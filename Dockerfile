FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --ignore-scripts && \
    pnpm rebuild bcrypt

COPY . .

CMD ["pnpm", "run", "dev"]