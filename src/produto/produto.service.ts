import { Injectable } from '@nestjs/common';
import { ProdutoDTO } from './produto.dto';
import { db } from 'src/config/firebase';
import { COLLECTIONS } from 'src/enum/firestore.enum';
import { idToDocumentRef } from 'src/util/firestore.util';

@Injectable()
export class ProdutoService {

  private COLLECTION_NAME: string

  constructor() {
    this.COLLECTION_NAME = COLLECTIONS.PRODUTOS,
      this.setup()
  }

  private docToProduto(id_produto: string, data: FirebaseFirestore.DocumentData): ProdutoDTO {
    return {
      id_produto: id_produto,
      id_empresa: data.empresa_reference.id,
      categoria: data.categoria,
      categoria_reference: data.categoria_reference.id,
      empresa_reference: data.empresa_reference.id,
      nome: data.nome,
      preco_venda: data.preco_venda,
      preco_compra: data.preco_compra,
      codigo: data.codigo,
      uni_medida: data.uni_medida,
      imagemProduto: data.imagemProduto,
      ultima_atualizacao: data.ultima_atualizacao?.toDate(),
      ultima_reposicao: data.ultima_reposicao?.toDate(),
      categoria_impressao: data.categoria_impressao,
      controle_estoque: data.controle_estoque,
      quantidade_estoque: data.quantidade_estoque,
      rotativo: data.rotativo,
      data_criacao: data.data_criacao.toDate(),
    }
  }

  private setup() {
    return db.collection(this.COLLECTION_NAME)
  }

  public async criar(produto: ProdutoDTO): Promise<ProdutoDTO | undefined> {
    const produtoParaSalvar: ProdutoDTO = {
      ...produto,
      nome: produto.nome.toLowerCase(),
      empresa_reference: idToDocumentRef(produto.empresa_reference as string, COLLECTIONS.EMPRESAS),
      categoria_reference: idToDocumentRef(produto.categoria_reference as string, COLLECTIONS.CATEGORIA_PRODUTO),
      rotativo: 0,
      // revisar essa lógica de código do produto, pois quando acontecer alguma exclusão de produto, pode gerar produtos com o mesmo código
      codigo: (produto.codigo) ? produto.codigo : (await this.setup().count().get().then(count => count.data().count + 1)).toString(),
      data_criacao: new Date(),
    }

    const ref = await this.setup().add(produtoParaSalvar)
    const doc = await ref.get()

    // falta adicionar o produto ao dicionario da empresa
    // .....

    return this.docToProduto(doc.id, doc.data()!);
  }

  public async listarTodos(id_empresa: string): Promise<ProdutoDTO[]> {
    let query = await this.setup().where('empresa_reference', '==', idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS)).get();
    if (!query.empty) {
      return query.docs.map(doc => this.docToProduto(doc.id, doc.data()));
    }
    return []
  }

  public async encontrarPorId(id_produto: string): Promise<ProdutoDTO | undefined> {
    const doc = await this.setup().doc(id_produto).get();
    if (!doc.exists) throw new Error("Produto não encontrado");
    return this.docToProduto(doc.id, doc.data()!);
  }

  public async remover(id_produto: string): Promise<void> {
    await this.setup().doc(id_produto).delete();
  }

  public async atualizarPorId(id_produto: string, payload: Partial<ProdutoDTO>): Promise<void> {
    const produtoRef = this.setup().doc(id_produto);
    const produtoDoc = await produtoRef.get();

    if (!produtoDoc.exists) throw new Error("Produto não encontrado");

    // verificar se há outro produto com o mesmo código que ta sendo passado para atualização
    if (payload.codigo != undefined || payload.codigo != null) {
      // ......
    }

    // se houver incremento na quantidade_estoque deve haver incremendo no rotativo
    if (payload.quantidade_estoque != undefined && payload.quantidade_estoque != null) {
      const quantidade_atual = produtoDoc.data()!.quantidade_estoque;
      const nova_quantidade = payload.quantidade_estoque;

      if (nova_quantidade > quantidade_atual) {
        const rotativo_atual = produtoDoc.data()!.rotativo || 0;
        payload.rotativo = rotativo_atual + 1;
        payload.ultima_reposicao = new Date();
      }
    }

    // ao atualizar qualquer campo, deve-se atualizar o campo de ultima_atualizacao
    payload.ultima_atualizacao = new Date();

    await produtoRef.update({
      ...payload
    });
  }

  public async paginarProdutos({
    id_empresa,
    limite,
    // categoria,
    ordem,
    cursor,
    cursorPrev
  }: {
    id_empresa: string;
    limite: number;
    // categoria?: string;
    ordem?: string;
    cursor?: string;      // próximo
    cursorPrev?: string;  // anterior
  }) {
    let query = this.setup().orderBy(ordem ?? "data_criacao", "desc");
    query = query.where("empresa_reference", "==", idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS));
    
    // if (categoria) query = query.where("categoria", "==", categoria);

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
      ...this.docToProduto(doc.id, doc.data())
    }));

    const first = snapshot.docs[0];
    const last = snapshot.docs[snapshot.docs.length - 1];

    return {
      produtos,
      nextCursor: last?.id ?? null,
      prevCursor: first?.id ?? null,
    };
  };


}
