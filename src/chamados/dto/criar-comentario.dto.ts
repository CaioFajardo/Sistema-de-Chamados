import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CriarComentarioDto {
  @IsInt({ message: 'O autorId deve ser um número inteiro' })
  autorId: number;

  @IsString({ message: 'O texto deve ser um texto' })
  @IsNotEmpty({ message: 'O comentário não pode ser vazio' })
  texto: string;
}
