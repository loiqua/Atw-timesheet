import { Injectable } from '@nestjs/common';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
} from 'pdf-lib';

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
  private createMappings() {
    return {
      status: {
        DRAFT: 'Brouillon',
        SUBMITTED: 'Soumis',
        APPROVED: 'Approuvé',
        REJECTED: 'Rejeté',
      },
      category: {
        FieldSurvey: 'Enquête terrain',
        CallCenter: 'Call center',
        Training: 'Formation',
        Accounting: 'Comptabilité',
        Maintenance: 'Maintenance',
        Sales: 'Commercial',
        Custom: 'Personnalisé',
      },
      projectType: {
        FIELD: 'Terrain',
        INTERNAL: 'Interne',
        CLIENT: 'Client',
      },
      fieldLabels: {
        firstName: 'Prénom',
        lastName: 'Nom',
        location: 'Lieu',
        sector: 'Secteur',
        personsMet: 'Personnes rencontrées',
        contactPoints: 'Points de contact',
        calls: 'Appels',
        success: 'Réussites',
        notes: 'Notes',
        sessionTitle: 'Titre de la session',
        attendees: 'Participants',
        auditType: "Type d'audit",
        documentsChecked: 'Documents vérifiés',
        equipment: 'Équipement',
        actions: 'Actions',
        leads: 'Pistes',
        meetings: 'Réunions',
        comments: 'Observations / Commentaires',
      },
    };
  }

  private formatDuration(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const hPart = `${h}\u00A0h`;
    const mPart = `${m}\u00A0min`;
    return `${hPart} ${mPart}`;
  }

  private getCategoryLabel(
    category: string,
    reportContent: Record<string, unknown> | null | undefined,
    mappings: ReturnType<typeof this.createMappings>,
  ): string {
    if (category === 'Custom' || category === 'Personnalisé') {
      const customName = reportContent?.['customCategoryName'];
      return typeof customName === 'string' && customName.trim()
        ? customName
        : (mappings.category[category as keyof typeof mappings.category] ??
            category);
    }
    return (
      mappings.category[category as keyof typeof mappings.category] ?? category
    );
  }

  private sanitizeTextForPdf(text: string): string {
    // Remplace les caractères accentués et spéciaux par des équivalents ASCII
    return (
      text
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ýÿ]/g, 'y')
        .replace(/ñ/g, 'n')
        .replace(/ç/g, 'c')
        .replace(/[ÀÁÂÃÄÅ]/g, 'A')
        .replace(/[ÈÉÊË]/g, 'E')
        .replace(/[ÌÍÎÏ]/g, 'I')
        .replace(/[ÒÓÔÕÖ]/g, 'O')
        .replace(/[ÙÚÛÜ]/g, 'U')
        .replace(/Ý/g, 'Y')
        .replace(/Ñ/g, 'N')
        .replace(/Ç/g, 'C')
        // Supprime les emojis et autres caractères Unicode non-ASCII
        .replace(
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
          '',
        )
        // Garde seulement les caractères ASCII imprimables
        .replace(/[^\x20-\x7E]/g, '')
    );
  }

  private formatValue(raw: unknown): string {
    if (raw === null || raw === undefined) {
      return '';
    }
    if (typeof raw === 'number' || typeof raw === 'boolean') {
      return String(raw);
    }
    if (typeof raw === 'string') {
      return this.sanitizeTextForPdf(raw);
    }
    if (Array.isArray(raw)) {
      return raw
        .map((x) =>
          typeof x === 'string' ||
          typeof x === 'number' ||
          typeof x === 'boolean'
            ? String(x)
            : (() => {
                try {
                  return JSON.stringify(x);
                } catch {
                  return '[objet]';
                }
              })(),
        )
        .join(', ');
    }
    try {
      return JSON.stringify(raw);
    } catch {
      return '[objet]';
    }
  }

  private drawReportDetails(
    currentPage: PDFPage,
    currentY: number,
    payload: PdfPayload,
    font: PDFFont,
    fontBold: PDFFont,
    pdfDoc: PDFDocument,
  ): number {
    if (!payload.reportContent) return currentY;

    const mappings = this.createMappings();
    let page = currentPage;
    let y = currentY;
    const { width } = page.getSize();

    const projectType =
      typeof payload.reportContent['projectType'] === 'string'
        ? String(payload.reportContent['projectType'])
        : undefined;
    const category =
      payload.reportCategory ??
      (typeof payload.reportContent['category'] === 'string'
        ? String(payload.reportContent['category'])
        : undefined);

    const drawLine = (label: string, value: string) => {
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

    if (projectType) {
      const typeLabel =
        mappings.projectType[
          projectType as keyof typeof mappings.projectType
        ] ?? projectType;
      drawLine('Type de projet', typeLabel);
    }
    if (category) {
      const categoryLabel = this.getCategoryLabel(
        category,
        payload.reportContent,
        mappings,
      );
      drawLine('Catégorie', categoryLabel);
    }

    // Section "Rapport détaillé" avec design moderne
    y -= 20;

    // Background pour la section
    page.drawRectangle({
      x: 20,
      y: y - 8,
      width: width - 40,
      height: 25,
      color: rgb(0.97, 0.98, 0.99),
    });

    // Barre colorée à gauche
    page.drawRectangle({
      x: 20,
      y: y - 8,
      width: 4,
      height: 25,
      color: rgb(0.95, 0.65, 0.15), // Orange
    });

    page.drawText(this.sanitizeTextForPdf('RAPPORT DETAILLE'), {
      x: 30,
      y,
      size: 13,
      font: fontBold,
      color: rgb(0.12, 0.2, 0.55),
    });
    y -= 35;

    // Filter and sort entries for better display
    const entries = Object.entries(payload.reportContent)
      .filter(([k, v]) => {
        if (k === 'projectType' || k === 'category') return false;
        if (v === null || v === undefined) return false;
        if (typeof v === 'string') return v.trim() !== '';
        if (typeof v === 'number') return true;
        if (typeof v === 'boolean') return true;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object')
          return Object.keys(v as Record<string, unknown>).length > 0;
        return true;
      })
      .sort(([a], [b]) => {
        // Prioritize known fields first, with comments at the end
        const knownFields = [
          'firstName',
          'lastName',
          'location',
          'sector',
          'personsMet',
          'contactPoints',
        ];

        // Comments should appear last
        if (a === 'comments') return 1;
        if (b === 'comments') return -1;

        const aIndex = knownFields.indexOf(a);
        const bIndex = knownFields.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      });

    const ensureSpace = (needed = 16) => {
      if (y < 60 + needed) {
        const p2 = pdfDoc.addPage([595.28, 841.89]);
        page = p2;
        y = 800;
        p2.drawText('Suite du rapport détaillé', {
          x: 24,
          y,
          size: 12,
          font: fontBold,
          color: rgb(0.05, 0.05, 0.05),
        });
        y -= 20;
      }
    };

    // Enhanced display with better formatting
    for (const [k, raw] of entries) {
      const label =
        mappings.fieldLabels[k as keyof typeof mappings.fieldLabels] ??
        k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1');

      const value = this.formatValue(raw);

      ensureSpace(20);

      // Background léger pour chaque champ
      page.drawRectangle({
        x: 20,
        y: y - 2,
        width: width - 40,
        height: 18,
        color: rgb(0.98, 0.99, 1.0),
      });

      // Puce colorée
      page.drawRectangle({
        x: 26,
        y: y + 2,
        width: 4,
        height: 4,
        color: rgb(0.12, 0.2, 0.55),
      });

      // Draw field name in bold avec icône
      page.drawText(this.sanitizeTextForPdf(`${label}:`), {
        x: 35,
        y,
        size: 10,
        font: fontBold,
        color: rgb(0.12, 0.2, 0.55),
      });
      y -= 16;

      // Draw value with proper wrapping and indentation
      const valueLines = this.wrap(value, 80);
      for (const line of valueLines) {
        ensureSpace();
        page.drawText(this.sanitizeTextForPdf(line), {
          x: 35,
          y,
          size: 10,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 12;
      }

      // Add some spacing between fields
      y -= 8;
    }

    // If no entries found, show a message
    if (entries.length === 0) {
      ensureSpace();
      page.drawText(
        this.sanitizeTextForPdf('Aucun detail de rapport disponible'),
        {
          x: 24,
          y,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        },
      );
      y -= 12;
    }

    return y;
  }

  async generateTimesheetPdf(payload: PdfPayload): Promise<Uint8Array> {
    const pdfDoc: PDFDocument = await PDFDocument.create();
    const page: PDFPage = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Modern Header with gradient effect (simulated with rectangles)
    // Main header background
    page.drawRectangle({
      x: 0,
      y: height - 70,
      width,
      height: 70,
      color: rgb(0.12, 0.2, 0.55), // Dark blue
    });

    // Accent stripe
    page.drawRectangle({
      x: 0,
      y: height - 75,
      width,
      height: 5,
      color: rgb(0.95, 0.65, 0.15), // Orange accent
    });

    // Company logo area (placeholder)
    page.drawRectangle({
      x: 24,
      y: height - 60,
      width: 40,
      height: 40,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });

    // Logo text
    page.drawText('ATW', {
      x: 34,
      y: height - 45,
      size: 14,
      font: fontBold,
      color: rgb(0.12, 0.2, 0.55),
    });

    // Main title
    page.drawText('FEUILLE DE TEMPS', {
      x: 80,
      y: height - 35,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Subtitle
    page.drawText("Rapport d'activité détaillé", {
      x: 80,
      y: height - 52,
      size: 11,
      font,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Date generation on the right
    const currentDate = new Date().toLocaleDateString('fr-FR');
    page.drawText(`Généré le ${currentDate}`, {
      x: width - 150,
      y: height - 45,
      size: 10,
      font,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Information section with modern layout
    let y = height - 100;

    // Section title
    page.drawText('INFORMATIONS GÉNÉRALES', {
      x: 24,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0.12, 0.2, 0.55),
    });

    // Underline
    page.drawRectangle({
      x: 24,
      y: y - 5,
      width: 200,
      height: 2,
      color: rgb(0.95, 0.65, 0.15),
    });

    y -= 25;

    const drawKeyValue = (label: string, value: string, xPos: number = 24) => {
      // Label with modern background and rounded corners effect
      page.drawRectangle({
        x: xPos,
        y: y - 2,
        width: 85,
        height: 16,
        color: rgb(0.94, 0.96, 0.99), // Bleu très clair
      });

      // Accent line on the left
      page.drawRectangle({
        x: xPos,
        y: y - 2,
        width: 3,
        height: 16,
        color: rgb(0.12, 0.2, 0.55), // Bleu foncé
      });

      page.drawText(label, {
        x: xPos + 8,
        y,
        size: 10,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      page.drawText(value, {
        x: 185,
        y,
        size: 11,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 20; // Plus d'espacement
    };

    const dateStr = new Date(payload.dateISO).toLocaleDateString('fr-FR', {
      timeZone: 'UTC',
    });
    const mappings = this.createMappings();

    drawKeyValue('Titre', this.sanitizeTextForPdf(payload.title));
    drawKeyValue('Domaine', this.sanitizeTextForPdf(payload.domainName ?? '-'));
    drawKeyValue('Date', dateStr);
    drawKeyValue('Duree', this.formatDuration(payload.durationMin));
    drawKeyValue(
      'Statut',
      this.sanitizeTextForPdf(
        mappings.status[payload.status as keyof typeof mappings.status] ??
          payload.status,
      ),
    );
    drawKeyValue(
      'Cree par',
      this.sanitizeTextForPdf(
        `${payload.createdBy.fullName} <${payload.createdBy.email}>`,
      ),
    );

    if (payload.description) {
      y -= 8;
      page.drawText(this.sanitizeTextForPdf('Description'), {
        x: 24,
        y,
        size: 11,
        font: fontBold,
      });
      y -= 16;
      const text = this.wrap(this.sanitizeTextForPdf(payload.description), 80);
      for (const row of text) {
        page.drawText(this.sanitizeTextForPdf(row), {
          x: 24,
          y,
          size: 11,
          font,
        });
        y -= 14;
      }
    }

    y = this.drawReportDetails(page, y, payload, font, fontBold, pdfDoc);

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
