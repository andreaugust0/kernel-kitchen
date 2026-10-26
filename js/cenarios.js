// Cenários fixos (Pessoa 1)
// Cada cenário é uma lista de pedidos escrita à mão. Prioridade menor = mais
// urgente (1 = VIP, 2 = comum, 3 = delivery).
//
// CENARIOS reúne o exemplo do contrato e os três cenários de comparação.
// "descricao" diz o que o cenário mostra; "conclusao" é a frase que a tela
// de Comparação exibe embaixo da tabela de métricas.

const cenarioExemplo = [
  { id: "P1", prato: "Lasanha",  chegada: 0, preparo: 5, prioridade: 2 },
  { id: "P2", prato: "Omelete",  chegada: 1, preparo: 3, prioridade: 1 },
  { id: "P3", prato: "Feijoada", chegada: 2, preparo: 8, prioridade: 3 },
  { id: "P4", prato: "Salada",   chegada: 3, preparo: 2, prioridade: 2 },
];

const CENARIOS = [
  {
    id: "exemplo",
    nome: "Exemplo do contrato",
    descricao: "Os quatro pedidos usados para conferir os algoritmos com o gabarito.",
    conclusao:
      "O SJF teve a menor espera média e o Round Robin a melhor resposta, mas a pior espera.",
    pedidos: cenarioExemplo,
  },
  {
    id: "comboio",
    nome: "Efeito comboio",
    descricao: "Um pedido longo chega primeiro e vários pedidos curtos chegam logo atrás.",
    conclusao:
      "O pedido longo que chegou primeiro segurou todos os outros no FCFS; o SJF atendeu os curtos antes e derrubou a espera.",
    pedidos: [
      { id: "P1", prato: "Feijoada",  chegada: 0, preparo: 10, prioridade: 2 },
      { id: "P2", prato: "Suco",      chegada: 0, preparo: 1,  prioridade: 2 },
      { id: "P3", prato: "Torrada",   chegada: 1, preparo: 2,  prioridade: 2 },
      { id: "P4", prato: "Café",      chegada: 1, preparo: 1,  prioridade: 2 },
      { id: "P5", prato: "Ovo frito", chegada: 2, preparo: 3,  prioridade: 2 },
    ],
  },
  {
    id: "vip",
    nome: "Cliente VIP",
    descricao: "Um pedido de prioridade 1 chega depois de outros que já estão no balcão.",
    conclusao:
      "Só o algoritmo de Prioridade passou o Filé do cliente VIP na frente; no FCFS ele esperou atrás de todos.",
    pedidos: [
      { id: "P1", prato: "Lasanha",   chegada: 0, preparo: 4, prioridade: 2 },
      { id: "P2", prato: "Risoto",    chegada: 1, preparo: 5, prioridade: 2 },
      { id: "P3", prato: "Bolo",      chegada: 1, preparo: 3, prioridade: 3 },
      { id: "P4", prato: "Filé VIP",  chegada: 2, preparo: 4, prioridade: 1 },
    ],
  },
  {
    id: "parecidos",
    nome: "Pedidos parecidos",
    descricao: "Pedidos com preparos próximos que chegam quase juntos.",
    conclusao:
      "O Round Robin começou todos os pedidos rápido (melhor resposta), mas ficou alternando entre eles e teve a pior espera.",
    pedidos: [
      { id: "P1", prato: "Pizza",       chegada: 0, preparo: 4, prioridade: 2 },
      { id: "P2", prato: "Hambúrguer",  chegada: 0, preparo: 5, prioridade: 2 },
      { id: "P3", prato: "Macarrão",    chegada: 1, preparo: 4, prioridade: 2 },
      { id: "P4", prato: "Strogonoff",  chegada: 1, preparo: 5, prioridade: 2 },
      { id: "P5", prato: "Frango",      chegada: 2, preparo: 4, prioridade: 2 },
    ],
  },
];
