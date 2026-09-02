import ExcelJS from "exceljs";
import { Response } from "express";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/** Builds a single-sheet workbook and streams it to the response as a real
 *  .xlsx download — used by the admin booking list export endpoints. */
export async function sendExcel(
  res: Response,
  filename: string,
  sheetName: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[]
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 18 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}
