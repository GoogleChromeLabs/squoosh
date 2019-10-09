FROM alpine:3.10

EXPOSE 8080

LABEL maintainer="Peponi <pep0ni@pm.com>" \
      description="will run a picture compression web service from GoogleChromeLabs"

ARG REPO_URL=https://github.com/GoogleChromeLabs/squoosh.git
ARG VERSION=v1.8.1
ARG USER=node
ENV USER=$USER

RUN apk update; \
  apk upgrade; \
  apk add --no-cache --virtual \
    bash \
    git \
    nodejs \
    npm; \
  node --version; \
  npm --version; \
  addgroup -g 1000 $USER;  \
  adduser -u 1000 -G $USER -s /bin/bash -D $USER; \
  cd /home/$USER; \
  git clone -b $VERSION --single-branch $REPO_URL squoosh; \
  cd squoosh; \
  npm i --no-optional; \
  npm cache clean --force; \
  npm run build; \
  chown -R $USER:$USER /home/$USER/

USER $USER
WORKDIR /home/$USER/squoosh

CMD ["npm", "run", "start"]

### Install ###
#
# Build:
# 
# > docker build -t alpine-squoosh .
# 
# with new version
# 
# > docker build -t alpine-squoosh --build-arg VERSION=v1.8.0 .
# 
# Run:
# 
# > docker run --name alpine-squoosh -p 8080:8080 alpine-squoosh
# 
### end ###