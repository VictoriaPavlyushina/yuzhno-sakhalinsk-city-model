import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const jobs = [
  {
    input: "C:/Users/victo/Downloads/_Экономические_эффекты_турпоток_Горный_воздух_Долина_Айна_13082026.xlsx",
    output: "../outputs/019ff12b-data-package/Экономические_эффекты_турпоток_Горный_воздух_Долина_Айна.xlsx",
  },
  {
    input: "C:/Users/victo/Downloads/_Зеленый_хребет_расчет_стоимости_и_стока_13_08_2026.xlsx",
    output: "../outputs/019ff12b-data-package/Зеленый_хребет_расчет_стоимости_и_стока.xlsx",
  },
];

const colors = {
  dark: "#123536",
  teal: "#73C8C6",
  tealDark: "#1A6668",
  pale: "#EAF3EF",
  warm: "#E5A06F",
  ink: "#17393A",
  muted: "#647878",
  white: "#FFFFFF",
  line: "#C9DDD7",
};

function isSection(text) {
  if (typeof text !== "string") return false;
  const s = text.trim();
  if (!s) return false;
  return /^(БЛОК|ИТОГО|КЛЮЧЕВЫЕ|РЕЗУЛЬТАТ|РАСЧ[ЕЁ]Т|ИСХОДНЫЕ|ПАРАМЕТРЫ|ГИДРОЛОГИЯ|СЦЕНАРИИ|МЕТОДИКА|ВАЖНО|ДИНАМИКА|ДОПОЛНИТЕЛЬНЫЙ|СВОДКА|ПОТРЕБНОСТЬ|ГОДОВЫЕ|ОЦЕНКА|РЕЕСТР|ТЕРРАСЫ|СМЕТНЫЙ)/i.test(s) || (s.length > 10 && s === s.toUpperCase());
}

function isColumnHeader(row) {
  const first = row.find((v) => v !== null && v !== "");
  return typeof first === "string" && /^(Показатель|Метрика|Параметр|Наименование|Материал|№|Сценарий|Документ|Территория)/i.test(first.trim());
}

function snapshot(wb) {
  return wb.worksheets.items.map((sheet) => {
    const used = sheet.getUsedRange();
    if (!used) return { name: sheet.name, address: null, cells: null };
    const values = used.values ?? [];
    const formulas = used.formulas ?? [];
    const cells = values.map((row, r) => row.map((value, c) => {
      const formula = formulas?.[r]?.[c];
      return typeof formula === "string" && formula.startsWith("=") ? { formula } : { value };
    }));
    return { name: sheet.name, address: used.address, cells };
  });
}

await fs.mkdir("../outputs/019ff12b-data-package", { recursive: true });
await fs.mkdir("previews-after", { recursive: true });

for (const job of jobs) {
  const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(job.input));
  const before = snapshot(wb);

  for (const sheet of wb.worksheets.items) {
    const used = sheet.getUsedRange();
    if (!used || used.address === "A1" && (used.values?.[0]?.[0] == null)) continue;
    const values = used.values ?? [];
    const rowCount = values.length;
    const colCount = Math.max(1, ...values.map((row) => row.length));

    sheet.showGridLines = false;
    used.format.font = { name: "Arial", size: 9, color: colors.ink };
    used.format.verticalAlignment = "center";
    used.format.wrapText = true;
    used.format.borders = { preset: "insideHorizontal", style: "hair", color: colors.line };

    const title = sheet.getRangeByIndexes(0, 0, 1, colCount);
    title.format.fill = colors.dark;
    title.format.font = { name: "Arial", size: 13, bold: true, color: colors.white };
    title.format.rowHeight = 32;
    title.format.verticalAlignment = "center";

    for (let r = 1; r < rowCount; r += 1) {
      const row = values[r] ?? [];
      const rowRange = sheet.getRangeByIndexes(r, 0, 1, colCount);
      const lead = row.find((v) => v !== null && v !== "");
      if (isColumnHeader(row)) {
        rowRange.format.fill = colors.tealDark;
        rowRange.format.font = { name: "Arial", size: 8, bold: true, color: colors.white };
        rowRange.format.rowHeight = 27;
      } else if (isSection(lead)) {
        rowRange.format.fill = colors.pale;
        rowRange.format.font = { name: "Arial", size: 10, bold: true, color: colors.dark };
        rowRange.format.borders = { preset: "bottom", style: "medium", color: colors.teal };
        rowRange.format.rowHeight = 25;
      }
      if (typeof lead === "string" && /внимание|важно|примечание|статус/i.test(lead)) {
        rowRange.format.fill = "#F8EDE5";
        rowRange.format.font = { name: "Arial", size: 8, bold: true, color: "#7A4026" };
        rowRange.format.borders = { preset: "left", style: "thick", color: colors.warm };
      }
    }

    for (let c = 0; c < colCount; c += 1) {
      let width = 12;
      for (const row of values) {
        const text = row?.[c] == null ? "" : String(row[c]);
        width = Math.max(width, Math.min(42, Math.ceil(text.length * (c === 0 ? 0.72 : 0.55))));
      }
      sheet.getRangeByIndexes(0, c, rowCount, 1).format.columnWidth = width;
    }
    sheet.getRangeByIndexes(0, 0, rowCount, 1).format.columnWidth = Math.min(46, Math.max(24, sheet.getRangeByIndexes(0, 0, rowCount, 1).format.columnWidth ?? 30));
    sheet.freezePanes.freezeRows(Math.min(4, rowCount));

    const safe = `${path.basename(job.output, ".xlsx")}_${sheet.name}`.replace(/[\\/:*?"<>|]/g, "_");
    const preview = await wb.render({ sheetName: sheet.name, range: used.address, autoCrop: "all", scale: 1, format: "png" });
    await fs.writeFile(path.join("previews-after", `${safe}.png`), new Uint8Array(await preview.arrayBuffer()));
  }

  const exported = await SpreadsheetFile.exportXlsx(wb);
  await exported.save(job.output);

  const check = await SpreadsheetFile.importXlsx(await FileBlob.load(job.output));
  const after = snapshot(check);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(`Workbook content/formulas changed during styling: ${path.basename(job.input)}`);
  }

  const errors = await check.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
  console.log(`EXPORTED ${job.output}`);
  console.log(errors.ndjson);
}
