FROM node:22-alpine AS deps
WORKDIR /workspace
COPY package.json ./
COPY tsconfig.base.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN npm install --workspace apps/frontend --include-workspace-root

FROM deps AS dev
COPY apps/frontend apps/frontend
EXPOSE 5173
CMD ["npm", "run", "dev", "--workspace", "apps/frontend"]

FROM deps AS build
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY apps/frontend apps/frontend
RUN npm run build --workspace apps/frontend

FROM nginx:1.27-alpine AS production
COPY infra/nginx/frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
