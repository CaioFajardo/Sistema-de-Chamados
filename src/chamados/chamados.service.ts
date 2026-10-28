import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prioridade, Situacao } from '../generated/prisma/enums.js';
import { CriarChamadoDto } from './dto/criar-chamado.dto.js';
import { DesignarTecnicoDto } from './dto/designar-tecnico.dto.js';
import { MudarSituacaoDto } from './dto/mudar-situacao.dto.js';
import { CriarComentarioDto } from './dto/criar-comentario.dto.js';

const LIMITE_EM_ATENDIMENTO = 5;

const TRANSICOES: Record<Situacao, Situacao[]> = {
  ABERTO: ['CANCELADO'],
  EM_ATENDIMENTO: ['RESOLVIDO', 'CANCELADO'],
  RESOLVIDO: ['FECHADO', 'EM_ATENDIMENTO'],
  FECHADO: [],
  CANCELADO: [],
};

@Injectable()
export class ChamadosService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarChamadoDto) {
    const solicitante = await this.prisma.pessoa.findUnique({
      where: { id: dto.solicitanteId },
    });
    if (!solicitante) {
      throw new NotFoundException(`Pessoa ${dto.solicitanteId} não encontrada`);
    }
    if (solicitante.tipo !== 'SOLICITANTE' || !solicitante.ativo) {
      throw new BadRequestException('O chamado deve ser aberto por um solicitante ativo');
    }

    const tipo = await this.prisma.tipoProblema.findUnique({
      where: { id: dto.tipoProblemaId },
    });
    if (!tipo) {
      throw new NotFoundException(
        `Tipo de problema ${dto.tipoProblemaId} não encontrado`,
      );
    }
    if (!tipo.ativo) {
      throw new BadRequestException('Tipo de problema desativado');
    }

    return this.prisma.chamado.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        prioridade: dto.prioridade,
        solicitanteId: dto.solicitanteId,
        tipoProblemaId: dto.tipoProblemaId,
      },
    });
  }

  listar(
    situacao?: Situacao,
    prioridade?: Prioridade,
    tipoProblemaId?: number,
    tecnicoId?: number,
  ) {
    return this.prisma.chamado.findMany({
      where: { situacao, prioridade, tipoProblemaId, tecnicoId },
      orderBy: { id: 'asc' },
    });
  }

  async buscar(id: number) {
    const chamado = await this.prisma.chamado.findUnique({
      where: { id },
      include: { comentarios: { orderBy: { id: 'asc' } } },
    });
    if (!chamado) throw new NotFoundException(`Chamado ${id} não encontrado`);
    return chamado;
  }

  async designarTecnico(id: number, dto: DesignarTecnicoDto) {
    const chamado = await this.buscar(id);
    this.verificarNaoEncerrado(chamado.situacao);

    const tecnico = await this.prisma.pessoa.findUnique({
      where: { id: dto.tecnicoId },
    });
    if (!tecnico) {
      throw new NotFoundException(`Pessoa ${dto.tecnicoId} não encontrada`);
    }
    if (tecnico.tipo !== 'TECNICO' || !tecnico.ativo) {
      throw new BadRequestException('O responsável deve ser um técnico ativo');
    }
    if (tecnico.id === chamado.solicitanteId) {
      throw new BadRequestException('Ninguém pode atender o próprio chamado');
    }

    // Chamado aberto passa a ser atendido; resolvido continua resolvido.
    const situacao =
      chamado.situacao === 'ABERTO' ? 'EM_ATENDIMENTO' : chamado.situacao;
    if (situacao === 'EM_ATENDIMENTO') {
      await this.verificarLimite(tecnico.id, id);
    }

    return this.prisma.chamado.update({
      where: { id },
      data: { tecnicoId: tecnico.id, situacao },
    });
  }

  async mudarSituacao(id: number, dto: MudarSituacaoDto) {
    const chamado = await this.buscar(id);
    this.verificarNaoEncerrado(chamado.situacao);

    if (chamado.situacao === 'ABERTO' && dto.situacao === 'EM_ATENDIMENTO') {
      throw new BadRequestException(
        'Para iniciar o atendimento, designe um técnico ao chamado',
      );
    }
    if (!TRANSICOES[chamado.situacao].includes(dto.situacao)) {
      throw new BadRequestException(
        `Não é possível mudar de ${chamado.situacao} para ${dto.situacao}`,
      );
    }

    if (dto.situacao === 'EM_ATENDIMENTO') {
      if (chamado.tecnicoId === null) {
        throw new BadRequestException('O chamado não tem técnico designado');
      }
      const tecnico = await this.prisma.pessoa.findUnique({
        where: { id: chamado.tecnicoId },
      });
      if (!tecnico?.ativo) {
        throw new BadRequestException('O técnico responsável está inativo');
      }
      await this.verificarLimite(chamado.tecnicoId, id);
    }

    return this.prisma.chamado.update({
      where: { id },
      data: {
        situacao: dto.situacao,
        resolvidoEm: dto.situacao === 'RESOLVIDO' ? new Date() : undefined,
      },
    });
  }

  async comentar(id: number, dto: CriarComentarioDto) {
    const chamado = await this.buscar(id);
    this.verificarNaoEncerrado(chamado.situacao);

    const autor = await this.prisma.pessoa.findUnique({
      where: { id: dto.autorId },
    });
    if (!autor) {
      throw new NotFoundException(`Pessoa ${dto.autorId} não encontrada`);
    }
    if (!autor.ativo) {
      throw new BadRequestException('Pessoa inativa não pode comentar');
    }
    if (autor.id !== chamado.solicitanteId && autor.id !== chamado.tecnicoId) {
      throw new ForbiddenException(
        'Só o solicitante e o técnico responsável podem comentar',
      );
    }
    if (dto.texto.trim() === '') {
      throw new BadRequestException('O comentário não pode ser vazio');
    }

    return this.prisma.comentario.create({
      data: { texto: dto.texto, chamadoId: id, autorId: autor.id },
    });
  }

  async listarComentarios(id: number) {
    await this.buscar(id);
    return this.prisma.comentario.findMany({
      where: { chamadoId: id },
      orderBy: { id: 'asc' },
    });
  }

  private verificarNaoEncerrado(situacao: Situacao) {
    if (situacao === 'FECHADO' || situacao === 'CANCELADO') {
      throw new BadRequestException('Chamado encerrado não pode ser alterado');
    }
  }

  private async verificarLimite(tecnicoId: number, chamadoId: number) {
    const emAtendimento = await this.prisma.chamado.count({
      where: {
        tecnicoId,
        situacao: 'EM_ATENDIMENTO',
        id: { not: chamadoId },
      },
    });
    if (emAtendimento >= LIMITE_EM_ATENDIMENTO) {
      throw new BadRequestException(
        `O técnico já tem ${LIMITE_EM_ATENDIMENTO} chamados em atendimento`,
      );
    }
  }
}
