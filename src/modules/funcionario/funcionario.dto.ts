import { DocumentReference } from "firebase-admin/firestore";

export type TipoFuncionario = 'CAIXA' | 'GERENTE' | 'GARCOM'

export class FuncionarioDTO {
  id_usuario?: string;
  id_empresa?: string;
  empresa_reference: DocumentReference;
  tipo: TipoFuncionario;
  permissao: TipoFuncionario[];
  nome: string;
  senha: string;
  ativo?: boolean;
  ultimo_acesso?: Date;
  data_criacao: Date
}

export class FuncionarioRequestAuthDTO {
  nome: string;
  senha: string;
}