import {
  AlignmentType,
  BorderStyle,
  Document,
  LineRuleType,
  Packer,
  PageOrientation,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";
import type { Letter } from "./types";

// ── Constants (standing spec) ──────────────────────────────────────────────
const A4_WIDTH_TWIPS = 11906; // 210 mm
const A4_HEIGHT_TWIPS = 16838; // 297 mm
const MARGIN_TWIPS = 1417;  // 25 mm
const ZERO = 0;

// ── Helper: zero-spaced paragraph ─────────────────────────────────────────
function p(
  children: TextRun[],
  opts: {
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    indent?: { firstLine?: number; left?: number };
  } = {}
): Paragraph {
  return new Paragraph({
    children,
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { before: ZERO, after: ZERO, line: 276, lineRule: LineRuleType.AUTO },
    ...(opts.indent ? { indent: opts.indent } : {}),
  });
}

// ── Helper: blank line (zero-height empty paragraph) ─────────────────────
function blankLine(): Paragraph {
  return new Paragraph({
    children: [],
    spacing: { before: ZERO, after: ZERO, line: 276, lineRule: LineRuleType.AUTO },
  });
}

function t(text: string, opts: { bold?: boolean; size?: number } = {}): TextRun {
  return new TextRun({
    text,
    bold: opts.bold,
    size: opts.size ?? 22,
    font: "Mangal",
  });
}

export async function exportLetterAsDocx(letter: Letter): Promise<void> {
  const language = letter.language ?? "hindi";
  const versions = [
    ...(language !== "english"
      ? [{
        language: "hindi" as const,
        toName: letter.toName,
        toDesignation: letter.toDesignation,
        toOffice: letter.toOffice,
        subject: letter.subject,
        reference: letter.reference,
        body: letter.body,
        fromName: letter.fromName,
        fromDesignation: letter.fromDesignation,
        fromOffice: letter.fromOffice,
        cc: letter.cc,
      }]
      : []),
    ...(language !== "hindi"
      ? [{
        language: "english" as const,
        toName: letter.toNameEn,
        toDesignation: letter.toDesignationEn,
        toOffice: letter.toOfficeEn,
        subject: letter.subjectEn,
        reference: letter.referenceEn,
        body: letter.bodyEn,
        fromName: letter.fromNameEn,
        fromDesignation: letter.fromDesignationEn,
        fromOffice: letter.fromOfficeEn,
        cc: letter.ccEn,
      }]
      : []),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              width: A4_WIDTH_TWIPS,
              height: A4_HEIGHT_TWIPS,
            },
            margin: {
              top: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
              header: ZERO,  // MANDATORY — zero header height
              footer: ZERO,  // MANDATORY — zero footer height
            },
          },
        },
        children: versions.flatMap((version, versionIndex) => {
          const english = version.language === "english";
          const bodyLines = (version.body ?? "").split("\n");
          const ccLines = version.cc ? version.cc.split("\n") : [];

          const paragraphs: Paragraph[] = [
            // ── Office Header ──────────────────────────────────────────
            p([t(english ? "Office of the Executive Engineer" : "कार्यालय अधिशासी अभियंता", { bold: true, size: 28 })],
              { align: AlignmentType.CENTER }),
            p([t(english ? "Public Works Department" : "सार्वजनिक निर्माण विभाग", { bold: true, size: 26 })],
              { align: AlignmentType.CENTER }),
            p([t(english ? "District Division–II, Udaipur, Rajasthan" : "जिला खण्ड–II, उदयपुर, राजस्थान", { bold: true, size: 24 })],
              { align: AlignmentType.CENTER }),
            blankLine(),

            // ── क्रमांक / दिनांक ────────────────────────────────────────
            new Paragraph({
              children: [
                t(`${english ? "No.:" : "क्रमांकः"} ${letter.letterNumber}`),
                t("\t"),
                t(`${english ? "Date:" : "दिनांकः"} ${letter.date}`),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: ZERO, after: ZERO, line: 276, lineRule: LineRuleType.AUTO },
              tabStops: [{ type: TabStopType.RIGHT, position: A4_WIDTH_TWIPS - MARGIN_TWIPS * 2 }],
            }),
            blankLine(),

            // ── Addressee ─────────────────────────────────────────────
            p([t(english ? "To," : "सेवा में,")], { align: AlignmentType.LEFT }),
            p([t(version.toDesignation + ",")], { align: AlignmentType.LEFT }),
            p([t(version.toName + ",")], { align: AlignmentType.LEFT }),
            p([t(version.toOffice + (english ? "." : "।"))], { align: AlignmentType.LEFT }),
            blankLine(),

            // ── विषय ──────────────────────────────────────────────────
            p([t(english ? "Subject: " : "विषयः– ", { bold: true }), t(version.subject)]),
            blankLine(),

            // ── संदर्भ (reply only) ────────────────────────────────────
            ...(version.reference
              ? [
                p([t(english ? "Reference: " : "संदर्भः– ", { bold: true }), t(version.reference)]),
                blankLine(),
              ]
              : []),

            // ── महोदय / Sir/Madam ────────────────────────────────────
            p([t(english ? "Sir/Madam," : "महोदय,")], { align: AlignmentType.LEFT }),
            blankLine(),

            // ── Body ──────────────────────────────────────────────────
            ...bodyLines.map((line) =>
              p([t(line)], { indent: { firstLine: 720 } })
            ),
            blankLine(),

            // ── Valediction ───────────────────────────────────────────
            p([t(english ? "Yours faithfully," : "भवदीय,")], { align: AlignmentType.LEFT }),
            blankLine(), blankLine(), blankLine(),

            // ── Signature ────────────────────────────────────────────
            p([t(`(${version.fromName})`)], { align: AlignmentType.LEFT }),
            p([t(version.fromDesignation)], { align: AlignmentType.LEFT }),
            p([t(version.fromOffice)], { align: AlignmentType.LEFT }),

            // ── CC (optional) ─────────────────────────────────────────
            ...(ccLines.length > 0
              ? [
                blankLine(),
                new Paragraph({
                  children: [],
                  border: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
                  spacing: { before: ZERO, after: ZERO, line: 276, lineRule: LineRuleType.AUTO },
                }),
                p([t(english ? "Copy to:" : "प्रतिलिपि सूचनार्थ एवं आवश्यक कार्यवाही हेतु प्रेषित:", { bold: true })],
                  { align: AlignmentType.LEFT }),
                blankLine(),
                ...ccLines.map((line, i) =>
                  p([t(`${i + 1}. ${line}`)], { indent: { left: 360 } })
                ),
                blankLine(), blankLine(),
                p([t(`(${version.fromName})`)], { align: AlignmentType.LEFT }),
                p([t(version.fromDesignation)], { align: AlignmentType.LEFT }),
              ]
              : []),
          ];

          return versionIndex < versions.length - 1
            ? [
              ...paragraphs,
              new Paragraph({
                pageBreakBefore: true,
                spacing: { before: ZERO, after: ZERO, line: 276, lineRule: LineRuleType.AUTO },
              }),
            ]
            : paragraphs;
        }),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeNum = letter.letterNumber.replace(/[^a-zA-Z0-9\-_]/g, "_");
  saveAs(blob, `Patra_${safeNum}.docx`);
}
