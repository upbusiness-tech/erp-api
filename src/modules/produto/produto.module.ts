import { forwardRef, Module } from '@nestjs/common';
import { ProdutoController } from './produto.controller';
import { ProdutoService } from './produto.service';
import { DicionarioModule } from '../dicionario/dicionario.module';

@Module({
  controllers: [ProdutoController],
  providers: [ProdutoService],
  imports: [forwardRef(() => DicionarioModule)],
  exports: [ProdutoService]
})
export class ProdutoModule {}
