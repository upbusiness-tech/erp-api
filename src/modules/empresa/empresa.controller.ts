import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { EmpresaDTO } from './empresa.dto';
import { User } from 'src/decorator/user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('empresa')
@UseGuards(AuthGuard)
export class EmpresaController {
  
  constructor(private readonly empresaService: EmpresaService) { }
  
  @Get() // por enquanto o id da empresa será passado por param, posteriormente vai ser pego pelo token
  encontrarEmpresaPorId(@User('uid') uid: string, @User('email') email: string) {
    return this.empresaService.encontrarPorId(uid);
  }

  @Put('/atualizar')
  atualizarPorId(@User('uid') uid: string, @Body() empresaBody: Partial<EmpresaDTO>) {
    // tirando os campos que nao permitidos passar por alterações
    const camposNaoPermitidos = ['id_empresa', 'empresa_reference', 'data_criacao', 'email', 'plano', 'uuid_auth'];
    for (const campo of camposNaoPermitidos) {
      if (campo in empresaBody) delete (empresaBody as any)[campo];
    }

    this.empresaService.atualizar(uid, empresaBody);
  }

}
