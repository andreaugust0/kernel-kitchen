// Métricas de escalonamento (Pessoa 1)
// Recebe os pedidos e a linha do tempo de qualquer algoritmo e calcula:
// - Turnaround = fim do último trecho menos chegada.
// - Espera     = turnaround menos preparo.
// - Resposta   = início do primeiro trecho menos chegada.
//
// Os números saem crus (ex.: 5.75). Formatar com vírgula é papel da tela:
// valor.toFixed(2).replace(".", ",")

function calcularMetricas(pedidos, linhaDoTempo) {
  const porPedido = pedidos.map((p) => {
    const trechos = linhaDoTempo.filter((t) => t.pedido === p.id);
    if (trechos.length === 0) {
      throw new Error(`calcularMetricas: o pedido ${p.id} não aparece na linha do tempo.`);
    }
    const primeiroInicio = Math.min(...trechos.map((t) => t.inicio));
    const ultimoFim = Math.max(...trechos.map((t) => t.fim));
    const turnaround = ultimoFim - p.chegada;
    return {
      id: p.id,
      espera: turnaround - p.preparo,
      turnaround,
      resposta: primeiroInicio - p.chegada,
    };
  });

  const media = (campo) =>
    porPedido.length === 0 ? 0 : porPedido.reduce((soma, m) => soma + m[campo], 0) / porPedido.length;

  return {
    porPedido,
    mediaEspera: media("espera"),
    mediaTurnaround: media("turnaround"),
    mediaResposta: media("resposta"),
  };
}
