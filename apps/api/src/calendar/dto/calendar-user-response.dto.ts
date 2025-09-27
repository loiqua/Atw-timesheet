import { ApiProperty } from '@nestjs/swagger';

export class CalendarUserResponseDto {
  @ApiProperty({ description: "ID de l'utilisateur" })
  id: string;

  @ApiProperty({ description: "Nom complet de l'utilisateur" })
  name: string;

  @ApiProperty({ description: "Email de l'utilisateur" })
  email: string;

  @ApiProperty({ description: "Initiales de l'utilisateur" })
  initials: string;
}
