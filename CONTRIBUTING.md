# Fluxo de trabalho

Atende ao **RNF04**: repositório privado, uma branch por funcionalidade e
revisão por pull request.

## Branches

`main` é protegida: nada entra nela por push direto, só por pull request.

Nome da branch pelo item do backlog, que torna o histórico rastreável até o
requisito:

```
feat/B010-partidas-do-dia
feat/B021-busca-global
fix/B008-cache-ttl
docs/RNF10-guia-de-ambiente
```

| Prefixo | Quando |
|---|---|
| `feat/` | item novo do backlog |
| `fix/` | correção de comportamento |
| `refactor/` | mudança interna sem efeito visível |
| `docs/` | só documentação |
| `chore/` | dependências, configuração, build |

## Ciclo

```bash
git switch main && git pull
git switch -c feat/B0XX-descricao-curta

# ... trabalho ...

npm run type-check && npm run lint && npm test
cd backend && npm test && cd ..

git push -u origin feat/B0XX-descricao-curta
gh pr create --fill
```

## Mensagem de commit

Primeira linha no imperativo, até 72 caracteres, sem ponto final. O corpo
explica **por que**, não o que — o diff já mostra o que mudou.

```
Corrigir normalização do confronto direto

Um retrospecto parelho (2 vitórias para cada lado e 2 empates) devolvia
0.44 em vez de 0.5, porque a conta dividia pelo máximo teórico de pontos
em vez da soma dos dois lados. Em jogos equilibrados isso invertia o
favorito na Home.
```

## Revisão

Todo pull request precisa de uma aprovação antes do merge. Quem revisa
confere, no mínimo:

- o item do backlog declarado está de fato implementado;
- os três comandos de verificação passam;
- não há valor hexadecimal solto nas telas nem regra de negócio no controller;
- mudança de endpoint veio com `backend/docs/api.md` atualizado.

Merge por *squash*, para que cada item do backlog vire um commit em `main`.
