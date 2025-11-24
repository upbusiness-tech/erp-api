import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { db } from 'src/config/firebase';
import { COLLECTIONS } from 'src/enum/firestore.enum';
import { EmpresaDTO } from './empresa.dto';

@Injectable()
export class EmpresaService {
  private COLLECTION_NAME: string

  constructor() {
    this.COLLECTION_NAME = COLLECTIONS.EMPRESAS;
    this.setup();
  }

  private docToObject(id: string, data: FirebaseFirestore.DocumentData): EmpresaDTO {
    return {
      id_empresa: id,
      nome: data.nome,
      plano: data.plano,
      atalhos_rapidos: data.atalhos_rapidos,
      cnpj: data.cnpj,
      descricao: data.descricao,
      endereco: data.endereco,
      img_perfil: data.img_perfil,
      senha: data.senha,
      taxa_servico: data.taxa_servico,
      email: data.email,
      email_contato: data.email_contato,
      data_criacao: data.data_criacao
    }
  }

  private setup() {
    return db.collection(this.COLLECTION_NAME);
  }

  public async encontrarPorId(id_empresa: string): Promise<EmpresaDTO> {
    const doc = await this.setup().doc(id_empresa).get();
    if (!doc.exists) throw new HttpException(`Empresa com ID ${id_empresa} não encontrada`, HttpStatus.BAD_REQUEST);
    return this.docToObject(doc.id, doc.data()!);
  }

  public async atualizar(id_empresa: string, payload: Partial<EmpresaDTO>): Promise<void> {
    const empresaRef = this.setup().doc(id_empresa);
    const empresaDoc = await empresaRef.get();

    if (!empresaDoc.exists) throw new Error("Empresa não encontrada");

    await empresaRef.update({
      ...payload
    });
  }

}


