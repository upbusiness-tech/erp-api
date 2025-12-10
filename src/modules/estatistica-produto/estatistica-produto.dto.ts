import { DocumentReference } from "firebase-admin/firestore";
import { ProdutoDTO } from "../produto/produto.dto";
import admin from "firebase-admin";

export class EstatisticaProdutoDTO {
  id?: string;
  ultima_venda: Date;
  datas_historico_vendas?: Date[];
  empresa_reference: DocumentReference | string | null;
  produto_reference: DocumentReference | string | null;
  produto_objeto?: ProdutoDTO;
  quantidade_saida: number;
  lucro: number;
  data_criacao: Date;
}

export type EstatisticaProdutoBodyParaVendas = {
  quantidade_vendida: number,
  preco_atual: number, 
}

export type TransacaoEstatistica = {
  produto_reference: DocumentReference,
  dados_estatistica: EstatisticaProdutoBodyParaVendas,
  snapshot: admin.firestore.QuerySnapshot<admin.firestore.DocumentData, admin.firestore.DocumentData>
}