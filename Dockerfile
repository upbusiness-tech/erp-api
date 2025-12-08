# Dockerfile SIMPLIFICADO
FROM node:18-alpine

WORKDIR /app

# Copiar tudo
COPY . .

# Instalar dependências
RUN npm install

# Build da aplicação
RUN npm run build

# Porta
EXPOSE 8080

# Comando de inicialização
CMD ["node", "dist/main.js"]