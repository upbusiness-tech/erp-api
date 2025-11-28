import { forwardRef, Module } from '@nestjs/common';
import { FuncionarioController } from './funcionario.controller';
import { FuncionarioService } from './funcionario.service';
import { VendaModule } from '../venda/venda.module';

@Module({
  controllers: [FuncionarioController],
  providers: [FuncionarioService],
  imports: [forwardRef(() => VendaModule)]
})
export class FuncionarioModule {}
