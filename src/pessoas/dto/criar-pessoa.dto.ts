import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TipoPessoa } from '../../generated/prisma/enums.js';

export class CriarPessoaDto {
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  nome: string;

  @IsEmail({}, { message: 'O e-mail deve ter um formato válido' })
  email: string;

  @IsEnum(TipoPessoa, { message: 'O tipo deve ser SOLICITANTE ou TECNICO' })
  tipo: TipoPessoa;
}
