import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DocumentReference } from 'firebase-admin/firestore';
import { db } from 'src/config/firebase';
import { COLLECTIONS } from 'src/enum/firestore.enum';
import { EstatisticaProdutoService } from 'src/modules/estatistica-produto/estatistica-produto.service';
import { ProdutoService } from 'src/modules/produto/produto.service';
import { idToDocumentRef } from 'src/util/firestore.util';
import { calcularTroco } from 'src/util/venda.util';
import { FluxoCaixaDTO } from '../fluxo-caixa/fluxo-caixa.dto';
import { FluxoCaixaService } from '../fluxo-caixa/fluxo-caixa.service';
import { FuncionarioEstatisticasVendas } from '../funcionario/funcionario.dto';
import { ItemVenda, VendaDTO } from './venda.dto';

@Injectable()
export class VendaService {

  private COLLECTION_NAME: string

  constructor(
    private readonly produtoService: ProdutoService,
    private readonly estatisticaProdutoService: EstatisticaProdutoService,
    private readonly fluxoService: FluxoCaixaService
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
    const fluxoAtivo = await this.fluxoService.encontrar("status", "==", true, id_empresa)
    if (fluxoAtivo === undefined) throw Error('Sem caixa aberto para realizar venda')

    // validando campos obrigatórios na venda
    if (
      venda.pagamentos === undefined ||
      venda.status === undefined ||
      venda.tipo === undefined
    ) throw new HttpException(`Campos obrigatórios faltando na venda`, HttpStatus.BAD_REQUEST);


    const empresaRef = idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS);
    const funcionariosResponsaveisRef: DocumentReference[] = venda.funcionarios_responsaveis?.map((id_funcionario) => {
      return idToDocumentRef(id_funcionario, COLLECTIONS.FUNCIONARIOS);
    }) ?? []
    const operadorCaixaRef = idToDocumentRef(venda.operador_caixa as string, COLLECTIONS.FUNCIONARIOS);

    const itensVendaParaSalvar: ItemVenda[] | undefined = venda.itens_venda?.map((item) => {
      const itemAtualizado: ItemVenda = {
        ...item,
        produto_reference: idToDocumentRef(item.produto_reference as string, COLLECTIONS.PRODUTOS)
      }
      return itemAtualizado
    })

    if (itensVendaParaSalvar === undefined) throw new HttpException('Erro ao definir os itens da venda', HttpStatus.BAD_REQUEST)

    const vendaParaSalvar: VendaDTO = {
      ...venda,
      pagamentos: venda.pagamentos,
      status: venda.status,
      tipo: venda.tipo,
      empresa_reference: empresaRef,
      funcionarios_responsaveis: funcionariosResponsaveisRef,
      operador_caixa: operadorCaixaRef,
      itens_venda: itensVendaParaSalvar,
      codigo: Math.random().toString(), // temporario
      data_venda: new Date()
    }

    // executando a transação nas estatisticas, fluxo e venda
    await db.runTransaction(async (transaction) => {
      // atualizando estatistica do produto 
      vendaParaSalvar.itens_venda?.map(async (item) => {
        if (typeof item.produto_reference != 'string') {
          await this.estatisticaProdutoService.adicionar_EmTransacao(transaction, id_empresa, item.produto_reference?.id!, {
            preco_atual: item.produto_objeto.preco_venda,
            quantidade_vendida: item.quantidade
          })
          // atualizando o estoque do produto
          await this.produtoService.atualizarEstoque_EmTransacao(transaction, item.produto_reference?.id!, item.quantidade, 'MENOS')
        }
      })

      // salvando a venda criada
      const novaVendaRef = this.setup().doc()
      transaction.set(novaVendaRef, vendaParaSalvar);

      // // registrando estatistica do produto 
      // vendaParaSalvar.itens_venda.map(async (item) => {
      //   await this.estatisticaProdutoService.adicionar_EmTransacao(transaction, id_empresa, item.id_produto!, {
      //     preco_atual: item.produto_objeto.preco_venda,
      //     quantidade_vendida: item.quantidade
      //   })
      // })

      // por fim, registrando os valores que entraram no fluxo
      const atualizacoesParaFluxo: Partial<FluxoCaixaDTO> = {
        entradas: venda.pagamentos,
        troco: calcularTroco(venda)
      }
      await this.fluxoService.atualizar_EmTransacao(transaction, id_empresa, atualizacoesParaFluxo);
    })
  }

  public async enontrarVendasPorIdFuncionario(id_empresa: string, id_funcionario: string) {
    let querySnap = await this.setup().where("empresa_reference", "==", idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS))
      .where("funcionarios_responsaveis", "array-contains", idToDocumentRef(id_funcionario, COLLECTIONS.FUNCIONARIOS))
    .get()

    if (querySnap.empty) {
      return {
        total_vendas: 0
      } as FuncionarioEstatisticasVendas
    }

    // const vendasEncontradas: VendaDTO[] = querySnap.docs.map((venda) => {
    //   return 
    // })

    return {
      total_vendas: querySnap.size,
      vendas: querySnap.docs
    } as FuncionarioEstatisticasVendas

  }

}
