import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { expect, it, vi } from "vitest";
import { drawCardPdf } from "./card-pdf";

vi.mock("server-only", () => ({}));

it.each([
  { full_name: "Ravi Kumar", allergies: [] },
  { full_name: "É".repeat(200), allergies: ["Penicillin".repeat(40), "दवा", "Latex"] },
])("draws one 428 by 270 point card when allergies are %j", async (details) => {
  const png = await QRCode.toBuffer("https://card.example/e/public-token");
  const bytes = await drawCardPdf({ ...details, age: 72, blood_group: "B+" }, png);

  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getPage(0).getSize()).toEqual({ width: 428, height: 270 });
});
