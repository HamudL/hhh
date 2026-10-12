// Baut die Präsentation "Donald J. Trump – Die erste Amtszeit (2017–2021)".
//
//   npm install pptxgenjs@3.12.0
//   node build_deck.js && node postprocess.js Trump_Erste_Amtszeit.pptx
//
// Aufbau: Theme + Layouts (Folienmaster) + Platzhalter, Inhalte pro Folie darauf.
// Theme-Farben, Morph-Übergänge und Diagramm-Beschriftungen ergänzt postprocess.js
// im fertigen OOXML; die Farben stehen in theme.json.

const path = require("path");
const pptxgen = require("pptxgenjs");

const OUT = process.argv[2] || path.join(__dirname, "Trump_Erste_Amtszeit.pptx");

// ---------------------------------------------------------------------------
// Theme: Republikaner-Rot auf tiefem Navy, Weiß als Fläche (Farben: theme.json)
//   dk1 Navy (Text, dunkle Flächen) · dk2 Schiefer (Sekundärtext) · lt2 Kachelgrau
//   accent1 Republikaner-Rot · accent2 Navy angehoben · accent3/4 Stahl hell/mittel
//   accent5 Demokraten-Blau (nur Wahlgrafiken) · accent6 Hellrot (kleine Schrift auf Dunkel)
// ---------------------------------------------------------------------------
const THEME = Object.assign({ headFontFace: "Cambria", bodyFontFace: "Arial" }, require("./theme.json"));

// Hex-Werte nur dort, wo pptxgenjs keine Schemafarben erlaubt (Diagramm-Gitter)
// oder für Linien, die nicht zum Thema gehören.
const HEX = {
  navy: "0B1E3B",
  red: "E81B23",
  hairLight: "C3CBD8",
  hairDark: "33496E",
  labelLight: "6B7488",
  labelDark: "8FA0BA",
  grid: "E3E7EE",
  seatLiberal: "D5DBE4",
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13,333 × 7,5 Zoll
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Donald J. Trump – Die erste Amtszeit (2017–2021)";
pres.subject = "Präsentation: die wichtigsten Ereignisse der ersten Amtszeit 2017–2021";
pres.lang = "de-DE";

// Schemafarben (folgen dem Theme, falls es später geändert wird)
const SC = {
  navy: "tx1",
  slate: "tx2",
  white: "bg1",
  tile: "bg2",
  red: "accent1",
  navyRaised: "accent2",
  steel: "accent3",
  steelMid: "accent4",
  blue: "accent5",
  redOnDark: "accent6",
};

// ---------------------------------------------------------------------------
// Raster
// ---------------------------------------------------------------------------
const MX = 0.6; // Seitenrand links/rechts
const RIGHT = 13.333 - MX; // 12.733
const CONTENT_TOP = 1.9;
const CONTENT_BOTTOM = 6.25;

// Zeitstrahl der Amtszeit (unten auf jeder Folie)
const TL = { x0: MX, x1: 11.7, y: 6.72 };
const D0 = Date.UTC(2017, 0, 1);
const D1 = Date.UTC(2021, 1, 1);
function tx(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return TL.x0 + ((Date.UTC(y, m - 1, d) - D0) / (D1 - D0)) * (TL.x1 - TL.x0);
}

// ---------------------------------------------------------------------------
// Helfer
// ---------------------------------------------------------------------------
// Geschützte Leerzeichen: Zahl und Einheit werden nie getrennt ("306 : 232", "2,9 Mio.", "Jan. 2017")
function nb(str) {
  return str
    .replace(/(\d) (?=%|Mio\.|Mrd\.|Bio\.|Tage|Jahre|Stimmen|Wahlleute)/g, "$1\u00A0")
    .replace(/(\d) : (\d)/g, "$1\u00A0:\u00A0$2")
    .replace(/(Mio\.|Mrd\.|Bio\.) \$/g, "$1\u00A0$")
    .replace(/(Jan\.|Feb\.|Apr\.|Sep\.|Okt\.|Nov\.|Dez\.|März|Juni) (\d{4})/g, "$1\u00A0$2");
}

function text(slide, t, o) {
  const content = typeof t === "string" ? nb(t) : t.map((r) => Object.assign({}, r, { text: nb(r.text) }));
  slide.addText(
    content,
    Object.assign(
      { isTextBox: true, margin: 0, valign: "top", fontSize: 14, color: SC.navy, lang: "de-DE", fit: "none" },
      o
    )
  );
}

function tile(slide, o) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, Object.assign({ rectRadius: 0.12 }, o));
}

function trackObjects(dark) {
  const hair = dark ? HEX.hairDark : HEX.hairLight;
  const label = dark ? HEX.labelDark : HEX.labelLight;
  const objs = [{ line: { x: TL.x0, y: TL.y, w: TL.x1 - TL.x0, h: 0, line: { color: hair, width: 1 } } }];
  for (const year of [2017, 2018, 2019, 2020, 2021]) {
    const x = tx(`${year}-01-01`);
    objs.push({ line: { x, y: TL.y - 0.07, w: 0, h: 0.14, line: { color: hair, width: 1 } } });
    objs.push({
      text: {
        text: String(year),
        options: { x: x + 0.07, y: TL.y + 0.08, w: 0.6, h: 0.2, fontSize: 10, color: label, margin: 0, valign: "top" },
      },
    });
  }
  return objs;
}

// Dynamischer Teil des Zeitstrahls: roter Zeitraum + Ereignispunkte (Morph-Namen "!!…")
function timeline(slide, { span, dots, dark }) {
  const red = dark ? SC.redOnDark : SC.red;
  const ring = dark ? SC.navy : SC.white;
  const [s, e] = span || ["2017-01-20", "2017-01-20"];
  const xs = tx(s);
  const w = Math.max(tx(e) - xs, 0.02);
  slide.addShape(pres.shapes.RECTANGLE, {
    x: xs, y: TL.y - 0.03, w, h: 0.06, fill: { color: red }, objectName: "!!tl-span",
  });
  dots.forEach((iso, i) => {
    const d = 0.18;
    slide.addShape(pres.shapes.OVAL, {
      x: tx(iso) - d / 2, y: TL.y - d / 2, w: d, h: d,
      fill: { color: red }, line: { color: ring, width: 1.5 }, objectName: `!!tl-d${i + 1}`,
    });
  });
}

const PH_KICKER = (color) => ({
  placeholder: {
    options: {
      name: "kicker", type: "body", x: MX, y: 0.5, w: 10, h: 0.3,
      fontFace: "Arial", fontSize: 12, bold: true, color, charSpacing: 2, margin: 0, valign: "top", align: "left",
    },
    text: "",
  },
});
const PH_TITLE = (color) => ({
  placeholder: {
    options: {
      name: "title", type: "title", x: MX, y: 0.8, w: RIGHT - MX, h: 0.8,
      fontFace: "Cambria", fontSize: 36, bold: true, color, margin: 0, valign: "top", align: "left",
    },
    text: "",
  },
});
const SLIDE_NUMBER = (color) => ({ x: 12.13, y: 6.6, w: 0.6, h: 0.25, fontFace: "Arial", fontSize: 10, color, align: "right" });

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------
pres.defineSlideMaster({
  title: "TITEL_DUNKEL",
  background: { color: SC.navy },
  objects: [
    ...trackObjects(true),
    {
      placeholder: {
        options: {
          name: "kicker", type: "body", x: MX, y: 1.75, w: 6.6, h: 0.3,
          fontFace: "Arial", fontSize: 13, bold: true, color: SC.redOnDark, charSpacing: 2.5, margin: 0, valign: "top", align: "left",
        },
        text: "",
      },
    },
    {
      placeholder: {
        options: {
          name: "title", type: "title", x: MX, y: 2.2, w: 7.0, h: 1.15,
          fontFace: "Cambria", fontSize: 54, bold: true, color: SC.white, margin: 0, valign: "top", align: "left",
        },
        text: "",
      },
    },
    {
      placeholder: {
        options: {
          name: "subtitle", type: "body", x: MX, y: 3.45, w: 6.8, h: 0.6,
          fontFace: "Cambria", fontSize: 30, color: SC.steel, margin: 0, valign: "top", align: "left",
        },
        text: "",
      },
    },
  ],
});

pres.defineSlideMaster({
  title: "INHALT_HELL",
  background: { color: SC.white },
  objects: [...trackObjects(false), PH_KICKER(SC.red), PH_TITLE(SC.navy)],
  slideNumber: SLIDE_NUMBER(HEX.labelLight),
});

pres.defineSlideMaster({
  title: "INHALT_DUNKEL",
  background: { color: SC.navy },
  objects: [...trackObjects(true), PH_KICKER(SC.redOnDark), PH_TITLE(SC.white)],
  slideNumber: SLIDE_NUMBER(HEX.labelDark),
});

pres.defineSlideMaster({
  title: "ANHANG_HELL",
  background: { color: SC.white },
  objects: [PH_KICKER(SC.red), PH_TITLE(SC.navy)],
  slideNumber: SLIDE_NUMBER(HEX.labelLight),
});

// Kicker + Titel einer Inhaltsfolie
function heading(slide, kicker, title) {
  slide.addText(kicker, { placeholder: "kicker", charSpacing: 2, align: "left" });
  slide.addText(title, { placeholder: "title", align: "left" });
}

// ---------------------------------------------------------------------------
// Folie 1 – Titel
// ---------------------------------------------------------------------------
pres.addSection({ title: "Einstieg" });
{
  const s = pres.addSlide({ masterName: "TITEL_DUNKEL", sectionTitle: "Einstieg" });
  s.addText("VIER JAHRE, DIE DIE USA PRÄGTEN", { placeholder: "kicker", charSpacing: 2.5, align: "left" });
  s.addText("Donald J. Trump", { placeholder: "title", align: "left" });
  s.addText(
    [
      { text: "Die erste Amtszeit  ", options: { color: SC.steel } },
      { text: "2017 – 2021", options: { color: SC.redOnDark, bold: true } },
    ],
    { placeholder: "subtitle", align: "left" }
  );
  text(s, "Person  ·  Die prägenden Ereignisse  ·  Bilanz", {
    x: MX, y: 4.45, w: 6.8, h: 0.35, fontSize: 16, color: SC.steel,
  });

  // Die große 45 – wandert per Morph auf Folie 2 in die rote Kachel
  text(s, "45", {
    x: 6.75, y: 0.35, w: 6.0, h: 5.3, fontSize: 330, bold: true, color: SC.red,
    align: "right", valign: "middle", objectName: "!!n45",
  });
  text(s, "45. Präsident der Vereinigten Staaten", {
    x: 8.2, y: 5.0, w: 4.45, h: 0.3, fontSize: 14, color: SC.steel, align: "right",
  });

  timeline(s, { dots: ["2017-01-20"], dark: true });
  text(s, "Amtsantritt", {
    x: tx("2017-01-20") - 0.02, y: TL.y - 0.36, w: 1.5, h: 0.22, fontSize: 10, color: HEX.labelDark,
    objectName: "!!tl-label",
  });

  s.addNotes(
    "Herzlich willkommen! Mein Thema ist die erste Amtszeit von Donald Trump – die vier Jahre von Januar 2017 bis Januar 2021, in denen er der 45. Präsident der USA war.\n\n" +
      "Ich stelle zuerst kurz die Person vor. Danach geht es um die Ereignisse, die diese vier Jahre am stärksten geprägt haben, und zum Schluss ziehe ich eine Bilanz.\n\n" +
      "Kleiner Tipp: Der Zeitstrahl unten auf jeder Folie zeigt immer, wo wir uns gerade in der Amtszeit befinden."
  );
}

// ---------------------------------------------------------------------------
// Folie 2 – Die Person
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide({ masterName: "INHALT_HELL", sectionTitle: "Einstieg" });
  heading(s, "01 · DIE PERSON", "Vom Immobilien-Tycoon ins Weiße Haus");

  // Rote Kachel mit der 45
  const L = { x: MX, w: 5.75 };
  tile(s, { x: L.x, y: CONTENT_TOP, w: L.w, h: 1.2, fill: { color: SC.red } });
  text(s, "45", {
    x: L.x + 0.25, y: CONTENT_TOP + 0.05, w: 1.35, h: 1.1, fontSize: 60, bold: true, color: SC.white,
    valign: "middle", objectName: "!!n45",
  });
  text(s, "45. Präsident der USA", {
    x: L.x + 1.7, y: CONTENT_TOP + 0.2, w: 3.85, h: 0.32, fontSize: 18, bold: true, color: SC.white,
  });
  text(s, "Amtszeit: 20.01.2017 – 20.01.2021", {
    x: L.x + 1.7, y: CONTENT_TOP + 0.56, w: 3.9, h: 0.25, fontSize: 14, color: SC.white,
  });
  text(s, "Vizepräsident: Mike Pence", {
    x: L.x + 1.7, y: CONTENT_TOP + 0.83, w: 3.9, h: 0.25, fontSize: 14, color: SC.white,
  });

  // Steckbrief
  const rows = [
    ["GEBOREN", "14. Juni 1946 in New York City"],
    ["KARRIERE", "Immobilien-Unternehmer, ab 1971 Chef der Trump Organization"],
    ["TV-STAR", "Show „The Apprentice“ (2004–2015)"],
    ["WAHLKAMPF", "Republikaner · „Make America Great Again“"],
    ["NOVUM", "erster Präsident ohne politisches Amt oder Militärdienst"],
  ];
  const top = 3.3;
  const rh = 0.59;
  rows.forEach(([k, v], i) => {
    const y = top + i * rh;
    if (i > 0) {
      s.addShape(pres.shapes.LINE, { x: L.x, y: y - 0.06, w: L.w, h: 0, line: { color: HEX.hairLight, width: 0.75 } });
    }
    text(s, k, { x: L.x, y: y + 0.04, w: 1.7, h: 0.25, fontSize: 11, bold: true, color: SC.red, charSpacing: 1.5 });
    text(s, v, { x: L.x + 1.8, y, w: L.w - 1.8, h: 0.5, fontSize: 14, color: SC.navy });
  });

  // Wahl 2016: Kachelkarte
  const R = { x: 6.75, y: CONTENT_TOP, w: RIGHT - 6.75, h: CONTENT_BOTTOM - CONTENT_TOP };
  tile(s, { x: R.x, y: R.y, w: R.w, h: R.h, fill: { color: SC.tile } });
  text(s, "WAHL 2016 · WAHLLEUTE", {
    x: R.x + 0.3, y: R.y + 0.22, w: 3.5, h: 0.25, fontSize: 11, bold: true, color: SC.red, charSpacing: 1.5,
  });
  text(
    s,
    [
      { text: "304 : 227", options: { fontSize: 36, bold: true, color: SC.navy } },
    ],
    { x: R.x + 0.3, y: R.y + 0.5, w: 2.8, h: 0.65 }
  );
  text(s, "für Trump – obwohl Clinton landesweit 2,9 Mio. Stimmen mehr bekam", {
    x: R.x + 3.05, y: R.y + 0.52, w: R.w - 3.35, h: 0.62, fontSize: 14, color: SC.slate,
  });

  const STATES = [
    ["AK", 0, 0, "R"], ["ME", 10, 0, "D"],
    ["WI", 5, 1, "R"], ["VT", 9, 1, "D"], ["NH", 10, 1, "D"],
    ["WA", 0, 2, "D"], ["ID", 1, 2, "R"], ["MT", 2, 2, "R"], ["ND", 3, 2, "R"], ["MN", 4, 2, "D"],
    ["IL", 5, 2, "D"], ["MI", 6, 2, "R"], ["NY", 8, 2, "D"], ["MA", 9, 2, "D"],
    ["OR", 0, 3, "D"], ["NV", 1, 3, "D"], ["WY", 2, 3, "R"], ["SD", 3, 3, "R"], ["IA", 4, 3, "R"],
    ["IN", 5, 3, "R"], ["OH", 6, 3, "R"], ["PA", 7, 3, "R"], ["NJ", 8, 3, "D"], ["CT", 9, 3, "D"], ["RI", 10, 3, "D"],
    ["CA", 0, 4, "D"], ["UT", 1, 4, "R"], ["CO", 2, 4, "D"], ["NE", 3, 4, "R"], ["MO", 4, 4, "R"],
    ["KY", 5, 4, "R"], ["WV", 6, 4, "R"], ["VA", 7, 4, "D"], ["MD", 8, 4, "D"], ["DE", 9, 4, "D"],
    ["AZ", 1, 5, "R"], ["NM", 2, 5, "D"], ["KS", 3, 5, "R"], ["AR", 4, 5, "R"], ["TN", 5, 5, "R"],
    ["NC", 6, 5, "R"], ["SC", 7, 5, "R"], ["DC", 8, 5, "D"],
    ["OK", 3, 6, "R"], ["LA", 4, 6, "R"], ["MS", 5, 6, "R"], ["AL", 6, 6, "R"], ["GA", 7, 6, "R"],
    ["HI", 0, 7, "D"], ["TX", 3, 7, "R"], ["FL", 8, 7, "R"],
  ];
  const RUST = new Set(["PA", "MI", "WI"]);
  const pitch = 0.34;
  const size = 0.3;
  const mapX = R.x + 0.3;
  const mapY = R.y + 1.35;
  for (const [abbr, c, r, win] of STATES) {
    const rust = RUST.has(abbr);
    s.addText(abbr, {
      shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.04,
      x: mapX + c * pitch, y: mapY + r * pitch, w: size, h: size,
      fill: { color: win === "R" ? SC.red : SC.blue },
      line: rust ? { color: SC.navy, width: 2.25 } : undefined,
      fontSize: 8, bold: true, color: SC.white, align: "center", valign: "middle", margin: 0,
      lang: "en-US", objectName: `Staat ${abbr}`,
    });
  }

  // Legende + Rust-Belt-Hinweis rechts neben der Karte
  const lx = mapX + 10 * pitch + size + 0.35;
  const lw = R.x + R.w - 0.25 - lx;
  const legend = [
    [SC.red, "Trump (R)", "30 Staaten"],
    [SC.blue, "Clinton (D)", "20 + D.C."],
  ];
  legend.forEach(([col, a, b], i) => {
    const y = mapY + 0.02 + i * 0.62;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: lx, y: y + 0.04, w: 0.18, h: 0.18, rectRadius: 0.03, fill: { color: col } });
    text(s, a, { x: lx + 0.28, y, w: lw - 0.28, h: 0.24, fontSize: 12, bold: true, color: SC.navy });
    text(s, b, { x: lx + 0.28, y: y + 0.24, w: lw - 0.28, h: 0.24, fontSize: 12, color: SC.slate });
  });
  const ry = mapY + 1.42;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: lx, y: ry + 0.04, w: 0.18, h: 0.18, rectRadius: 0.03, fill: { color: SC.tile }, line: { color: SC.navy, width: 2 },
  });
  text(s, "Rust Belt", { x: lx + 0.28, y: ry, w: lw - 0.28, h: 0.24, fontSize: 12, bold: true, color: SC.navy });
  text(s, "PA, MI und WI entschieden die Wahl – mit zusammen nur ~78.000 Stimmen Vorsprung", {
    x: lx, y: ry + 0.3, w: lw, h: 1.2, fontSize: 12, color: SC.slate,
  });

  timeline(s, { dots: ["2017-01-20"] });
  text(s, "Amtsantritt", {
    x: tx("2017-01-20") - 0.02, y: TL.y - 0.36, w: 1.5, h: 0.22, fontSize: 10, color: HEX.labelLight,
    objectName: "!!tl-label",
  });

  s.addNotes(
    "Donald Trump wurde am 14. Juni 1946 in New York geboren. Nach seinem Wirtschaftsstudium übernahm er 1971 die Immobilienfirma seines Vaters und machte daraus die Trump Organization – mit Hochhäusern wie dem Trump Tower, mit Hotels, Casinos und Golfplätzen. Dabei gab es auch Pleiten: Mehrere seiner Firmen, vor allem Casinos, mussten Insolvenz anmelden. Landesweit berühmt wurde er durchs Fernsehen: Von 2004 bis 2015 moderierte er die Show „The Apprentice“, sein Satz „You’re fired!“ wurde zum Markenzeichen.\n\n" +
      "2015 kündigte er seine Kandidatur an – für die Republikaner und mit dem Slogan „Make America Great Again“. In den Vorwahlen setzte er sich gegen 16 Konkurrenten durch, im November 2016 schlug er Hillary Clinton.\n\n" +
      "Rechts sehen wir das Ergebnis: 304 zu 227 Wahlleute. Entscheidend waren Pennsylvania, Michigan und Wisconsin – auf der Karte dunkel umrandet. Dort gewann Trump mit zusammen nur rund 78.000 Stimmen Vorsprung. Landesweit hatte Clinton sogar fast 2,9 Millionen Stimmen mehr – das ermöglicht das amerikanische Wahlleute-System.\n\n" +
      "Am 20. Januar 2017 wurde Trump vereidigt: als erster Präsident ohne vorheriges politisches Amt und ohne Militärdienst – und mit 70 Jahren als damals ältester Präsident bei Amtsantritt."
  );
}

// ---------------------------------------------------------------------------
// Folie 3 – Wirtschaft
// ---------------------------------------------------------------------------
pres.addSection({ title: "Ereignisse" });
{
  const s = pres.addSlide({ masterName: "INHALT_HELL", sectionTitle: "Ereignisse" });
  heading(s, "02 · WIRTSCHAFT · 2017–2020", "Steuern runter, Zölle rauf");

  const colW = 5.9;
  const gap = 0.333;
  const xL = MX;
  const xR = MX + colW + gap;
  const bigH = 2.45;
  const smallY = CONTENT_TOP + bigH + 0.2;
  const smallH = CONTENT_BOTTOM - smallY;
  const smallW = (colW - 0.2) / 2;

  // Links: Steuerreform
  tile(s, { x: xL, y: CONTENT_TOP, w: colW, h: bigH, fill: { color: SC.navy } });
  text(s, "STEUERN RUNTER", { x: xL + 0.35, y: CONTENT_TOP + 0.28, w: 5, h: 0.25, fontSize: 12, bold: true, color: SC.redOnDark, charSpacing: 2 });
  text(
    s,
    [
      { text: "35 % ", options: { color: SC.white } },
      { text: "→", options: { color: SC.redOnDark } },
      { text: " 21 %", options: { color: SC.white } },
    ],
    { x: xL + 0.35, y: CONTENT_TOP + 0.55, w: 5.3, h: 0.95, fontSize: 60, bold: true }
  );
  text(s, "Unternehmenssteuer – Kern der größten Steuerreform seit 1986 (Dezember 2017)", {
    x: xL + 0.35, y: CONTENT_TOP + 1.72, w: 5.2, h: 0.6, fontSize: 14, color: SC.steel,
  });

  tile(s, { x: xL, y: smallY, w: smallW, h: smallH, fill: { color: SC.tile } });
  text(s, "37 %", { x: xL + 0.3, y: smallY + 0.22, w: smallW - 0.5, h: 0.55, fontSize: 30, bold: true, color: SC.navy });
  text(s, "Spitzensteuersatz für Privatleute (vorher 39,6 %)", { x: xL + 0.3, y: smallY + 0.82, w: smallW - 0.5, h: 0.7, fontSize: 14, color: SC.slate });

  tile(s, { x: xL + smallW + 0.2, y: smallY, w: smallW, h: smallH, fill: { color: SC.tile } });
  text(s, "+1,5 Bio. $", { x: xL + smallW + 0.5, y: smallY + 0.22, w: smallW - 0.5, h: 0.55, fontSize: 30, bold: true, color: SC.navy });
  text(s, "zusätzliche Schulden in 10 Jahren (Schätzung des Kongresses)", { x: xL + smallW + 0.5, y: smallY + 0.82, w: smallW - 0.5, h: 0.7, fontSize: 14, color: SC.slate });

  // Rechts: Handelskrieg
  tile(s, { x: xR, y: CONTENT_TOP, w: colW, h: bigH, fill: { color: SC.red } });
  text(s, "ZÖLLE RAUF", { x: xR + 0.35, y: CONTENT_TOP + 0.28, w: 5, h: 0.25, fontSize: 12, bold: true, color: SC.white, charSpacing: 2 });
  text(s, "370 Mrd. $", { x: xR + 0.35, y: CONTENT_TOP + 0.55, w: 5.3, h: 0.95, fontSize: 60, bold: true, color: SC.white });
  text(s, "chinesische Importe mit Strafzöllen belegt (2018–2019) – der Handelskrieg mit China", {
    x: xR + 0.35, y: CONTENT_TOP + 1.72, w: 5.2, h: 0.6, fontSize: 14, color: SC.white,
  });

  tile(s, { x: xR, y: smallY, w: smallW, h: smallH, fill: { color: SC.tile } });
  text(s, "28 Mrd. $", { x: xR + 0.3, y: smallY + 0.22, w: smallW - 0.5, h: 0.55, fontSize: 30, bold: true, color: SC.navy });
  text(s, "Hilfen für US-Farmer – China konterte mit Zöllen auf Soja & Co.", { x: xR + 0.3, y: smallY + 0.82, w: smallW - 0.5, h: 0.7, fontSize: 14, color: SC.slate });

  tile(s, { x: xR + smallW + 0.2, y: smallY, w: smallW, h: smallH, fill: { color: SC.tile } });
  text(s, "Jan. 2020", { x: xR + smallW + 0.5, y: smallY + 0.22, w: smallW - 0.5, h: 0.55, fontSize: 30, bold: true, color: SC.navy });
  text(s, "„Phase One“-Deal: China verspricht Mehrkäufe von 200 Mrd. $", { x: xR + smallW + 0.5, y: smallY + 0.82, w: smallW - 0.5, h: 0.7, fontSize: 14, color: SC.slate });

  timeline(s, { span: ["2017-12-22", "2020-01-15"], dots: ["2017-12-22", "2018-07-06", "2020-01-15"] });

  s.addNotes(
    "Beginnen wir mit der Wirtschaft. Trumps Kurs lässt sich in vier Worten zusammenfassen: Steuern runter, Zölle rauf.\n\n" +
      "Links: Im Dezember 2017 unterschrieb Trump den „Tax Cuts and Jobs Act“, die größte Steuerreform seit 1986. Kernstück: Die Steuer auf Unternehmensgewinne sank von 35 auf 21 Prozent. Auch Privatleute wurden entlastet, der Spitzensteuersatz fiel von 39,6 auf 37 Prozent. Befürworter sagten, so würden Firmen wieder mehr in den USA investieren und Jobs schaffen. Kritiker hielten dagegen, dass vor allem Unternehmen und Wohlhabende profitieren – und dass die Reform laut Schätzung des Kongresses in zehn Jahren rund 1,5 Billionen Dollar zusätzliche Schulden verursacht.\n\n" +
      "Rechts: Gleichzeitig brach Trump mit der Freihandelspolitik seiner Vorgänger. Ab 2018 verhängte er Strafzölle – auf Stahl und Aluminium, was übrigens auch die EU und Deutschland traf, und vor allem auf Waren aus China. Am Ende waren chinesische Importe im Wert von rund 370 Milliarden Dollar betroffen. Sein Ziel: das Handelsdefizit senken und China zu faireren Regeln zwingen. China schlug zurück, unter anderem mit Zöllen auf Sojabohnen. Das traf amerikanische Farmer so hart, dass die Regierung ihnen rund 28 Milliarden Dollar Hilfe zahlte. Im Januar 2020 folgte eine Art Waffenstillstand: Im „Phase One“-Abkommen versprach China, zusätzlich US-Waren für 200 Milliarden Dollar zu kaufen. Außerdem ersetzte Trump das Freihandelsabkommen NAFTA mit Kanada und Mexiko durch das neue USMCA.\n\n" +
      "Bis Anfang 2020 lief die Wirtschaft gut: Im Februar 2020 lag die Arbeitslosigkeit bei nur 3,5 Prozent, so niedrig wie seit 50 Jahren nicht. Wie schnell sich das änderte, sehen wir gleich bei Corona."
  );
}

// ---------------------------------------------------------------------------
// Folie 4 – Justiz / Supreme Court
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide({ masterName: "INHALT_HELL", sectionTitle: "Ereignisse" });
  heading(s, "03 · JUSTIZ · 2017–2020", "Ein Gericht für eine Generation");

  const lw = 3.75;
  tile(s, { x: MX, y: CONTENT_TOP, w: lw, h: 2.45, fill: { color: SC.navy } });
  text(s, "SUPREME COURT · 2021", { x: MX + 0.3, y: CONTENT_TOP + 0.28, w: lw - 0.5, h: 0.25, fontSize: 12, bold: true, color: SC.redOnDark, charSpacing: 2 });
  text(s, "6 : 3", { x: MX + 0.3, y: CONTENT_TOP + 0.5, w: lw - 0.5, h: 1.05, fontSize: 72, bold: true, color: SC.white });
  text(s, "konservative Mehrheit – die Richter bleiben auf Lebenszeit", { x: MX + 0.3, y: CONTENT_TOP + 1.72, w: lw - 0.55, h: 0.6, fontSize: 14, color: SC.steel });

  const by = 4.55;
  tile(s, { x: MX, y: by, w: lw, h: CONTENT_BOTTOM - by, fill: { color: SC.tile } });
  text(s, "234", { x: MX + 0.3, y: by + 0.22, w: lw - 0.5, h: 0.6, fontSize: 34, bold: true, color: SC.navy });
  text(s, "Bundesrichter ernannt – alle auf Lebenszeit", { x: MX + 0.3, y: by + 0.85, w: lw - 0.55, h: 0.6, fontSize: 14, color: SC.slate });

  // Sitzordnung vorher/nachher
  const gx = 4.65;
  const seatX0 = 5.95;
  const seatPitch = 0.76;
  const seatD = 0.56;
  const row1 = 2.3;
  const row2 = 3.42;
  const kinds = {
    kons: { fill: { color: SC.navy } },
    swing: { fill: { color: SC.steelMid } },
    trump: { fill: { color: SC.red } },
    lib: { fill: { color: HEX.seatLiberal } },
    frei: { fill: { color: SC.white }, line: { color: SC.navy, width: 1.5 } },
  };
  const before = [
    ["Roberts", "kons"], ["Thomas", "kons"], ["Alito", "kons"], ["frei", "frei"], ["Kennedy", "swing"],
    ["Ginsburg", "lib"], ["Breyer", "lib"], ["Sotomayor", "lib"], ["Kagan", "lib"],
  ];
  const after = [
    ["Roberts", "kons"], ["Thomas", "kons"], ["Alito", "kons"], ["Gorsuch", "trump"], ["Kavanaugh", "trump"],
    ["Barrett", "trump"], ["Breyer", "lib"], ["Sotomayor", "lib"], ["Kagan", "lib"],
  ];
  const rowLabel = (y, a, b) => {
    text(s, a, { x: gx, y: y - 0.28, w: 1.2, h: 0.32, fontSize: 18, bold: true, color: SC.navy });
    text(s, b, { x: gx, y: y + 0.04, w: 1.2, h: 0.25, fontSize: 11, color: SC.slate });
  };
  rowLabel(row1, "2017", "bei Amtsantritt");
  rowLabel(row2, "2021", "bei Amtsende");
  const drawRow = (seats, cy, labelAll) => {
    seats.forEach(([name, kind], i) => {
      const x = seatX0 + i * seatPitch;
      s.addShape(pres.shapes.OVAL, Object.assign({ x, y: cy - seatD / 2, w: seatD, h: seatD }, JSON.parse(JSON.stringify(kinds[kind]))));
      const changed = i >= 3 && i <= 5;
      if (labelAll || changed) {
        text(s, name, {
          x: x - 0.12, y: cy + seatD / 2 + 0.04, w: seatD + 0.24, h: 0.2, fontSize: 10, align: "center",
          color: kind === "trump" ? SC.red : SC.slate, bold: kind === "trump",
        });
      }
    });
  };
  drawRow(before, row1, false);
  drawRow(after, row2, true);
  // Pfeile für die drei neu besetzten Sitze
  for (let i = 3; i <= 5; i++) {
    const cx = seatX0 + i * seatPitch + seatD / 2;
    s.addShape(pres.shapes.ISOSCELES_TRIANGLE, {
      x: cx - 0.07, y: row1 + seatD / 2 + 0.3, w: 0.14, h: 0.1, rotate: 180, fill: { color: SC.red },
    });
  }
  // Legende
  const legend = [
    ["kons", "konservativ"], ["swing", "Swing-Richter"], ["trump", "von Trump ernannt"], ["lib", "liberal"], ["frei", "unbesetzt"],
  ];
  let lx = gx;
  legend.forEach(([kind, label]) => {
    s.addShape(pres.shapes.OVAL, Object.assign({ x: lx, y: 4.17, w: 0.16, h: 0.16 }, JSON.parse(JSON.stringify(kinds[kind]))));
    const w = label.length * 0.075 + 0.1;
    text(s, label, { x: lx + 0.22, y: 4.14, w, h: 0.22, fontSize: 10, color: SC.slate });
    lx += 0.22 + w + 0.18;
  });

  // Drei Karten zu den Ernennungen
  const cards = [
    ["Neil Gorsuch", "2017 · SENAT 54 : 45", "Folgt auf Scalia – der Sitz war 2016 für Obama blockiert."],
    ["Brett Kavanaugh", "2018 · SENAT 50 : 48", "Ersetzt Swing-Richter Kennedy – trotz Missbrauchsvorwürfen."],
    ["Amy Coney Barrett", "2020 · SENAT 52 : 48", "Folgt auf die liberale Ikone Ginsburg – 8 Tage vor der Wahl."],
  ];
  const cy0 = 4.55;
  const cw = (RIGHT - gx - 2 * 0.2) / 3;
  cards.forEach(([name, meta, body], i) => {
    const x = gx + i * (cw + 0.2);
    tile(s, { x, y: cy0, w: cw, h: CONTENT_BOTTOM - cy0, fill: { color: SC.tile } });
    text(s, name, { x: x + 0.22, y: cy0 + 0.17, w: cw - 0.4, h: 0.3, fontSize: 15, bold: true, color: SC.navy });
    text(s, meta, { x: x + 0.22, y: cy0 + 0.47, w: cw - 0.4, h: 0.22, fontSize: 10, bold: true, color: SC.red, charSpacing: 1 });
    text(s, body, { x: x + 0.22, y: cy0 + 0.75, w: cw - 0.4, h: 0.9, fontSize: 14, color: SC.slate });
  });

  timeline(s, { span: ["2017-04-07", "2020-10-26"], dots: ["2017-04-07", "2018-10-06", "2020-10-26"] });

  s.addNotes(
    "Jetzt zu dem Bereich, der wohl am längsten nachwirkt: der Justiz. Der Supreme Court ist das oberste Gericht der USA. Seine neun Richter werden vom Präsidenten vorgeschlagen, vom Senat bestätigt – und bleiben dann auf Lebenszeit. Das Gericht entscheidet über die großen Streitfragen des Landes, etwa Abtreibung, Waffenrecht oder Wahlrecht.\n\n" +
      "Trump konnte in nur einer Amtszeit drei Sitze besetzen. Die Grafik zeigt, wie sich das Gericht verändert hat. Oben die Lage bei seinem Amtsantritt: Ein Sitz war frei, denn der konservative Richter Antonin Scalia war 2016 gestorben, und der republikanisch geführte Senat hatte sich geweigert, über Obamas Kandidaten auch nur abzustimmen. Diesen Sitz besetzte Trump 2017 mit Neil Gorsuch.\n\n" +
      "2018 ging Anthony Kennedy in den Ruhestand – ein Konservativer, der aber oft mit den Liberalen stimmte, also das Zünglein an der Waage. Sein Nachfolger Brett Kavanaugh wurde nach Vorwürfen sexueller Übergriffe, die er bestritt, mit 50 zu 48 Stimmen äußerst knapp bestätigt. Und im September 2020 starb die liberale Richterin Ruth Bader Ginsburg. Ihre Nachfolgerin Amy Coney Barrett wurde nur acht Tage vor der Präsidentschaftswahl bestätigt.\n\n" +
      "Das Ergebnis sehen wir unten: Aus einem knapp ausbalancierten Gericht wurde eine klare konservative Mehrheit von 6 zu 3. Da die drei Neuen bei ihrer Ernennung im Schnitt nur 50 Jahre alt waren, kann diese Mehrheit noch Jahrzehnte halten. Insgesamt ernannte Trump 234 Bundesrichter – alle auf Lebenszeit.\n\n" +
      "(Optionaler Ausblick: Wie groß dieser Einfluss ist, zeigte sich 2022, als dieses Gericht das landesweite Recht auf Abtreibung – das Urteil Roe v. Wade – aufhob.)"
  );
}

// ---------------------------------------------------------------------------
// Folie 5 – America First: Grenze & Welt
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide({ masterName: "INHALT_HELL", sectionTitle: "Ereignisse" });
  heading(s, "04 · AMERICA FIRST · 2017–2020", "Härte an der Grenze, Alleingänge in der Welt");

  const lw = 3.75;
  tile(s, { x: MX, y: CONTENT_TOP, w: lw, h: CONTENT_BOTTOM - CONTENT_TOP, fill: { color: SC.navy } });
  text(s, "AMTSEINFÜHRUNG · 20.01.2017", { x: MX + 0.3, y: CONTENT_TOP + 0.3, w: lw - 0.5, h: 0.25, fontSize: 11, bold: true, color: SC.redOnDark, charSpacing: 1.5 });
  text(s, "“", { x: MX + 0.24, y: CONTENT_TOP + 0.5, w: 1, h: 0.8, fontSize: 80, bold: true, color: SC.redOnDark, fontFace: "+mj-lt" });
  text(s, "From this day forward, it’s going to be only America first.", {
    x: MX + 0.3, y: CONTENT_TOP + 1.25, w: lw - 0.55, h: 1.6, fontSize: 24, bold: true, italic: true, color: SC.white,
    fontFace: "+mj-lt", lang: "en-US",
  });
  text(s, "„Von diesem Tag an heißt es nur noch: Amerika zuerst.“", {
    x: MX + 0.3, y: CONTENT_TOP + 2.85, w: lw - 0.55, h: 0.55, fontSize: 14, italic: true, color: SC.steel,
  });
  text(s, "Leitidee: nationale Interessen vor internationalen Verpflichtungen", {
    x: MX + 0.3, y: CONTENT_TOP + 3.55, w: lw - 0.55, h: 0.55, fontSize: 14, color: SC.white,
  });

  const gx = 4.65;
  const cw = (RIGHT - gx - 2 * 0.2) / 3;
  const rows = [
    {
      label: "AN DER GRENZE", y: CONTENT_TOP, items: [
        ["7 Länder", "Einreisestopp für Bürger muslimisch geprägter Staaten (2017)"],
        ["35 Tage", "längster Shutdown der US-Geschichte – Streit um Geld für die Mauer"],
        ["3.900+", "Kinder an der Grenze von den Eltern getrennt – Höhepunkt 2018"],
      ],
    },
    {
      label: "IN DER WELT", y: 4.185, items: [
        ["Klima & Iran", "Ausstieg aus Pariser Klimaabkommen und Iran-Atomdeal"],
        ["Nordkorea", "2018 erster Gipfel mit Kim Jong-un – Abrüstung bleibt aus"],
        ["Nahost", "Abraham-Abkommen 2020: Israel nimmt Beziehungen zu VAE und Bahrain auf"],
      ],
    },
  ];
  rows.forEach((row) => {
    text(s, row.label, { x: gx, y: row.y, w: 4, h: 0.25, fontSize: 12, bold: true, color: SC.red, charSpacing: 2 });
    const ty = row.y + 0.33;
    const th = 1.735;
    row.items.forEach(([hero, body], i) => {
      const x = gx + i * (cw + 0.2);
      tile(s, { x, y: ty, w: cw, h: th, fill: { color: SC.tile } });
      text(s, hero, { x: x + 0.25, y: ty + 0.2, w: cw - 0.45, h: 0.45, fontSize: 24, bold: true, color: SC.navy });
      text(s, body, { x: x + 0.25, y: ty + 0.7, w: cw - 0.45, h: 0.95, fontSize: 14, color: SC.slate });
    });
  });

  timeline(s, { span: ["2017-01-27", "2020-09-15"], dots: ["2017-01-27", "2018-06-12", "2018-12-22", "2020-09-15"] });

  s.addNotes(
    "„America First“ – Amerika zuerst. Mit diesem Satz trat Trump sein Amt an, und er wurde zur Leitlinie seiner Politik – an der Grenze und in der Welt.\n\n" +
      "Obere Reihe, die Grenze: Migration war sein wichtigstes Wahlkampfthema. Eine Woche nach Amtsantritt verhängte er einen Einreisestopp für Bürger aus sieben überwiegend muslimischen Ländern. Gerichte stoppten die erste Fassung, eine überarbeitete Version bestätigte der Supreme Court 2018. Für die versprochene Mauer zu Mexiko verlangte Trump 5,7 Milliarden Dollar vom Kongress. Die Demokraten lehnten ab – es folgte der längste Regierungsstillstand der US-Geschichte: 35 Tage, rund 800.000 Staatsbedienstete ohne Lohn. Gebaut wurden bis 2021 rund 725 Kilometer Mauer, meist als Ersatz für alte Zäune. Am umstrittensten war 2018 die „Null-Toleranz“-Politik: Wer illegal einreiste, wurde angeklagt – und Kinder wurden von ihren Eltern getrennt. Nach landesweiten Protesten stoppte Trump die Praxis; laut einer späteren Regierungskommission waren mindestens rund 3.900 Kinder betroffen.\n\n" +
      "Untere Reihe, die Welt: Trump kündigte den Ausstieg aus dem Pariser Klimaabkommen an und verließ das Atomabkommen mit dem Iran. Von den NATO-Partnern – auch von Deutschland – forderte er immer wieder deutlich höhere Verteidigungsausgaben. Gleichzeitig suchte er ungewöhnliche Deals: 2018 traf er sich in Singapur als erster amtierender US-Präsident mit Nordkoreas Machthaber Kim Jong-un – eine echte atomare Abrüstung kam aber nie zustande. Im Nahen Osten verlegte er die US-Botschaft nach Jerusalem und vermittelte 2020 die Abraham-Abkommen: Israel nahm offizielle Beziehungen zu den Vereinigten Arabischen Emiraten und Bahrain auf, später erklärten sich auch Marokko und der Sudan dazu bereit. Diese Abkommen gelten selbst bei vielen Kritikern als Erfolg."
  );
}

// ---------------------------------------------------------------------------
// Folie 6 – Corona
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide({ masterName: "INHALT_HELL", sectionTitle: "Ereignisse" });
  heading(s, "05 · CORONA · 2020", "Vom Boom in die Krise");

  text(s, "Arbeitslosenquote der USA in %, monatlich", { x: MX, y: CONTENT_TOP, w: 7.6, h: 0.3, fontSize: 14, bold: true, color: SC.navy });

  const MONTHS = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
  // U.S. Bureau of Labor Statistics, Reihe LNS14000000 (saisonbereinigt)
  const UNRATE = [
    4.7, 4.6, 4.4, 4.4, 4.4, 4.3, 4.3, 4.4, 4.3, 4.2, 4.2, 4.1,
    4.0, 4.1, 4.0, 4.0, 3.8, 4.0, 3.8, 3.8, 3.7, 3.8, 3.8, 3.9,
    4.0, 3.8, 3.8, 3.7, 3.6, 3.6, 3.7, 3.6, 3.5, 3.6, 3.6, 3.6,
    3.5, 3.5, 4.4, 14.8, 13.2, 11.0, 10.2, 8.4, 7.8, 6.8, 6.7, 6.7,
  ];
  // Achse zeigt nur die Jahre; die übrigen Monate bleiben unbeschriftet
  const labels = [];
  for (let y = 2017; y <= 2020; y++) MONTHS.forEach((m, i) => labels.push(i === 0 ? String(y) : ""));
  s.addChart(
    pres.charts.LINE,
    [{ name: "Arbeitslosenquote (%)", labels, values: UNRATE }],
    {
      x: MX - 0.1, y: CONTENT_TOP + 0.35, w: 7.85, h: 3.0,
      chartColors: [HEX.navy], lineSize: 2, lineDataSymbol: "none",
      showLegend: false, showTitle: false,
      valAxisMinVal: 0, valAxisMaxVal: 20, valAxisMajorUnit: 5, valAxisLabelFormatCode: "0",
      valAxisLabelColor: HEX.labelLight, catAxisLabelColor: HEX.labelLight,
      valAxisLabelFontSize: 10, catAxisLabelFontSize: 10,
      valAxisLabelFontFace: "+mn-lt", catAxisLabelFontFace: "+mn-lt",
      valAxisLineShow: false, catAxisLineShow: true, catAxisLineColor: HEX.hairLight,
      valGridLine: { color: HEX.grid, size: 0.75 }, catGridLine: { style: "none" },
      catAxisLabelFrequency: 12, catAxisMajorTickMark: "none", valAxisMajorTickMark: "none",
      layout: { x: 0.06, y: 0.07, w: 0.84, h: 0.8 },
    }
  );
  text(s, "Quelle: U.S. Bureau of Labor Statistics (saisonbereinigt)", {
    x: MX, y: CONTENT_TOP + 3.38, w: 7.6, h: 0.22, fontSize: 10, color: HEX.labelLight,
  });
  text(s, "“", { x: MX - 0.04, y: 5.42, w: 0.5, h: 0.8, fontSize: 54, bold: true, color: SC.red, fontFace: "+mj-lt" });
  text(s, "I wanted to always play it down.", {
    x: MX + 0.45, y: 5.52, w: 7.1, h: 0.4, fontSize: 20, bold: true, italic: true, color: SC.navy, fontFace: "+mj-lt", lang: "en-US",
  });
  text(s, "Trump im März 2020 zum Journalisten Bob Woodward – über die Gefahr des Virus", {
    x: MX + 0.45, y: 5.93, w: 7.1, h: 0.3, fontSize: 12, color: SC.slate,
  });

  // Kennzahlen rechts
  const rx = 8.75;
  const rw = RIGHT - rx;
  const th = 1.32;
  const stats = [
    [SC.navy, SC.white, SC.steel, "2,2 Bio. $", "CARES Act (März 2020) – größtes Hilfspaket der US-Geschichte"],
    [SC.tile, SC.navy, SC.slate, "< 1 Jahr", "bis zum ersten zugelassenen Impfstoff („Operation Warp Speed“)"],
    [SC.red, SC.white, SC.white, "400.000", "Corona-Tote in den USA bis zum Ende der Amtszeit"],
  ];
  stats.forEach(([bg, fg, fg2, hero, body], i) => {
    const y = CONTENT_TOP + i * (th + 0.195);
    tile(s, { x: rx, y, w: rw, h: th, fill: { color: bg } });
    text(s, hero, { x: rx + 0.3, y: y + 0.17, w: rw - 0.5, h: 0.5, fontSize: 28, bold: true, color: fg });
    text(s, body, { x: rx + 0.3, y: y + 0.68, w: rw - 0.5, h: 0.55, fontSize: 14, color: fg2 });
  });

  timeline(s, { span: ["2020-01-21", "2021-01-19"], dots: ["2020-03-27", "2020-12-11"] });

  s.addNotes(
    "Dann kam 2020 – und mit Corona die größte Krise der Amtszeit. Die Grafik zeigt die Arbeitslosenquote: Drei Jahre lang sinkt sie, im Februar 2020 liegt sie bei 3,5 Prozent, dem niedrigsten Wert seit 50 Jahren. Dann kommt das Virus, und innerhalb von zwei Monaten springt die Quote auf 14,8 Prozent – der höchste Wert seit Beginn der Statistik 1948. Allein im April 2020 gingen über 20 Millionen Jobs verloren.\n\n" +
      "Die Regierung reagierte mit gewaltigen Summen: Ende März unterschrieb Trump den CARES Act, mit 2,2 Billionen Dollar das größte Hilfspaket der US-Geschichte. Die meisten Erwachsenen bekamen einen Scheck über 1.200 Dollar. Ein klarer Erfolg war die „Operation Warp Speed“: Die Regierung investierte Milliarden in die Entwicklung und Produktion von Impfstoffen. Schon am 11. Dezember 2020 wurde der erste Impfstoff zugelassen – weniger als ein Jahr nach Ausbruch der Pandemie. Er stammte übrigens vom Mainzer Unternehmen BioNTech und seinem Partner Pfizer.\n\n" +
      "Trumps Krisenmanagement wurde aber auch scharf kritisiert. Öffentlich spielte er die Gefahr lange herunter. Dem Journalisten Bob Woodward sagte er im März 2020 selbst: „I wanted to always play it down“ – „Ich wollte es immer herunterspielen“. Er begründete das damit, keine Panik auslösen zu wollen. Masken und Schutzmaßnahmen wurden zum politischen Streitthema, im Oktober erkrankte Trump selbst und kam ins Krankenhaus. Bis zum Ende seiner Amtszeit starben in den USA rund 400.000 Menschen an Corona.\n\n" +
      "[Hinweis: Für April 2020 meldete die Statistikbehörde zunächst 14,7 %, nach späterer Überarbeitung 14,8 %.]"
  );
}

// ---------------------------------------------------------------------------
// Folie 7 – Das Ende
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide({ masterName: "INHALT_HELL", sectionTitle: "Ereignisse" });
  heading(s, "06 · DAS ENDE · 2019–2021", "Abwahl und Sturm aufs Kapitol");

  const topH = 1.75;
  const lw = 3.75;
  tile(s, { x: MX, y: CONTENT_TOP, w: lw, h: topH, fill: { color: SC.red } });
  text(s, "2×", { x: MX + 0.28, y: CONTENT_TOP + 0.22, w: 1.4, h: 1.2, fontSize: 66, bold: true, color: SC.white, valign: "middle" });
  text(s, "Impeachment", { x: MX + 1.75, y: CONTENT_TOP + 0.25, w: lw - 1.95, h: 0.3, fontSize: 16, bold: true, color: SC.white });
  text(s, "als erster Präsident zweimal angeklagt – beide Male freigesprochen", {
    x: MX + 1.75, y: CONTENT_TOP + 0.6, w: lw - 1.95, h: 1.0, fontSize: 14, color: SC.white,
  });

  const qx = 4.65;
  const qw = RIGHT - qx;
  tile(s, { x: qx, y: CONTENT_TOP, w: qw, h: topH, fill: { color: SC.navy } });
  text(s, "TRUMPS REDE AM 6. JANUAR 2021", { x: qx + 0.3, y: CONTENT_TOP + 0.22, w: 6, h: 0.25, fontSize: 11, bold: true, color: SC.redOnDark, charSpacing: 1.5 });
  text(s, "„… peacefully and patriotically make your voices heard.“", {
    x: qx + 0.3, y: CONTENT_TOP + 0.5, w: qw - 0.6, h: 0.36, fontSize: 18, bold: true, italic: true, color: SC.white, fontFace: "+mj-lt", lang: "en-US",
  });
  text(s, "„We fight like hell.“", {
    x: qx + 0.3, y: CONTENT_TOP + 0.88, w: qw - 0.6, h: 0.36, fontSize: 18, bold: true, italic: true, color: SC.white, fontFace: "+mj-lt", lang: "en-US",
  });
  text(s, "Beide Sätze fielen in derselben Rede – im 2. Impeachment stritt man darüber, welcher zählt.", {
    x: qx + 0.3, y: CONTENT_TOP + 1.33, w: qw - 0.6, h: 0.25, fontSize: 13, color: SC.steel,
  });

  // Chronologie in fünf Schritten
  const steps = [
    ["18. DEZ. 2019", "1. Impeachment", "Vorwurf: Druck auf die Ukraine, gegen Biden zu ermitteln. Freispruch im Senat."],
    ["3. NOV. 2020", "Wahl verloren", "Biden gewinnt 306 : 232 Wahlleute und 7 Mio. Stimmen mehr."],
    ["NOV.–DEZ. 2020", "Betrugsvorwurf", "Trump erkennt die Niederlage nicht an – über 60 Klagen scheitern."],
    ["6. JAN. 2021", "Sturm aufs Kapitol", "Anhänger dringen gewaltsam ins Kapitol ein: Tote, rund 140 verletzte Polizisten."],
    ["13. JAN. 2021", "2. Impeachment", "„Anstiftung zum Aufruhr“ – Senat: 57 : 43, nötig wären 67 gewesen."],
  ];
  const cy = CONTENT_TOP + topH + 0.3;
  const ch = CONTENT_BOTTOM - cy;
  const g = 0.2;
  const cw = (RIGHT - MX - 4 * g) / 5;
  steps.forEach(([date, title, body], i) => {
    const x = MX + i * (cw + g);
    tile(s, { x, y: cy, w: cw, h: ch, fill: { color: SC.tile } });
    text(s, date, { x: x + 0.2, y: cy + 0.18, w: cw - 0.35, h: 0.22, fontSize: 10, bold: true, color: SC.red, charSpacing: 1 });
    text(s, title, { x: x + 0.2, y: cy + 0.44, w: cw - 0.35, h: 0.32, fontSize: 15, bold: true, color: SC.navy });
    text(s, body, { x: x + 0.2, y: cy + 0.82, w: cw - 0.33, h: ch - 0.95, fontSize: 14, color: SC.slate });
    if (i < steps.length - 1) {
      s.addShape(pres.shapes.ISOSCELES_TRIANGLE, {
        x: x + cw + g / 2 - 0.05, y: cy + ch / 2 - 0.07, w: 0.14, h: 0.1, rotate: 90, fill: { color: SC.red },
      });
    }
  });

  timeline(s, { span: ["2019-12-18", "2021-01-20"], dots: ["2019-12-18", "2020-11-03", "2021-01-06"] });

  s.addNotes(
    "Damit zum dramatischen Ende der Amtszeit, das eigentlich schon Ende 2019 beginnt.\n\n" +
      "Im Dezember 2019 erhob das Repräsentantenhaus Anklage gegen Trump – ein sogenanntes Impeachment. Der Vorwurf: Er habe den ukrainischen Präsidenten Selenskyj gedrängt, gegen seinen Rivalen Joe Biden zu ermitteln, und dafür Militärhilfe von rund 390 Millionen Dollar zurückgehalten. Trump sprach von einem „perfekten Telefonat“. Der Senat mit republikanischer Mehrheit sprach ihn im Februar 2020 frei.\n\n" +
      "Im November 2020 verlor Trump die Wahl gegen Joe Biden – mit 232 zu 306 Wahlleuten und rund sieben Millionen Stimmen Rückstand. Er erkannte die Niederlage nicht an und sprach von Wahlbetrug. Über 60 Klagen von ihm und seinen Verbündeten scheiterten, auch vor Richtern, die er selbst ernannt hatte. Sogar sein Justizminister William Barr erklärte, man habe keinen Betrug gefunden, der das Ergebnis hätte ändern können.\n\n" +
      "Am 6. Januar 2021 sollte der Kongress Bidens Sieg offiziell bestätigen. Trump sprach vorher vor Tausenden Anhängern. Oben stehen zwei Sätze aus dieser Rede: Er rief dazu auf, „friedlich und patriotisch“ die Stimme zu erheben – sagte aber auch „We fight like hell“, also „Wir kämpfen mit aller Macht“. Danach drangen Anhänger gewaltsam ins Kapitol ein. Abgeordnete mussten fliehen, es gab Tote und rund 140 verletzte Polizisten. Noch in der Nacht bestätigte der Kongress das Ergebnis.\n\n" +
      "Eine Woche später wurde Trump als erster Präsident zum zweiten Mal angeklagt, wegen „Anstiftung zum Aufruhr“. Diesmal stimmten auch zehn Republikaner zu. Im Senat votierten 57 Senatoren für eine Verurteilung, darunter sieben Republikaner – nötig gewesen wären 67. Am 20. Januar 2021 endete die Amtszeit. Trump blieb der Amtseinführung seines Nachfolgers fern – das hatte es seit über 150 Jahren nicht gegeben."
  );
}

// ---------------------------------------------------------------------------
// Folie 8 – Bilanz
// ---------------------------------------------------------------------------
pres.addSection({ title: "Bilanz" });
{
  const s = pres.addSlide({ masterName: "INHALT_DUNKEL", sectionTitle: "Bilanz" });
  heading(s, "07 · BILANZ", "Was von vier Jahren bleibt");

  const g = 0.3;
  const cw = (RIGHT - MX - 2 * g) / 3;
  const ch = 3.3;
  const cols = [
    ["DAS LÄNGSTE ERBE", "6 : 3", 54, "Ein konservativer Supreme Court – Richter auf Lebenszeit prägen das Land noch für Jahrzehnte."],
    ["EIN GESPALTENES LAND", "41 %", 54, "Ø Zustimmung (Gallup) – Tiefstwert aller Präsidenten. Und doch: 74 Mio. Stimmen 2020, Rekord für einen Amtsinhaber."],
    ["EIN NEUER KURS", "America First", 32, "Zölle, Mauer, Ausstiege: weniger Abkommen, mehr Alleingänge und Deals."],
  ];
  cols.forEach(([label, hero, size, body], i) => {
    const x = MX + i * (cw + g);
    tile(s, { x, y: CONTENT_TOP, w: cw, h: ch, fill: { color: SC.navyRaised } });
    text(s, label, { x: x + 0.3, y: CONTENT_TOP + 0.3, w: cw - 0.5, h: 0.25, fontSize: 12, bold: true, color: SC.redOnDark, charSpacing: 2 });
    // Grundlinien angleichen: kleinere Schrift beginnt um die Differenz der Oberlängen tiefer
    const dy = (54 - size) * 0.905 / 72;
    text(s, hero, { x: x + 0.3, y: CONTENT_TOP + 0.62 + dy, w: cw - 0.5, h: 0.95, fontSize: size, bold: true, color: SC.white });
    text(s, body, { x: x + 0.3, y: CONTENT_TOP + 1.75, w: cw - 0.55, h: 1.4, fontSize: 15, color: SC.steel });
  });

  const qy = CONTENT_TOP + ch + 0.3;
  tile(s, { x: MX, y: qy, w: RIGHT - MX, h: CONTENT_BOTTOM - qy, fill: { color: SC.red } });
  text(
    s,
    [
      { text: "Zur Diskussion:  ", options: { bold: true } },
      { text: "Welche Entscheidung dieser vier Jahre wirkt am längsten nach?" },
    ],
    { x: MX + 0.35, y: qy, w: RIGHT - MX - 0.7, h: CONTENT_BOTTOM - qy, fontSize: 20, color: SC.white, valign: "middle" }
  );

  timeline(s, { span: ["2017-01-20", "2021-01-20"], dots: ["2017-01-20", "2017-12-22", "2020-03-27", "2021-01-06"], dark: true });

  s.addNotes(
    "Was bleibt also von diesen vier Jahren? Drei Punkte.\n\n" +
      "Erstens: Das langlebigste Erbe ist der Supreme Court. Mit drei Richtern auf Lebenszeit hat Trump die Rechtsprechung der USA für Jahrzehnte geprägt.\n\n" +
      "Zweitens: Kaum ein Präsident hat das Land so gespalten. Im Schnitt waren nur 41 Prozent der Amerikaner mit seiner Arbeit zufrieden – der niedrigste Durchschnitt, den das Gallup-Institut je gemessen hat. Trotzdem bekam er 2020 über 74 Millionen Stimmen, mehr als jeder amtierende Präsident vor ihm. Für seine Anhänger war er der Außenseiter, der endlich gegen das Establishment kämpft – für seine Gegner eine Gefahr für die Demokratie.\n\n" +
      "Drittens: Mit „America First“ hat Trump die Rolle der USA in der Welt verändert – weg von internationalen Abkommen, hin zu Zöllen und Deals.\n\n" +
      "Zum Schluss eine Frage an euch: Welche Entscheidung dieser vier Jahre wirkt eurer Meinung nach am längsten nach? Vielen Dank für eure Aufmerksamkeit!"
  );
}

// ---------------------------------------------------------------------------
// Folie 9 – Quellen (ausgeblendet, nur im Bearbeitungsmodus sichtbar)
// ---------------------------------------------------------------------------
pres.addSection({ title: "Anhang" });
{
  const s = pres.addSlide({ masterName: "ANHANG_HELL", sectionTitle: "Anhang" });
  s.hidden = true;
  heading(s, "ANHANG · AUSGEBLENDETE FOLIE", "Quellen");
  const left = [
    "Gallup (2021): Last Trump Job Approval 34%; Average Is Record-Low – news.gallup.com/poll/328637",
    "U.S. Bureau of Labor Statistics: Arbeitslosenquote, Reihe LNS14000000 – bls.gov",
    "Congressional Budget Office / Joint Committee on Taxation (2017): Kostenschätzung H.R. 1 – cbo.gov/publication/53312",
    "U.S. Department of Homeland Security (05.01.2021): 450 Meilen Grenzmauer – dhs.gov",
    "Family Reunification Task Force (Juni 2021): 3.913 getrennte Kinder – Bericht via AP",
    "PolitiFact (2021): Bilanz der Wahlklagen 2020 – politifact.com",
    "Reuters (2025): 234 Bundesrichter in Trumps erster Amtszeit – reuters.com",
  ];
  const right = [
    "NPR (10.02.2021): Trumps Rede vom 6. Januar 2021 im Wortlaut – npr.org",
    "Amtsantrittsrede vom 20.01.2017, Transkript – npr.org / pbs.org",
    "Federal Election Commission: offizielle Ergebnisse 2016 und 2020 – fec.gov",
    "U.S. Senate: Abstimmungen zu Impeachments und Richterbestätigungen – senate.gov",
    "Johns Hopkins University via AP (19.01.2021): 400.000 Corona-Tote in den USA",
    "Bob Woodward: Rage (2020), Interview vom 19.03.2020",
    "Columbia Sabin Center: Austritt aus dem Pariser Abkommen (wirksam 04.11.2020)",
  ];
  const col = (items, x) =>
    text(
      s,
      items.map((t, i) => ({ text: t, options: { breakLine: i < items.length - 1, paraSpaceAfter: 8 } })),
      { x, y: CONTENT_TOP, w: 5.9, h: 4.4, fontSize: 12, color: SC.slate }
    );
  col(left, MX);
  col(right, MX + 6.23);
  s.addNotes("Diese Folie ist ausgeblendet und erscheint nicht in der Bildschirmpräsentation. Sie dient als Quellennachweis.");
}

pres.writeFile({ fileName: OUT }).then((f) => console.log("geschrieben:", f));
