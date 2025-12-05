import { DocumentReference } from "firebase-admin/firestore";
import { Pagamento } from "src/modules/venda/venda.dto";

export class FluxoCaixaDTO {
  id?: string;
  funcionario_responsavel_abertura: DocumentReference | string;
  funcionario_responsavel_fechamento?: DocumentReference | string | null;
  empresa_reference: DocumentReference | string;
  valor_inicial: number;
  entradas: Pagamento[]; //
  reposicao_troco: SangriaOuReposicao[];
  sangria: SangriaOuReposicao[]; 
  troco: number; 
  status: boolean;
  valores_finais_informados: Pagamento[];
  diferencas: Pagamento[];
  data_abertura: Date;
  data_fechamento: Date | null;
}

export type SangriaOuReposicao = {
  valor: number,
  funcionario_responsavel: string | DocumentReference,
  data_de_entrada: Date,
}