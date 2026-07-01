# -*- coding: utf-8 -*-
"""
Baut aus den geprueften Karten-JSON-Dateien:
  - kunst_lk_abitur_2027.apkg   (fertiges Anki-Deck mit Unterstapeln, Tags, Quellen)
  - anki_kunst_lk_abitur_2027.csv (Import-Datei fuer Anki)
  - UEBERSICHT.md               (menschenlesbare Uebersicht aller Karten inkl. Quellen)
Aufruf:  python3 build_deck.py
"""
import json, os, csv, html
import genanki

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "karten_daten")

COMMON_TAG = "Kunst_LK_Abitur_2027_BW"

# Reihenfolge + Zuordnung Kategorie -> Unterstapel, Thema-Label, Tags
CATS = [
    dict(key="format",      file="cards_format.json",      deck="d00",  thema="Pruefung & Organisation",
         label="Pruefungsformat & Organisation", tags=["Pruefung_Organisation"]),
    dict(key="themen",      file="cards_themen.json",       deck="d00",  thema="Schwerpunktthemen - Ueberblick",
         label="Ueberblick Schwerpunktthemen", tags=["Themen_Ueberblick"]),
    dict(key="methodik",    file="cards_methodik.json",     deck="d01",  thema="Methodik & Fachbegriffe",
         label="Bildanalyse-Methodik & Fachbegriffe", tags=["Methodik_Fachbegriffe"]),
    dict(key="bernini",     file="cards_bernini.json",      deck="dSP1", thema="SP1 Koerper-Raum-Bewegung · Bernini",
         label="Gian Lorenzo Bernini", tags=["SP1_Koerper_Raum_Bewegung", "Gian_Lorenzo_Bernini"]),
    dict(key="schlemmer",   file="cards_schlemmer.json",    deck="dSP1", thema="SP1 Koerper-Raum-Bewegung · Oskar Schlemmer",
         label="Oskar Schlemmer", tags=["SP1_Koerper_Raum_Bewegung", "Oskar_Schlemmer"]),
    dict(key="horn",        file="cards_horn.json",         deck="dSP1", thema="SP1 Koerper-Raum-Bewegung · Rebecca Horn",
         label="Rebecca Horn", tags=["SP1_Koerper_Raum_Bewegung", "Rebecca_Horn"]),
    dict(key="giotto",      file="cards_giotto.json",       deck="dSP2", thema="SP2 Figur im Kontext · Giotto",
         label="Giotto di Bondone", tags=["SP2_Figur_im_Kontext", "Giotto_di_Bondone"]),
    dict(key="bacon",       file="cards_bacon.json",        deck="dSP2", thema="SP2 Figur im Kontext · Francis Bacon",
         label="Francis Bacon", tags=["SP2_Figur_im_Kontext", "Francis_Bacon"]),
    dict(key="bergemann",   file="cards_bergemann.json",    deck="dSP2", thema="SP2 Figur im Kontext · Sibylle Bergemann",
         label="Sibylle Bergemann", tags=["SP2_Figur_im_Kontext", "Sibylle_Bergemann"]),
]

DECKS = {
    "d00":  (1642010112, "Kunst LK Abitur 2027 (BW)::00 Prüfung & Themen"),
    "d01":  (1642010113, "Kunst LK Abitur 2027 (BW)::01 Methodik & Fachbegriffe"),
    "dSP1": (1642010114, "Kunst LK Abitur 2027 (BW)::SP1 Körper – Raum – Bewegung"),
    "dSP2": (1642010115, "Kunst LK Abitur 2027 (BW)::SP2 Figur im Kontext"),
}

MODEL = genanki.Model(
    1642010111,
    "Kunst LK Abitur 2027 (Frage/Antwort)",
    fields=[{"name": "Front"}, {"name": "Back"}, {"name": "Thema"}, {"name": "Quelle"}],
    templates=[{
        "name": "Karte",
        "qfmt": """<div class="thema">{{Thema}}</div><div class="front">{{Front}}</div>""",
        "afmt": """<div class="thema">{{Thema}}</div><div class="front">{{Front}}</div>
<hr id="answer">
<div class="back">{{Back}}</div>
<div class="quelle">Quelle: {{Quelle}}</div>""",
    }],
    css="""
.card { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 20px; line-height: 1.5; color: #1a1a1a; background: #ffffff;
        max-width: 720px; margin: 0 auto; padding: 14px; }
.thema { font-size: 12px; letter-spacing: .3px; text-transform: uppercase;
         color: #8a6d3b; margin-bottom: 10px; }
.front { font-weight: 600; }
hr#answer { border: none; border-top: 2px solid #e0c9a6; margin: 16px 0; }
.back { text-align: left; }
.quelle { margin-top: 16px; font-size: 12px; color: #999; }
""",
)


def clean(s):
    if s is None:
        return ""
    return " ".join(str(s).split())


def load(cat):
    with open(os.path.join(DATA, cat["file"]), encoding="utf-8") as fh:
        rows = json.load(fh)
    out = []
    for r in rows:
        f = clean(r.get("front"))
        b = clean(r.get("back"))
        src = clean(r.get("source")) or "offizielle Vorgaben / Fachquellen"
        if not f or not b:
            continue
        out.append((f, b, src))
    return out


def main():
    # genanki decks
    gdecks = {k: genanki.Deck(v[0], v[1]) for k, v in DECKS.items()}
    csv_rows = []          # (front, back, tags)
    md_sections = []       # markdown
    total = 0
    per_cat = []

    for cat in CATS:
        cards = load(cat)
        per_cat.append((cat["label"], len(cards)))
        tags = [COMMON_TAG] + cat["tags"]
        # Markdown-Abschnitt
        md = [f"\n## {cat['label']}  \n*Thema-Tag:* `{cat['thema']}` — **{len(cards)} Karten**\n"]
        for i, (f, b, src) in enumerate(cards, 1):
            note = genanki.Note(
                model=MODEL,
                fields=[f, b, cat["thema"], src],
                tags=tags,
            )
            gdecks[cat["deck"]].add_note(note)
            csv_rows.append([f, b, " ".join(tags)])
            md.append(f"{i}. **F:** {f}  \n   **A:** {b}  \n   <sub>Quelle: {src}</sub>\n")
            total += 1
        md_sections.append("\n".join(md))

    # apkg schreiben
    pkg = genanki.Package(list(gdecks.values()))
    apkg_path = os.path.join(HERE, "kunst_lk_abitur_2027.apkg")
    pkg.write_to_file(apkg_path)

    # CSV schreiben (Anki-Import, Komma-getrennt, mit Kopf-Direktiven)
    csv_path = os.path.join(HERE, "anki_kunst_lk_abitur_2027.csv")
    with open(csv_path, "w", encoding="utf-8", newline="") as fh:
        fh.write("#separator:Comma\n")
        fh.write("#html:false\n")
        fh.write("#notetype:Basic\n")
        fh.write("#deck:Kunst LK Abitur 2027 (BW)\n")
        fh.write("#columns:Front,Back,Tags\n")
        fh.write("#tags column:3\n")
        w = csv.writer(fh, quoting=csv.QUOTE_ALL)
        for row in csv_rows:
            w.writerow(row)

    # UEBERSICHT.md schreiben
    md_path = os.path.join(HERE, "UEBERSICHT.md")
    with open(md_path, "w", encoding="utf-8") as fh:
        fh.write("# Kartenuebersicht – Kunst LK Abitur 2027 (Baden-Württemberg)\n\n")
        fh.write(f"**Gesamt: {total} Karten.** Alle Inhalte basieren auf den offiziellen Vorgaben "
                 "(Facherlass für die Abiturprüfung 2027 BW, Kap. 14 Bildende Kunst; "
                 "offizielles Schwerpunktthema-II-Dokument „Figur im Kontext“) sowie auf geprüften Fachquellen.\n")
        fh.write("\n> Hinweis: Dieses Set deckt die **unterrichteten Schwerpunktthemen SP1 und SP2** ab "
                 "(SP3 wird von der Lehrkraft nicht unterrichtet und ist daher nicht enthalten).\n")
        fh.write("\n".join(md_sections))

    print("apkg :", apkg_path)
    print("csv  :", csv_path)
    print("md   :", md_path)
    print("---- Karten pro Kategorie ----")
    for label, n in per_cat:
        print(f"  {n:3d}  {label}")
    print(f"  GESAMT: {total}")


if __name__ == "__main__":
    main()
