import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/decorator/user.decorator';
import { CategoriaProdutoService } from './categoria-produto.service';

@Controller('categoria-produto')
@UseGuards(AuthGuard)
export class CategoriaProdutoController {

  constructor(private readonly categoriaProdutoService: CategoriaProdutoService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  criar(@Body('nome') nome: string, @User('uid') uid: string) {
    return this.categoriaProdutoService.criar(uid, nome);
  }

  @Get('/listar')
  listarTodos(@User('uid') uid: string) {
    return this.categoriaProdutoService.listarTodos(uid);
  }
  
  @Get('/:id')
  encontrar(@Param('id') id: string) {
    return this.categoriaProdutoService.encontrarPorId(id)
  }

  @Delete('/:id')
  remover(@Param('id') id: string){
    try {
      this.categoriaProdutoService.remover(id);
    } catch (error) {
      throw new HttpException(`Erro ao remover categoria e produtos associados ${error}`, HttpStatus.BAD_REQUEST)
    }
  }

}
