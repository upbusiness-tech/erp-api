import { DocumentReference } from "firebase-admin/firestore"
import { PLANOS } from "src/enum/planos.enum"

export type AtalhosRapidosEmpresa = {
  label: string,
  criado_em: Date
}

export type TaxaServico = {
  valor_taxa: number,
  esta_habilitado: boolean
}

export class EmpresaDTO {
  id_empresa?: string;
  img_perfil?: string;
  uuid_auth?: string;
  empresa_reference?: string | DocumentReference;
  nome: string;
  descricao?: string;
  cnpj?: string;
  endereco?: string;
  plano: PLANOS;
  email: string
  senha?: string;
  atalhos_rapidos?: AtalhosRapidosEmpresa[];
  taxa_servico?: TaxaServico;
  data_criacao: Date;
}