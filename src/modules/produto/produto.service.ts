import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ProdutoDTO } from './produto.dto';
import { db } from 'src/config/firebase';
import { COLLECTIONS } from 'src/enum/firestore.enum';
import { docToObject, idToDocumentRef } from 'src/util/firestore.util';
import { DicionarioService } from '../dicionario/dicionario.service';
import admin from "firebase-admin";

@Injectable()
export class ProdutoService {

  private COLLECTION_NAME: string

  constructor(private readonly dicionarioService: DicionarioService) {
    this.COLLECTION_NAME = COLLECTIONS.PRODUTOS,
      this.setup()
  }

  private docToObject(id: string, data: FirebaseFirestore.DocumentData): ProdutoDTO {
    return {
      id: id,
      categoria_reference: data.categoria_reference?.id || '',
      empresa_reference: data.empresa_reference.id || '',
      nome: data.nome,
      preco_venda: data.preco_venda,
      preco_compra: data.preco_compra,
      codigo: data.codigo,
      uni_medida: data.uni_medida,
      imagemProduto: data.imagemProduto,
      ultima_atualizacao: data.ultima_atualizacao?.toDate() || '',
      ultima_reposicao: data.ultima_reposicao?.toDate() || '',
      categoria_impressao: data.categoria_impressao,
      controle_estoque: data.controle_estoque,
      quantidade_estoque: data.quantidade_estoque,
      rotativo: data.rotativo,
      data_criacao: data.data_criacao?.toDate(),
    }
  }

  private setup() {
    return db.collection(this.COLLECTION_NAME)
  }

  public async criar(id_empresa: string, produto: ProdutoDTO): Promise<ProdutoDTO> {
    let produtoId: string = ''

    await db.runTransaction(async (transaction) => {

      const produtoRef = this.setup().doc();
      produtoId = produtoRef.id

      const produtoParaSalvar: ProdutoDTO = {
        ...produto,
        nome: produto.nome.toLowerCase(),
        empresa_reference: idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS),
        categoria_reference: (produto.categoria_reference === '') ? null : idToDocumentRef(produto.categoria_reference as string, COLLECTIONS.CATEGORIA_PRODUTO),
        rotativo: 1,
        preco_compra: (produto.preco_compra === undefined) ? 0 : produto.preco_compra,
        // revisar essa lógica de código do produto, pois quando acontecer alguma exclusão de produto, pode gerar produtos com o mesmo código
        codigo: (produto.codigo) ? produto.codigo : (await this.setup().count().get().then(count => count.data().count + 1)).toString(),
        ultima_atualizacao: new Date(),
        ultima_reposicao: new Date(),
        data_criacao: new Date(),
      }

      transaction.set(produtoRef, produtoParaSalvar);

      await this.dicionarioService.adicionar_EmTransacao(
        transaction,
        id_empresa,
        {
          id_produto: produtoRef.id,
          label: produtoParaSalvar.nome
        }
      );
    });

    const docCriado = await this.setup().doc(produtoId).get()
    if (!docCriado.exists) throw new HttpException(`Produto não foi criado corretamente`, HttpStatus.BAD_REQUEST);
    return this.docToObject(docCriado.id, docCriado.data()!)
  }

  public async listarTodos(id_empresa: string): Promise<ProdutoDTO[]> {
    let query = await this.setup().where('empresa_reference', '==', idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS)).get();
    if (!query.empty) {
      return query.docs.map(doc => this.docToObject(doc.id, doc.data()));
    }
    return []
  }

  public async encontrarPorId(id_produto: string): Promise<ProdutoDTO | undefined> {
    const doc = await this.setup().doc(id_produto).get();
    if (!doc.exists) throw new Error("Produto não encontrado");
    return this.docToObject(doc.id, doc.data()!);
  }

  public async remover(id_produto: string, id_empresa: string): Promise<void> {
    const produtoRef = this.setup().doc(id_produto);

    // ao remover um produto, ele também deve ser removido do dicionário de pesquisa para que não aconteçam pesquisas no nome de um produto excluído
    await db.runTransaction(async (transaction) => {
      // primeiro apagando do dicionário
      await this.dicionarioService.remover_EmTransacao(transaction, id_empresa, id_produto)

      // finalmente apagando o produto
      transaction.delete(produtoRef);
    })

  }

  public async atualizarPorId(id_produto: string, id_empresa: string, payload: Partial<ProdutoDTO>): Promise<void> {
    const produtoRef = this.setup().doc(id_produto);
    const produtoDoc = await produtoRef.get();
    if (!produtoDoc.exists) throw new Error("Produto não encontrado");

    // verificar se há outro produto com o mesmo código que ta sendo passado para atualização
    if (payload.codigo != undefined || payload.codigo != null) {
      // ......
    }

    if (payload.nome) payload.nome = payload.nome.toLowerCase();

    const produtoObj = this.docToObject(produtoDoc.id, produtoDoc.data()!)

    // se houver incremento na quantidade_estoque deve haver incremendo no rotativo
    if (payload.quantidade_estoque != undefined && payload.quantidade_estoque != null) {
      const quantidade_atual = produtoObj.quantidade_estoque;
      const nova_quantidade = payload.quantidade_estoque;

      if (nova_quantidade > quantidade_atual) {
        const rotativo_atual = produtoObj.rotativo || 0;
        payload.rotativo = rotativo_atual + 1;
        payload.ultima_reposicao = new Date();
      }
    }

    // ao atualizar qualquer campo, deve-se atualizar o campo de ultima_atualizacao
    payload.ultima_atualizacao = new Date();

    // o dicionário só vai sofrer alterações se o produto mudar de nome
    if (payload.nome !== undefined && payload.nome !== produtoObj.nome) {
      await db.runTransaction(async (transaction) => {
        await this.dicionarioService.atualizar_EmTransacao(transaction, id_empresa, {
          id_produto: id_produto,
          label: payload.nome as string
        })

        transaction.update(produtoRef, {
          ...payload
        })
      })
      return
    }

    // se nao entrar no if, entao atualiza de forma normal
    await produtoRef.update({
      ...payload
    });
  }

  public async paginarProdutos({
    id_empresa,
    limite,
    categoriaId,
    ordem,
    cursor,
    cursorPrev
  }: {
    id_empresa: string;
    limite: number;
    categoriaId?: string;
    ordem?: string;
    cursor?: string;      // próximo
    cursorPrev?: string;  // anterior
  }) {
    let query = this.setup().orderBy(ordem ?? "data_criacao", "desc");
    query = query.where("empresa_reference", "==", idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS));

    if (categoriaId) query = query.where("categoria_reference", "==", idToDocumentRef(categoriaId, COLLECTIONS.CATEGORIA_PRODUTO));

    let snapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>;

    // Indo para a próxima página
    if (cursor) {
      const cursorDoc = await this.setup().doc(cursor).get();
      snapshot = await query.startAfter(cursorDoc).limit(limite).get();
    }
    // Voltando para a página anterior
    else if (cursorPrev) {
      const cursorDoc = await this.setup().doc(cursorPrev).get();
      snapshot = await query.endBefore(cursorDoc).limitToLast(limite).get();
    }
    // Primeira página
    else {
      snapshot = await query.limit(limite).get();
    }

    const produtos: ProdutoDTO[] = snapshot.docs.map(doc => ({
      ...this.docToObject(doc.id, doc.data())
    }));

    const first = snapshot.docs[0];
    const last = snapshot.docs[snapshot.docs.length - 1];

    return {
      produtos,
      nextCursor: last?.id ?? null,
      prevCursor: first?.id ?? null,
    };
  };

  public async encontrar(campoDeFiltro: string, operacao: admin.firestore.WhereFilterOp, valor: any, asObject: boolean, id_empresa?: string, limite?: number) {
    let query = this.setup().where(campoDeFiltro, operacao, valor);

    if (id_empresa) query = query.where("empresa_reference", "==", idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS));

    if (limite) query = query.limit(limite);

    const querySnap = await query.get();

    if (querySnap.empty) return []

    if (asObject) {
      const listaDeProdutosEncontrados: ProdutoDTO[] = querySnap.docs.map((doc) => {
        return docToObject<ProdutoDTO>(doc.id, doc.data()!)
      })

      return listaDeProdutosEncontrados
    }

    return querySnap.docs
  }

  public async encontrarEstatisticaQtdEstoque(id_empresa: string, ordenarPor: string, limite?: number) {
    const ordem: admin.firestore.OrderByDirection = (ordenarPor === 'asc')?'asc':'desc';
    let query = this.setup().where("empresa_reference", "==", idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS))
    .orderBy("quantidade_estoque", ordem);

    if (limite) query = query.limit(limite);

    const querySnap = await query.get();

    if (querySnap.empty) return []

    const resultados = querySnap.docs.map((doc) => {
      return docToObject<ProdutoDTO>(doc.id, doc.data())
    })

    return resultados;
  }

  public atualizar_EmTransacao(transaction: FirebaseFirestore.Transaction, id_produto: string, produtoAtualizado: Partial<ProdutoDTO>) {
    const docRef = this.setup().doc(id_produto)
    transaction.update(docRef, {
      ...produtoAtualizado
    });
  }

  public async atualizarEstoque_EmTransacao(transaction: FirebaseFirestore.Transaction, id_produto: string, valor: number, tipoOperacao: 'MAIS' | 'MENOS') {
    const prodRef = this.setup().doc(id_produto);

    const prodDoc = await prodRef.get()
    if (!(prodDoc.data()?.controle_estoque)) {
      return
    }

    if (tipoOperacao === 'MAIS') {
      transaction.update(prodRef, {
        quantidade_estoque: admin.firestore.FieldValue.increment(valor)
      })
      return
    }
    if (tipoOperacao === 'MENOS') {
      transaction.update(prodRef, {
        quantidade_estoque: admin.firestore.FieldValue.increment(-valor)
      })
      return
    }
  }


}
