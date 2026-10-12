import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function slugifyName(name: string) {
  return name.trim().toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") || "", { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return new Response(JSON.stringify({ error: "Oturum doğrulanamadı." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const adminClient = createClient(url, serviceKey);
  const { data: profile } = await adminClient.from("staff_profiles").select("role,active").eq("user_id", userData.user.id).maybeSingle();
  if (!profile || profile.role !== "manager" || !profile.active) return new Response(JSON.stringify({ error: "Bu işlem için yönetici yetkisi gerekir." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let body: { action?: string; full_name?: string; password?: string; user_id?: string; active?: boolean };
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Geçersiz istek." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

  if (body.action === "set-active") {
    if (!body.user_id || typeof body.active !== "boolean") return new Response(JSON.stringify({ error: "Personel ve durum bilgisi gerekli." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: target } = await adminClient.from("staff_profiles").select("role").eq("user_id", body.user_id).maybeSingle();
    if (!target || target.role === "manager") return new Response(JSON.stringify({ error: "Yönetici hesabı bu ekrandan değiştirilemez." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { error } = await adminClient.from("staff_profiles").update({ active: body.active }).eq("user_id", body.user_id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const fullName = String(body.full_name || "").trim().replace(/\s+/g, " ");
  const password = String(body.password || "");
  if (fullName.length < 3 || password.length < 8) return new Response(JSON.stringify({ error: "Ad soyad girin; şifre en az 8 karakter olmalı." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const email = slugifyName(fullName) + "@staff.buyakapuma.com";
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: fullName }
  });
  if (createError || !created.user) return new Response(JSON.stringify({ error: createError?.message || "Personel oluşturulamadı." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { error: profileError } = await adminClient.from("staff_profiles").upsert({ user_id: created.user.id, full_name: fullName, role: "staff", active: true });
  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return new Response(JSON.stringify({ error: "Personel profili oluşturulamadı: " + profileError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ success: true, full_name: fullName }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
