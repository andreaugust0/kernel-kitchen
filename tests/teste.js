// Testes dos algoritmos, métricas e cenários (Pessoa 1)
// Roda tudo contra o gabarito do contrato e mostra ✔/✘ em cada verificação.
// Como rodar: no terminal, `node teste.js`. Também dá para colar no console do
// navegador numa página que já carregue cenarios.js, algoritmos.js e metricas.js.

// No Node, carrega os três arquivos antes de testar.
if (typeof require !== "undefined" && typeof fcfs === "undefined") {
  const fs = require("fs");
  const path = require("path");
  const vm = require("vm");
  for (const arquivo of ["cenarios.js", "algoritmos.js", "metricas.js"]) {
    vm.runInThisContext(fs.readFileSync(path.join(__dirname, "..", "js", arquivo), "utf8"), { filename: arquivo });
  }
}

const GABARITO = [
  { nome: "FCFS",       rodar: (p) => fcfs(p),          ordem: "P1, P2, P3, P4",                     espera: 5.75, turnaround: 10.25, resposta: 5.75 },
  { nome: "SJF",        rodar: (p) => sjf(p),           ordem: "P1, P4, P2, P3",                     espera: 4.0,  turnaround: 8.5,   resposta: 4.0 },
  { nome: "Prioridade", rodar: (p) => prioridade(p),    ordem: "P1, P2, P4, P3",                     espera: 4.25, turnaround: 8.75,  resposta: 4.25 },
  { nome: "Round Robin (q=2)", rodar: (p) => roundRobin(p, 2), ordem: "P1, P2, P3, P1, P4, P2, P3, P1, P3", espera: 7.25, turnaround: 11.75, resposta: 2.0 },
];

let falhas = 0;

function titulo(texto) {
  console.log(`\n== ${texto} ==`);
}

function verificar(descricao, ok, detalhe = "") {
  if (!ok) falhas++;
  console.log(`${ok ? "✔" : "✘"} ${descricao}${!ok && detalhe ? ` — ${detalhe}` : ""}`);
}

const quase = (a, b) => Math.abs(a - b) < 0.001;
const ordemNoFogao = (linha) => linha.map((t) => t.pedido).join(", ");
const formatar = (n) => n.toFixed(2).replace(".", ",");

// 1. Gabarito do cenário de exemplo
titulo("1. Gabarito do cenário de exemplo");
for (const g of GABARITO) {
  const linha = g.rodar(cenarioExemplo);
  const m = calcularMetricas(cenarioExemplo, linha);
  verificar(`${g.nome}: ordem no fogão`, ordemNoFogao(linha) === g.ordem, `veio ${ordemNoFogao(linha)}`);
  verificar(
    `${g.nome}: médias ${formatar(g.espera)} / ${formatar(g.turnaround)} / ${formatar(g.resposta)}`,
    quase(m.mediaEspera, g.espera) && quase(m.mediaTurnaround, g.turnaround) && quase(m.mediaResposta, g.resposta),
    `veio ${formatar(m.mediaEspera)} / ${formatar(m.mediaTurnaround)} / ${formatar(m.mediaResposta)}`
  );
}
const fcfsEsperado = [
  { pedido: "P1", inicio: 0, fim: 5 },
  { pedido: "P2", inicio: 5, fim: 8 },
  { pedido: "P3", inicio: 8, fim: 16 },
  { pedido: "P4", inicio: 16, fim: 18 },
];
verificar(
  "FCFS: linha do tempo igual à do contrato",
  JSON.stringify(fcfs(cenarioExemplo)) === JSON.stringify(fcfsEsperado)
);

// 2. As funções não alteram a lista recebida
titulo("2. Imutabilidade");
for (const cenario of CENARIOS) {
  const congelado = cenario.pedidos.map((p) => Object.freeze({ ...p }));
  Object.freeze(congelado);
  const antes = JSON.stringify(congelado);
  let erro = "";
  try {
    for (const g of GABARITO) calcularMetricas(congelado, g.rodar(congelado));
  } catch (e) {
    erro = e.message;
  }
  verificar(`${cenario.nome}: entrada intacta`, !erro && JSON.stringify(congelado) === antes, erro);
}

// 3. Coerência da linha do tempo em todos os cenários
titulo("3. Coerência da linha do tempo");
for (const cenario of CENARIOS) {
  for (const g of GABARITO) {
    const linha = g.rodar(cenario.pedidos);
    const problemas = [];
    linha.forEach((t, i) => {
      if (t.fim <= t.inicio) problemas.push(`trecho ${i} com duração ${t.fim - t.inicio}`);
      if (i > 0 && t.inicio < linha[i - 1].fim) problemas.push(`trecho ${i} sobrepõe o anterior`);
    });
    for (const p of cenario.pedidos) {
      const trechos = linha.filter((t) => t.pedido === p.id);
      const cozinhado = trechos.reduce((s, t) => s + t.fim - t.inicio, 0);
      if (cozinhado !== p.preparo) problemas.push(`${p.id} cozinhou ${cozinhado} de ${p.preparo}`);
      if (trechos.some((t) => t.inicio < p.chegada)) problemas.push(`${p.id} começou antes de chegar`);
    }
    verificar(`${cenario.nome} / ${g.nome}`, problemas.length === 0, problemas.join("; "));
  }
}

// 4. Cada cenário conta a história que promete
titulo("4. História de cada cenário");
function medias(id) {
  const pedidos = CENARIOS.find((c) => c.id === id).pedidos;
  const resultado = {};
  for (const g of GABARITO) resultado[g.nome] = calcularMetricas(pedidos, g.rodar(pedidos));
  return resultado;
}
{
  const m = medias("comboio");
  verificar(
    "Efeito comboio: SJF espera bem menos que o FCFS (menos da metade)",
    m["SJF"].mediaEspera < m["FCFS"].mediaEspera / 2,
    `FCFS ${formatar(m["FCFS"].mediaEspera)}, SJF ${formatar(m["SJF"].mediaEspera)}`
  );
}
{
  const m = medias("vip");
  const esperaVip = (nome) => m[nome].porPedido.find((p) => p.id === "P4").espera;
  verificar(
    "Cliente VIP: o VIP espera menos na Prioridade do que no FCFS e no SJF",
    esperaVip("Prioridade") < esperaVip("FCFS") && esperaVip("Prioridade") < esperaVip("SJF"),
    `FCFS ${esperaVip("FCFS")}, SJF ${esperaVip("SJF")}, Prioridade ${esperaVip("Prioridade")}`
  );
}
{
  const m = medias("parecidos");
  const rr = m["Round Robin (q=2)"];
  const outros = GABARITO.filter((g) => g.nome !== "Round Robin (q=2)").map((g) => m[g.nome]);
  verificar(
    "Pedidos parecidos: Round Robin tem a melhor resposta média",
    outros.every((o) => rr.mediaResposta < o.mediaResposta)
  );
  verificar(
    "Pedidos parecidos: Round Robin tem a pior espera média",
    outros.every((o) => rr.mediaEspera > o.mediaEspera)
  );
}

// 5. Casos de borda
titulo("5. Casos de borda");
const comFogaoVazio = [
  { id: "P1", prato: "Café", chegada: 0, preparo: 2, prioridade: 2 },
  { id: "P2", prato: "Bolo", chegada: 10, preparo: 3, prioridade: 2 },
];
for (const g of GABARITO) {
  verificar(
    `${g.nome}: fogão vazio de 2 a 10 não gera trecho`,
    JSON.stringify(g.rodar(comFogaoVazio)) ===
      JSON.stringify([{ pedido: "P1", inicio: 0, fim: 2 }, { pedido: "P2", inicio: 10, fim: 13 }])
  );
  verificar(`${g.nome}: lista vazia devolve linha vazia`, g.rodar([]).length === 0);
}
verificar(
  "Round Robin com quantum grande fica igual ao FCFS",
  JSON.stringify(roundRobin(cenarioExemplo, 100)) === JSON.stringify(fcfs(cenarioExemplo))
);
let quantumInvalido = false;
try {
  roundRobin(cenarioExemplo, 0);
} catch (e) {
  quantumInvalido = true;
}
verificar("Round Robin recusa quantum 0", quantumInvalido);
const foraDeOrdem = [cenarioExemplo[2], cenarioExemplo[0], cenarioExemplo[3], cenarioExemplo[1]];
verificar(
  "Pedidos fora de ordem na lista dão o mesmo resultado",
  GABARITO.every((g) => ordemNoFogao(g.rodar(foraDeOrdem)) === g.ordem)
);

// 6. Tabela de resultados de todos os cenários (vai para o relatório)
titulo("6. Resultados por cenário");
for (const cenario of CENARIOS) {
  const linhas = GABARITO.map((g) => {
    const linha = g.rodar(cenario.pedidos);
    const m = calcularMetricas(cenario.pedidos, linha);
    return [g.nome, ordemNoFogao(linha), formatar(m.mediaEspera), formatar(m.mediaTurnaround), formatar(m.mediaResposta)];
  });
  const cabecalho = ["Algoritmo", "Ordem no fogão", "Espera média", "Turnaround médio", "Resposta média"];
  console.log(`\n${cenario.nome}`);
  for (const valores of [cabecalho, ...linhas]) console.log("  " + valores.join(" | "));
}

// Resumo
titulo(falhas === 0 ? "Tudo certo ✔" : `${falhas} verificação(ões) falharam ✘`);
