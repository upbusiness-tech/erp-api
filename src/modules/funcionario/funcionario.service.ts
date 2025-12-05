import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { db } from 'src/config/firebase';
import { COLLECTIONS } from 'src/enum/firestore.enum';
import { criptografarSenha, verificarSenha } from 'src/util/bcrypt.util';
import { idToDocumentRef } from 'src/util/firestore.util';
import { FuncionarioDTO, FuncionarioRequestAuthDTO, ListaFuncionarioDTO } from './funcionario.dto';
import { VendaService } from '../venda/venda.service';

@Injectable()
export class FuncionarioService {

  private COLLECTION_NAME: string

  constructor(private readonly vendaService: VendaService) {
    this.COLLECTION_NAME = COLLECTIONS.FUNCIONARIOS,
      this.setup();
  }

  private setup() {
    return db.collection(this.COLLECTION_NAME);
  }

  private docToObject(id: string, data: FirebaseFirestore.DocumentData): FuncionarioDTO {
    return {
      id: id,
      empresa_reference: data.empresa_reference.id || '',
      nome: data.nome,
      permissao: data.permissao,
      senha: data.senha,
      tipo: data.tipo,
      ativo: data.ativo,
      ultimo_acesso: data.ultimo_acesso?.toDate() || '',
      data_criacao: data.data_criacao?.toDate(),
    }
  }

  public async autenticar(id_empresa: string, payload: FuncionarioRequestAuthDTO) {
    // validações
    if (payload.nome === undefined || payload.nome === '') throw new HttpException(`Necessário preencher nome.`, HttpStatus.BAD_REQUEST)
    if (payload.senha === undefined || payload.senha === '') throw new HttpException(`Necessário preencher senha.`, HttpStatus.BAD_REQUEST)
    
    let query = this.setup().
      where('empresa_reference', '==', idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS)).
      where('nome', '==', payload.nome);

    if ((await query.get()).empty) throw new NotFoundException(`Funcionário de nome ${payload.nome} não foi encontrado`)

    const funcionarioEncontrado = this.docToObject((await query.get()).docs[0].id, (await query.get()).docs[0].data());
    
    if (!verificarSenha(payload.senha, funcionarioEncontrado.senha)) throw new HttpException('', HttpStatus.FORBIDDEN)

    return HttpStatus.ACCEPTED
  }

  public async criar(id_empresa: string, funcionario: FuncionarioDTO): Promise<FuncionarioDTO> {
    const funcionarioParaSalvar: FuncionarioDTO = {
      ...funcionario,
      ativo: true,
      empresa_reference: idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS),
      senha: criptografarSenha(funcionario.senha),
      data_criacao: new Date()
    }

    const ref = await this.setup().add(funcionarioParaSalvar)
    const doc = await ref.get()
    return this.docToObject(doc.id, doc.data()!)
  }

  public async encontrarPorId(id_funcionario: string): Promise<FuncionarioDTO> {
    const doc = await this.setup().doc(id_funcionario).get();
    if (!doc.exists) throw new HttpException("Funcionário não encontrado", HttpStatus.BAD_REQUEST);
    return this.docToObject(doc.id, doc.data()!);
  }

  public async atualizar(id_funcionario: string, payload: Partial<FuncionarioDTO>) {
    const funcionarioRef = this.setup().doc(id_funcionario);
    const funcionarioDoc = await funcionarioRef.get();

    if (!funcionarioDoc.exists) throw new Error("Funcionário não encontrado");

    await funcionarioRef.update({
      ...payload
    });
  }

  public async listarTodos(id_empresa: string): Promise<ListaFuncionarioDTO> {
    let query = await this.setup().where('empresa_reference', '==', idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS)).get();
    if (!query.empty) {
      return {
        total: query.docs.length,
        funcionarios: query.docs.map(doc => this.docToObject(doc.id, doc.data()))
      }
    }
    return {
      total: 0,
      funcionarios: []
    }
  }

  public async remover(id_funcionario: string) {
    await this.setup().doc(id_funcionario).delete();
  }

  public async encontrarVendas(id_empresa: string, id_funcionario: string) {
    return await this.vendaService.enontrarVendasPorIdFuncionario(id_empresa, id_funcionario);    
  }


}
