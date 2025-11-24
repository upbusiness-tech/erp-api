import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ProdutoDTO } from './produto.dto';
import { ProdutoService } from './produto.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/decorator/user.decorator';

@Controller('produto')
@UseGuards(AuthGuard)
export class ProdutoController {

  constructor(private readonly produtoService: ProdutoService) { }

  private id_categoriaTemplate: string = '5xwD3FVjBPh6ak9dAR0a';
  private categoriaTemplate: string = 'DinDin';

  @Post()
  criar(@Body() produto: ProdutoDTO, @User('uid') uid: string) {
    try {
      // temporariamente passando empresa e categorias fixas
      produto.categoria_reference = this.id_categoriaTemplate;
      produto.categoria = this.categoriaTemplate;

      return this.produtoService.criar(uid, produto)
    } catch (error) {
      throw new HttpException(`Erro ao criar produto ${error}`, HttpStatus.BAD_REQUEST)
    }
  }

  @Get()
  listarTodos(@User('uid') uid: string) {
    try {
      return this.produtoService.listarTodos(uid);
    } catch (error) {
      throw new HttpException(`Erro ao buscar por produtos da empresa ${error}`, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('/deletar/:id')
  remover(@Param('id') id: string) {
    try {
      this.produtoService.remover(id)
    } catch (error) {
      throw new HttpException(`Erro ao deletar produto ${error}`, HttpStatus.BAD_REQUEST)
    }
  }

  @Get('/encontrar/:id')
  encontrarPorId(@Param('id') id: string) {
    try {
      return this.produtoService.encontrarPorId(id);
    } catch (error) {
      throw new HttpException(`Erro ao buscar produto por ID ${error}`, HttpStatus.BAD_REQUEST)
    }
  }

  @Put('/atualizar/:id')
  atualizarPorId(@Param('id') id: string, @Body() produtoBody: Partial<ProdutoDTO>) {
    try {
      const produtoParaAtualizar: Omit<Partial<ProdutoDTO>, 'id_produto' | 'empresa_reference' | 'data_criacao'> = { ...produtoBody };
      return this.produtoService.atualizarPorId(id, produtoParaAtualizar);
    } catch (error) {
      throw new HttpException(`Erro ao atualizar produto por ID ${error}`, HttpStatus.BAD_REQUEST)
    }
  }

  @Get('/paginar')
  paginarProdutos(
    @User('uid') uid: string,
    @Query('limite') limite: number,
    // @Query('categoria') categoria: string,
    @Query('ordem') ordem: string,
    @Query('cursor') cursor: string,
    @Query('cursorPrev') cursorPrev: string,
  ) {
    try {
      const resultado = this.produtoService.paginarProdutos({
        id_empresa: uid,
        limite: Number(limite),
        // categoria: categoria,
        ordem: ordem,
        cursor: cursor,
        cursorPrev: cursorPrev,
      });
      return resultado;
    } catch (error) {
      throw new HttpException(`Erro ao paginar produtos ${error}`, HttpStatus.BAD_REQUEST)
    }
  }

}
