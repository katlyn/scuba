FROM ghcr.io/pnpm/pnpm:12 as base
RUN pnpm runtime set node 26 -g

FROM base as build
WORKDIR /usr/build
COPY tsconfig.json package.json pnpm-lock.yaml pnpm-workspace.yaml /usr/build/
RUN pnpm install --frozen-lockfile
COPY ./src /usr/build/src/
RUN pnpm build

FROM base
WORKDIR /usr/bot
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /usr/bot/
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /usr/build/dist /usr/bot/dist

CMD [ "node", "/usr/bot/dist/index.js" ]
