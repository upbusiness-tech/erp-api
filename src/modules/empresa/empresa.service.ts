import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import admin from "firebase-admin";
import { Timestamp } from 'firebase-admin/firestore';
import { db } from 'src/config/firebase';
import { COLLECTIONS } from 'src/enum/firestore.enum';
import { AtalhosRapidosEmpresa, EmpresaDTO, toAtalhosRapidosEmpresaReponse } from './empresa.dto';

@Injectable()
export class EmpresaService {
  private COLLECTION_NAME: string

  constructor() {
    this.COLLECTION_NAME = COLLECTIONS.EMPRESAS;
    this.setup();
  }

  private docToObject(id: string, data: FirebaseFirestore.DocumentData): EmpresaDTO {
    return {
      id: id,
      nome: data.nome,
      plano: data.plano,
      atalhos_rapidos: toAtalhosRapidosEmpresaReponse(data.atalhos_rapidos),
      cnpj: data.cnpj,
      descricao: data.descricao,
      endereco: data.endereco,
      img_perfil: data.img_perfil,
      senha: data.senha,
      taxa_servico: data.taxa_servico,
      email: data.email,
      email_contato: data.email_contato,
      data_criacao: data.data_criacao?.toDate() || ''
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

    if (!empresaDoc.exists) throw new HttpException("Empresa não encontrada", HttpStatus.BAD_REQUEST);

    await empresaRef.update({
      ...payload
    });
  }

  public async atualizarAtalhosRapidos(id_empresa: string, payload: Partial<AtalhosRapidosEmpresa>) {
    const empresaRef = this.setup().doc(id_empresa);
    if (payload.label === undefined || payload.label === '') throw new HttpException('Necessário label para adicionar o atalho', HttpStatus.BAD_REQUEST);

    const atalho: AtalhosRapidosEmpresa = {
      id: randomUUID(),
      label: payload.label,
      criado_em: new Date()
    }

    await empresaRef.update({
      atalhos_rapidos: admin.firestore.FieldValue.arrayUnion(atalho),
    })
  }

  public async removerAtalhoRapido(id_empresa: string, payload: AtalhosRapidosEmpresa) {
    const empresaRef = this.setup().doc(id_empresa);
    
    const atalhoParaRemover = {
      id: payload.id,
      label: payload.label,
      criado_em: Timestamp.fromDate(new Date(payload.criado_em))
    }

    await empresaRef.update({
      atalhos_rapidos: admin.firestore.FieldValue.arrayRemove(atalhoParaRemover),
    })
  }

}


