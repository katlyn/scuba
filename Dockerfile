FROM node:20-alpine as base
RUN corepack enable

FROM base as build
WORKDIR /usr/build
RUN corepack enable
COPY tsconfig.json package.json pnpm-lock.yaml /usr/build/
RUN pnpm i --frozen-lockfile
COPY ./src /usr/build/src/
RUN pnpm build

FROM base
WORKDIR /usr/bot
COPY package.json pnpm-lock.yaml /usr/bot/
RUN pnpm i --prod
COPY --from=build /usr/build/dist /usr/bot/dist

CMD [ "node", "/usr/bot/dist/index.js" ]
