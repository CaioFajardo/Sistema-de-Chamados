import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';

export class AtualizarPessoaDto {
  @ValidateIf((o) => o.nome !== undefined)
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome não pode ser vazio' })
  nome?: string;

  @ValidateIf((o) => o.email !== undefined)
  @IsEmail({}, { message: 'O e-mail deve ter um formato válido' })
  email?: string;

  @ValidateIf((o) => o.ativo !== undefined)
  @IsBoolean({ message: 'O campo ativo deve ser true ou false' })
  ativo?: boolean;
}
