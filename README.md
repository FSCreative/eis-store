# EIS.STORE — Demo-Shop

Ein an eis.at angelehnter Demo-Onlineshop in frischem, Apple-Store-inspiriertem Design.
**80 echte Markenprodukte (Satisfyer, Womanizer, We-Vibe, LELO, Fun Factory, Fleshlight, Tenga, pjur u.v.m.) von Mini bis XXL.**
Beschreibungen eigenständig verfasst; Preise, Bewertungen und Verfügbarkeit fiktiv; Abbildungen sind stilisierte Eigen-Illustrationen (keine Herstellerfotos). Markennamen gehören ihren Inhabern. Nur für Personen ab 18 Jahren.

## Features

- **Startseite** mit Hero, Kategorien, Neuheiten, Bestsellern und Sale-Band
- **Shop-Seite** mit Live-Filtern und Sortierung:
  - Sortieren nach Beliebtheit, **Neuheiten**, Preis (auf-/absteigend), Bewertung, Rabatt
  - Filtern nach Kategorie, Marke, Preis, **Länge (cm)** und **Umfang (cm)** per Dual-Range-Slider
  - Aktive Filter als entfernbare Chips
- **Produktdetailseite** mit Spezifikationen (Länge, Umfang, Ø, Material), Mengenwahl, ähnlichen Produkten
- **Warenkorb** (localStorage) mit Versandkosten-Logik und Demo-Checkout
- Altersabfrage (18+), responsive, mobile Filter-Sheet

## Lokal starten

```bash
npm install
npm start
# → http://localhost:3000
```

Oder einfach `index.html` direkt im Browser öffnen (kein Server nötig).

## Deployment (Railway)

Railway erkennt das Projekt automatisch über `package.json`:
Start-Command `npm start`, Port über `process.env.PORT`.
