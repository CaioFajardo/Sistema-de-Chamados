import { IsInt } from 'class-validator';

export class DesignarTecnicoDto {
  @IsInt({ message: 'O tecnicoId deve ser um número inteiro' })
  tecnicoId: number;
}
