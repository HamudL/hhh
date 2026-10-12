// Builds the presentation "Donald J. Trump – The First Term (2017–2021)".
//
//   npm install pptxgenjs@3.12.0
//   node build_deck.js && node postprocess.js Trump_First_Term.pptx
//
// Structure: theme + layouts (slide masters) + placeholders, content composed per slide.
// postprocess.js adds what pptxgenjs cannot write (theme colors, Morph, chart labels);
// the colors live in theme.json.

const path = require("path");
const pptxgen = require("pptxgenjs");

const OUT = process.argv[2] || path.join(__dirname, "Trump_First_Term.pptx");

// ---------------------------------------------------------------------------
// Theme: Republican red on deep navy, white surfaces (colors: theme.json)
//   dk1 navy (text, dark fills) · dk2 slate (secondary text) · lt2 tile gray
//   accent1 Republican red · accent2 raised navy · accent3/4 light/mid steel
//   accent5 Democratic blue (election graphics only) · accent6 bright red (small text on dark)
// ---------------------------------------------------------------------------
const THEME = Object.assign({ headFontFace: "Cambria", bodyFontFace: "Arial" }, require("./theme.json"));

// Hex only where pptxgenjs refuses scheme colors (chart grid) or for lines outside the theme.
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
pres.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Donald J. Trump – The First Term (2017–2021)";
pres.subject = "The defining events of Donald Trump's first term, 2017–2021";
pres.lang = "en-US";

// Scheme colors (follow the theme if it changes later)
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
// Grid
// ---------------------------------------------------------------------------
const MX = 0.6; // left/right margin
const RIGHT = 13.333 - MX; // 12.733
const CONTENT_TOP = 1.9;
const CONTENT_BOTTOM = 6.25;

// Timeline of the term (bottom of every slide)
const TL = { x0: MX, x1: 11.7, y: 6.72 };
const D0 = Date.UTC(2017, 0, 1);
const D1 = Date.UTC(2021, 1, 1);
function tx(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return TL.x0 + ((Date.UTC(y, m - 1, d) - D0) / (D1 - D0)) * (TL.x1 - TL.x0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Non-breaking spaces keep numbers with their units and dates in one piece
// ("2.9 million", "8 days", "Jan 20, 2017", "Dec 2017").
const MONTH = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)";
function nb(str) {
  return str
    .replace(/\b(was|from|by|over|than) (?=[\d$~])/g, "$1\u00A0")
    .replace(/(\d[+%]?) (?=million|billion|trillion|days|years|votes|countries|children|states|officers|lawsuits)/g, "$1 ")
    .replace(new RegExp(`${MONTH} (\\d{1,2}), (\\d{4})`, "g"), "$1 $2, $3")
    .replace(new RegExp(`${MONTH} (\\d{1,4})`, "g"), "$1 $2");
}

function text(slide, t, o) {
  const content = typeof t === "string" ? nb(t) : t.map((r) => Object.assign({}, r, { text: nb(r.text) }));
  slide.addText(
    content,
    Object.assign(
      { isTextBox: true, margin: 0, valign: "top", fontSize: 14, color: SC.navy, lang: "en-US", fit: "none" },
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

// Moving part of the timeline: red span + event dots (Morph names "!!…")
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
  title: "TITLE_DARK",
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
  title: "CONTENT_LIGHT",
  background: { color: SC.white },
  objects: [...trackObjects(false), PH_KICKER(SC.red), PH_TITLE(SC.navy)],
  slideNumber: SLIDE_NUMBER(HEX.labelLight),
});

pres.defineSlideMaster({
  title: "CONTENT_DARK",
  background: { color: SC.navy },
  objects: [...trackObjects(true), PH_KICKER(SC.redOnDark), PH_TITLE(SC.white)],
  slideNumber: SLIDE_NUMBER(HEX.labelDark),
});

pres.defineSlideMaster({
  title: "APPENDIX_LIGHT",
  background: { color: SC.white },
  objects: [PH_KICKER(SC.red), PH_TITLE(SC.navy)],
  slideNumber: SLIDE_NUMBER(HEX.labelLight),
});

// Kicker + title of a content slide
function heading(slide, kicker, title) {
  slide.addText(kicker, { placeholder: "kicker", charSpacing: 2, align: "left" });
  slide.addText(title, { placeholder: "title", align: "left" });
}

// ---------------------------------------------------------------------------
// Slide 1 – Title
// ---------------------------------------------------------------------------
pres.addSection({ title: "Introduction" });
{
  const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Introduction" });
  s.addText("FOUR YEARS THAT SHAPED AMERICA", { placeholder: "kicker", charSpacing: 2.5, align: "left" });
  s.addText("Donald J. Trump", { placeholder: "title", align: "left" });
  s.addText(
    [
      { text: "The First Term  ", options: { color: SC.steel } },
      { text: "2017 – 2021", options: { color: SC.redOnDark, bold: true } },
    ],
    { placeholder: "subtitle", align: "left" }
  );
  text(s, "Background  ·  Key events  ·  Legacy", {
    x: MX, y: 4.45, w: 6.8, h: 0.35, fontSize: 16, color: SC.steel,
  });

  // The big 45 – Morph carries it into the red tile on slide 2
  text(s, "45", {
    x: 6.75, y: 0.35, w: 6.0, h: 5.3, fontSize: 330, bold: true, color: SC.red,
    align: "right", valign: "middle", objectName: "!!n45",
  });
  text(s, "45th President of the United States", {
    x: 8.2, y: 5.0, w: 4.45, h: 0.3, fontSize: 14, color: SC.steel, align: "right",
  });

  timeline(s, { dots: ["2017-01-20"], dark: true });
  text(s, "Inauguration", {
    x: tx("2017-01-20") - 0.02, y: TL.y - 0.36, w: 1.5, h: 0.22, fontSize: 10, color: HEX.labelDark,
    objectName: "!!tl-label",
  });

  s.addNotes(
    "Hello everyone! Today I’m talking about Donald Trump’s first term – the four years from January 2017 to January 2021, when he was the 45th President of the United States.\n\n" +
      "First, a quick look at his background. Then we’ll go through the events that defined these four years, and at the end I’ll sum up what they left behind.\n\n" +
      "The timeline at the bottom of each slide shows where we are in his term."
  );
}

// ---------------------------------------------------------------------------
// Slide 2 – Background
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Introduction" });
  heading(s, "01 · BACKGROUND", "From Real-Estate Tycoon to the White House");

  // Red tile with the 45
  const L = { x: MX, w: 5.75 };
  tile(s, { x: L.x, y: CONTENT_TOP, w: L.w, h: 1.2, fill: { color: SC.red } });
  text(s, "45", {
    x: L.x + 0.25, y: CONTENT_TOP + 0.05, w: 1.35, h: 1.1, fontSize: 60, bold: true, color: SC.white,
    valign: "middle", objectName: "!!n45",
  });
  text(s, "45th President · 2017–2021", {
    x: L.x + 1.7, y: CONTENT_TOP + 0.3, w: 3.85, h: 0.32, fontSize: 18, bold: true, color: SC.white,
  });
  text(s, "Vice President: Mike Pence", {
    x: L.x + 1.7, y: CONTENT_TOP + 0.67, w: 3.9, h: 0.25, fontSize: 14, color: SC.white,
  });

  // Profile
  const rows = [
    ["BORN", "June 14, 1946, New York City"],
    ["BUSINESS", "Real estate · Trump Organization (from 1971)"],
    ["TV", "Host of “The Apprentice” (2004–2015)"],
    ["CAMPAIGN", "Republican · “Make America Great Again”"],
    ["OUTSIDER", "No prior political office or military service"],
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

  // 2016 election: tile map
  const R = { x: 6.75, y: CONTENT_TOP, w: RIGHT - 6.75, h: CONTENT_BOTTOM - CONTENT_TOP };
  tile(s, { x: R.x, y: R.y, w: R.w, h: R.h, fill: { color: SC.tile } });
  text(s, "2016 ELECTION · ELECTORAL VOTES", {
    x: R.x + 0.3, y: R.y + 0.22, w: 4.5, h: 0.25, fontSize: 11, bold: true, color: SC.red, charSpacing: 1.5,
  });
  text(s, "304–227", { x: R.x + 0.3, y: R.y + 0.5, w: 2.8, h: 0.65, fontSize: 36, bold: true, color: SC.navy });
  text(s, "despite losing the popular vote by 2.9 million", {
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
      lang: "en-US", objectName: `State ${abbr}`,
    });
  }

  // Legend + Rust Belt note right of the map
  const lx = mapX + 10 * pitch + size + 0.35;
  const lw = R.x + R.w - 0.25 - lx;
  const legend = [
    [SC.red, "Trump (R)", "30 states"],
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
  text(s, "PA, MI and WI: won by ~78,000 votes combined", {
    x: lx, y: ry + 0.3, w: lw, h: 1.0, fontSize: 12, color: SC.slate,
  });

  timeline(s, { dots: ["2017-01-20"] });
  text(s, "Inauguration", {
    x: tx("2017-01-20") - 0.02, y: TL.y - 0.36, w: 1.5, h: 0.22, fontSize: 10, color: HEX.labelLight,
    objectName: "!!tl-label",
  });

  s.addNotes(
    "Donald Trump was born in New York City in 1946. In 1971 he took over his father’s real-estate business and built it into the Trump Organization – skyscrapers like Trump Tower, hotels, casinos and golf courses. Not everything worked out: several of his companies, mostly casinos, went bankrupt. He became a household name on TV, hosting the reality show “The Apprentice” from 2004 to 2015 – “You’re fired!” became his catchphrase.\n\n" +
      "In 2015 he ran for president as a Republican with the slogan “Make America Great Again”. He beat 16 rivals in the primaries and then Hillary Clinton in November 2016.\n\n" +
      "The map shows the result: 304 to 227 electoral votes. Pennsylvania, Michigan and Wisconsin – outlined here – decided the race, and Trump won them by only about 78,000 votes combined. Nationwide, Clinton actually got almost 2.9 million more votes; the Electoral College makes that possible.\n\n" +
      "When he was sworn in on January 20, 2017, he was the first president without any prior political office or military service – and, at 70, the oldest president ever inaugurated at that time."
  );
}

// ---------------------------------------------------------------------------
// Slide 3 – Economy
// ---------------------------------------------------------------------------
pres.addSection({ title: "Key events" });
{
  const s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Key events" });
  heading(s, "02 · ECONOMY · 2017–2020", "Taxes Down, Tariffs Up");

  const colW = 5.9;
  const gap = 0.333;
  const xL = MX;
  const xR = MX + colW + gap;
  const bigH = 2.45;
  const smallY = CONTENT_TOP + bigH + 0.2;
  const smallH = CONTENT_BOTTOM - smallY;
  const smallW = (colW - 0.2) / 2;

  // Left: tax reform
  tile(s, { x: xL, y: CONTENT_TOP, w: colW, h: bigH, fill: { color: SC.navy } });
  text(s, "TAXES DOWN", { x: xL + 0.35, y: CONTENT_TOP + 0.28, w: 5, h: 0.25, fontSize: 12, bold: true, color: SC.redOnDark, charSpacing: 2 });
  text(
    s,
    [
      { text: "35% ", options: { color: SC.white } },
      { text: "→", options: { color: SC.redOnDark } },
      { text: " 21%", options: { color: SC.white } },
    ],
    { x: xL + 0.35, y: CONTENT_TOP + 0.55, w: 5.3, h: 0.95, fontSize: 60, bold: true }
  );
  text(s, "Corporate tax rate · biggest tax overhaul since 1986 (Dec 2017)", {
    x: xL + 0.35, y: CONTENT_TOP + 1.72, w: 5.2, h: 0.6, fontSize: 14, color: SC.steel,
  });

  const small = (x, hero, body) => {
    tile(s, { x, y: smallY, w: smallW, h: smallH, fill: { color: SC.tile } });
    text(s, hero, { x: x + 0.3, y: smallY + 0.24, w: smallW - 0.5, h: 0.5, fontSize: 28, bold: true, color: SC.navy });
    text(s, body, { x: x + 0.3, y: smallY + 0.82, w: smallW - 0.5, h: 0.7, fontSize: 14, color: SC.slate });
  };
  small(xL, "37%", "top income tax rate (was 39.6%)");
  small(xL + smallW + 0.2, "$1.5 trillion", "added to the deficit over 10 years (Congress estimate)");

  // Right: trade war
  tile(s, { x: xR, y: CONTENT_TOP, w: colW, h: bigH, fill: { color: SC.red } });
  text(s, "TARIFFS UP", { x: xR + 0.35, y: CONTENT_TOP + 0.28, w: 5, h: 0.25, fontSize: 12, bold: true, color: SC.white, charSpacing: 2 });
  text(s, "$370 billion", { x: xR + 0.35, y: CONTENT_TOP + 0.55, w: 5.3, h: 0.95, fontSize: 60, bold: true, color: SC.white });
  text(s, "of Chinese imports hit by U.S. tariffs (2018–2019)", {
    x: xR + 0.35, y: CONTENT_TOP + 1.72, w: 5.2, h: 0.6, fontSize: 14, color: SC.white,
  });

  small(xR, "$28 billion", "in aid to farmers hit by China’s counter-tariffs");
  small(xR + smallW + 0.2, "Jan 2020", "“Phase One” deal: China pledges $200 billion in extra purchases");

  timeline(s, { span: ["2017-12-22", "2020-01-15"], dots: ["2017-12-22", "2018-07-06", "2020-01-15"] });

  s.addNotes(
    "Let’s start with the economy. Trump’s approach fits into four words: taxes down, tariffs up.\n\n" +
      "On the left: in December 2017 he signed the Tax Cuts and Jobs Act, the biggest tax overhaul since 1986. At its core, the corporate tax rate fell from 35 to 21 percent. Individuals got tax cuts too – the top rate dropped from 39.6 to 37 percent. Supporters argued that companies would invest more in the U.S. and create jobs. Critics said the main winners were corporations and the wealthy – and Congress estimated the law would add about 1.5 trillion dollars to the deficit over ten years.\n\n" +
      "On the right: at the same time, Trump broke with decades of free-trade policy. From 2018 he imposed tariffs – on steel and aluminum, which also hit the EU and Germany, and above all on goods from China. In the end, about 370 billion dollars’ worth of Chinese imports were affected. His goals: shrink the trade deficit and force China to play by fairer rules. China hit back, for example with tariffs on soybeans. That hurt American farmers so badly that the government paid them around 28 billion dollars in aid. In January 2020 both sides agreed to a truce: in the “Phase One” deal, China promised to buy an extra 200 billion dollars of American goods. Trump also replaced NAFTA, the trade deal with Canada and Mexico, with the new USMCA.\n\n" +
      "By early 2020 the economy was strong: in February, unemployment was just 3.5 percent – a 50-year low. We’ll see in a moment how quickly that changed."
  );
}

// ---------------------------------------------------------------------------
// Slide 4 – The courts
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Key events" });
  heading(s, "03 · THE COURTS · 2017–2020", "A Court for a Generation");

  const lw = 3.75;
  tile(s, { x: MX, y: CONTENT_TOP, w: lw, h: 2.45, fill: { color: SC.navy } });
  text(s, "SUPREME COURT · 2021", { x: MX + 0.3, y: CONTENT_TOP + 0.28, w: lw - 0.5, h: 0.25, fontSize: 12, bold: true, color: SC.redOnDark, charSpacing: 2 });
  text(s, "6–3", { x: MX + 0.3, y: CONTENT_TOP + 0.5, w: lw - 0.5, h: 1.05, fontSize: 72, bold: true, color: SC.white });
  text(s, "conservative majority · justices serve for life", { x: MX + 0.3, y: CONTENT_TOP + 1.72, w: lw - 0.55, h: 0.6, fontSize: 14, color: SC.steel });

  const by = 4.55;
  tile(s, { x: MX, y: by, w: lw, h: CONTENT_BOTTOM - by, fill: { color: SC.tile } });
  text(s, "234", { x: MX + 0.3, y: by + 0.22, w: lw - 0.5, h: 0.6, fontSize: 34, bold: true, color: SC.navy });
  text(s, "federal judges appointed, all for life", { x: MX + 0.3, y: by + 0.85, w: lw - 0.55, h: 0.6, fontSize: 14, color: SC.slate });

  // Seats before/after
  const gx = 4.65;
  const seatX0 = 5.95;
  const seatPitch = 0.76;
  const seatD = 0.56;
  const row1 = 2.3;
  const row2 = 3.42;
  const kinds = {
    cons: { fill: { color: SC.navy } },
    swing: { fill: { color: SC.steelMid } },
    trump: { fill: { color: SC.red } },
    lib: { fill: { color: HEX.seatLiberal } },
    vacant: { fill: { color: SC.white }, line: { color: SC.navy, width: 1.5 } },
  };
  const before = [
    ["Roberts", "cons"], ["Thomas", "cons"], ["Alito", "cons"], ["vacant", "vacant"], ["Kennedy", "swing"],
    ["Ginsburg", "lib"], ["Breyer", "lib"], ["Sotomayor", "lib"], ["Kagan", "lib"],
  ];
  const after = [
    ["Roberts", "cons"], ["Thomas", "cons"], ["Alito", "cons"], ["Gorsuch", "trump"], ["Kavanaugh", "trump"],
    ["Barrett", "trump"], ["Breyer", "lib"], ["Sotomayor", "lib"], ["Kagan", "lib"],
  ];
  const rowLabel = (y, a, b) => {
    text(s, a, { x: gx, y: y - 0.28, w: 1.2, h: 0.32, fontSize: 18, bold: true, color: SC.navy });
    text(s, b, { x: gx, y: y + 0.04, w: 1.2, h: 0.25, fontSize: 11, color: SC.slate });
  };
  rowLabel(row1, "2017", "start of term");
  rowLabel(row2, "2021", "end of term");
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
  // Arrows for the three seats Trump filled
  for (let i = 3; i <= 5; i++) {
    const cx = seatX0 + i * seatPitch + seatD / 2;
    s.addShape(pres.shapes.ISOSCELES_TRIANGLE, {
      x: cx - 0.07, y: row1 + seatD / 2 + 0.3, w: 0.14, h: 0.1, rotate: 180, fill: { color: SC.red },
    });
  }
  // Legend
  const legend = [
    ["cons", "conservative"], ["swing", "swing vote"], ["trump", "Trump appointee"], ["lib", "liberal"], ["vacant", "vacant"],
  ];
  let lx = gx;
  legend.forEach(([kind, label]) => {
    s.addShape(pres.shapes.OVAL, Object.assign({ x: lx, y: 4.17, w: 0.16, h: 0.16 }, JSON.parse(JSON.stringify(kinds[kind]))));
    const w = label.length * 0.075 + 0.1;
    text(s, label, { x: lx + 0.22, y: 4.14, w, h: 0.22, fontSize: 10, color: SC.slate });
    lx += 0.22 + w + 0.18;
  });

  // Three appointment cards
  const cards = [
    ["Neil Gorsuch", "2017 · SENATE 54–45", "Took Scalia’s seat, held open by the Senate in 2016."],
    ["Brett Kavanaugh", "2018 · SENATE 50–48", "Replaced swing vote Kennedy despite assault allegations."],
    ["Amy Coney Barrett", "2020 · SENATE 52–48", "Replaced Ginsburg 8 days before the election."],
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
    "Next, the area with probably the longest-lasting impact: the courts. The Supreme Court is the highest court in the United States. Its nine justices are nominated by the president, confirmed by the Senate – and serve for life. The court decides the country’s biggest disputes, such as abortion, gun rights and voting rights.\n\n" +
      "Trump filled three seats in a single term. The graphic shows how the court changed. Top row – when he took office, one seat was empty: conservative justice Antonin Scalia had died in 2016, and the Republican-led Senate had refused to even vote on Obama’s nominee. Trump filled that seat with Neil Gorsuch in 2017.\n\n" +
      "In 2018 Anthony Kennedy retired – a conservative who often sided with the liberals, the court’s swing vote. His successor, Brett Kavanaugh, faced sexual assault allegations, which he denied, and was confirmed by just 50 to 48. Then, in September 2020, liberal justice Ruth Bader Ginsburg died. Amy Coney Barrett replaced her only eight days before the presidential election.\n\n" +
      "The result is in the bottom row: a closely balanced court became a clear 6–3 conservative majority. Since the three new justices were only about 50 years old on average, that majority can last for decades. In total, Trump appointed 234 federal judges – all for life.\n\n" +
      "(Optional outlook: How big this influence is became clear in 2022, when this court overturned Roe v. Wade, the nationwide right to abortion.)"
  );
}

// ---------------------------------------------------------------------------
// Slide 5 – America First: border & world
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Key events" });
  heading(s, "04 · AMERICA FIRST · 2017–2020", "Hard Line at the Border, Going Solo Abroad");

  const lw = 3.75;
  tile(s, { x: MX, y: CONTENT_TOP, w: lw, h: CONTENT_BOTTOM - CONTENT_TOP, fill: { color: SC.navy } });
  text(s, "THE GUIDING IDEA", { x: MX + 0.3, y: CONTENT_TOP + 0.3, w: lw - 0.5, h: 0.25, fontSize: 11, bold: true, color: SC.redOnDark, charSpacing: 1.5 });
  text(s, "“", { x: MX + 0.24, y: CONTENT_TOP + 0.6, w: 1, h: 0.8, fontSize: 80, bold: true, color: SC.redOnDark, fontFace: "+mj-lt" });
  text(s, "From this day forward, it’s going to be only America first.", {
    x: MX + 0.3, y: CONTENT_TOP + 1.4, w: lw - 0.55, h: 2.0, fontSize: 24, bold: true, italic: true, color: SC.white,
    fontFace: "+mj-lt",
  });
  text(s, "Inaugural address, Jan 20, 2017", {
    x: MX + 0.3, y: CONTENT_TOP + 3.6, w: lw - 0.55, h: 0.3, fontSize: 14, color: SC.steel,
  });

  const gx = 4.65;
  const cw = (RIGHT - gx - 2 * 0.2) / 3;
  const rows = [
    {
      label: "AT THE BORDER", y: CONTENT_TOP, items: [
        ["7 countries", "travel ban on mostly Muslim nations (2017)"],
        ["35 days", "longest shutdown in U.S. history, over wall funding"],
        ["3,900+", "children separated from their parents at the border"],
      ],
    },
    {
      label: "AROUND THE WORLD", y: 4.185, items: [
        ["Paris & Iran", "exits from the climate accord and the Iran nuclear deal"],
        ["North Korea", "Kim\u00A0Jong-un: first summit (2018), but no disarmament"],
        ["Middle East", "Abraham Accords (2020): Israel opens ties with UAE and Bahrain"],
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
    "“America First” – Trump used this phrase in his inaugural address, and it became the guiding idea of his presidency, at the border and around the world.\n\n" +
      "Top row, the border: immigration was his central campaign issue. One week into his term, he banned travel from seven mostly Muslim countries. Courts blocked the first version; a revised version was upheld by the Supreme Court in 2018. For the wall he had promised on the border with Mexico, he demanded 5.7 billion dollars from Congress. Democrats refused, and the result was the longest government shutdown in U.S. history: 35 days, with around 800,000 federal employees going without pay. By 2021 about 450 miles of wall had been built, mostly replacing older fencing. The most controversial policy was “zero tolerance” in 2018: people who crossed the border illegally were prosecuted, and children were separated from their parents. After nationwide protests Trump ended the practice; a later government task force counted at least 3,900 separated children.\n\n" +
      "Bottom row, the world: Trump announced that the U.S. would leave the Paris climate agreement, and he pulled out of the nuclear deal with Iran. He repeatedly pressured NATO allies – Germany included – to spend much more on defense. At the same time, he went for unusual deals: in 2018 in Singapore he became the first sitting U.S. president to meet North Korea’s leader, Kim Jong-un – but real nuclear disarmament never followed. In the Middle East he moved the U.S. embassy to Jerusalem and brokered the 2020 Abraham Accords, in which Israel established relations with the United Arab Emirates and Bahrain; Morocco and Sudan later agreed to follow. Even many of his critics see these accords as a success."
  );
}

// ---------------------------------------------------------------------------
// Slide 6 – COVID-19
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Key events" });
  heading(s, "05 · COVID-19 · 2020", "From Boom to Bust");

  text(s, "U.S. unemployment rate (%), monthly", { x: MX, y: CONTENT_TOP, w: 7.6, h: 0.3, fontSize: 14, bold: true, color: SC.navy });

  // U.S. Bureau of Labor Statistics, series LNS14000000 (seasonally adjusted), Jan 2017 – Dec 2020
  const UNRATE = [
    4.7, 4.6, 4.4, 4.4, 4.4, 4.3, 4.3, 4.4, 4.3, 4.2, 4.2, 4.1,
    4.0, 4.1, 4.0, 4.0, 3.8, 4.0, 3.8, 3.8, 3.7, 3.8, 3.8, 3.9,
    4.0, 3.8, 3.8, 3.7, 3.6, 3.6, 3.7, 3.6, 3.5, 3.6, 3.6, 3.6,
    3.5, 3.5, 4.4, 14.8, 13.2, 11.0, 10.2, 8.4, 7.8, 6.8, 6.7, 6.7,
  ];
  // The axis shows only the years; the other months stay unlabeled
  const labels = UNRATE.map((_, i) => (i % 12 === 0 ? String(2017 + i / 12) : ""));
  s.addChart(
    pres.charts.LINE,
    [{ name: "Unemployment rate (%)", labels, values: UNRATE }],
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
  text(s, "Source: U.S. Bureau of Labor Statistics, seasonally adjusted", {
    x: MX, y: CONTENT_TOP + 3.38, w: 7.6, h: 0.22, fontSize: 10, color: HEX.labelLight,
  });
  text(s, "“", { x: MX - 0.04, y: 5.42, w: 0.5, h: 0.8, fontSize: 54, bold: true, color: SC.red, fontFace: "+mj-lt" });
  text(s, "I wanted to always play it down.", {
    x: MX + 0.45, y: 5.52, w: 7.1, h: 0.4, fontSize: 20, bold: true, italic: true, color: SC.navy, fontFace: "+mj-lt",
  });
  text(s, "Trump to journalist Bob Woodward, March 2020", {
    x: MX + 0.45, y: 5.93, w: 7.1, h: 0.3, fontSize: 12, color: SC.slate,
  });

  // Key figures on the right
  const rx = 8.75;
  const rw = RIGHT - rx;
  const th = 1.32;
  const stats = [
    [SC.navy, SC.white, SC.steel, "$2.2 trillion", "CARES Act (March 2020), the largest relief package in U.S. history"],
    [SC.tile, SC.navy, SC.slate, "< 1 year", "to the first approved vaccine (Operation Warp Speed)"],
    [SC.red, SC.white, SC.white, "400,000", "COVID-19 deaths in the U.S. by the end of his term"],
  ];
  stats.forEach(([bg, fg, fg2, hero, body], i) => {
    const y = CONTENT_TOP + i * (th + 0.195);
    tile(s, { x: rx, y, w: rw, h: th, fill: { color: bg } });
    text(s, hero, { x: rx + 0.3, y: y + 0.17, w: rw - 0.5, h: 0.5, fontSize: 28, bold: true, color: fg });
    text(s, body, { x: rx + 0.3, y: y + 0.68, w: rw - 0.5, h: 0.55, fontSize: 14, color: fg2 });
  });

  timeline(s, { span: ["2020-01-21", "2021-01-19"], dots: ["2020-03-27", "2020-12-11"] });

  s.addNotes(
    "Then came 2020 – and with COVID-19 the biggest crisis of his term. The chart shows the unemployment rate. For three years it keeps falling; in February 2020 it is at 3.5 percent, a 50-year low. Then the virus hits, and within two months the rate jumps to 14.8 percent – the highest since records began in 1948. In April 2020 alone, more than 20 million jobs were lost.\n\n" +
      "The government responded with enormous sums. In late March Trump signed the CARES Act – at 2.2 trillion dollars the largest relief package in U.S. history. Most adults received a check for 1,200 dollars. A clear success was Operation Warp Speed: the government invested billions in developing and producing vaccines. The first vaccine was approved on December 11, 2020 – less than a year into the pandemic. By the way, it came from the German company BioNTech and its partner Pfizer.\n\n" +
      "But Trump’s handling of the crisis was also heavily criticized. In public he downplayed the danger for a long time. In March 2020 he told journalist Bob Woodward: “I wanted to always play it down.” He said he didn’t want to create a panic. Masks and lockdowns became political battlegrounds, and in October Trump himself caught the virus and was hospitalized. By the end of his term, about 400,000 Americans had died of COVID-19.\n\n" +
      "[Note: The April 2020 rate was first reported as 14.7% and later revised to 14.8%.]"
  );
}

// ---------------------------------------------------------------------------
// Slide 7 – The end
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Key events" });
  heading(s, "06 · THE END · 2019–2021", "Defeat and the Storming of the Capitol");

  const topH = 2.0;
  const lw = 3.75;
  tile(s, { x: MX, y: CONTENT_TOP, w: lw, h: topH, fill: { color: SC.red } });
  text(s, "2×", { x: MX + 0.28, y: CONTENT_TOP + 0.4, w: 1.4, h: 1.2, fontSize: 66, bold: true, color: SC.white, valign: "middle" });
  text(s, "Impeached", { x: MX + 1.75, y: CONTENT_TOP + 0.42, w: lw - 1.95, h: 0.3, fontSize: 16, bold: true, color: SC.white });
  text(s, "a first for any president – acquitted both times", {
    x: MX + 1.75, y: CONTENT_TOP + 0.78, w: lw - 1.95, h: 1.0, fontSize: 14, color: SC.white,
  });

  const qx = 4.65;
  const qw = RIGHT - qx;
  tile(s, { x: qx, y: CONTENT_TOP, w: qw, h: topH, fill: { color: SC.navy } });
  text(s, "TRUMP’S SPEECH · JAN 6, 2021", { x: qx + 0.3, y: CONTENT_TOP + 0.28, w: 6, h: 0.25, fontSize: 11, bold: true, color: SC.redOnDark, charSpacing: 1.5 });
  text(s, "“… peacefully and patriotically make your voices heard.”", {
    x: qx + 0.3, y: CONTENT_TOP + 0.62, w: qw - 0.6, h: 0.36, fontSize: 18, bold: true, italic: true, color: SC.white, fontFace: "+mj-lt",
  });
  text(s, "“We fight like hell.”", {
    x: qx + 0.3, y: CONTENT_TOP + 1.02, w: qw - 0.6, h: 0.36, fontSize: 18, bold: true, italic: true, color: SC.white, fontFace: "+mj-lt",
  });
  text(s, "Same speech – at the second impeachment trial, each side quoted one line.", {
    x: qx + 0.3, y: CONTENT_TOP + 1.55, w: qw - 0.6, h: 0.25, fontSize: 13, color: SC.steel,
  });

  // Five-step chronology
  const steps = [
    ["DEC 18, 2019", "1st impeachment", "Pressure on Ukraine to investigate Biden. Acquitted."],
    ["NOV 3, 2020", "Election lost", "Biden wins 306–232 and by 7 million votes."],
    ["NOV–DEC 2020", "Fraud claims", "Refuses to concede; 60+ lawsuits fail."],
    ["JAN 6, 2021", "Capitol stormed", "Supporters break in; deaths, ~140 officers injured."],
    ["JAN 13, 2021", "2nd impeachment", "“Incitement of insurrection.” Senate: 57–43, 67 needed."],
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
    text(s, body, { x: x + 0.2, y: cy + 0.82, w: cw - 0.33, h: ch - 0.95, fontSize: 15, color: SC.slate });
    if (i < steps.length - 1) {
      s.addShape(pres.shapes.ISOSCELES_TRIANGLE, {
        x: x + cw + g / 2 - 0.05, y: cy + ch / 2 - 0.07, w: 0.14, h: 0.1, rotate: 90, fill: { color: SC.red },
      });
    }
  });

  timeline(s, { span: ["2019-12-18", "2021-01-20"], dots: ["2019-12-18", "2020-11-03", "2021-01-06"] });

  s.addNotes(
    "Now to the dramatic end of his term – which really starts in late 2019.\n\n" +
      "In December 2019 the House of Representatives impeached Trump. The charge: he had pressured Ukraine’s president, Zelensky, to investigate his political rival Joe Biden, while holding back about 390 million dollars in military aid. Trump called it a “perfect” phone call. In February 2020 the Republican-controlled Senate acquitted him.\n\n" +
      "In November 2020 Trump lost the election to Joe Biden – 232 to 306 electoral votes, and about seven million votes behind. He refused to concede and claimed the election had been stolen. More than 60 lawsuits by him and his allies failed, including before judges he had appointed himself. Even his own attorney general, William Barr, said there was no fraud on a scale that could have changed the outcome.\n\n" +
      "On January 6, 2021, Congress met to certify Biden’s victory. Beforehand, Trump spoke to thousands of supporters. At the top you can see two lines from that speech: he told the crowd to “peacefully and patriotically make your voices heard” – but he also said “we fight like hell.” Afterwards, supporters forced their way into the Capitol. Lawmakers had to flee, people died, and about 140 police officers were injured. That same night, Congress certified the result.\n\n" +
      "A week later, Trump became the first president ever to be impeached twice, this time for “incitement of insurrection.” Ten House Republicans voted in favor. In the Senate, 57 senators voted to convict, including seven Republicans – but 67 votes were needed. His term ended on January 20, 2021, and Trump stayed away from his successor’s inauguration – something no president had done in more than 150 years."
  );
}

// ---------------------------------------------------------------------------
// Slide 8 – Legacy
// ---------------------------------------------------------------------------
pres.addSection({ title: "Legacy" });
{
  const s = pres.addSlide({ masterName: "CONTENT_DARK", sectionTitle: "Legacy" });
  heading(s, "07 · LEGACY", "What Four Years Left Behind");

  const g = 0.3;
  const cw = (RIGHT - MX - 2 * g) / 3;
  const ch = 3.0;
  const cols = [
    ["THE LASTING LEGACY", "6–3", 54, "A conservative Supreme Court for decades to come."],
    ["A DIVIDED NATION", "41%", 54, "average approval (Gallup), the lowest ever. Yet 74 million votes in 2020, a record for an incumbent."],
    ["A NEW COURSE", "America First", 32, "Tariffs, the wall, treaty exits: fewer agreements, more deals."],
  ];
  cols.forEach(([label, hero, size, body], i) => {
    const x = MX + i * (cw + g);
    tile(s, { x, y: CONTENT_TOP, w: cw, h: ch, fill: { color: SC.navyRaised } });
    text(s, label, { x: x + 0.3, y: CONTENT_TOP + 0.3, w: cw - 0.5, h: 0.25, fontSize: 12, bold: true, color: SC.redOnDark, charSpacing: 2 });
    // Align baselines: smaller type starts lower by the difference in ascent
    const dy = (54 - size) * 0.905 / 72;
    text(s, hero, { x: x + 0.3, y: CONTENT_TOP + 0.62 + dy, w: cw - 0.5, h: 0.95, fontSize: size, bold: true, color: SC.white });
    text(s, body, { x: x + 0.3, y: CONTENT_TOP + 1.75, w: cw - 0.55, h: 1.1, fontSize: 16, color: SC.steel });
  });

  const qy = CONTENT_TOP + ch + 0.3;
  tile(s, { x: MX, y: qy, w: RIGHT - MX, h: CONTENT_BOTTOM - qy, fill: { color: SC.red } });
  text(
    s,
    [
      { text: "For discussion:  ", options: { bold: true } },
      { text: "Which decision from these four years will last the longest?" },
    ],
    { x: MX + 0.35, y: qy, w: RIGHT - MX - 0.7, h: CONTENT_BOTTOM - qy, fontSize: 22, color: SC.white, valign: "middle" }
  );

  timeline(s, { span: ["2017-01-20", "2021-01-20"], dots: ["2017-01-20", "2017-12-22", "2020-03-27", "2021-01-06"], dark: true });

  s.addNotes(
    "So what did these four years leave behind? Three points.\n\n" +
      "First: the longest-lasting legacy is the Supreme Court. With three justices appointed for life, Trump shaped American law for decades.\n\n" +
      "Second: few presidents have divided the country this much. On average, only 41 percent of Americans approved of the job he was doing – the lowest average Gallup has ever measured. And yet in 2020 he won more than 74 million votes, more than any sitting president before him. To his supporters he was the outsider finally taking on the establishment; to his opponents, a threat to democracy.\n\n" +
      "Third: with “America First”, Trump changed America’s role in the world – away from international agreements, toward tariffs and deals.\n\n" +
      "I’ll finish with a question for you: which decision from these four years do you think will have the longest-lasting impact? Thank you for listening!"
  );
}

// ---------------------------------------------------------------------------
// Slide 9 – Sources (hidden: visible only while editing)
// ---------------------------------------------------------------------------
pres.addSection({ title: "Appendix" });
{
  const s = pres.addSlide({ masterName: "APPENDIX_LIGHT", sectionTitle: "Appendix" });
  s.hidden = true;
  heading(s, "APPENDIX · HIDDEN SLIDE", "Sources");
  const left = [
    "Gallup (2021): Last Trump Job Approval 34%; Average Is Record-Low – news.gallup.com/poll/328637",
    "U.S. Bureau of Labor Statistics: unemployment rate, series LNS14000000 – bls.gov",
    "Congressional Budget Office / Joint Committee on Taxation (2017): cost estimate for H.R. 1 – cbo.gov/publication/53312",
    "U.S. Department of Homeland Security (Jan 5, 2021): 450 miles of border wall – dhs.gov",
    "Family Reunification Task Force (June 2021): 3,913 separated children – reported by AP",
    "PolitiFact (2021): tally of the 2020 election lawsuits – politifact.com",
    "Reuters (2025): 234 federal judges in Trump’s first term – reuters.com",
  ];
  const right = [
    "NPR (Feb 10, 2021): full text of Trump’s Jan 6, 2021 speech – npr.org",
    "Inaugural address, Jan 20, 2017, transcript – npr.org / pbs.org",
    "Federal Election Commission: official 2016 and 2020 results – fec.gov",
    "U.S. Senate: impeachment and confirmation votes – senate.gov",
    "Johns Hopkins University via AP (Jan 19, 2021): 400,000 U.S. COVID-19 deaths",
    "Bob Woodward: Rage (2020), interview of March 19, 2020",
    "Columbia Sabin Center: U.S. withdrawal from the Paris Agreement (effective Nov 4, 2020)",
  ];
  const col = (items, x) =>
    text(
      s,
      items.map((t, i) => ({ text: t, options: { breakLine: i < items.length - 1, paraSpaceAfter: 8 } })),
      { x, y: CONTENT_TOP, w: 5.9, h: 4.4, fontSize: 12, color: SC.slate }
    );
  col(left, MX);
  col(right, MX + 6.23);
  s.addNotes("This slide is hidden and does not appear in the slide show. It lists the sources.");
}

pres.writeFile({ fileName: OUT }).then((f) => console.log("written:", f));
