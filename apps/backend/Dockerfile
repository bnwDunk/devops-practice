FROM node:22-alpine AS deps
WORKDIR /workspace
COPY package.json ./
COPY tsconfig.base.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN npm install --workspace apps/backend --include-workspace-root

FROM deps AS dev
COPY apps/backend apps/backend
EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace", "apps/backend"]

FROM deps AS build
COPY apps/backend apps/backend
RUN npm run build --workspace apps/backend
RUN npm prune --omit=dev --workspace apps/backend --include-workspace-root

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /workspace
COPY package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY --from=build /workspace/node_modules node_modules
COPY --from=build /workspace/apps/backend/dist apps/backend/dist
USER node
EXPOSE 3000
CMD ["node", "apps/backend/dist/server.js"]
