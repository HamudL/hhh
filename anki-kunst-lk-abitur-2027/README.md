# Anki-Karten · Kunst Leistungsfach · Abitur 2027 · Baden-Württemberg

Ein sorgfältig recherchierter, faktengeprüfter Karteikarten-Satz (Anki) für das
**Leistungsfach Bildende Kunst**, Abiturjahrgang **2027**, **Baden-Württemberg**.

**262 Karten**, aufgeteilt in Prüfungswissen, Methodik und die drei offiziellen
Schwerpunktthemen mit allen zugehörigen künstlerischen Positionen.

---

## 📌 Wichtig zuerst lesen

- Deine Lehrkraft unterrichtet laut Erlass **zwei der drei** Schwerpunktthemen.
  Nur diese zwei sind bei **dir** prüfungsrelevant. Dieses Set deckt sicherheitshalber
  **alle drei** ab – du kannst den Unterstapel des nicht behandelten Themas einfach
  löschen oder auf „Suspendieren“ setzen.
- Der Satz ist **text- und begriffsbasiert**. Für das Wiedererkennen konkreter Werke
  solltest du zusätzlich mit Abbildungen deiner Lehrmaterialien arbeiten (aus
  Urheberrechts- und Verlässlichkeitsgründen sind hier keine Bilder eingebettet).

---

## 🎯 Die drei Schwerpunktthemen (Facherlass 2027 BW, Leistungsfach)

Die Fachlehrkraft wählt **2 von 3**:

| Nr. | Schwerpunktthema | Künstlerische Positionen |
|-----|------------------|--------------------------|
| **SP 1** | Körper – Raum – Bewegung | Gian Lorenzo Bernini · Oskar Schlemmer *(Triadisches Ballett & Bauhaus-Tänze)* · Rebecca Horn *(ohne Filme)* |
| **SP 2** | Figur im Kontext | Giotto di Bondone · Francis Bacon · Sibylle Bergemann |
| **SP 3** | Wohnkonzepte und Gebäudestrukturen | Le Corbusier *(realisierte Wohngebäude ab 1920)* · Bjarke Ingels Group (BIG) |

> Im Leistungsfach sind bei SP 2 **alle drei** Positionen verpflichtend und gleichrangig.
> Oskar Schlemmer (SP 1) ist **nur im Leistungsfach** vorgesehen.

---

## 📚 Inhalt & Kartenzahl

| Unterstapel | Karten |
|-------------|:------:|
| 00 Prüfung & Themen (Format · Organisation · Themen-Überblick) | 32 |
| 01 Methodik & Fachbegriffe (Bildanalyse, Perspektive, Farbe, Plastik …) | 35 |
| SP 1 – Bernini / Schlemmer / Horn | 27 / 23 / 22 |
| SP 2 – Giotto / Bacon / Bergemann | 26 / 27 / 22 |
| SP 3 – Le Corbusier / BIG | 25 / 23 |
| **Gesamt** | **262** |

Eine vollständige, menschenlesbare Liste **aller Karten inkl. Quellen** steht in
[`UEBERSICHT.md`](UEBERSICHT.md).

---

## 💻 Benutzung

Du hast zwei Formate – **nutze nur eines**, sonst entstehen Dubletten.

### Variante A – Fertiges Deck (empfohlen)
1. `kunst_lk_abitur_2027.apkg` herunterladen.
2. In Anki: **Datei → Importieren** (oder Doppelklick auf die Datei).
3. Fertig – die Unterstapel und Tags sind bereits angelegt.

### Variante B – CSV importieren
1. In Anki: **Datei → Importieren** → `anki_kunst_lk_abitur_2027.csv`.
2. Die Datei enthält Kopfzeilen, die Anki automatisch auswertet
   (Trennzeichen: Komma, Notiztyp: *Basic*, Spalte 3 = Tags, Zielstapel angelegt).
3. Spaltenzuordnung: **Feld 1 → Vorderseite**, **Feld 2 → Rückseite**, **Feld 3 → Tags**.

---

## ✅ Quellen & Genauigkeit

Alle Inhalte wurden gegen **offizielle Vorgaben** und geprüfte Fachquellen abgeglichen:

- **Facherlass für die Abiturprüfung 2027, Baden-Württemberg**, Kap. 14 *Bildende Kunst*
  (Ministerium für Kultus, Jugend und Sport BW) — Schwerpunktthemen & Prüfungsvorgaben.
- **„Neues Schwerpunktthema II – Figur im Kontext"** (Regierungspräsidium Tübingen,
  ab Abitur 2027) — verbindliche Beschreibung zu Giotto, Bacon, Bergemann.
- **Bildungsplan 2016 BW – Bildende Kunst** (Bereiche Fläche / Raum / Zeit).
- Zu den einzelnen Positionen zusätzlich seriöse Fachquellen (Museen, Stiftungen/Archive,
  UNESCO, Fachliteratur). Die konkrete Quelle steht bei jeder Karte im Feld *Quelle* bzw.
  in `UEBERSICHT.md`.

Jede Position wurde zunächst recherchiert und anschließend **einzeln auf Richtigkeit
geprüft** (Lebensdaten, Werk­datierungen, Standorte, Zuschreibungen). Fachlich umstrittene
Punkte (z. B. die Zuschreibung des Assisi-Zyklus bei Giotto) sind auf den Karten
ausdrücklich als solche gekennzeichnet.

Prüfungstermin schriftliche Abiturprüfung Bildende Kunst 2027 (BW): **Montag, 19. April 2027**.

---

## 🔧 Neu erzeugen / anpassen

Die Kartendaten liegen als JSON in [`karten_daten/`](karten_daten/) (eine Datei je Position).
Nach Änderungen neu bauen mit:

```bash
pip install genanki
python3 build_deck.py
```

Das erzeugt `.apkg`, `.csv` und `UEBERSICHT.md` neu.
