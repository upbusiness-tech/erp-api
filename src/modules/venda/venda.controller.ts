import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/decorator/user.decorator';
import { VendaDTO } from './venda.dto';
import { VendaService } from './venda.service';

@Controller('venda')
@UseGuards(AuthGuard)
export class VendaController {

  constructor(private readonly vendaService: VendaService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  criar(@User('uid') uid: string, @Body() vendaBody: Partial<VendaDTO>) {
    try {
      return this.vendaService.criar(uid, vendaBody)
    } catch (error) {
      throw new HttpException(`Erro ao buscar produto por ID ${error}`, HttpStatus.BAD_REQUEST)
    }
  }

  @Get('/listar/fluxo-atual')
  encontrarPorFluxoAtual(@User('uid') uid: string) {
    return this.vendaService.encontrarPorFluxoAtual(uid);
  }

  @Get('/listar/fluxo/:id')
  encontrarPorFluxo(@User('uid') uid: string, @Param('id') id_fluxo: string) {
    return this.vendaService.encontrarPorIdFluxo(uid, id_fluxo);
  }

}
