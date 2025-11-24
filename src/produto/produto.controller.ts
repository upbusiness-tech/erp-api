import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ProdutoDTO } from './produto.dto';
import { ProdutoService } from './produto.service';

@Controller('produto')
export class ProdutoController {

  constructor(private readonly produtoService: ProdutoService) { }

  private id_empresaTemplate: string = 'IEtFbUYnrImdpmoHliTy'
  private id_categoriaTemplate: string = 'zeUZr2futnU6wxonVv1r';
  private categoriaTemplate: string = 'Dindin gourmet';

  @Post()
  criar(@Body() produto: ProdutoDTO) {
    try {
      // temporariamente passando empresa e categorias fixas
      produto.empresa_reference = this.id_empresaTemplate;
      produto.categoria_reference = this.id_categoriaTemplate;
      produto.categoria = this.categoriaTemplate;

      return this.produtoService.criar(produto)
    } catch (error) {
      throw new HttpException(`Erro ao criar produto ${error}`, HttpStatus.BAD_REQUEST)
    }
  }

  @Get()
  listarTodos() {
    try {
      return this.produtoService.listarTodos(this.id_empresaTemplate);
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

  @Get('/paginar/:idEmpresa')
  paginarProdutos(
    @Param('idEmpresa') idEmpresa: string,
    @Query('limite') limite: number,
    // @Query('categoria') categoria: string,
    @Query('ordem') ordem: string,
    @Query('cursor') cursor: string,
    @Query('cursorPrev') cursorPrev: string,
  ) {
    try {
      const resultado = this.produtoService.paginarProdutos({
        id_empresa: idEmpresa,
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
