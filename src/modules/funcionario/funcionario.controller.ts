import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/decorator/user.decorator';
import { FuncionarioDTO, FuncionarioRequestAuthDTO } from './funcionario.dto';
import { FuncionarioService } from './funcionario.service';

@Controller('funcionario')
@UseGuards(AuthGuard)
export class FuncionarioController {

  constructor(private readonly funcionarioService: FuncionarioService) { }

  @HttpCode(HttpStatus.CREATED)
  @Post('/cadastrar')
  criar(@User('uid') uid: string, @Body() funcionarioBody: FuncionarioDTO) {
    return this.funcionarioService.criar(uid, funcionarioBody);
  }

  @Get()
  listarFuncionarios(@User('uid') uid: string) {
    return this.funcionarioService.listarTodos(uid);
  }

  @Get('/:id')
  encontrarPorId(@Param('id') id: string) {
    return this.funcionarioService.encontrarPorId(id)
  }

  @Put('/atualizar/:id')
  atualizarPorId(@Param('id') id: string, @Body() funcionarioBody: Partial<FuncionarioDTO>) {
    const funcionarioParaAtualizar: Omit<Partial<FuncionarioDTO>, 'id_usuario' | 'empresa_reference' | 'data_criacao' | 'id_empresa'> = {
      ...funcionarioBody
    };

    return this.funcionarioService.atualizar(id, funcionarioParaAtualizar)
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/autenticar')
  autenticar(@Body() funcionarioAuthDTO: FuncionarioRequestAuthDTO, @User('uid') uid: string) {
    return this.funcionarioService.autenticar(uid, funcionarioAuthDTO);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/deletar/:id')
  remover(@Param('id') id: string) {
    this.funcionarioService.remover(id)
  }

}
