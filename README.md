# iaboostlab

Monorepo de experimentos. Cada projeto fica em sua própria pasta e é servido sob a rota correspondente.

## Projetos

- `bancointer/` — Estudo da home do Banco Inter (Figma → HTML/CSS/JS)
- `notionboost/` — Em construção
- `fitnessboost/` — Em construção

## Rodando local

```bash
npm install
npm run dev
```

- Hub: `http://localhost:5011/`
- Banco Inter: `http://localhost:5011/bancointer`
- Notionboost: `http://localhost:5011/notionboost`
- Fitnessboost: `http://localhost:5011/fitnessboost`

## Deploy

Hospedado no Vercel com `vercel.json` fazendo as rewrites das três pastas.
