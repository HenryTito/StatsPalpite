# Regras de negócio e onde elas são garantidas

Validar na API é a primeira linha de defesa, não a única. Um script de
manutenção, um seed ou um bug numa sprint futura escrevem direto na tabela e
passam por cima dela. Por isso as invariantes que não podem ser violadas
estão **no banco**, e a suíte `tests/integration/businessRules.test.js` as
exercita escrevendo pelo caminho mais bruto possível — o model, sem passar
por serviço nenhum.

## Palpites

| Regra | Requisito | Onde é garantida |
|---|---|---|
| Um palpite por usuário por partida | implícito no RF09 | índice único `predictions_user_match_unique` |
| Aposta de 1 a 10 pontos | RF09 | `CHECK predictions_stake_range` |
| Sem palpite depois do apito inicial | RF44 | gatilho `predictions_kickoff_guard` |
| Sem palpite em partida ao vivo ou encerrada | RF44 | mesmo gatilho, pela situação da partida |
| Palpite perdido não credita pontos | RF10 | `CHECK predictions_status_consistency` |
| Palpite ganho credita acima de zero | RF10 | mesmo CHECK |
| Palpite pendente não tem pontos nem data de apuração | RF10 | mesmo CHECK |
| Placar palpitado não é negativo | — | `CHECK predictions_predicted_goals_non_negative` |

**Por que o gatilho confere duas coisas.** O horário de início sozinho não
basta: uma partida marcada como ao vivo pela fonte, com horário ainda no
futuro por desencontro de relógio, passaria por uma checagem apenas de
tempo. O gatilho recusa o palpite pendente se a partida já começou **ou** se
a situação dela não é `scheduled` nem `postponed`.

**Condição de corrida.** Duas requisições simultâneas do mesmo usuário na
mesma partida: o índice único resolve no banco, uma vence e a outra recebe
409. Há um teste que dispara as duas em paralelo e confere que sobrou uma.

## Pontuação e ranking

| Regra | Requisito | Onde é garantida |
|---|---|---|
| Pontuação do usuário nunca fica negativa | — | `CHECK users_points_non_negative` |
| Pontuação do perfil é a soma dos palpites apurados | RF10, RF11 | derivada no seed e verificada por teste |
| Posição no ranking começa em 1 | RF11 | `CHECK ranking_snapshots_valid` |
| Um retrato de ranking por usuário por dia | RF71 | índice único `ranking_snapshots_user_day_unique` |

**Sobre a pontuação derivada.** O seed não fixa números escolhidos a dedo. Um
usuário com 1204 pontos no perfil cujos palpites somam 44 é uma incoerência
que qualquer consulta revela, e o ranking deixa de significar alguma coisa. A
pontuação é calculada a partir dos palpites apurados, que é exatamente o que
a apuração da Sprint 2 fará a cada partida encerrada.

## Partidas

| Regra | Onde é garantida |
|---|---|
| Placar não é negativo | `CHECK matches_goals_non_negative` |
| Minuto entre 0 e 130 | `CHECK matches_minute_range` |
| Um time não joga contra si mesmo | `CHECK matches_distinct_teams` |
| Partida ao vivo já começou | gerador de dados + teste de coerência |
| Partida agendada não tem placar | gerador de dados + teste de coerência |
| Partida encerrada tem placar | teste de coerência |

## Conta

| Regra | Requisito | Onde é garantida |
|---|---|---|
| Idade mínima de 18 anos | RF31 | serviço, com a data calculada no servidor em UTC |
| E-mail único | RF01 | índice único |
| Nome de usuário único | RF34 | índice único |
| Nome de usuário sem termo bloqueado | RF34 | serviço, com lista e regex |
| Link de redefinição vale 15 minutos | RF02 | serviço, com `expiresAt` conferido na troca |
| Link de redefinição serve uma vez só | RF02 | `usedAt` marcado na troca |

## O que fica para a Sprint 2

Estas regras estão no documento de requisitos mas pertencem a requisitos da
próxima sprint. Ficam registradas aqui para não se perderem:

- **Orçamento diário de pontos (RF50).** O teto por dia depende de uma soma
  agregada por usuário e por data, que um `CHECK` não expressa. Vai no serviço
  de registro de palpite, com teste. O seed respeita o teto — nenhum usuário
  passa de 30 pontos em um dia.
- **Pontuação por placar exato paga 5x (RF10).** O seed implementa o acerto
  do vencedor, que paga 2x. A apuração completa entra junto com o cálculo
  automático ao fim da partida.
- **Cancelamento com confirmação em duas etapas (RF44).** A janela de tempo já
  é garantida pelo gatilho; falta o fluxo na interface.
