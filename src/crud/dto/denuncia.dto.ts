import { ApiProperty } from '@nestjs/swagger';

export class CreateDenunciaDTO {
  @ApiProperty({ description: 'Observation of the complaint' })
  observacion: string;

  @ApiProperty({ description: 'Comment ID related to the complaint' })
  idComentario: string;

  @ApiProperty({ description: 'ID of the reported user' })
  idDenunciado: string;

  @ApiProperty({ description: 'ID of the reporting user' })
  idDenunciante: string;

  @ApiProperty({ description: 'ID of the administrator handling the complaint' })
  idAdministrador: string;

  @ApiProperty({ description: 'Type of complaint' })
  tipo: string;

  @ApiProperty({ description: 'Date of the complaint' })
  fecha: Date;
}