FROM node:18-alpine3.15 as build-stage
RUN apk add git --update --no-cache
WORKDIR /app/
RUN git clone https://github.com/GoogleChromeLabs/squoosh .
COPY ./ ./
RUN npm install
RUN npm run build

FROM pektin/feoco
COPY --from=build-stage /app/build/ /public/
COPY config.yml /
