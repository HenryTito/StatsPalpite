# Segurança

Como o sistema se defende, e o que foi testado tentando quebrá-lo.

A suíte `tests/integration/security.test.js` é adversarial: cada teste é uma
tentativa de ataque. Ela roda junto com as demais, em `npm test`.

## Autenticação

| Ameaça | Defesa |
|---|---|
| Senha em texto no banco | bcrypt com 10 rounds; `User.toJSON()` remove o hash de toda resposta |
| Token forjado com `alg=none` | `jsonwebtoken` verifica a assinatura; algoritmo nenhum é aceito |
| Token assinado com outro segredo | mesma verificação |
| Segredo padrão em produção | o processo **se recusa a iniciar** se `JWT_SECRET` faltar, for igual ao padrão de desenvolvimento ou tiver menos de 32 caracteres |
| Sessão roubada vive para sempre | access token de 15 min; refresh de 30 dias, rotativo — usar o antigo depois da troca devolve 401 |
| Vazamento da tabela de sessões | só o hash SHA-256 do refresh token é gravado |
| Senha trocada sem derrubar invasor | redefinir a senha revoga todas as sessões abertas |

## Enumeração de contas

Descobrir quais e-mails estão cadastrados é o primeiro passo de um ataque
dirigido. Três caminhos foram fechados:

- **Login** devolve a mesma mensagem e o mesmo status para e-mail inexistente
  e senha errada.
- **Recuperação de senha** devolve a mesma mensagem exista ou não a conta.
- **Tempo de resposta.** Este é o sutil: comparar a senha contra uma string
  inventada faz o bcrypt rejeitar o formato e responder em 0 ms, enquanto uma
  conta real custa ~55 ms. A diferença é medível e denuncia o cadastro. O
  serviço compara contra um **hash legítimo** de uma senha descartável, então
  o custo é o mesmo nos dois caminhos. Há um teste que mede e falha se a razão
  entre os tempos passar de 3x.

## Escalação de privilégio

O cadastro aceita apenas `email`, `username`, `password`, `passwordConfirmation`
e `birthDate`. Mandar `role: "admin"` ou `points: 999999` no corpo não tem
efeito: o serviço monta o registro campo a campo. As rotas de administração
exigem `requireRole('admin')`.

## Injeção

Toda consulta passa pelo Sequelize com parâmetros ligados. A única consulta
crua é a busca por similaridade, e nela:

- o **nome da tabela** vem de uma lista fechada no próprio módulo, nunca da
  requisição;
- o **termo** entra por `replacements`, nunca por interpolação;
- o parâmetro `types` é validado contra `team|player|league|venue`.

## Força bruta

Limite de 20 requisições por 15 minutos nas rotas de credencial.

**A armadilha aqui era o `trust proxy`.** Com ele ligado, o Express acredita no
cabeçalho `X-Forwarded-For`; sem um proxy de verdade na frente, qualquer
cliente forja o próprio IP, ganha um balde novo a cada requisição e o limite
deixa de existir. O valor agora vem de `TRUST_PROXY_HOPS`, que é **0 por
padrão** — o cabeçalho é ignorado e vale o IP real da conexão. Quem faz o
deploy define 1 ao colocar nginx, Railway ou Render na frente.

## Entradas que derrubavam o servidor

Formato não é validade. Estas entradas passavam na validação de formato e
explodiam na consulta ao banco como erro 500:

| Entrada | Antes | Agora |
|---|---|---|
| `date=2026-13-45` | 500 | 422 |
| `date=2026-02-31` | 500 | 422 |
| `offset=99999999999999999999` | 500 | 422 |
| JSON malformado | 500 | 400 |
| corpo acima de 256 KB | — | 413 |
| busca com 10.000 caracteres | 200, varrendo à toa | 422 |
| comparar um time consigo mesmo | 200 com retrospecto falso | 422 |
| `days=99999999` na sincronização | janela inválida | 422 |

A validação de data compara os campos reconstruídos com o texto original: o
construtor de `Date` normaliza o excedente e transforma 31 de fevereiro em 3
de março calado.

## Transporte

`helmet` aplica os cabeçalhos de segurança do **RNF07**; HSTS só em produção,
onde há HTTPS de verdade. O CORS aceita todas as origens por padrão — o
consumidor é um app nativo — e se restringe com `CORS_ORIGINS` em produção.

Em build de release, o Android bloqueia tráfego em texto claro: a API precisa
estar atrás de HTTPS, que é o que o **RNF07** exige.

## Rastreabilidade

Cada login, logout, pedido de redefinição, visualização de estatística e ação
administrativa vira uma linha em `audit_logs`, com usuário, IP e recurso
(**RF28**). A gravação acontece depois da resposta sair e nunca derruba a
requisição: auditoria que atrasa o usuário acaba desligada.

## O que fica para as próximas sprints

- **Detecção de reuso de refresh token.** Hoje, reapresentar um token já
  rotacionado devolve 401. O passo seguinte é revogar a família inteira, que
  é o que transforma o reuso em sinal de roubo.
- **Redis para o rate limit.** Em memória, o limite vale por instância; com
  mais de um processo, o teto efetivo se multiplica. Entra junto com o
  **RNF02**, na Sprint 3.
- **Rotação de segredo do JWT** sem derrubar as sessões válidas.
