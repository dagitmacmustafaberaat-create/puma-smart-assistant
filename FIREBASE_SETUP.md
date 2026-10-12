# Firebase kurulum adımları — BUYAKA PUMA SMART ASSISTANT

Kod değişiklikleri `feature/personel-giris-egitim-takibi` dalında hazırlanmıştır. Canlıya geçmeden önce aşağıdaki kurulum gerekir.

## 1. Firebase Authentication
1. Firebase Console → **Authentication** → **Get started**.
2. **Sign-in method** bölümünde **Email/Password** sağlayıcısını etkinleştirin.
3. **Users** sekmesinde **Add user** ile yönetici hesabı oluşturun:
   - E-posta: `manager@buyakapuma.com`
   - Şifre: güçlü ve size özel bir şifre
4. Kullanıcı satırından UID değerini kopyalayın. Bu UID Vercel'deki `MANAGER_UID` değeridir.
5. Giriş ekranında yönetici kullanıcı adı `manager` olacaktır.

## 2. Firestore
1. Firebase Console → **Firestore Database** → **Create database**.
2. Veritabanını oluşturun.
3. Bu depodaki `firestore.rules` içeriğini Firestore → **Rules** bölümüne yapıştırıp **Publish** edin.

Tarayıcıdan doğrudan personel/eğitim verisi okunup yazılamaz; kayıtlar Vercel API üzerinden Firebase Admin SDK ile işlenir.

## 3. Vercel ortam değişkenleri
Vercel → proje → **Settings → Environment Variables** bölümüne şu iki değişkeni ekleyin (Preview ve Production ortamları için gerekenleri seçin):

- `MANAGER_UID`: `6M8bxxLZZmVTiNm7bC2jhPVcEm13` (paylaştığınız yönetici UID'si).
- `FIREBASE_SERVICE_ACCOUNT_JSON`: Firebase Console → Project settings → **Service accounts** → **Generate new private key** ile indirdiğiniz servis hesabı JSON dosyasının **tam içeriği**.

**Servis hesabı JSON dosyasını GitHub'a veya sohbet mesajına yüklemeyin.** Yalnızca Vercel'in Environment Variables alanına ekleyin. Sonrasında yeni dağıtım başlatın.

## 4. Personel hesabı oluşturma
Yönetici giriş yaptıktan sonra **Yönetici Paneli** → **Yeni personel hesabı oluştur** bölümünden personel adı, kullanıcı adı ve geçici şifre girilir. Kullanıcı adı girişte kullanılır; sistem bunu arka planda `@buyakapuma.com` uzantılı Firebase e-posta kimliğine dönüştürür.

## 5. Test
- Yönetici `manager` kullanıcı adıyla giriş yapabilmeli.
- Yönetici panelinden bir test personeli oluşturulabilmeli.
- Personel ayrı bir tarayıcı/cihazda kendi kullanıcı adı ve şifresiyle giriş yapabilmeli.
- Eğitim tamamlaması kaydedildiğinde kişisel geçmişte ve yönetici raporunda görünmeli.
- Personel hesabı pasifleştirildiğinde tekrar giriş yapamamalı.

Not: Bu adımlar tamamlanana kadar sistem Firebase'e bağlı olarak çalışmaya hazır değildir. Firebase web yapılandırması herkese açık istemci ayarıdır; servis hesabı anahtarı ise gizli tutulmalıdır.
