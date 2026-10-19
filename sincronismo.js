// Tela de Sincronismo (Pessoa 4)
// Dois cozinheiros disputam um único forno. O forno é o recurso compartilhado
// e usar o forno é a região crítica. Com o mutex desligado acontece uma
// condição de corrida; com o mutex ligado, há exclusão mútua.
//
// A tela não usa threads nem temporizadores para a lógica: cada passo é
// calculado por executarPasso() e guardado numa lista (o histórico). Avançar
// e voltar é só mudar o índice dessa lista.
//
// Quem executa cada passo depende de quem faz o papel de escalonador: o
// revezamento fixo, um sorteio ou a própria turma, clicando no cozinheiro.
// Sem o mutex, o resultado muda conforme essa ordem.

const ASSAR_INSTANTES = 3;

// Programa de cada cozinheiro. Cada linha é uma "instrução".
const PROGRAMAS = {
  semMutex: [
    { op: "verificar", texto: "se forno está livre:" },
    { op: "colocar", texto: "    colocar prato no forno" },
    { op: "assar", texto: "    assar (3 instantes)" },
    { op: "retirar", texto: "    retirar prato" },
  ],
  comMutex: [
    { op: "lock", texto: "lock(forno)" },
    { op: "colocar", texto: "colocar prato no forno" },
    { op: "assar", texto: "assar (3 instantes)" },
    { op: "retirar", texto: "retirar prato" },
    { op: "unlock", texto: "unlock(forno)" },
  ],
};

const COZINHEIROS = [
  { id: "A", nome: "Cozinheira Ana", prato: "Pizza" },
  { id: "B", nome: "Cozinheiro Beto", prato: "Lasanha" },
];

function copiar(objeto) {
  return JSON.parse(JSON.stringify(objeto));
}

function estadoInicial(comMutex) {
  return {
    passo: 0,
    comMutex,
    vez: null, // quem executou neste passo
    cozinheiros: COZINHEIROS.map((c) => ({
      ...c,
      linha: 0, // próxima instrução a executar
      assado: 0, // instantes de forno já cumpridos
      estado: "pronto", // pronto | executando | bloqueado | terminado
      resultado: null, // null | "pronto" | "estragado"
    })),
    forno: {
      pratos: [], // ids de quem colocou prato
      trancadoPor: null, // id de quem tem o mutex
      filaEspera: [], // ids bloqueados esperando o mutex
    },
    prontos: 0,
    estragados: 0,
    erro: false,
    fim: false,
    mensagem: comMutex
      ? "Mutex ligado. Clique em Próximo passo para começar."
      : "Mutex desligado. Clique em Próximo passo para começar.",
  };
}

// Quem pode receber a vez: os cozinheiros que não estão bloqueados nem terminados.
function candidatosDaVez(estado) {
  return estado.cozinheiros.filter((c) => c.estado !== "bloqueado" && c.estado !== "terminado");
}

// As formas de escolher quem executa recebem o estado e quem executou por
// último, e devolvem um cozinheiro (ou null se ninguém pode executar).

// Revezamento entre os candidatos, como um escalonador Round Robin com quantum 1.
function escolherVez(estado, ultimo) {
  const candidatos = candidatosDaVez(estado);
  if (candidatos.length === 0) return null;
  if (candidatos.length === 1) return candidatos[0];
  const outro = candidatos.find((c) => c.id !== ultimo);
  return outro || candidatos[0];
}

// Sorteio entre os candidatos.
function escolherAoAcaso(estado) {
  const candidatos = candidatosDaVez(estado);
  if (candidatos.length === 0) return null;
  return candidatos[Math.floor(Math.random() * candidatos.length)];
}

// Escolha feita pela turma: dá a vez ao cozinheiro indicado, se ele puder executar.
function escolherCozinheiro(id) {
  return (estado) => candidatosDaVez(estado).find((c) => c.id === id) || null;
}

function primeiroNome(c) {
  return c.nome.split(" ")[1];
}

function executarPasso(anterior, ultimo, escolher = escolherVez) {
  const e = copiar(anterior);
  e.passo += 1;
  const programa = e.comMutex ? PROGRAMAS.comMutex : PROGRAMAS.semMutex;

  // Quem executou no passo anterior volta para "pronto".
  e.cozinheiros.forEach((c) => {
    if (c.estado === "executando") c.estado = "pronto";
  });

  const c = escolher(e, ultimo);
  if (!c) {
    e.fim = true;
    e.vez = null;
    return e;
  }
  c.estado = "executando";
  e.vez = c.id;
  const nome = primeiroNome(c);
  const instr = programa[c.linha];
  const forno = e.forno;
  e.cozinheiros.forEach((o) => (o.executou = null));
  c.executou = c.linha; // linha executada neste passo, para destacar na tela

  switch (instr.op) {
    case "verificar":
      if (forno.pratos.length === 0) {
        c.linha += 1;
        e.mensagem = `${nome} olhou o forno e viu que está livre. Vai colocar o prato.`;
      } else {
        e.mensagem = `${nome} olhou o forno, viu que está ocupado e vai olhar de novo.`;
      }
      break;

    case "colocar":
      forno.pratos.push(c.id);
      if (forno.pratos.length > 1) {
        // Condição de corrida: os dois entraram na região crítica.
        const outro = e.cozinheiros.find((o) => o.id !== c.id);
        e.erro = true;
        e.estragados = 2;
        e.cozinheiros.forEach((o) => {
          o.resultado = "estragado";
          o.estado = "terminado";
        });
        e.fim = true;
        e.mensagem =
          `${nome} colocou a ${c.prato.toLowerCase()}, mas a ${outro.prato.toLowerCase()} de ${primeiroNome(outro)} já estava no forno. ` +
          `Os dois olharam antes de qualquer um colocar, e os dois viram "livre". ` +
          `Isso é uma condição de corrida: os dois pratos estragaram.`;
        return e;
      }
      c.linha += 1;
      e.mensagem = `${nome} colocou a ${c.prato.toLowerCase()} no forno.`;
      break;

    case "assar":
      c.assado += 1;
      e.mensagem = `${nome} está assando a ${c.prato.toLowerCase()} (${c.assado}/${ASSAR_INSTANTES}).`;
      if (c.assado >= ASSAR_INSTANTES) c.linha += 1;
      break;

    case "retirar":
      forno.pratos = forno.pratos.filter((id) => id !== c.id);
      c.resultado = "pronto";
      e.prontos += 1;
      c.linha += 1;
      e.mensagem = `${nome} retirou a ${c.prato.toLowerCase()} pronta.`;
      break;

    case "lock":
      if (forno.trancadoPor === null) {
        forno.trancadoPor = c.id;
        c.linha += 1;
        e.mensagem = `${nome} trancou o forno (lock). Agora só ${nome} pode usá-lo.`;
      } else {
        c.estado = "bloqueado";
        forno.filaEspera.push(c.id);
        const dono = e.cozinheiros.find((o) => o.id === forno.trancadoPor);
        e.mensagem =
          `${nome} tentou trancar o forno, mas ${primeiroNome(dono)} já está com ele. ` +
          `${nome} fica bloqueado na fila do forno, sem gastar a vez.`;
      }
      break;

    case "unlock": {
      forno.trancadoPor = null;
      c.linha += 1;
      e.mensagem = `${nome} destrancou o forno (unlock).`;
      if (forno.filaEspera.length > 0) {
        const idProximo = forno.filaEspera.shift();
        const proximo = e.cozinheiros.find((o) => o.id === idProximo);
        proximo.estado = "pronto";
        proximo.linha += 1; // o lock que estava esperando foi concedido
        forno.trancadoPor = proximo.id;
        e.mensagem += ` ${primeiroNome(proximo)} saiu do bloqueio e ficou com o forno.`;
      }
      break;
    }
  }

  if (c.linha >= programa.length) c.estado = "terminado";
  if (e.cozinheiros.every((o) => o.estado === "terminado")) {
    e.fim = true;
    e.mensagem += e.comMutex
      ? " Fim: o mutex garantiu que só um cozinheiro usasse o forno por vez."
      : " Fim: os dois pratos saíram certos, mas foi sorte. Ninguém foi interrompido entre olhar e colocar.";
  }
  return e;
}

// Calcula o serviço inteiro de uma vez (revezamento ou sorteio).
function gerarHistorico(comMutex, escolher = escolherVez) {
  const historico = [estadoInicial(comMutex)];
  let ultimo = null;
  // No sorteio, quem espera o forno pode olhar muitas vezes; o limite só evita laço infinito.
  while (!historico[historico.length - 1].fim && historico.length < 300) {
    const prox = executarPasso(historico[historico.length - 1], ultimo, escolher);
    if (prox.vez) ultimo = prox.vez;
    historico.push(prox);
  }
  return historico;
}

// Roda vários serviços com o sorteio e conta em quantos os pratos estragaram.
function contarEstragos(vezes, comMutex) {
  let estragados = 0;
  for (let i = 0; i < vezes; i++) {
    const historico = gerarHistorico(comMutex, escolherAoAcaso);
    if (historico[historico.length - 1].erro) estragados += 1;
  }
  return estragados;
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

const ROTULO_ESTADO = {
  pronto: "Pronto (aguardando a vez)",
  executando: "Executando",
  bloqueado: "Bloqueado",
  terminado: "Terminado",
};

const tela = {
  historico: [],
  indice: 0,
  timer: null,
  politica: "turma", // quem escolhe a vez: turma | sorteio | revezamento
};

function el(id) {
  return document.getElementById(id);
}

function iniciar() {
  const comMutex = el("mutex").checked;
  pararAuto();
  if (tela.politica === "turma") {
    // A turma decide passo a passo, então o histórico cresce a cada escolha.
    const inicial = estadoInicial(comMutex);
    inicial.mensagem =
      `${comMutex ? "Mutex ligado" : "Mutex desligado"}. Vocês são o escalonador: ` +
      `clique em "Dar a vez" (ou aperte A / B) para escolher quem executa a próxima linha.`;
    tela.historico = [inicial];
  } else {
    tela.historico = gerarHistorico(comMutex, tela.politica === "sorteio" ? escolherAoAcaso : escolherVez);
  }
  tela.indice = 0;
  el("rotulo-mutex").textContent = comMutex ? "Mutex ligado" : "Mutex desligado";
  desenhar();
}

function desenharCozinheiro(c, estado) {
  const programa = estado.comMutex ? PROGRAMAS.comMutex : PROGRAMAS.semMutex;
  const card = el("coz-" + c.id);
  card.className = `cozinheiro estado-${c.estado}` + (c.resultado ? ` resultado-${c.resultado}` : "");
  card.querySelector(".coz-estado").textContent = ROTULO_ESTADO[c.estado];

  let resultado = "";
  if (c.resultado === "pronto") resultado = `${c.prato} pronta`;
  if (c.resultado === "estragado") resultado = `${c.prato} estragou`;
  card.querySelector(".coz-resultado").textContent = resultado;

  const lista = card.querySelector(".coz-codigo");
  lista.innerHTML = "";
  programa.forEach((instr, i) => {
    const li = document.createElement("li");
    li.textContent = instr.texto;
    if (i < c.linha) li.classList.add("feita");
    // Destaca a linha que acabou de rodar (quem tem a vez) ou a próxima.
    const rodou = c.executou !== null && c.executou !== undefined;
    if (rodou && i === c.executou) li.classList.add("atual");
    else if (!rodou && c.estado !== "terminado" && i === c.linha) li.classList.add("proxima");
    if (instr.op === "assar" && c.assado > 0) {
      li.textContent = `${instr.texto} [${c.assado}/${ASSAR_INSTANTES}]`;
    }
    lista.appendChild(li);
  });
}

function desenharForno(estado) {
  const f = estado.forno;
  const forno = el("forno");
  forno.classList.toggle("erro", estado.erro);
  forno.classList.toggle("ocupado", f.pratos.length > 0 && !estado.erro);

  let status = estado.comMutex ? "Vazio" : "Livre";
  if (estado.erro) status = "Dois pratos ao mesmo tempo!";
  else if (f.pratos.length > 0) {
    const c = estado.cozinheiros.find((o) => o.id === f.pratos[0]);
    status = `Ocupado: ${c.prato.toLowerCase()} de ${primeiroNome(c)}`;
  }
  el("forno-status").textContent = status;

  const pratos = el("forno-pratos");
  pratos.innerHTML = "";
  f.pratos.forEach((id) => {
    const c = estado.cozinheiros.find((o) => o.id === id);
    const span = document.createElement("span");
    span.className = `prato prato-${id}`;
    span.textContent = c.prato;
    pratos.appendChild(span);
  });

  const trava = el("forno-trava");
  trava.hidden = !estado.comMutex;
  if (estado.comMutex) {
    const dono = estado.cozinheiros.find((o) => o.id === f.trancadoPor);
    trava.textContent = dono ? `Trancado por ${primeiroNome(dono)}` : "Destrancado";
    trava.classList.toggle("trancado", !!dono);
  }

  const fila = el("forno-fila");
  fila.hidden = !estado.comMutex;
  if (estado.comMutex) {
    const nomes = f.filaEspera.map((id) => primeiroNome(estado.cozinheiros.find((o) => o.id === id)));
    fila.textContent = "Fila do forno: " + (nomes.length ? nomes.join(", ") : "vazia");
  }
}

function desenhar() {
  const estado = tela.historico[tela.indice];
  estado.cozinheiros.forEach((c) => desenharCozinheiro(c, estado));
  desenharForno(estado);

  const turma = tela.politica === "turma";
  el("passo").textContent = turma
    ? `Passo ${estado.passo}`
    : `Passo ${estado.passo} de ${tela.historico.length - 1}`;
  el("mensagem").textContent = estado.mensagem;
  el("mensagem").classList.toggle("erro", estado.erro);

  el("prontos").textContent = estado.prontos;
  el("estragados").textContent = estado.estragados;

  const resumo = el("resumo");
  resumo.hidden = !estado.fim;
  if (estado.fim) {
    if (estado.erro) {
      resumo.className = "resumo ruim";
      resumo.innerHTML =
        "<strong>Condição de corrida.</strong> Sem o mutex, verificar e colocar são dois passos separados. " +
        "O escalonador trocou de cozinheiro entre eles, e os dois entraram na região crítica juntos. " +
        "Ligue o mutex e rode de novo.";
    } else if (estado.comMutex) {
      resumo.className = "resumo bom";
      resumo.innerHTML =
        "<strong>Exclusão mútua.</strong> O lock deixou só um cozinheiro na região crítica por vez. " +
        "O outro ficou bloqueado, sem disputar a vez de executar, até o unlock. Os dois pratos saíram certos.";
    } else {
      resumo.className = "resumo sorte";
      resumo.innerHTML =
        "<strong>Deu certo, por sorte.</strong> Sem o mutex nada impede a troca de cozinheiro entre olhar e " +
        "colocar; desta vez ela só não aconteceu. Reinicie e tente outra ordem.";
    }
  }

  el("btn-proximo").hidden = turma;
  el("btn-auto").hidden = turma;
  document.querySelectorAll(".btn-vez").forEach((botao) => {
    botao.hidden = !turma;
    botao.disabled = estado.fim || !escolherCozinheiro(botao.dataset.coz)(estado);
  });

  el("btn-voltar").disabled = tela.indice === 0;
  el("btn-proximo").disabled = tela.indice === tela.historico.length - 1;
  el("btn-auto").disabled = tela.indice === tela.historico.length - 1;
  if (tela.indice === tela.historico.length - 1) pararAuto();
}

function proximo() {
  if (tela.indice < tela.historico.length - 1) {
    tela.indice += 1;
    desenhar();
  }
}

// A turma escolhe quem executa. Se voltou alguns passos, a escolha nova
// descarta os passos que vinham depois.
function darVez(id) {
  if (tela.politica !== "turma") return;
  const atual = tela.historico[tela.indice];
  const escolher = escolherCozinheiro(id);
  if (atual.fim || !escolher(atual)) return;
  tela.historico = tela.historico.slice(0, tela.indice + 1);
  tela.historico.push(executarPasso(atual, atual.vez, escolher));
  tela.indice += 1;
  desenhar();
}

function definirPolitica(politica) {
  tela.politica = politica;
  document.querySelectorAll("[data-politica]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.politica === politica));
  });
  iniciar();
}

// Mostra, em muitos serviços sorteados, quantos estragam com e sem o mutex.
function rodarExperimento() {
  const vezes = 100;
  el("experimento-resultado").hidden = false;
  mostrarBarra("sem", contarEstragos(vezes, false), vezes);
  mostrarBarra("com", contarEstragos(vezes, true), vezes);
}

function mostrarBarra(id, estragados, vezes) {
  el("barra-" + id).style.width = `${(estragados / vezes) * 100}%`;
  el("taxa-" + id).textContent = `${estragados} de ${vezes} estragaram`;
}

function voltar() {
  pararAuto();
  if (tela.indice > 0) {
    tela.indice -= 1;
    desenhar();
  }
}

function alternarAuto() {
  if (tela.timer) {
    pararAuto();
  } else {
    el("btn-auto").textContent = "Pausar";
    tela.timer = setInterval(proximo, 1200);
  }
}

function pararAuto() {
  if (tela.timer) clearInterval(tela.timer);
  tela.timer = null;
  const botao = document.getElementById("btn-auto");
  if (botao) botao.textContent = "Reproduzir";
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    el("mutex").addEventListener("change", iniciar);
    el("btn-proximo").addEventListener("click", proximo);
    el("btn-voltar").addEventListener("click", voltar);
    el("btn-reiniciar").addEventListener("click", iniciar);
    el("btn-auto").addEventListener("click", alternarAuto);
    el("btn-100").addEventListener("click", rodarExperimento);
    document.querySelectorAll("[data-politica]").forEach((b) => {
      b.addEventListener("click", () => definirPolitica(b.dataset.politica));
    });
    document.querySelectorAll(".btn-vez").forEach((b) => {
      b.addEventListener("click", () => darVez(b.dataset.coz));
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === "ArrowRight") proximo();
      if (ev.key === "ArrowLeft") voltar();
      if (ev.key === "a" || ev.key === "A") darVez("A");
      if (ev.key === "b" || ev.key === "B") darVez("B");
    });
    iniciar();
  });
}

if (typeof module !== "undefined") {
  module.exports = {
    gerarHistorico,
    executarPasso,
    escolherVez,
    escolherAoAcaso,
    escolherCozinheiro,
    contarEstragos,
    PROGRAMAS,
  };
}
