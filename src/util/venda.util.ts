import { ItemVenda, Servico, VendaDTO } from "src/modules/venda/venda.dto";

export function calcularTroco(venda: Partial<VendaDTO>) {
  const totalVenda = somarTotalItensVenda(venda.itens_venda, venda.dados_servico);
  const totalPagamentos = venda.pagamentos?.reduce((total, item) => total + item.quantidade_paga, 0).toFixed(2);

  return Number(totalPagamentos) - Number(totalVenda) < 0
    ? 0
    : Number(totalPagamentos) - Number(totalVenda);
}

export function somarTotalItensVenda(itensVenda: ItemVenda[] | undefined, servicos?: Servico[]) {
  if (itensVenda === undefined) {
    return 0
  }

  const totalItens = itensVenda.reduce((total, item) => {
    if (item.uni_medida === 'GRAMAS') {
      return total + item.produto_objeto.preco_venda * item.valor_medida! * item.quantidade
    }
    return total + item.produto_objeto.preco_venda * item.quantidade;
  }, 0);

  // let totalServico = 0
  // if (servicos != undefined) {
  //   totalServico = servicos?.reduce((total, servico) => {
  //     return total + servico.valor;
  //   }, 0);
  // }

  // return Number(totalItens) + totalServico;
  return Number(totalItens);
}