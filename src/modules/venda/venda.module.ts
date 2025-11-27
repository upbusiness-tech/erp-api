import { forwardRef, Module } from '@nestjs/common';
import { VendaController } from './venda.controller';
import { VendaService } from './venda.service';
import { ProdutoModule } from 'src/modules/produto/produto.module';
import { EstatisticaProdutoModule } from 'src/modules/estatistica-produto/estatistica-produto.module';
import { FluxoCaixaModule } from '../fluxo-caixa/fluxo-caixa.module';

@Module({
  controllers: [VendaController],
  providers: [VendaService],
  imports: [
    forwardRef(() => ProdutoModule),
    forwardRef(() => EstatisticaProdutoModule),
    forwardRef(() => FluxoCaixaModule)
  ]
})
export class VendaModule {}
