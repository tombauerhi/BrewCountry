# Brew Country

Brew Country visualisiert eine 100x100 km Zone um München und markiert dominante Biersorten basierend auf User-Votes. Dominanzberechnung läuft im Web Worker, um die UI flüssig zu halten.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

## Bedienung (Kurz)

- Klick auf die Karte setzt den Standort für den aktuellen User.
- Wähle eine Biersorte und speichere den Vote.
- Simulation-Panel erzeugt zufällige Votes in der Bounding Box.
- Klick auf eine Zelle zeigt ein Popup mit Dominanzdaten.

## Performance Notes

- Dominanzberechnung erfolgt im Web Worker.
- Das Karten-Overlay nutzt Canvas statt tausender Leaflet-Rectangle-Layer.
- Regionen werden als zusammenhängende Komponenten zusammengefasst und als Polygone gezeichnet.

## Assumptions

- Offline-Demo-Auth: eine frei editierbare User-ID dient als Auth-Stellvertreter.
- Persistenz: IndexedDB ist die primäre Speicherung (Fallback localStorage), sodass ein späteres Backend (SQLite/Supabase/Firebase) leichter integriert werden kann.
- Polygone basieren auf einer einfachen Kanten-Extraktion aus Rasterzellen und approximieren die tatsächliche Zell-Geometrie.
