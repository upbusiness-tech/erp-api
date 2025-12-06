import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { FluxoCaixaService } from './fluxo-caixa.service';
import { User } from 'src/decorator/user.decorator';
import { FluxoCaixaDTO, SangriaOuReposicao } from './fluxo-caixa.dto';
import { idToDocumentRef } from 'src/util/firestore.util';
import { COLLECTIONS } from 'src/enum/firestore.enum';

@Controller('fluxo-caixa')
@UseGuards(AuthGuard)
export class FluxoCaixaController {

  constructor(private readonly fluxoService: FluxoCaixaService) {}

  @Post('')
  criar(@User('uid') uid: string, @Body() fluxoBody: Partial<FluxoCaixaDTO>) {
    return this.fluxoService.criar(uid, fluxoBody)
  }

  @HttpCode(HttpStatus.OK)
  @Get('/aberto')
  encontrarFluxoCaixaAberto(@User('uid') uid: string) {
    const resultado = this.fluxoService.encontrar("status", "==", true, uid)
    if (resultado === undefined) throw new HttpException(`Não há fluxo aberto para a empresa de ID ${uid}`, HttpStatus.BAD_REQUEST)
    return resultado
  }
  
  @Get('/listar')
  listarTodos(@User('uid') uid: string) {
    return this.fluxoService.listarTodos(uid)
  }

  @HttpCode(HttpStatus.OK)
  @Put('/fechar/:id')
  fecharFluxoCaixa(@Param('id') id: string, @Body() fluxPayload: Partial<FluxoCaixaDTO>) {
    this.fluxoService.atualizar(id, {
      ...fluxPayload,
      funcionario_responsavel_fechamento: idToDocumentRef(fluxPayload.funcionario_responsavel_fechamento as string, COLLECTIONS.FUNCIONARIOS),
      status: false,
      data_fechamento: new Date()
    })
  }

  @HttpCode(HttpStatus.CREATED)
  @Put('/sangria/:id')
  adicionarSangria(@Param('id') id: string, @Body() sangriaPayload: Partial<SangriaOuReposicao>) {
    this.fluxoService.adicionarSangriaOuReposicao(id, sangriaPayload, 'sangria');
  }

  @HttpCode(HttpStatus.CREATED)
  @Put('/reposicao/:id')
  adicionarReposicao(@Param('id') id: string, @Body() sangriaPayload: Partial<SangriaOuReposicao>) {
    this.fluxoService.adicionarSangriaOuReposicao(id, sangriaPayload, 'reposicao_troco');    
  }

}
