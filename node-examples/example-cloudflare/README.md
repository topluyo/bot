# Topluyo Chatbot – Cloudflare Worker

Bu proje, [Topluyo](https://topluyo.com/) uygulamasına entegre edilen bir **chatbot**'tur. Kullanıcıların belirli mesajlara otomatik yanıt almasını sağlar.

## Özellikler

- Cloudflare Workers ile hızlı ve güvenli sunucu tarafı mantığı
- Şifrelenmiş webhook verisini AES-CBC + MD5 doğrulama ile çözümler
- Belirli mesajlara otomatik yanıt verir (`!selam`, `!naber`)
- Webhook üzerinden grup ve kanal bilgisine göre mesaj gönderir

## Kurulum

### 1. Gerekli Araçlar

- [Node.js](https://nodejs.org/) (v18+ önerilir)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install/) (Cloudflare Worker CLI)

Kurmak için:

```bash
npm install -g wrangler
```
### 2. Gerekli Araçlar

```bash
git clone https://github.com/topluyo/bot/node-examples/example-cloudflare.git
cd example-cloudflare
```

### 3. Bağımlılıkları Kurun
```bash
npm install
```

### 4. Ortam Değişkenlerini Ayarlayın
Worker’ın doğru çalışması için iki gizli anahtar tanımlamanız gerekir:

- APPLICATION_KEY: Şifrelenmiş webhook verisinin çözülmesi için kullanılan anahtar

- CLIENT_KEY: Topluyo API’sine istek yapmak için kullanılan yetkilendirme token’ı

Bu anahtarları .dev.vars dosyasında tanımlayabilirsiniz (geliştirme ortamı için):
```ini
APPLICATION_KEY="uygun-bir-gizli-anahtar"
CLIENT_KEY="topluyo-api-token"
```

Veya `wrangler.toml` dosyanızda production için secrets olarak ekleyin:
```bash
wrangler secret put APPLICATION_KEY
wrangler secret put CLIENT_KEY
```

### 5. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcıda açın: http://localhost:8787

### 6. Deploy Et (Yayınlama)
```bash
npm run deploy
```
Worker yayınlandıktan sonra size bir URL verilir. Webhook çağrılarınızı bu URL'ye yönlendirebilirsiniz.

#### Webhook Formatı
Webhook verisi şifreli olarak gelir. Çözüldüğünde JSON şu formatta olmalıdır:
```json
{
  "action": "post/add",
  "user": "ali",
  "message": "!selam",
  "channel": "genel",
  "group": "topluluk-id"
}
```
Şu mesajlara otomatik yanıt verir:

- !selam → selam {user}
- !naber → iyidir {user} kanka senden naber =)

#### Güvenlik
Webhook verisi AES-CBC algoritmasıyla şifrelenir.

İçerik bütünlüğü, mesajın başına eklenen ilk 4 karakterlik MD5 checksum ile doğrulanır.

Geçerli değilse worker cevap vermez (400 hatası).

#### Kaynaklar
- [Cloudflare Workers Belgeleri](https://developers.cloudflare.com/workers/)
- [Topluyo API](https://topluyo.com/!api/)