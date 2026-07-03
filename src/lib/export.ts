import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Add type for jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

/**
 * Exports data to an Excel file
 */
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Exports data to a PDF file
 */
export function exportToPDF(columns: string[], data: any[][], fileName: string, title: string) {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  
  // Set Arabic font support if possible, or just use standard
  doc.setFontSize(18);
  doc.text(title, 105, 15, { align: 'center' });
  
  doc.autoTable({
    head: [columns],
    body: data,
    startY: 25,
    theme: 'striped',
    styles: { font: 'helvetica', halign: 'right' },
    headStyles: { fillStyle: [45, 85, 255] }
  });
  
  doc.save(`${fileName}.pdf`);
}
