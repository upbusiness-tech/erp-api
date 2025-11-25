import { DocumentReference } from "firebase-admin/firestore";

export class CategoriaProdutoDTO {
  id_categoria?: string;
  id_empresa?: string;
  empresa_reference?: string | DocumentReference;
  nome: string;
}