import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { ProdutoModule } from './modules/produto/produto.module';
// import { AdminModule } from './admin/admin.module';
import { FuncionarioModule } from './modules/funcionario/funcionario.module';
import { CategoriaProdutoModule } from './modules/categoria-produto/categoria-produto.module';
import { DicionarioModule } from './modules/dicionario/dicionario.module';
import { EstatisticaProdutoModule } from './modules/estatistica-produto/estatistica-produto.module';
import { VendaModule } from './modules/venda/venda.module';
import { FluxoCaixaModule } from './modules/fluxo-caixa/fluxo-caixa.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProdutoModule,
    EmpresaModule,
    AuthModule,
    // AdminModule,
    FuncionarioModule,
    CategoriaProdutoModule,
    DicionarioModule,
    EstatisticaProdutoModule,
    VendaModule,
    FluxoCaixaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
