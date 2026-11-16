# Smart Assistant 2.0 – Rapor Verileri

Bu klasör, Smart Assistant 2.0 uygulamasında kullanılacak rapor dosyaları için ayrılmıştır.

## Dosya yükleme
- Excel raporlarınızı (`.xlsx``) bu klasöre yükleyin.
- Dosya adlarını mümkün olduğunca anlaşılır ve dönem belirtecek şekilde kullanın (ör. `WEEKLY_W46.xlsx`, `AYLIK_KASIM_2026.xlsx`, `YILLIK_2026.xlsx`).
- Aynı raporun yeni sürümünü yüklerken eski dosyayı güncelleyin veya sürümünü açıkça belirtin.

## Önemli
Dosyaların bu klasöre yüklenmesi tek başına uygulamanın onları otomatik okuduğu anlamına gelmez. Smart Assistant 2.0'ın `index.html` dosyasındaki veri okuma bağlantısı, yüklenecek raporların yapısı ve dosya adları netleştirildikten sonra kurulmalıdır. Bu nedenle raporları yükledikten sonra uygulamanın okuyacağı dosyaları ve sayfaları birlikte eşleştireceğiz.