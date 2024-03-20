FROM node:18-alpine3.15 as build-stage
WORKDIR /app/
COPY ./ ./
RUN npm install
RUN npm run build

FROM pektin/feoco
COPY --from=build-stage /app/build/ /public/
COPY docker/feoco/config.yml /
