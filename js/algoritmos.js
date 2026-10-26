// Algoritmos de escalonamento (Pessoa 1)
// Cada algoritmo recebe a lista de pedidos e devolve a linha do tempo pronta:
// uma lista de trechos { pedido, inicio, fim } em que um pedido ocupou o fogão.
// Nada roda em tempo real; as telas só leem a linha do tempo e desenham.
//
// Regras de desempate (iguais para todos):
// - Empate em qualquer critério: ganha quem chegou primeiro; se ainda empatar,
//   a ordem da lista.
// - Fogão vazio e ninguém na fila: o relógio pula para a próxima chegada.
// - Round Robin: um pedido que chega no mesmo instante em que outro perde o
//   fogão entra na fila antes do interrompido.
//
// As funções trabalham numa cópia e nunca alteram a lista recebida.

// Copia os pedidos e guarda a posição original, usada no desempate.
function copiarPedidos(pedidos) {
  return pedidos.map((p, ordem) => ({ ...p, ordem }));
}

function ordenarPorChegada(lista) {
  return lista.slice().sort((a, b) => a.chegada - b.chegada || a.ordem - b.ordem);
}

// Junta trechos seguidos do mesmo pedido. No Round Robin, quando só sobra um
// pedido ele ganha vários quanta em sequência, e isso vira um trecho só.
function juntarTrechos(linha) {
  const juntos = [];
  for (const trecho of linha) {
    const ultimo = juntos[juntos.length - 1];
    if (ultimo && ultimo.pedido === trecho.pedido && ultimo.fim === trecho.inicio) {
      ultimo.fim = trecho.fim;
    } else {
      juntos.push({ ...trecho });
    }
  }
  return juntos;
}

function fcfs(pedidos) {
  const linha = [];
  let t = 0;
  for (const p of ordenarPorChegada(copiarPedidos(pedidos))) {
    t = Math.max(t, p.chegada);
    linha.push({ pedido: p.id, inicio: t, fim: t + p.preparo });
    t += p.preparo;
  }
  return linha;
}

// Núcleo do SJF e da Prioridade: quando o fogão libera, escolhe entre os
// pedidos que já chegaram o de menor critério e o executa até o fim.
function escolherNaoPreemptivo(pedidos, criterio) {
  const pendentes = ordenarPorChegada(copiarPedidos(pedidos));
  const linha = [];
  let t = 0;
  while (pendentes.length > 0) {
    const prontos = pendentes.filter((p) => p.chegada <= t);
    if (prontos.length === 0) {
      t = pendentes[0].chegada;
      continue;
    }
    // prontos já está ordenado por chegada e ordem, então em caso de empate
    // o primeiro encontrado é mantido.
    let escolhido = prontos[0];
    for (const p of prontos) {
      if (criterio(p) < criterio(escolhido)) escolhido = p;
    }
    linha.push({ pedido: escolhido.id, inicio: t, fim: t + escolhido.preparo });
    t += escolhido.preparo;
    pendentes.splice(pendentes.indexOf(escolhido), 1);
  }
  return linha;
}

function sjf(pedidos) {
  return escolherNaoPreemptivo(pedidos, (p) => p.preparo);
}

function prioridade(pedidos) {
  return escolherNaoPreemptivo(pedidos, (p) => p.prioridade);
}

function roundRobin(pedidos, quantum = 2) {
  if (!(quantum >= 1)) {
    throw new Error("roundRobin: o quantum precisa ser um número maior ou igual a 1.");
  }
  const chegando = ordenarPorChegada(copiarPedidos(pedidos));
  const restante = new Map(chegando.map((p) => [p, p.preparo]));
  const fila = [];
  const linha = [];
  let proximo = 0; // índice do próximo pedido a chegar
  let t = 0;

  function admitirAte(instante) {
    while (proximo < chegando.length && chegando[proximo].chegada <= instante) {
      fila.push(chegando[proximo]);
      proximo++;
    }
  }

  while (fila.length > 0 || proximo < chegando.length) {
    admitirAte(t);
    if (fila.length === 0) {
      t = chegando[proximo].chegada;
      continue;
    }
    const p = fila.shift();
    const fatia = Math.min(quantum, restante.get(p));
    linha.push({ pedido: p.id, inicio: t, fim: t + fatia });
    t += fatia;
    restante.set(p, restante.get(p) - fatia);
    // Quem chegou até agora entra antes do pedido interrompido.
    admitirAte(t);
    if (restante.get(p) > 0) fila.push(p);
  }
  return juntarTrechos(linha);
}

// Lista para as telas montarem seletores e laços. O quantum só é usado pelo
// Round Robin.
const ALGORITMOS = [
  { id: "fcfs", nome: "FCFS", executar: (pedidos) => fcfs(pedidos) },
  { id: "sjf", nome: "SJF", executar: (pedidos) => sjf(pedidos) },
  { id: "prioridade", nome: "Prioridade", executar: (pedidos) => prioridade(pedidos) },
  { id: "rr", nome: "Round Robin", executar: (pedidos, quantum) => roundRobin(pedidos, quantum) },
];
