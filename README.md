# Sistema de Chamados

API REST de chamados de suporte feita com NestJS, Prisma e MySQL (Docker Compose).
Trabalho do SENAI, baseado no exemplo de API de tarefas do professor.

## Requisitos

- Node.js 22 ou superior e npm
- Docker (com Docker Compose)

## Como executar

```bash
npm install
cp .env.example .env        # no Windows (cmd): copy .env.example .env
docker compose up -d        # sobe o MySQL (aguarde uns 20 segundos)
npx prisma migrate deploy   # cria as tabelas
npx prisma generate         # gera o client do Prisma
npm run start:dev           # API em http://localhost:3000
```

A senha do `.env` precisa ser a mesma do `docker-compose.yml` (`MYSQL_ROOT_PASSWORD`).
A porta 3306 não pode estar em uso por outro MySQL na máquina.

## Rotas

| Método | Rota | Ação |
|---|---|---|
| POST, GET | `/pessoas` | Cadastra e lista pessoas |
| GET, PATCH, DELETE | `/pessoas/:id` | Busca, atualiza (nome, e-mail, ativo) e remove |
| POST, GET | `/tipos-problema` | Cadastra e lista tipos de problema |
| GET, PATCH, DELETE | `/tipos-problema/:id` | Busca, atualiza (nome, ativo) e remove |
| POST | `/chamados` | Abre um chamado |
| GET | `/chamados` | Lista, com filtros `situacao`, `prioridade`, `tipoProblemaId` e `tecnicoId` |
| GET | `/chamados/:id` | Busca o chamado com seus comentários |
| PATCH | `/chamados/:id/tecnico` | Designa (ou troca) o técnico |
| PATCH | `/chamados/:id/situacao` | Muda a situação |
| POST, GET | `/chamados/:id/comentarios` | Registra e lista comentários |

Valores aceitos: tipo da pessoa `SOLICITANTE` ou `TECNICO`; prioridade `BAIXA`, `MEDIA`, `ALTA` ou `CRITICA`;
situação `ABERTO`, `EM_ATENDIMENTO`, `RESOLVIDO`, `FECHADO` ou `CANCELADO`.

Como não há autenticação, quem faz a ação vai no corpo da requisição: `solicitanteId`, `tecnicoId` e `autorId`.

## Exemplo de teste com curl

```bash
curl -X POST localhost:3000/pessoas -H 'Content-Type: application/json' \
  -d '{"nome":"Ana","email":"ana@empresa.com","tipo":"SOLICITANTE"}'

curl -X POST localhost:3000/pessoas -H 'Content-Type: application/json' \
  -d '{"nome":"Caio","email":"caio@empresa.com","tipo":"TECNICO"}'

curl -X POST localhost:3000/tipos-problema -H 'Content-Type: application/json' \
  -d '{"nome":"Rede"}'

curl -X POST localhost:3000/chamados -H 'Content-Type: application/json' \
  -d '{"titulo":"Sem internet","descricao":"A internet caiu na minha sala","solicitanteId":1,"tipoProblemaId":1}'

curl -X PATCH localhost:3000/chamados/1/tecnico -H 'Content-Type: application/json' \
  -d '{"tecnicoId":2}'

curl -X POST localhost:3000/chamados/1/comentarios -H 'Content-Type: application/json' \
  -d '{"autorId":2,"texto":"Estou verificando o roteador"}'

curl -X PATCH localhost:3000/chamados/1/situacao -H 'Content-Type: application/json' \
  -d '{"situacao":"RESOLVIDO"}'

curl "localhost:3000/chamados?situacao=RESOLVIDO"
```

No PowerShell do Windows, use `curl.exe` e o Insomnia ou o Postman para facilitar o JSON.

## Regras principais implementadas

- E-mail da pessoa único e válido; pessoa inativa não abre, não é designada e não comenta.
- Pessoa envolvida em chamado ou comentário, e tipo de problema já usado, não podem ser removidos, só desativados.
- Tipo de problema desativado não aceita novos chamados.
- O chamado nasce `ABERTO`, sem técnico; título de 5 a 100 caracteres e descrição de no mínimo 10; prioridade padrão `MEDIA`.
- Designar um técnico ativo a um chamado `ABERTO` inicia o atendimento. O técnico não pode ser o solicitante
  e não pode ter mais de 5 chamados `EM_ATENDIMENTO`.
- Transições: `ABERTO` → `EM_ATENDIMENTO` (só ao designar técnico) → `RESOLVIDO` → `FECHADO`;
  `RESOLVIDO` → `EM_ATENDIMENTO` (reabrir); `ABERTO` ou `EM_ATENDIMENTO` → `CANCELADO`.
- Chamado `FECHADO` ou `CANCELADO` não aceita alterações nem comentários. O momento da resolução fica em `resolvidoEm`.
- Só o solicitante e o técnico responsável comentam; comentário não pode ser vazio, editado ou apagado.
