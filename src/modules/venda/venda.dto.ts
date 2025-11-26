import { DocumentReference } from "firebase-admin/firestore";
import { ProdutoDTO } from "src/modules/produto/produto.dto";

export class VendaDTO {
  id_venda?: string;
  id_empresa?: string;
  codigo?: string;
  empresa_reference: DocumentReference | string | null;
  funcionarios_responsaveis: DocumentReference[] | string[] | null; // usuarios cadastrados na empresa
  mesa_reference?: DocumentReference // alguma das mesas que a empresa cadastro SE for se tratar de uma venda do tipo mesa
  dados_servico?: Servico[]
  itens_venda: ItemVenda[]; // itens da venda baseado em produtos que foram cadastrados com o reference da empresa
  tipo: TipoVenda;
  pagamentos: Pagamento[];
  status: StatusVenda;
  operador_caixa?: DocumentReference | string | null; // algum dos usuarios que for caixa da empresa deve ser colocando aqui
  troco: number;
  motivo_cancelamento?: string;
  data_venda: Date
}

export class ItemVenda {
  id_itemVenda?: string;
  id_produto?: string;
  produto_reference: DocumentReference | string | null;
  uni_medida: 'GRAMAS' | 'METROS' | 'QUILO' | 'UNIDADE';
  quantidade: number;
  produto_objeto: ProdutoDTO;
  observacao?: string;
  valor_medida?: number;
}

export class Servico {
  id_servico?: string;
  descricao: string;
  cliente?: string;
  contato_cliente?: string;
  valor: number;
  profissional_responsavel?: string
}

export class Pagamento {
  id_pagamento?: string;
  forma: TipoPagamento;
  quantidade_paga: number;
}

export type TipoPagamento = 'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO';
export type TipoVenda = 'BALCAO' | 'SERVIÇO' | 'PDV';
export type StatusVenda = 'CONCLUIDA' | 'AGUARDANDO' | 'ANDAMENTO' | 'CANCELADA';