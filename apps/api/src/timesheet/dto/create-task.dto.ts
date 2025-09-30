import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsInt,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ReportType } from '@prisma/client';

// 🔒 Validateur personnalisé pour les heures de travail 8h-18h STRICT
@ValidatorConstraint({ name: 'workingHours', async: false })
export class WorkingHoursValidator implements ValidatorConstraintInterface {
  validate(time: string): boolean {
    if (!time) return true; // Optionnel

    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    // Heure de début : 8h00 à 17h59 (480 à 1079 minutes)
    // Heure de fin : 8h01 à 18h00 (481 à 1080 minutes)
    const minTime = 8 * 60; // 8h00 = 480 minutes
    const maxTime = 18 * 60; // 18h00 = 1080 minutes

    return totalMinutes >= minTime && totalMinutes <= maxTime;
  }

  defaultMessage(): string {
    return '🚫 Heures de travail autorisées : 8h00 à 18h00 uniquement';
  }
}

export class CreateTaskDto {
  @IsUUID()
  domainId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  date!: string; // ISO 8601, stored as timestamptz

  // Nouveau système d'heures (prioritaire) - 🔒 RESTRICTION 8h-18h
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?\d|2[0-3]):[0-5]\d$/, {
    message: "Format d'heure invalide. Attendu: HH:mm",
  })
  @Validate(WorkingHoursValidator)
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?\d|2[0-3]):[0-5]\d$/, {
    message: "Format d'heure invalide. Attendu: HH:mm",
  })
  @Validate(WorkingHoursValidator)
  endTime?: string;

  // Ancien système (optionnel pour compatibilité)
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMin?: number;

  // Optional detailed report
  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType; // STANDARD | CUSTOM

  @IsOptional()
  @IsString()
  reportCategory?: string; // e.g., FieldSurvey, CallCenter, Training, etc.

  @IsOptional()
  @IsObject()
  reportContent?: Record<string, unknown>;
}
