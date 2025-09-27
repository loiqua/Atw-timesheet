import { ApiProperty } from '@nestjs/swagger';

export class CalendarDomainResponseDto {
  @ApiProperty({ description: 'ID du domaine' })
  id: string;

  @ApiProperty({ description: 'Nom du domaine' })
  name: string;

  @ApiProperty({ description: 'Couleur du domaine (format hexadécimal)' })
  color: string;
}
