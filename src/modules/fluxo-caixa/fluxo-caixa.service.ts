import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import admin from "firebase-admin";
import { db } from 'src/config/firebase';
import { COLLECTIONS } from 'src/enum/firestore.enum';
import { idToDocumentRef } from 'src/util/firestore.util';
import { FluxoCaixaDTO } from './fluxo-caixa.dto';

@Injectable()
export class FluxoCaixaService {

  private COLLECTION_NAME: string

  constructor() {
    this.COLLECTION_NAME = COLLECTIONS.FLUXOS,
      this.setup()
  }

  private setup() {
    return db.collection(this.COLLECTION_NAME);
  }

  private docToObject(id: string, data: FirebaseFirestore.DocumentData): FluxoCaixaDTO {
    return {
      id: id,
      data_abertura: data.data_abertura?.toDate() || '',
      data_fechamento: data.data_fechamento?.toDate() || '',
      diferencas: data.diferencas,
      empresa_reference: data.empresa_reference.id || '',
      entradas: data.entradas,
      funcionario_responsavel_abertura: data.funcionario_responsavel_abertura?.id || '',
      funcionario_responsavel_fechamento: data.funcionario_responsavel_fechamento?.id || '',
      reposicao_troco: data.reposicao_troco,
      sangria: data.sangria,
      status: data.status,
      troco: data.troco,
      valor_inicial: data.valor_inicial,
      valores_finais_informados: data.valores_finais_informados,
    }
  }

  public async criar(id_empresa: string, fluxoBody: Partial<FluxoCaixaDTO>): Promise<FluxoCaixaDTO> {
    if (fluxoBody.valor_inicial === undefined) throw new Error('Necessário preencher valor inical para abrir caixa')

    const fluxoParaSalvar: FluxoCaixaDTO = {
      valor_inicial: fluxoBody.valor_inicial,
      reposicao_troco: [],
      sangria: [],
      troco: 0,
      valores_finais_informados: [],
      entradas: [],
      diferencas: [],
      status: true,
      empresa_reference: idToDocumentRef(id_empresa as string, COLLECTIONS.EMPRESAS),
      funcionario_responsavel_abertura: idToDocumentRef(fluxoBody.funcionario_responsavel_abertura as string, COLLECTIONS.FUNCIONARIOS),
      funcionario_responsavel_fechamento: null,
      data_abertura: new Date(),
      data_fechamento: null
    }

    const fluxRef = await this.setup().add(fluxoParaSalvar);
    return this.docToObject(fluxRef.id, (await fluxRef.get()).data()!);
  }


  public async encontrar(campoDeFiltro: string, operacao: admin.firestore.WhereFilterOp, valor: any, id_empresa: string) {
    let query = await this.setup().where(campoDeFiltro, operacao, valor)
      .where("empresa_reference", "==", idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS))
      .get()

    if (query.empty) return undefined

    return this.docToObject(query.docs[0].id, query.docs[0].data()!);
  }

  public async encontrarPorId(id_fluxo) {
    let fluxo = await this.setup().doc(id_fluxo).get()

    if (!fluxo.exists) throw new HttpException("Fluxo não encontrado", HttpStatus.BAD_REQUEST);

    return this.docToObject(fluxo.id, fluxo.data()!);
  }

  public async listarTodos(id_empresa: string) {
    const fluxSnap = await this.setup().where('empresa_reference', '==', idToDocumentRef(id_empresa, COLLECTIONS.EMPRESAS))
      .orderBy("data_abertura", "desc")
    .get()

    if (fluxSnap.empty) return []

    let resultado: FluxoCaixaDTO[] = fluxSnap.docs.map((flux, indice) => {
      return this.docToObject(flux.id, flux.data()!)
    })

    return resultado
  }

  public async atualizar(id_fluxo: string, fluxBody: Partial<FluxoCaixaDTO>) {    
    const fluxRef = this.setup().doc(id_fluxo);
    
    await fluxRef.update({
      ...fluxBody
    })
  }

  public async atualizar_EmTransacao(
    transaction: FirebaseFirestore.Transaction,
    id_empresa: string,
    fluxoBody: Partial<FluxoCaixaDTO>
  ) {
    const fluxoAberto = await this.encontrar("status", "==", true, id_empresa);

    if (!fluxoAberto) return;

    const docRef = this.setup().doc(fluxoAberto.id!);

    // 1 — Primeiro update sem mexer nos arrays
    const updateData: any = {};

    // copia apenas campos que NÃO são arrays
    for (const [key, value] of Object.entries(fluxoBody)) {
      if (key !== "entradas" && key !== "saidas") {
        updateData[key] = value;
      }
    }

    // handle troco (increment)
    if (fluxoBody.troco !== undefined) {
      updateData["troco"] = admin.firestore.FieldValue.increment(fluxoBody.troco);
    }

    // faz o update "normal" sem arrays
    transaction.update(docRef, updateData);

    // 2 — Agora manipula arrays separadamente
    if (fluxoBody.entradas && fluxoBody.entradas.length > 0) {
      fluxoBody.entradas.forEach((entrada) => {
        transaction.update(docRef, {
          entradas: admin.firestore.FieldValue.arrayUnion(entrada),
        });
      });
    }
  }


}
