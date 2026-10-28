import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarPessoaDto } from './dto/criar-pessoa.dto.js';
import { AtualizarPessoaDto } from './dto/atualizar-pessoa.dto.js';

@Injectable()
export class PessoasService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarPessoaDto) {
    await this.verificarEmail(dto.email);
    return this.prisma.pessoa.create({
      data: { nome: dto.nome, email: dto.email, tipo: dto.tipo },
    });
  }

  listar() {
    return this.prisma.pessoa.findMany({ orderBy: { id: 'asc' } });
  }

  async buscar(id: number) {
    const pessoa = await this.prisma.pessoa.findUnique({ where: { id } });
    if (!pessoa) throw new NotFoundException(`Pessoa ${id} não encontrada`);
    return pessoa;
  }

  async atualizar(id: number, dto: AtualizarPessoaDto) {
    const pessoa = await this.buscar(id);
    if (dto.email !== undefined && dto.email !== pessoa.email) {
      await this.verificarEmail(dto.email);
    }
    return this.prisma.pessoa.update({ where: { id }, data: dto });
  }

  async remover(id: number) {
    await this.buscar(id);
    const chamados = await this.prisma.chamado.count({
      where: { OR: [{ solicitanteId: id }, { tecnicoId: id }] },
    });
    const comentarios = await this.prisma.comentario.count({
      where: { autorId: id },
    });
    if (chamados > 0 || comentarios > 0) {
      throw new ConflictException(
        'Pessoa envolvida em chamados não pode ser removida, apenas desativada',
      );
    }
    return this.prisma.pessoa.delete({ where: { id } });
  }

  private async verificarEmail(email: string) {
    const existente = await this.prisma.pessoa.findUnique({ where: { email } });
    if (existente) throw new ConflictException('E-mail já cadastrado');
  }
}
