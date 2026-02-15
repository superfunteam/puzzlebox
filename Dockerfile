FROM node:22-alpine AS base
WORKDIR /app
COPY package.json tsconfig*.json vitest.config.ts ./
COPY apps ./apps
COPY packages ./packages
COPY tools ./tools
COPY scripts ./scripts
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@puzzlebox/api"]
