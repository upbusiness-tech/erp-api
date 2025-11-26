const serverless = require("serverless-http");
const { createApp } = require("../dist/main");

// Cache do servidor entre invocações (Vercel mantém isso quentinho)
let cachedServer;

module.exports = async (req, res) => {
  if (!cachedServer) {
    const app = await createApp(); // chamamos a função exportada do main.ts
    cachedServer = serverless(app);
  }

  // CORS obrigatório ANTES de chamar o Nest
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  return cachedServer(req, res);
};
