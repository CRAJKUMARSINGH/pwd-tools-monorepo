import { CASES } from "@/data/audit-cases";
import { AlignmentType, BorderStyle, Document, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType } from "docx";
import { saveAs } from "file-saver";

function mangalRun(text: string, bold = false): TextRun {
  return new TextRun({
    text: text || "",
    bold,
    font: { name: "Mangal", cs: "Mangal" },
    language: { value: "hi-IN", eastAsia: "hi-IN", bidirectional: "hi-IN" },
    size: 18,
  });
}

function createCellContent(text: string, bold = false) {
  if (!text) text = "";
  return text.split('\n').map(line =>
    new Paragraph({
      children: [mangalRun(line, bold)],
      spacing: { before: 0, after: 0, line: 240 },
    })
  );
}

const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };

/** SOLID shading helper — colour fills the whole cell. */
function shade(fill: string) {
  return { type: ShadingType.SOLID, color: fill, fill };
}

export async function generateDocx(cases: typeof CASES, replies: Record<string, { reply: string; comments: string }>) {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 16838, height: 11906, orientation: "landscape" as const },
          margin: { top: 851, bottom: 851, left: 851, right: 851, header: 0, footer: 0 },
        },
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "अंकेक्षण प्रतिवेदन उत्तर — जिला प्रभाग II, उदयपुर",
              bold: true,
              size: 28,
              font: { name: "Mangal", cs: "Mangal" },
              language: { value: "hi-IN", eastAsia: "hi-IN", bidirectional: "hi-IN" },
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0, line: 240 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [567, 1984, 1417, 3685, 3685, 3797],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ children: createCellContent("Para No.", true), borders, shading: shade("E0E0E0") }),
                new TableCell({ children: createCellContent("संक्षिप्त विवरण", true), borders, shading: shade("E0E0E0") }),
                new TableCell({ children: createCellContent("उत्तरदायित्व", true), borders, shading: shade("E0E0E0") }),
                new TableCell({ children: createCellContent("अंकेक्षण आपत्ति", true), borders, shading: shade("E0E0E0") }),
                new TableCell({ children: createCellContent("उत्तर", true), borders, shading: shade("E0E0E0") }),
                new TableCell({ children: createCellContent("उच्चाधिकारी की टिप्पणी", true), borders, shading: shade("E0E0E0") }),
              ]
            }),
            ...cases.flatMap(c => {
              const r = replies[c.no] || { reply: "", comments: "" };

              const row1 = new TableRow({
                children: [
                  new TableCell({
                    rowSpan: 2,
                    children: createCellContent(c.no, true),
                    borders,
                    verticalAlign: VerticalAlign.TOP,
                  }),
                  new TableCell({
                    columnSpan: 5,
                    children: createCellContent(c.header, true),
                    borders,
                    shading: shade("F5F5F5"),
                  })
                ]
              });

              const row2 = new TableRow({
                children: [
                  new TableCell({ children: createCellContent(c.gist, true), borders }),
                  new TableCell({ children: createCellContent(c.resp), borders }),
                  new TableCell({ children: createCellContent(c.obs), borders }),
                  new TableCell({
                    children: createCellContent(r.reply),
                    borders,
                    shading: shade("FFFDE7"),
                  }),
                  new TableCell({
                    children: createCellContent(r.comments),
                    borders,
                    shading: shade("E3F2FD"),
                  }),
                ]
              });

              return [row1, row2];
            })
          ]
        })
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `DRAFT_REPLY_${new Date().toISOString().slice(0, 10)}.docx`);
}
