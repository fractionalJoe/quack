FROM node:24-slim AS build
RUN npm install -g pnpm@12.4.1
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm ducks deploy --prod /out

FROM node:24-slim
WORKDIR /app
COPY --from=build /out .
ENV PORT=3000
EXPOSE 3000
CMD ["node_modules/.bin/tsx", "src/server.ts"]