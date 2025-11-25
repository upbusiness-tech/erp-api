import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { db } from 'src/config/firebase';
import { COLLECTIONS } from 'src/enum/firestore.enum';
import { DicionarioDTO, ProdutoDicionario } from './dicionario.dto';
import { idToDocumentRef } from 'src/util/firestore.util';
import admin from "firebase-admin";

@Injectable()
export class DicionarioService {

  private COLLECTION_NAME: string

  constructor() {
    this.COLLECTION_NAME = COLLECTIONS.DICIONARIO,
      this.setup()
  }

  private setup() {
    return db.collection(this.COLLECTION_NAME);
  }

  private docToObject(id: string, data: FirebaseFirestore.DocumentData): DicionarioDTO {
    return {
      id_dicionario: id,
      id_empresa: data.empresa_reference.id,
      empresa_reference: data.empresa_reference.id,
      dicionario_produtos: data.dicionario_produtos
    }
  }

  public async adicionar_EmTransacao(
    transaction: FirebaseFirestore.Transaction,
    id_empresa: string,
    item_dicionario: ProdutoDicionario,
    dicionario?: DicionarioDTO
  ) {
    const empresaRef = idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS);

    const query = await this.setup()
      .where("empresa_reference", "==", empresaRef)
      .get();

    if (query.empty) {
      // criar novo dicionário
      const newRef = this.setup().doc();
      transaction.set(newRef, {
        empresa_reference: empresaRef,
        dicionario_produtos: [item_dicionario]
      });
      return;
    }

    const dicRef = query.docs[0].ref;
    transaction.update(dicRef, {
      ...dicionario,
      dicionario_produtos: admin.firestore.FieldValue.arrayUnion(item_dicionario)
    });
  }

  public async atualizar_EmTransacao(transaction: FirebaseFirestore.Transaction, id_empresa: string, produto_dicionario: ProdutoDicionario) {
    // quando um produto sofrer atualizações, o dicionário também deve atualizar respectivamente
    const dicionarioParaAtualizar = await this.encontrarPorId(id_empresa)

    // encontrando o produto e o atualizando
    const indiceItemParaAtualizar = dicionarioParaAtualizar.dicionario_produtos.findIndex(item => item.id_produto === produto_dicionario.id_produto)

    dicionarioParaAtualizar.dicionario_produtos[indiceItemParaAtualizar] = {
      id_produto: produto_dicionario.id_produto,
      label: produto_dicionario.label
    }

    const dicRef = this.setup().doc(dicionarioParaAtualizar.id_dicionario!);

    transaction.update(dicRef, {
      dicionario_produtos: dicionarioParaAtualizar.dicionario_produtos
    })
  }

  public async remover_EmTransacao(transaction: FirebaseFirestore.Transaction, id_empresa: string, id_produto: string) {
    // quando um produto for excluído, ele também deve ser removido do dicionario
    const dicionarioParaAtualizar = await this.encontrarPorId(id_empresa)

    // encontrando o produto e o atualizando
    const produtosDicionarioAtualizado = dicionarioParaAtualizar.dicionario_produtos.filter(item => item.id_produto !== id_produto)

    const dicRef = this.setup().doc(dicionarioParaAtualizar.id_dicionario!)

    transaction.update(dicRef, {
      dicionario_produtos: produtosDicionarioAtualizado
    })
  }

  public async encontrarPorId(id_empresa: string): Promise<DicionarioDTO> {
    const doc = await this.setup().where("empresa_reference", "==", idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS)).get()
    if (doc.empty) throw new NotFoundException('Dicionario não encontrado')
    return this.docToObject(doc.docs[0].id, doc.docs[0].data())
  }


}
