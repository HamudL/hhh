# Donald J. Trump – The First Term (2017–2021)

Englischsprachige PowerPoint-Präsentation für einen Vortrag von 10–15 Minuten. Es geht **nur um die erste Amtszeit**: kurz die Person, danach die prägenden Ereignisse, am Ende eine Bilanz.

| Datei | Inhalt |
|---|---|
| `Trump_First_Term.pptx` | Die Präsentation, mit englischem Sprechertext in den Notizen |
| `Trump_First_Term.pdf` | Ersatzversion zum Ausdrucken oder falls PowerPoint fehlt (ohne Animation, ohne Notizen) |
| `build_deck.js`, `postprocess.js`, `theme.json` | Skripte, die die Präsentation erzeugen |

## Aufbau (8 Folien plus eine ausgeblendete Quellenfolie)

| # | Folie | Inhalt |
|---|---|---|
| 1 | Title | „Donald J. Trump – The First Term 2017–2021“ |
| 2 | Background | Steckbrief, Wahl 2016 (304–227 Wahlleute) als Karte der Bundesstaaten, Rust Belt |
| 3 | Taxes Down, Tariffs Up | Steuerreform 2017 (35% → 21%), Handelskrieg mit China ($370 billion) |
| 4 | A Court for a Generation | Drei Supreme-Court-Richter, aus freiem Sitz und Swing Vote wird 6–3, 234 Bundesrichter |
| 5 | Hard Line at the Border, Going Solo Abroad | Einreisestopp, 35-Tage-Shutdown, Familientrennungen; Paris & Iran, Nordkorea, Abraham Accords |
| 6 | From Boom to Bust | Arbeitslosenquote 2017–2020 als Diagramm, CARES Act, Impfstoff, 400,000 Tote |
| 7 | Defeat and the Storming of the Capitol | 1. Impeachment, Wahlniederlage, 6. Januar, 2. Impeachment |
| 8 | What Four Years Left Behind | Drei Thesen und eine Diskussionsfrage |
| 9 | Sources | ausgeblendet, erscheint nicht in der Bildschirmpräsentation |

## Vortragen

- **Sprechertext:** Jede Folie hat einen ausformulierten englischen Text in den Notizen, insgesamt rund 1.700 Wörter, also etwa 12–13 Minuten. In der Referentenansicht (Bildschirmpräsentation → „Referentenansicht verwenden“) sieht nur der Vortragende die Notizen.
- **Zeitstrahl:** Unten auf jeder Folie zeigt ein Zeitstrahl, wo man sich gerade in der Amtszeit befindet. Mit dem Übergang **Morph** gleiten die roten Markierungen beim Weiterklicken an die neue Stelle. Die große „45“ von der Titelfolie fliegt in die rote Kachel auf Folie 2.
- **Morph** braucht PowerPoint 2019, 2021 oder Microsoft 365 (Windows oder Mac). Ältere Versionen zeigen automatisch eine Überblendung.
- **Schriften:** Cambria (Überschriften) und Arial (Text) sind auf Windows und Mac mit Office vorinstalliert.
- In den Notizen zu Folie 4 ist ein optionaler Ausblick auf 2022 markiert. Wer ihn weglässt, bleibt strikt bei 2017–2021.

## Neu erzeugen

```bash
npm install pptxgenjs@3.12.0
node build_deck.js && node postprocess.js Trump_First_Term.pptx
```

`postprocess.js` schreibt die Theme-Farben aus `theme.json` in die Datei und ergänzt Morph-Übergänge und Diagrammbeschriftungen. Das sind die Teile, die pptxgenjs selbst nicht erzeugen kann.
