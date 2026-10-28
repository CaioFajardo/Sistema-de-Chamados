import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarTipoProblemaDto } from './dto/criar-tipo-problema.dto.js';
import { AtualizarTipoProblemaDto } from './dto/atualizar-tipo-problema.dto.js';

@Injectable()
export class TiposProblemaService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarTipoProblemaDto) {
    await this.verificarNome(dto.nome);
    return this.prisma.tipoProblema.create({ data: { nome: dto.nome } });
  }

  listar() {
    return this.prisma.tipoProblema.findMany({ orderBy: { id: 'asc' } });
  }

  async buscar(id: number) {
    const tipo = await this.prisma.tipoProblema.findUnique({ where: { id } });
    if (!tipo) {
      throw new NotFoundException(`Tipo de problema ${id} não encontrado`);
    }
    return tipo;
  }

  async atualizar(id: number, dto: AtualizarTipoProblemaDto) {
    const tipo = await this.buscar(id);
    if (dto.nome !== undefined && dto.nome !== tipo.nome) {
      await this.verificarNome(dto.nome);
    }
    return this.prisma.tipoProblema.update({ where: { id }, data: dto });
  }

  async remover(id: number) {
    await this.buscar(id);
    const chamados = await this.prisma.chamado.count({
      where: { tipoProblemaId: id },
    });
    if (chamados > 0) {
      throw new ConflictException(
        'Tipo de problema já usado em chamados não pode ser removido, apenas desativado',
      );
    }
    return this.prisma.tipoProblema.delete({ where: { id } });
  }

  private async verificarNome(nome: string) {
    const existente = await this.prisma.tipoProblema.findUnique({
      where: { nome },
    });
    if (existente) throw new ConflictException('Nome de tipo já cadastrado');
  }
}
