import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';

export interface PdfPayload {
  readonly title: string;
  readonly domainName?: string | null;
  readonly dateISO: string; // ISO 8601
  readonly durationMin: number;
  readonly status: string;
  readonly description?: string | null;
  readonly reportCategory?: string | null;
  readonly reportContent?: Record<string, unknown> | null;
  readonly createdBy: { readonly fullName: string; readonly email: string };
}

@Injectable()
export class PdfService {
  async generateTimesheetPdf(payload: PdfPayload): Promise<Uint8Array> {
    const pdfDoc: PDFDocument = await PDFDocument.create();
    let page: PDFPage = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header band
    page.drawRectangle({
      x: 0,
      y: 800,
      width,
      height: 40,
      color: rgb(0.15, 0.25, 0.6),
    });
    page.drawText('ATW Timesheet', {
      x: 24,
      y: 812,
      size: 16,
      color: rgb(1, 1, 1),
      font: fontBold,
    });

    let y = 770;
    const line = (label: string, value: string) => {
      page.drawText(label, {
        x: 24,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      page.drawText(value, {
        x: 180,
        y,
        size: 11,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 18;
    };

    const dateStr = new Date(payload.dateISO).toLocaleString('fr-FR', {
      timeZone: 'UTC',
    });
    line('Titre', payload.title);
    line('Domaine', payload.domainName ?? '-');
    line('Date', dateStr);
    line('Durée (min)', String(payload.durationMin));
    line('Statut', payload.status);
    line(
      'Créé par',
      `${payload.createdBy.fullName} <${payload.createdBy.email}>`,
    );

    if (payload.description) {
      y -= 8;
      page.drawText('Description', { x: 24, y, size: 11, font: fontBold });
      y -= 16;
      const text = this.wrap(payload.description, 80);
      for (const row of text) {
        page.drawText(row, { x: 24, y, size: 11, font });
        y -= 14;
      }
    }

    if (payload.reportContent) {
      y -= 8;
      page.drawText('Rapport détaillé', { x: 24, y, size: 11, font: fontBold });
      y -= 16;
      const json = JSON.stringify(payload.reportContent, null, 2);
      const rows = this.wrap(json, 90);
      for (const r of rows) {
        if (y < 60) {
          // add new page
          const p2 = pdfDoc.addPage([595.28, 841.89]);
          y = 800; // reset
          p2.drawText('Suite du rapport détaillé', {
            x: 24,
            y,
            size: 11,
            font: fontBold,
          });
          y -= 16;
          // switch page reference
          page = p2;
        }
        page.drawText(r, { x: 24, y, size: 10, font });
        y -= 12;
      }
    }

    const bytes = await pdfDoc.save();
    return bytes;
  }

  private wrap(text: string, maxChars: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > maxChars) {
        lines.push(line.trim());
        line = w;
      } else {
        line = (line + ' ' + w).trim();
      }
    }
    if (line) lines.push(line.trim());
    return lines;
  }
}
