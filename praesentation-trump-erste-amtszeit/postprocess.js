// Ergänzt im fertigen PPTX, was pptxgenjs nicht schreiben kann:
//   1. Theme-Farben aus theme.json (pptxgenjs schreibt sonst die Office-Standardpalette).
//   2. Morph-Übergänge (Folie 2–8) – der Zeitstrahl und die große 45 gleiten von Folie zu Folie.
//      Ältere PowerPoint-Versionen ohne Morph zeigen stattdessen eine Überblendung.
//   3. Gezielte Beschriftungen im Arbeitslosen-Diagramm (Tiefpunkt, Rekord, Ende).
//
//   node postprocess.js Trump_Erste_Amtszeit.pptx

const fs = require("fs");
const path = require("path");
const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));

const THEME = JSON.parse(fs.readFileSync(path.join(__dirname, "theme.json"), "utf8"));
const SLOTS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];

function applyThemeColors(xml) {
  for (const k of SLOTS) {
    if (!/^[0-9A-F]{6}$/i.test(THEME.colors[k])) throw new Error(`theme.json: ${k} ist keine sechsstellige Hex-Farbe`);
  }
  const scheme =
    `<a:clrScheme name="${THEME.name}">` +
    SLOTS.map((k) => `<a:${k}><a:srgbClr val="${THEME.colors[k].toUpperCase()}"/></a:${k}>`).join("") +
    "</a:clrScheme>";
  const out = xml
    .replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme)
    .replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, head) => `${head}${THEME.name}"`);
  if (!out.includes(scheme)) throw new Error("ppt/theme/theme1.xml ohne <a:clrScheme>");
  return out;
}

const FILE = process.argv[2];
if (!FILE) {
  console.error("usage: node postprocess.js deck.pptx");
  process.exit(2);
}

const MORPH_SLIDES = [2, 3, 4, 5, 6, 7, 8];
const MORPH =
  '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">' +
  '<mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">' +
  '<p:transition spd="slow"><p159:morph option="byObject"/></p:transition>' +
  "</mc:Choice>" +
  '<mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback>' +
  "</mc:AlternateContent>";

const NAVY = "0B1E3B";
const RED = "E81B23";

// Punkte im Diagramm: Index = Monat ab Jan. 2017
const POINTS = [
  { idx: 37, label: "3,5 % · 50-Jahres-Tief", pos: "b", color: NAVY, bold: true },
  { idx: 39, label: "14,8 % · höchster Wert seit 1948", pos: "l", color: RED, bold: true },
  { idx: 47, label: "6,7 %", pos: "r", color: NAVY, bold: false },
];

function dPt(p) {
  return (
    `<c:dPt><c:idx val="${p.idx}"/><c:marker><c:symbol val="circle"/><c:size val="8"/>` +
    `<c:spPr><a:solidFill><a:srgbClr val="${p.color}"/></a:solidFill>` +
    `<a:ln w="19050"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:marker>` +
    `<c:bubble3D val="0"/></c:dPt>`
  );
}

function dLbl(p) {
  return (
    `<c:dLbl><c:idx val="${p.idx}"/><c:layout/>` +
    `<c:tx><c:rich><a:bodyPr wrap="none"/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1100" b="${p.bold ? 1 : 0}"/></a:pPr>` +
    `<a:r><a:rPr lang="de-DE" sz="1100" b="${p.bold ? 1 : 0}"><a:solidFill><a:srgbClr val="${NAVY}"/></a:solidFill>` +
    `<a:latin typeface="Arial"/></a:rPr><a:t>${p.label}</a:t></a:r></a:p></c:rich></c:tx>` +
    `<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>` +
    `<c:dLblPos val="${p.pos}"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/>` +
    `<c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbl>`
  );
}

function fixLineSeries(ser) {
  // Schema-Reihenfolge einer Linienreihe: idx, order, tx, spPr, marker, dPt*, dLbls, cat, val, smooth
  let out = ser.replace(/<c:invertIfNegative val="0"\/>/g, "");
  out = out.replace(/<c:dLbls>[\s\S]*?<\/c:dLbls>/, "");
  out = out.replace(/<c:marker>[\s\S]*?<\/c:marker>/, "");
  const labels =
    "<c:dLbls>" +
    POINTS.map(dLbl).join("") +
    '<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>' +
    '<c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/>' +
    '<c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>';
  const block = '<c:marker><c:symbol val="none"/></c:marker>' + POINTS.map(dPt).join("") + labels;
  if (!out.includes("<c:cat>")) throw new Error("Linienreihe ohne <c:cat> – unerwartetes Diagramm-XML");
  return out.replace("<c:cat>", block + "<c:cat>");
}

(async () => {
  const zip = await JSZip.loadAsync(fs.readFileSync(FILE));

  const themePart = "ppt/theme/theme1.xml";
  zip.file(themePart, applyThemeColors(await zip.file(themePart).async("string")));

  for (const n of MORPH_SLIDES) {
    const part = `ppt/slides/slide${n}.xml`;
    let xml = await zip.file(part).async("string");
    if (xml.includes("<p:transition")) continue;
    if (!xml.includes("</p:clrMapOvr>")) throw new Error(`${part}: kein <p:clrMapOvr> gefunden`);
    xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + MORPH);
    zip.file(part, xml);
  }

  const charts = Object.keys(zip.files).filter((f) => /^ppt\/charts\/chart\d+\.xml$/.test(f));
  if (charts.length !== 1) throw new Error(`erwartet genau 1 Diagramm, gefunden: ${charts.length}`);
  let chart = await zip.file(charts[0]).async("string");
  const sers = chart.match(/<c:ser>[\s\S]*?<\/c:ser>/g) || [];
  if (sers.length !== 1) throw new Error(`erwartet genau 1 Datenreihe, gefunden: ${sers.length}`);
  chart = chart.replace(sers[0], fixLineSeries(sers[0]));
  zip.file(charts[0], chart);

  fs.writeFileSync(FILE, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log(`Theme „${THEME.name}“; Morph auf Folie ${MORPH_SLIDES.join(", ")}; Diagramm ${charts[0]} beschriftet`);
})().catch((e) => {
  console.error("Fehler:", e.message);
  process.exit(1);
});
