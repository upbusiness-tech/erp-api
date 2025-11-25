import { forwardRef, Module } from '@nestjs/common';
import { CategoriaProdutoController } from './categoria-produto.controller';
import { CategoriaProdutoService } from './categoria-produto.service';
import { ProdutoModule } from '../produto/produto.module';

@Module({
  controllers: [CategoriaProdutoController],
  providers: [CategoriaProdutoService],
  imports: [forwardRef(() => ProdutoModule)]
})
export class CategoriaProdutoModule { }
