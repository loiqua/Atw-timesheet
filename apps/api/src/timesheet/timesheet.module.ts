import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TimesheetController } from './timesheet.controller';
import { TimesheetService } from './timesheet.service';
import { PdfService } from './utils/pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [TimesheetController],
  providers: [TimesheetService, PdfService],
  exports: [TimesheetService],
})
export class TimesheetModule {}
