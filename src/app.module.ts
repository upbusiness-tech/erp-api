import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { ProdutoModule } from './modules/produto/produto.module';
import { AdminModule } from './admin/admin.module';
import { FuncionarioModule } from './modules/funcionario/funcionario.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProdutoModule,
    EmpresaModule,
    AuthModule,
    AdminModule,
    FuncionarioModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
