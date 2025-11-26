import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DocumentReference } from 'firebase-admin/firestore';
import { db } from 'src/config/firebase';
import { COLLECTIONS } from 'src/enum/firestore.enum';
import { EstatisticaProdutoService } from 'src/modules/estatistica-produto/estatistica-produto.service';
import { ProdutoDTO } from 'src/modules/produto/produto.dto';
import { ProdutoService } from 'src/modules/produto/produto.service';
import { idToDocumentRef } from 'src/util/firestore.util';
import { ItemVenda, VendaDTO } from './venda.dto';

@Injectable()
export class VendaService {

  private COLLECTION_NAME: string

  constructor(
    private readonly produtoService: ProdutoService,
    private readonly estatisticaProdutoService: EstatisticaProdutoService
  ) {
    this.COLLECTION_NAME = COLLECTIONS.VENDAS,
      this.setup()
  }

  private setup() {
    return db.collection(this.COLLECTION_NAME);
  }

  public async criar(id_empresa: string, venda: Partial<VendaDTO>) {
    // antes de tudo, necessário verificar se há um fluxo de caixa aberto para a empresa realizar uma venda
    // ........


    // validando campos obrigatórios na venda
    if (
      venda.pagamentos === undefined ||
      venda.troco === undefined ||
      venda.status === undefined ||
      venda.tipo === undefined
    ) throw new HttpException(`Campos obrigatórios faltando na venda`, HttpStatus.BAD_REQUEST);
    

    const empresaRef = idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS);
    const funcionariosResponsaveisRef: DocumentReference[] = venda.funcionarios_responsaveis?.map((id_funcionario) => {
      return idToDocumentRef(id_funcionario, COLLECTIONS.FUNCIONARIOS);
    }) ?? []
    const operadorCaixaRef = idToDocumentRef(venda.operador_caixa as string, COLLECTIONS.FUNCIONARIOS);

    const itensVendaParaSalvar: ItemVenda[] = venda.itens_venda
      ? await Promise.all(venda.itens_venda.map(async (item) => {
        const itemRefatorado: ItemVenda = {
          ...item,
          produto_reference: idToDocumentRef(item.id_produto as string, COLLECTIONS.PRODUTOS),
          produto_objeto: await this.produtoService.encontrarPorId(item.id_produto as string) as ProdutoDTO
        }
        return itemRefatorado
      }))
      : [];

    const vendaParaSalvar: VendaDTO = {
      ...venda,
      pagamentos: venda.pagamentos,
      troco: venda.troco,
      status: venda.status,
      tipo: venda.tipo,
      empresa_reference: empresaRef,
      funcionarios_responsaveis: funcionariosResponsaveisRef,
      operador_caixa: operadorCaixaRef,
      itens_venda: itensVendaParaSalvar,
      codigo: Math.random().toString(), // temporario
      data_venda: new Date()
    }
  
    await db.runTransaction(async (transaction) => {

      // salvando a transação criada
      const novaVendaRef = this.setup().doc()
      transaction.set(novaVendaRef, vendaParaSalvar);

      // registrando estatistica do produto 
      vendaParaSalvar.itens_venda.map(async (item) => {
        await this.estatisticaProdutoService.adicionar_EmTransacao(transaction, id_empresa, item.id_produto!, {
          preco_atual: item.produto_objeto.preco_venda,
          quantidade_vendida: item.quantidade
        })
      })

      // por fim, registrando os valores que entraram no documento de fluxo de caixa
      // .....
      
    })
  }

}
