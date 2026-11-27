import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { Profile } from "../mock";

type CardDetails = Pick<Profile, "full_name" | "age" | "blood_group" | "allergies">;

const PAGE_WIDTH = 428;
const PAGE_HEIGHT = 270;
const LEFT = 18;
const TEXT_WIDTH = 250;
const QR_SIZE = 120;
const QR_X = PAGE_WIDTH - LEFT - QR_SIZE;
const RED = rgb(220 / 255, 38 / 255, 38 / 255);
const WHITE = rgb(1, 1, 1);
const INK = rgb(0.07, 0.09, 0.15);
const GRAY = rgb(0.29, 0.33, 0.39);

function printableText(text: string, font: PDFFont) {
  const supported = new Set(font.getCharacterSet());
  return Array.from(text.normalize("NFC").trim().replace(/\s+/g, " "), (character) =>
    supported.has(character.codePointAt(0)!) ? character : "?",
  ).join("");
}

function fitPrefix(text: string, font: PDFFont, size: number, suffix = "") {
  let length = 0;
  while (
    length < text.length
    && font.widthOfTextAtSize(text.slice(0, length + 1) + suffix, size) <= TEXT_WIDTH
  ) {
    length++;
  }
  return length;
}

function fitLines(text: string, font: PDFFont, size: number, maxLines: number) {
  const lines: string[] = [];
  let rest = printableText(text, font);
  while (rest && lines.length < maxLines) {
    const fit = fitPrefix(rest, font, size);
    if (fit === rest.length) {
      lines.push(rest);
      break;
    }
    if (lines.length === maxLines - 1) {
      const end = fitPrefix(rest.slice(0, fit), font, size, "…");
      lines.push(`${rest.slice(0, end).trimEnd()}…`);
      break;
    }
    const space = rest.lastIndexOf(" ", fit);
    const end = space > 0 ? space : fit;
    lines.push(rest.slice(0, end));
    rest = rest.slice(end).trimStart();
  }
  return lines;
}

export async function drawCardPdf(profile: CardDetails, qrPng: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.create({ updateMetadata: false });
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qr = await pdf.embedPng(qrPng);

  page.drawRectangle({ x: 0, y: 230, width: PAGE_WIDTH, height: 40, color: RED });
  page.drawText("EMERGENCY HEALTH CARD", { x: LEFT, y: 245, size: 16, font: bold, color: WHITE });
  const headerCaption = "Scan in emergency";
  page.drawText(headerCaption, {
    x: PAGE_WIDTH - LEFT - font.widthOfTextAtSize(headerCaption, 11), y: 245, size: 11, font, color: WHITE,
  });

  const [name] = fitLines(profile.full_name, bold, 23, 1);
  if (name) page.drawText(name, { x: LEFT, y: 198, size: 23, font: bold, color: INK });
  page.drawText(`Age ${profile.age}`, { x: LEFT, y: 178, size: 13, font, color: GRAY });
  page.drawText("Blood group", { x: LEFT, y: 151, size: 11, font, color: GRAY });
  page.drawText(profile.blood_group, { x: LEFT, y: 117, size: 30, font: bold, color: RED });
  page.drawText("Allergies", { x: LEFT, y: 93, size: 11, font, color: GRAY });
  const allergies = profile.allergies.length ? profile.allergies.join(", ") : "None listed";
  fitLines(allergies, bold, 12, 4).forEach((line, index) => {
    page.drawText(line, { x: LEFT, y: 75 - index * 15, size: 12, font: bold, color: INK });
  });

  page.drawImage(qr, { x: QR_X, y: 80, width: QR_SIZE, height: QR_SIZE });
  const qrCaption = "Scan for medical info";
  page.drawText(qrCaption, {
    x: QR_X + (QR_SIZE - font.widthOfTextAtSize(qrCaption, 10)) / 2, y: 66, size: 10, font, color: GRAY,
  });
  page.drawRectangle({ x: 1, y: 1, width: PAGE_WIDTH - 2, height: PAGE_HEIGHT - 2, borderColor: RED, borderWidth: 2 });
  return pdf.save();
}
