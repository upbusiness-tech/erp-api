import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from 'src/decorator/user.decorator';
import { DicionarioService } from './dicionario.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('dicionario')
@UseGuards(AuthGuard)
export class DicionarioController {

  constructor(private readonly dicionarioService: DicionarioService){}

  @Get()
  encontrar(@User('uid') uid: string){
    return this.dicionarioService.encontrarPorId(uid);
  }

}
