import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Prioridade, Situacao } from '../generated/prisma/enums.js';
import { ChamadosService } from './chamados.service.js';
import { CriarChamadoDto } from './dto/criar-chamado.dto.js';
import { DesignarTecnicoDto } from './dto/designar-tecnico.dto.js';
import { MudarSituacaoDto } from './dto/mudar-situacao.dto.js';
import { CriarComentarioDto } from './dto/criar-comentario.dto.js';

@Controller('chamados')
export class ChamadosController {
  constructor(private readonly chamadosService: ChamadosService) {}

  @Post()
  criar(@Body() dto: CriarChamadoDto) {
    return this.chamadosService.criar(dto);
  }

  @Get()
  listar(
    @Query('situacao', new ParseEnumPipe(Situacao, { optional: true }))
    situacao?: Situacao,
    @Query('prioridade', new ParseEnumPipe(Prioridade, { optional: true }))
    prioridade?: Prioridade,
    @Query('tipoProblemaId', new ParseIntPipe({ optional: true }))
    tipoProblemaId?: number,
    @Query('tecnicoId', new ParseIntPipe({ optional: true }))
    tecnicoId?: number,
  ) {
    return this.chamadosService.listar(
      situacao,
      prioridade,
      tipoProblemaId,
      tecnicoId,
    );
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.buscar(id);
  }

  @Patch(':id/tecnico')
  designarTecnico(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DesignarTecnicoDto,
  ) {
    return this.chamadosService.designarTecnico(id, dto);
  }

  @Patch(':id/situacao')
  mudarSituacao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MudarSituacaoDto,
  ) {
    return this.chamadosService.mudarSituacao(id, dto);
  }

  @Post(':id/comentarios')
  comentar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CriarComentarioDto,
  ) {
    return this.chamadosService.comentar(id, dto);
  }

  @Get(':id/comentarios')
  listarComentarios(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.listarComentarios(id);
  }
}
