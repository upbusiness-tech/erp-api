import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import admin from "firebase-admin";
import { db } from 'src/config/firebase';
import { COLLECTIONS } from 'src/enum/firestore.enum';
import { idToDocumentRef } from 'src/util/firestore.util';
import { EstatisticaProdutoBodyParaVendas, EstatisticaProdutoDTO } from './estatistica-produto.dto';

@Injectable()
export class EstatisticaProdutoService {

  private COLLECTION_NAME: string

  constructor() {
    this.COLLECTION_NAME = COLLECTIONS.ESTATISTICA,
      this.setup()
  }

  private setup() {
    return db.collection(this.COLLECTION_NAME);
  }

  private docToObject(id: string, data: FirebaseFirestore.DocumentData): EstatisticaProdutoDTO {
    return {
      id_estatistica: id,
      id_empresa: data.id_empresa || '',
      id_produto: data.id_produto || '',
      ultima_venda: data.ultima_venda?.toDate(),
      datas_historico_vendas: data.datas_historico_vendas,
      empresa_reference: data.empresa_reference?.id || '',
      produto_reference: data.produto_reference?.id || '',
      produto_objeto: data.produto_objeto,
      quantidade_saida: data.quantidade_saida,
      lucro: data.lucro,
      data_criacao: data.data_criacao?.toDate()
    }
  }

  public async adicionar_EmTransacao(
    transaction: FirebaseFirestore.Transaction,
    id_empresa: string,
    id_produto: string,
    dadosEst: EstatisticaProdutoBodyParaVendas
  ): Promise<void> {
    const empresaRef = idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS);
    const produtoRef = idToDocumentRef(id_produto, COLLECTIONS.PRODUTOS);

    const query = this.setup()
      .where("empresa_reference", "==", empresaRef)
    .where("produto_reference", "==", produtoRef);

    const estSnapshot = await transaction.get(query);

    let estatisticaParaSalvar: Partial<EstatisticaProdutoDTO> = {
      empresa_reference: empresaRef,
      produto_reference: produtoRef,
      ultima_venda: new Date(),
    };

    if (estSnapshot.empty) {
      const newRef = this.setup().doc();
      estatisticaParaSalvar.data_criacao = new Date();

      transaction.set(newRef, {
        ...estatisticaParaSalvar,
        lucro: admin.firestore.FieldValue.increment(
          dadosEst.quantidade_vendida * dadosEst.preco_atual
        ),
        quantidade_saida: admin.firestore.FieldValue.increment(
          dadosEst.quantidade_vendida
        ),
        datas_historico_vendas: admin.firestore.FieldValue.arrayUnion(new Date()),
      });
      return;
    }

    const estRef = estSnapshot.docs[0].ref;

    transaction.update(estRef, {
      lucro: admin.firestore.FieldValue.increment(
        dadosEst.quantidade_vendida * dadosEst.preco_atual
      ),
      quantidade_saida: admin.firestore.FieldValue.increment(
        dadosEst.quantidade_vendida
      ),
      datas_historico_vendas: admin.firestore.FieldValue.arrayUnion(new Date()),
    });
  }

  public async encontrar(id_empresa: string, id_produto: string): Promise<EstatisticaProdutoDTO> {
    const estSnapshot = await this.setup()
      .where("empresa_reference", "==", idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS))
      .where("produto_reference", "==", idToDocumentRef(id_produto, COLLECTIONS.PRODUTOS))
      .get()

    if (estSnapshot.empty) throw new HttpException(`Estatística não encontrada para o produto de ID ${id_produto} e empresa de ID ${id_empresa}`, HttpStatus.BAD_REQUEST);

    return this.docToObject(estSnapshot.docs[0].id, estSnapshot.docs[0].data());
  }

  public async remover_EmTransacao(transaction: FirebaseFirestore.Transaction, id_empresa: string, id_produto: string) {
    const estEncontrada = await this.encontrar(id_empresa, id_produto);
    const estRef = this.setup().doc(estEncontrada.id_estatistica!)
  
    transaction.delete(estRef);
  }


}
