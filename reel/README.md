# 🎬 Snapchat+ Reel — BNS Store

ريل عمودي (9:16) للترويج لعروض **Snapchat+** تاع **BNS Store**، مصنوع باش يتحط في **TikTok / Instagram Reels / Snapchat**.

A vertical (9:16) promo reel for BNS Store's Snapchat+ offers, animated in HTML and rendered to a phone-ready MP4.

## المحتوى / Output

| File | واش هو |
|------|--------|
| `snapchat-plus-bns-reel.mp4` | 🎥 الفيديو النهائي — 1080×1920، 14 ثانية، 30fps، H.264 (متوافق مع TikTok وكل الهواتف) |
| `cover.png` | 🖼️ صورة الغلاف (cover) للـ TikTok |
| `index.html` | نسخة HTML متحركة (خطوط مضمّنة) — تقدر تحلّها في المتصفح مباشرة |
| `src/` | الكود اللي يولّد و يصوّر الريل |

### المشاهد / Scenes
1. **Hook** — شعار Snapchat+ + «ميزات حصرية و مميزة»
2. **كيفاش نخدمو** — بدون كلمة مرور · بدون تسجيل دخول · غير أضفني كصديق و نبعتولك Gift
3. **الأثمنة** — 3 أشهر 1500دج · 6 أشهر 2500دج · 12 شهر 4500دج
4. **CTA** — أطلب الآن + BNS Store + Snapchat: `i48446539`

## كيفاش تبدّل الأثمنة / النصوص
كلش موجود في `src/make-html.mjs` (الـ HTML جوا الـ template). بدّل النص، ومن بعد أعد التصنيع.

## إعادة التصنيع / Regenerate

```bash
cd reel
npm install
npm run render        # يولّد index.html و يصوّر snapchat-plus-bns-reel.mp4
# معاينة إطارات فقط:  node src/preview.mjs 2.4 9.6 12.4   (يكتب في out/)
```

> يستعمل Chromium تاع Playwright للتصوير frame-by-frame، و `h264-mp4-encoder` (WASM) للـ encoding — ما يحتاجش ffmpeg مثبّت في النظام.

## 💡 نصائح TikTok
- **زيد صوت trending** من محرّر TikTok — الفيديو بلا صوت باش تختار انت الأغنية (أحسن للـ algorithm).
- استعمل `cover.png` كغلاف، وحُط hashtags: `#سناب_شات #snapchatplus #الجزائر #bnsstore`.
- أحسن وقت للنشر: العشية (18:00–22:00).
