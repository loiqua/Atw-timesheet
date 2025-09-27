import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have sanitizeTextForPdf method', () => {
    expect(typeof service['sanitizeTextForPdf']).toBe('function');
  });

  it('should have formatValue method', () => {
    expect(typeof service['formatValue']).toBe('function');
  });
});
