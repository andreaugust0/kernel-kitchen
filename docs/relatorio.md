# Chef Escalonador: escalonamento de processos e sincronismo em uma cozinha de restaurante

**Disciplina:** [preencher] · **Professor(a):** [preencher] · **Data:** [preencher]

**Integrantes:** [Pessoa 1], [Pessoa 2], [Pessoa 3], [Pessoa 4]

> Rascunho montado pela Pessoa 4. Trechos entre colchetes e marcados com **PENDENTE** são da pessoa indicada. Os demais estão escritos e podem ser revisados por todos.

---

## 1. Introdução

O escalonador de CPU decide qual processo da fila de pronto vai executar em seguida. A escolha do algoritmo muda o tempo que cada processo espera, o tempo total até terminar e a rapidez com que ele começa a ser atendido. Quando vários processos usam o mesmo recurso, também é preciso garantir que não o usem ao mesmo tempo de forma errada, o que é papel do sincronismo.

O Chef Escalonador é um jogo web que mostra esses dois conceitos com a analogia de uma cozinha de restaurante. O objetivo é que o usuário veja, passo a passo, como cada algoritmo organiza os pedidos e o que acontece quando dois cozinheiros disputam o mesmo forno.

O projeto tem três telas:

- **Modo Aula:** executa um algoritmo passo a passo, com os estados dos pedidos e o gráfico de Gantt.
- **Comparação:** roda FCFS, SJF, Prioridade e Round Robin com os mesmos pedidos e compara as métricas.
- **Sincronismo:** mostra uma condição de corrida e a solução com mutex.

Foi feito em HTML, CSS e JavaScript, sem framework e sem servidor; basta abrir o `index.html` no navegador.

## 2. A analogia da cozinha

| Na cozinha | No sistema operacional |
| --- | --- |
| Pedido | Processo |
| Fogão | CPU |
| Balcão de comandas | Fila de pronto |
| Hora em que o pedido chega | Tempo de chegada |
| Tempo de preparo | Tempo de burst (uso de CPU) |
| Tipo de cliente (VIP, comum, delivery) | Prioridade |
| Pedido entregue | Processo terminado |
| Forno compartilhado | Recurso compartilhado |
| Usar o forno | Região crítica |
| Trava do forno | Mutex |

Cada pedido passa pelos estados do processo:

- **Novo:** o pedido ainda não chegou ao balcão.
- **Pronto:** está no balcão esperando o fogão.
- **Executando:** está no fogão.
- **Bloqueado:** espera um recurso, como o forno ocupado (usado na tela de Sincronismo).
- **Terminado:** foi entregue ao cliente.

## 3. Algoritmos de escalonamento

> **PENDENTE (Pessoa 1):** revisar as descrições abaixo e confirmar que batem com o código em `algoritmos.js`.

### 3.1 FCFS (First Come, First Served)

Atende os pedidos na ordem de chegada, sem interromper. É o mais simples, mas sofre do **efeito comboio**: um pedido longo que chega primeiro faz todos os curtos esperarem.

### 3.2 SJF (Shortest Job First)

Quando o fogão libera, escolhe, entre os pedidos que já chegaram, o de menor tempo de preparo. Na versão do projeto ele não é preemptivo: o pedido no fogão vai até o fim. Minimiza a espera média, mas um pedido longo pode esperar muito se sempre chegarem pedidos curtos (**inanição**).

### 3.3 Prioridade

Escolhe o pedido de maior prioridade entre os que já chegaram; no projeto, número menor significa mais urgente (1 = VIP, 2 = comum, 3 = delivery). Também não é preemptivo. Pode causar inanição dos pedidos de baixa prioridade; a solução usual é o **envelhecimento** (aging), que aumenta a prioridade de quem espera muito.

### 3.4 Round Robin

Cada pedido usa o fogão por no máximo um **quantum** de tempo. Se não terminar, volta para o fim da fila. É preemptivo e dá a melhor resposta (todos começam logo), mas aumenta a espera total e o número de trocas de contexto. Um quantum muito grande faz o Round Robin virar FCFS; um muito pequeno gasta tempo demais trocando de pedido.

### 3.5 Métricas

- **Turnaround** = instante de término − instante de chegada.
- **Espera** = turnaround − tempo de preparo.
- **Resposta** = instante em que começa no fogão pela primeira vez − instante de chegada.

## 4. Implementação

Os algoritmos não rodam em tempo real. Cada um é uma função que recebe a lista de pedidos e devolve a linha do tempo pronta, uma lista de trechos `{ pedido, inicio, fim }`. As telas só leem essa linha do tempo e desenham o estado em cada instante. Isso separou a lógica da interface e permitiu que o grupo trabalhasse em paralelo.

| Arquivo | Conteúdo | Responsável |
| --- | --- | --- |
| `algoritmos.js`, `metricas.js`, `cenarios.js` | Algoritmos, métricas e cenários de teste | [Pessoa 1] |
| `aula.html`, `aula.js`, `gantt.js`, `estilo.css` | Modo Aula, gráfico de Gantt e estilo comum | [Pessoa 2] |
| `index.html`, `comparacao.html`, `comparacao.js` | Página inicial e tela de Comparação | [Pessoa 3] |
| `sincronismo.html`, `sincronismo.js`, `sincronismo.css` | Tela de Sincronismo | [Pessoa 4] |

### 4.1 Modo Aula

> **PENDENTE (Pessoa 2):** um parágrafo sobre a tela (o que o usuário escolhe, como avança e volta, como o estado de cada pedido é obtido da linha do tempo) e uma captura de tela.

### 4.2 Comparação

> **PENDENTE (Pessoa 3):** um parágrafo sobre a tela (Gantts empilhados, tabela de métricas, destaque do melhor valor) e uma captura de tela.

### 4.3 Sincronismo

A tela mostra dois cozinheiros, Ana e Beto, que precisam assar um prato no mesmo forno. Cada um segue um pequeno programa, exibido ao lado como pseudocódigo, com a linha atual destacada. A vez de executar alterna entre os dois a cada passo, como um Round Robin com quantum de uma instrução.

A cada passo a tela mostra o estado de cada cozinheiro (pronto, executando, bloqueado ou terminado), o que está no forno, quem está com a trava e a fila de espera do forno. Uma chave liga e desliga o mutex, e o usuário pode avançar, voltar, reproduzir automaticamente e reiniciar. Assim como nas outras telas, o histórico completo é calculado de uma vez e os botões só mudam o passo exibido.

[Captura de tela: mutex desligado, passo 4]

[Captura de tela: mutex ligado, passo 2, com Beto bloqueado]

## 5. Sincronismo

### 5.1 Sem mutex: condição de corrida

Sem trava, o programa de cada cozinheiro é:

```
se forno está livre:
    colocar prato no forno
    assar (3 instantes)
    retirar prato
```

O problema é que verificar e colocar são dois passos separados. A execução fica assim:

| Passo | Quem executa | O que acontece |
| --- | --- | --- |
| 1 | Ana | Olha o forno: livre |
| 2 | Beto | Olha o forno: ainda livre, porque Ana não colocou nada |
| 3 | Ana | Coloca a pizza |
| 4 | Beto | Coloca a lasanha: dois pratos no forno, os dois estragam |

Os dois entraram na região crítica ao mesmo tempo. O resultado depende da ordem em que o escalonador intercalou os passos, o que caracteriza uma **condição de corrida**.

### 5.2 Com mutex: exclusão mútua

Com o mutex, o programa vira:

```
lock(forno)
colocar prato no forno
assar (3 instantes)
retirar prato
unlock(forno)
```

| Passo | Quem executa | O que acontece |
| --- | --- | --- |
| 1 | Ana | `lock`: pega a trava do forno |
| 2 | Beto | `lock`: a trava está com Ana, então Beto fica **bloqueado** na fila do forno |
| 3 a 7 | Ana | Coloca, assa por 3 instantes e retira a pizza. Beto, bloqueado, não recebe a vez |
| 8 | Ana | `unlock`: solta a trava; Beto é acordado e recebe a trava |
| 9 a 14 | Beto | Coloca, assa e retira a lasanha, depois faz `unlock` |

Resultado: dois pratos prontos e nenhum estragado. O `lock` é uma operação atômica, que verifica e tranca de uma vez, então não há como os dois verem o forno livre ao mesmo tempo. O passo 2 também mostra o estado **bloqueado**: enquanto espera o recurso, o processo sai da disputa pela CPU, e por isso Ana executa vários passos seguidos.

## 6. Resultados

Cenário de exemplo usado para validar os algoritmos:

| Pedido | Prato | Chegada | Preparo | Prioridade |
| --- | --- | --- | --- | --- |
| P1 | Lasanha | 0 | 5 | 2 |
| P2 | Omelete | 1 | 3 | 1 |
| P3 | Feijoada | 2 | 8 | 3 |
| P4 | Salada | 3 | 2 | 2 |

| Algoritmo | Ordem no fogão | Espera média | Turnaround médio | Resposta média |
| --- | --- | --- | --- | --- |
| FCFS | P1, P2, P3, P4 | 5,75 | 10,25 | 5,75 |
| SJF | P1, P4, P2, P3 | 4,00 | 8,50 | 4,00 |
| Prioridade | P1, P2, P4, P3 | 4,25 | 8,75 | 4,25 |
| Round Robin (quantum 2) | P1, P2, P3, P1, P4, P2, P3, P1, P3 | 7,25 | 11,75 | 2,00 |

O SJF teve a menor espera média, como a teoria prevê. O Round Robin teve a pior espera, mas a melhor resposta: em média, cada pedido começou a ser preparado 2 instantes depois de chegar, contra 5,75 no FCFS.

> **PENDENTE (Pessoa 1 e Pessoa 3):** tabela de resultados dos três cenários do `cenarios.js` (efeito comboio, cliente VIP, pedidos parecidos), com uma frase de conclusão para cada um.

## 7. Conclusão

O jogo mostra que não existe algoritmo de escalonamento melhor em tudo. O SJF reduz a espera média, mas precisa conhecer o tempo de preparo e pode deixar pedidos longos esperando. A Prioridade atende primeiro quem é mais importante, com o mesmo risco para os demais. O Round Robin é o mais justo na resposta, ao custo de mais espera total e mais trocas. O FCFS é simples, mas sofre com o efeito comboio.

Na parte de sincronismo, a tela mostra que verificar um recurso e depois usá-lo, em dois passos, não é seguro quando outro processo pode executar no meio. O mutex resolve isso com uma operação atômica e coloca quem chega depois no estado bloqueado.

A analogia da cozinha ajudou a tornar visíveis conceitos que normalmente aparecem só em tabelas e diagramas.

> **PENDENTE (todos):** uma frase cada sobre o que aprendeu ou a principal dificuldade da sua parte.

## Referências

- SILBERSCHATZ, A.; GALVIN, P. B.; GAGNE, G. *Fundamentos de Sistemas Operacionais*. 9. ed. Rio de Janeiro: LTC, 2015.
- TANENBAUM, A. S.; BOS, H. *Sistemas Operacionais Modernos*. 4. ed. São Paulo: Pearson, 2016.
