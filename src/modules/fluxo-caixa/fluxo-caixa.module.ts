import { Module } from '@nestjs/common';
import { FluxoCaixaController } from './fluxo-caixa.controller';
import { FluxoCaixaService } from './fluxo-caixa.service';

@Module({
  controllers: [FluxoCaixaController],
  providers: [FluxoCaixaService],
  exports: [FluxoCaixaService]
})
export class FluxoCaixaModule {}
