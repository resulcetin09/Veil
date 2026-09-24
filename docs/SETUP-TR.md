# Veil — yerel kullanım ve teslim adımları

## Projeyi aç

Proje klasöründe:

```sh
npm ci
npm run setup:compact
npm run compile
npm run dev
```

Tarayıcı: `http://127.0.0.1:5173/`

**Try the local demo**, cüzdan olmadan gerçek derlenmiş kontrat mantığını çalıştırır. Bu mod zincirde işlem yapmaz ve ZK ispatı üretmez. Başarılı demo, canlı Midnight entegrasyonunun tamamlandığı anlamına gelmez.

## Gerçek Midnight işlemi için

1. Chrome’a [Lace](https://www.lace.io/) kur ve Midnight desteğini aç. Cüzdan oluşturma, yedekleme ve imzalama adımlarını kendin tamamla; seed/recovery phrase’i hiçbir yere gönderme.
2. Ağ olarak **Preview** seç. Resmi kaynaklardan test fonu ve işlem ücreti için DUST hazırla.
3. [Docker Desktop](https://www.docker.com/products/docker-desktop/) kurulu ve açık olmalı. Proje klasöründe `docker compose up -d` çalıştır.
4. Lace ayarlarında yerel proof server adresini `http://localhost:6300` seç.
5. Veil’de **Connect wallet**, ardından **For organizers** bölümünü kullan.
6. Etkinliği oluştur, cüzdanda işlemi onayla ve zincir onayını bekle. Organizatör kurtarma dosyasını hemen indir.
7. Davetleri oluştur, her birinin onaylanmasını bekle ve indirilen dosyayı sadece ilgili kişiye ilet.
8. **Seal allowlist** ile listeyi kapat. Bu işlem geri alınamaz; sonrasında yeni davet eklenmez.
9. Misafir akışında daveti yükle, açıklamayı onayla ve **Prove & request access** ile işlemi tamamla.

## GitHub ve canlı arayüz

Depo: [resulcetin09/Veil](https://github.com/resulcetin09/Veil)

GitHub’da **Settings → Pages → Build and deployment → Source: GitHub Actions** seçilmelidir. `main` dalına gönderim compile/test/build akışını başlatır. Testler geçince yayın işi çalışır. Hedef adres: `https://resulcetin09.github.io/Veil/`.

GitHub Pages yalnızca arayüzü ve ispat anahtarlarını barındırır. Midnight kontratını dağıtmaz ve yerel proof server’ın yerini tutmaz.

## Teslimden önce

- `docs/submission.md` içindeki eksikleri gerçek kanıtlarla tamamla.
- `docs/product-proposal.md` içindeki öneriyi etkinlik ekibine gönderip onay al.
- Test çıktısı görselini, başarılı GitHub Actions bağlantısını ve canlı demo bağlantısını ekle.
- `docs/demo-script.md` akışına göre bir dakikalık gerçek ağ demosu kaydet. Özel davet sırrını veya cüzdan kurtarma kelimelerini kayda alma.

İlk ortam kontrolünde Docker komutu ve Docker Desktop bulunamadı. Compact derleyicisi bu proje için `.tools` içine kuruldu. Lace’in kullanıcı Chrome profilinde kurulu olup olmadığı ayrıca kontrol edilmelidir.
