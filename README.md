# Hemşire Hasta Atama

Klinik servis odaları için dinamik hemşire hasta atama aracı. Tek sayfa React (Vite + TypeScript) uygulaması.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

## Özellikler

- **Dinamik oda listesi:** Sabit 1–32 yerine kullanıcı odaları manuel ekler (örn. 24/2, 12A, 305-B)
- **Servis modu:** Standart (genel) veya Enfeksiyon/Nakil (özel kısıtlamalar)
- **Oda formu:** Oda kodu, yatak (1–3), hasta, enfekte, nakil/kaçınma, infüzyon alanları
- **Solver:** Deterministik heuristic — enfekte/nakil kuralları, yük dengesi, oda yakınlığı
- **localStorage:** Tüm veri otomatik kaydedilir

## Komutlar

- `npm run dev` — Geliştirme sunucusu
- `npm run build` — Production build
- `npm run preview` — Build önizlemesi

## Canlı Yayın

Uygulama GitHub Pages ile yayınlanıyor: [https://ruzgardev.github.io/nursetech.github.io/](https://ruzgardev.github.io/nursetech.github.io/)
