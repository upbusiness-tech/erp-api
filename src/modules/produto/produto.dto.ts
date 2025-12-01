import { DocumentReference } from "firebase-admin/firestore";

export class ProdutoDTO {
  id: string;
  empresa_reference?: string | DocumentReference;
  nome: string;
  categoria_reference?: string | DocumentReference | null;
  uni_medida: 'GRAMAS' | 'METROS' | 'QUILO' | 'UNIDADE';
  preco_compra?: number;
  preco_venda: number;
  quantidade_estoque: number;
  rotativo: number;
  imagemProduto: string;
  codigo: string;
  categoria_impressao: 'COMUM' | 'COZINHA' | 'CHURRASQUEIRA';
  data_criacao: Date;
  ultima_atualizacao?: Date;
  ultima_reposicao?: Date;
  controle_estoque: boolean
}