const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5011;

const projects = ['bancointer', 'notionboost', 'fitnessboost', 'notionpulse', 'notionpulsev2', 'notionpulsev3'];

projects.forEach((name) => {
  app.use(`/${name}`, express.static(path.join(__dirname, name)));
});

app.get('/', (req, res) => {
  res.send(`<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>iaboostlab</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 720px; margin: 80px auto; padding: 0 24px; color: #1c1c1c; }
    h1 { font-size: 48px; margin: 0 0 16px; }
    p { color: #5d5d5d; font-size: 18px; line-height: 1.5; }
    ul { padding: 0; list-style: none; }
    li { margin: 12px 0; }
    a { color: #ea7100; text-decoration: none; font-weight: 600; font-size: 20px; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>iaboostlab</h1>
  <p>Monorepo de projetos.</p>
  <ul>
    ${projects.map((p) => `<li><a href="/${p}/">/${p}</a></li>`).join('')}
  </ul>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`iaboostlab running on http://localhost:${PORT}`);
  projects.forEach((p) => console.log(`  → http://localhost:${PORT}/${p}`));
});
