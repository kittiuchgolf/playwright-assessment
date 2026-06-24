FROM mcr.microsoft.com/playwright:v1.61.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV CI=true

CMD ["npm", "test"]
