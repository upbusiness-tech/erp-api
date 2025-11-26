import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/decorator/user.decorator';
import { VendaDTO } from './venda.dto';
import { VendaService } from './venda.service';

@Controller('venda')
@UseGuards(AuthGuard)
export class VendaController {

  constructor(private readonly vendaService: VendaService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  criar(@User('uid') uid: string, @Body() vendaBody: Partial<VendaDTO>) {
    return this.vendaService.criar(uid, vendaBody)
  }

}
