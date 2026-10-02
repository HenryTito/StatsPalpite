# Sprint 1 — estado de entrega

Os 32 itens do backlog, com onde cada um foi implementado e como foi
verificado. Pontos e horas vêm da planilha `backlog-statspalpite`.

## Backend (19 itens)

| Item | Req. | Onde | Verificação |
|---|---|---|---|
| B001 | RNF05 | `backend/src/` em MVC, Sequelize, 6 migrations | esquema aplicado pelas migrations |
| B002 | RF01 | `services/authService.js` | 11 testes de integração |
| B003 | RF76 | `services/tokenService.js` | rotação e reuso cobertos por teste |
| B004 | RF31 | `utils/age.js` | 6 testes unitários, incluindo virada de fuso |
| B005 | RF34 | `utils/username.js` | 6 testes unitários |
| B006 | RF02 | `authService` + `mailService` | validade de 15 min verificada |
| B008 | — | `providers/IngestionEngine.js` | 10 testes unitários |
| B009 | RNF03 | `app.js` (compression) + cache TTL | cache verificado por teste |
| B010 | RF03 | `services/matchService.js` + `probabilityService.js` | soma 100 verificada |
| B011 | RF04 | `matchService.getMatchDetail` | 6 testes de integração |
| B012 | RF15 | `providers/weather/` | incluído no detalhe |
| B013 | RF36 | `models/injury.js` + ingestão | incluído no detalhe |
| B014 | RF62 | `models/referee.js` | médias no detalhe |
| B015 | RNF11 | fallback do `IngestionEngine` | 3 testes de fallback |
| B018 | RF06 | `matchService.headToHead` | simetria verificada |
| B021 | RF27 | `services/searchService.js` | busca sem acento verificada |
| B022 | RF56 | `searchService.searchPlayers` | estatísticas verificadas |
| B030 | RF53 | `services/digestService.js` | agregação verificada |
| B031 | RF77 | `digestService.getPreviousRoundBulletin` | separação de acertos e erros |
| B032 | RF71 | `services/rankingService.js` | série de 30 dias verificada |

## App (11 itens)

| Item | Req. | Onde | Verificação |
|---|---|---|---|
| B016 | — | `core/ui/ComparisonPanel.tsx` | usado por RF04, RF06 e RF37 |
| B017 | RF37 | `CompararTimesScreen` com barras | renderizado nos 3 Androids |
| B019 | RF43 | `hooks/useCountdown.ts` + notificação local | 7 testes unitários |
| B020 | RF48 | `modules/sync/useForegroundSync.ts` | intervalo de 5 min, pausa em background |
| B023 | RF49 | `MapaEstadiosScreen` com react-native-maps | marcadores e GPS opcional |
| B024 | RF75 | `core/i18n/` pt/en | **verificado ao vivo**: app abriu em inglês no emulador en-US |
| B025 | RNF01 | `navigation/lazy.tsx` | 13 telas fora do caminho crítico |
| B026 | RNF06 | — | **3 emuladores**: Android 11, 12 e 13 |
| B027 | RNF08 | `core/observability/sentry.ts` + `ErrorBoundary` | inerte sem DSN |
| B029 | RF54 | `modules/share/sharePrediction.ts` | captura e compartilha PNG |
| — | RF27/RF56 | `BuscaScreen` | busca global e de jogador |

## Entrega (2 itens)

| Item | Req. | Onde |
|---|---|---|
| B007 | RNF04 | `CONTRIBUTING.md`, `.github/pull_request_template.md`, branches por feature |
| B028 | RNF09 | `fastlane/Fastfile` com 6 lanes, sintaxe validada |

## Verificação em dispositivos (RNF06)

| Versão | API | Resolução | Densidade | Resultado |
|---|---|---|---|---|
| Android 11 | 30 | 1080×2280 | 440dpi | sem quebra de layout |
| Android 12 | 31 | 1080×2400 | 420dpi | sem quebra de layout |
| Android 13 | 33 | 1080×2220 | 440dpi | sem quebra de layout |

## Problemas encontrados e corrigidos

1. **Normalização do confronto direto** (`probabilityService`) — um retrospecto
   parelho devolvia 0,44 em vez de 0,5, porque dividia pelo máximo teórico de
   pontos em vez da soma dos dois lados. Em jogos equilibrados isso invertia o
   favorito na Home.

2. **Semântica de lista vazia** (`IngestionEngine`) — `[]` significava "todas"
   num ponto e "nenhuma" em outro. Agora `null` pede todas e `[]` pede nenhuma,
   nos três adapters.

3. **Crash no arranque com `expo-notifications`** — descoberto ao rodar no
   Android 11. Desde o SDK 53 o módulo lança ao ser avaliado dentro do Expo Go,
   porque registra um listener de push remoto que o Expo Go deixou de suportar.
   A primeira correção — `require` dentro de try/catch — **não resolveu**: o
   erro nasce de forma assíncrona dentro da inicialização do módulo, então o
   catch nunca é alcançado. A correção boa verifica o ambiente com
   `expo-constants` ANTES de importar, e no Expo Go o módulo nem é tocado.

4. **Rate limiter derrubava a própria suíte de testes** — o teto de 20
   requisições por 15 minutos nas rotas de credencial ficava ativo em teste, e
   da 21ª chamada em diante tudo virava 429, mascarando 11 asserções de
   negócio. Os limitadores foram extraídos para `middlewares/rateLimiters.js`,
   desligados em teste, e cobertos por um teste próprio que os liga
   explicitamente num app mínimo.

5. **Teclado cobria o botão de entrar** — com o teclado aberto, o layout
   comprimia e o aviso legal do rodapé subia por cima do botão "Entrar",
   deixando-o inalcançável. Resolvido com `KeyboardAvoidingView` e `ScrollView`.

6. **Strings do card de partida fora do i18n** — "Ao vivo" e "Confiança"
   estavam fixas em português e apareciam em meio à interface em inglês. O
   adaptador `toPartida` passou a receber o tradutor da tela.

## Auditoria de segurança

Uma rodada adversarial contra a API no ar encontrou sete problemas, todos
corrigidos e cobertos por teste. O detalhamento está em
`backend/docs/seguranca.md`.

| # | Problema | Gravidade |
|---|---|---|
| 1 | `trust proxy` ligado sem proxy: forjar `X-Forwarded-For` burlava o limite de tentativas de login | alta — força bruta sem teto |
| 2 | Token de redefinição de senha devolvido no corpo da resposta sempre que `NODE_ENV` não fosse `production` | alta — tomada de conta |
| 3 | `JWT_SECRET` com valor padrão: subir sem a variável aceitava tokens assinados por qualquer um | alta |
| 4 | Enumeração de contas por tempo de resposta: hash de reserva malformado respondia em 0 ms contra 55 ms de uma conta real | média |
| 5 | Datas com formato válido e inexistentes no calendário derrubavam a consulta com 500 | média — indisponibilidade |
| 6 | Retrospecto do confronto direto truncado pelo limite da lista: anunciava 10 confrontos onde havia 20 | média — dado errado na tela |
| 7 | Percentuais da comunidade somavam 99 ou 101; a barra de comparação estourava o contêiner em 67/133 | baixa — visível ao usuário |

Resistiram à primeira tentativa, sem precisar de correção: injeção de SQL,
escalação de privilégio pelo corpo do cadastro, JWT com `alg=none`, JWT
assinado com outro segredo, acesso a rota de administração sem papel, e
vazamento de hash de senha nas respostas.

## Limitações declaradas

- **Notificação local do RF43 exige development build.** Com Expo Go o
  agendamento é desativado em silêncio, com um aviso no console em
  desenvolvimento; o resto do app funciona. `npx expo run:android` ou um build
  EAS resolve.
- **Fastlane não foi executado aqui** — falta Ruby na máquina. A sintaxe dos
  três arquivos foi validada com `ruby -c`.
- **Registro de palpite e cálculo de pontuação (`RF09`, `RF10`) são da Sprint
  2.** A tabela `predictions` existe porque o resumo diário e o ranking agregam
  sobre ela, e o seed a popula para que os números sejam reais.
