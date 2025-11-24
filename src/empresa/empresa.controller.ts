import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { EmpresaDTO } from './empresa.dto';

@Controller('empresa')
export class EmpresaController {

  constructor(private readonly empresaService: EmpresaService) { }

  @Get('/:id') // por enquanto o id da empresa será passado por param, posteriormente vai ser pego pelo token
  encontrarEmpresaPorId(@Param('id') id: string) {
    return this.empresaService.encontrarPorId(id);
  }

  @Put('/:id')
  atualizarPorId(@Param('id') id: string, @Body() empresaBody: Partial<EmpresaDTO>) {
    // tirando os campos que nao permitidos passar por alterações
    const camposNaoPermitidos = ['id_empresa', 'empresa_reference', 'data_criacao', 'email', 'plano', 'uuid_auth'];
    for (const campo of camposNaoPermitidos) {
      if (campo in empresaBody) delete (empresaBody as any)[campo];
    }

    this.empresaService.atualizar(id, empresaBody);
  }

}
