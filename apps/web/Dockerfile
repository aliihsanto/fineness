FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile --filter @fineness/web...
# build without a DB — pages fall back to demo data at build time and read the
# live DB at request time / ISR revalidation
RUN pnpm --filter @fineness/web build

FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@fineness/web", "start"]
