import {
  IsEnum,
  IsInt,
  IsString,
  Length,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Prioridade } from '../../generated/prisma/enums.js';

export class CriarChamadoDto {
  @IsString({ message: 'O título deve ser um texto' })
  @Length(5, 100, { message: 'O título deve ter entre 5 e 100 caracteres' })
  titulo: string;

  @IsString({ message: 'A descrição deve ser um texto' })
  @MinLength(10, { message: 'A descrição deve ter no mínimo 10 caracteres' })
  descricao: string;

  @ValidateIf((o) => o.prioridade !== undefined)
  @IsEnum(Prioridade, {
    message: 'A prioridade deve ser BAIXA, MEDIA, ALTA ou CRITICA',
  })
  prioridade?: Prioridade;

  @IsInt({ message: 'O solicitanteId deve ser um número inteiro' })
  solicitanteId: number;

  @IsInt({ message: 'O tipoProblemaId deve ser um número inteiro' })
  tipoProblemaId: number;
}
