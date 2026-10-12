import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return json({ error: "Sunucu yapılandırması eksik." }, 500);

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Oturum doğrulanamadı. Yeniden giriş yapın." }, 401);

  let body: { password?: string };
  try { body = await req.json(); } catch { return json({ error: "Geçersiz istek." }, 400); }
  const password = String(body.password || "");
  if (password.length < 8) return json({ error: "Yeni şifre en az 8 karakter olmalı." }, 400);

  const adminClient = createClient(url, serviceKey);
  const { data: profile, error: profileError } = await adminClient
    .from("staff_profiles").select("active,must_change_password")
    .eq("user_id", userData.user.id).maybeSingle();
  if (profileError || !profile || !profile.active) return json({ error: "Aktif personel hesabı bulunamadı." }, 403);
  if (!profile.must_change_password) return json({ error: "İlk giriş şifre değişikliği zaten tamamlanmış." }, 400);

  const { error: passwordError } = await adminClient.auth.admin.updateUserById(userData.user.id, { password });
  if (passwordError) return json({ error: "Şifre güncellenemedi: " + passwordError.message }, 400);

  const { error: updateError } = await adminClient.from("staff_profiles")
    .update({ must_change_password: false }).eq("user_id", userData.user.id);
  if (updateError) return json({ error: "Şifre değişti ancak profil işaretlenemedi. Yöneticiyle görüşün." }, 500);

  return json({ success: true });
});
