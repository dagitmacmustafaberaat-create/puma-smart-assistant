# Personel girişi ve eğitim takibi — kurulum

Bu özellikler ana `main` dalına aktarılmadan önce Supabase tarafı hazırlanmalıdır. Site arka plan görseli için kullanılan mevcut `puma-wallpaper.png` ve CSS arka plan tanımı değiştirilmemiştir.

## 1. Veritabanını hazırla
1. Supabase projesini aç: `https://zjxphwqcmmmbikgrbhyn.supabase.co`
2. **SQL Editor** bölümünde yeni sorgu oluştur.
3. Bu klasördeki `setup.sql` dosyasının tamamını çalıştır.

## 2. İlk yönetici hesabını oluştur
1. Supabase **Authentication → Users → Add user** bölümünde kullanıcı oluştur.
2. E-posta: `yonetici@staff.buyakapuma.com`
3. Güçlü bir ilk şifre belirle ve kullanıcıyı doğrulanmış (confirmed) olarak oluştur.
4. SQL Editor'de şu sorguyu çalıştır:
   ```sql
   update public.staff_profiles sp
   set role = 'manager', full_name = 'Yönetici', active = true
   from auth.users u
   where sp.user_id = u.id
     and u.email = 'yonetici@staff.buyakapuma.com';
   ```
5. Yönetici profilinin ilk girişte şifre değiştirmeye zorlanmaması için SQL Editor'de şu ek sorguyu da çalıştır: `update public.staff_profiles set must_change_password = false where user_id = (select id from auth.users where email = 'yonetici@staff.buyakapuma.com');`
6. Site girişinde ad soyad alanına **Yönetici**, şifre alanına az önce belirlediğin şifreyi gir.

## 3. Personel oluşturma fonksiyonunu yayımla
Supabase CLI ile repo kökünde:
```bash
supabase login
supabase link --project-ref zjxphwqcmmmbikgrbhyn
supabase functions deploy create-staff
supabase functions deploy change-password
```
Fonksiyon `supabase/functions/create-staff/index.ts` dosyasındadır. Supabase Edge Functions ortamında `SUPABASE_URL`, `SUPABASE_ANON_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` değişkenleri kullanılmalıdır. Service-role anahtarını HTML/JavaScript dosyalarına veya GitHub'a eklemeyin.

## 4. Önemli Auth ayarı
Supabase Authentication ayarlarında **public sign-ups / yeni kullanıcı kaydı** kapalı olmalıdır. Personel hesapları yalnızca giriş yapan yönetici panelinden oluşturulmalıdır. Bu sayede yeni hesap oluşturma yetkisi personele açılmaz.

## 5. Çalışma şekli
- Personel girişi ad soyad + şifre ile yapılır. İsim, `@staff.buyakapuma.com` iç alan adıyla eşleştirilir.
- Yönetici panelinden hesap oluşturulur ve hesap aktif/pasif yapılabilir.
- Yeni personel ilk girişte geçici şifresini değiştirmeden portala erişemez. Bunun için `change-password` Edge Function yayımlanmalıdır.
- Eğitim kartlarının altındaki **Eğitimi tamamladım** düğmesi, personel ve eğitim tarihiyle kaydı saklar.
- Personel kendi eğitim geçmişini; yönetici tüm personellerin eğitim kayıtlarını görür.
- Stok arama ve eğitim takvimi aynı dosyalardan çalışmaya devam eder.

## Not
Bu dal henüz üretim dalına birleştirilmemiştir. Supabase kurulumu tamamlandıktan sonra Vercel önizlemesinde giriş, stok sorgulama, beden bazlı sorgulama, eğitim takvimi ve yönetici raporları test edilmelidir.
