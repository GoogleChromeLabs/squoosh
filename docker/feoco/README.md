# FEOCO

## Content Security Policy
If something does not work open the dev tools (F12), 
look in the Console and add the Hash from 
the Error message to the `feoco` config file (`config.yml`)
```yaml
...
document:
    Content-Security-Policy: >-
      default-src 'none';

      script-src 'self' 'sha256-ASLOheG06d3Ki7JdH/cJOYqOpoHDbrabbcTjIgbYpRI=' 'SCRIPT HASH HERE';
                  
      style-src 'self' 
      'sha256-r4w0Hpmqa9mzXpgsvu8FwnGj4j7CpbrS5vHVS6QzpEM=' 
      'sha256-OTdQIZNeJ+u2K6P+da06j73k5B+WYvb3m+/iO94IM2g=' 
      'sha256-2EA12+9d+s6rrc0rkdIjfmjbh6p2o0ZSXs4wbZuk/tA='
      'sha256-2EA12+9d+s6rrc0rkdIjfmjbh6p2o0ZSXs4wbZuk/tA='
      'sha256-Yh8FYUptAjJ9w67MZdihL5MxhHHFuUbmmVNtqv9dQIY='
      'sha256-oLLn19wHxgxFjhnaXa7h53+82py1urmj+GLI9l8f3Hk='
      'STYLE HASH HERE';
...
```

## Build it and tag it as `squoosh-feoco` by cloning this repo on your system

```sh
docker build . -f docker/feoco/Dockerfile -t squoosh-feoco
```

## Or build it and tag it as `squoosh-feoco` without cloning just from the Dockerfile
Check out `noclone.Dockerfile` and copy its contents on your system

Copy `config.yml` on your system (same directory as the Dockerfile)

Build it
```
docker build . -f noclone.Dockerfile -t squoosh-feoco
```

## Run it locally on port `8080`
Visit `http://localhost:8080`
```sh
docker run -p 8080:80 squoosh-feoco -it
```

## With compose
Using the `noclone.Dockerfile` building method
```yaml
version: "3.8"
services:
    squoosh:
        build:
            context: .
            dockerfile: noclone.Dockerfile
        restart: always
        container_name: squoosh
        ports:
            - "8080:80"

```
## and traefik
Assuming traefik is available in a docker network named `rp` has the entrypoint `websecure` and certresolver `default`

```yaml
version: "3.8"
services:
    squoosh:
        build:
            context: .
            dockerfile: noclone.Dockerfile
        container_name: squoosh
        restart: always
        networks:
            - rp
        labels:
            traefik.enable: "true"
            traefik.http.routers.squoosh.tls.certresolver: "default"
            traefik.http.routers.squoosh.tls.domains[0].main: "example.com"
            traefik.http.routers.squoosh.tls.domains[0].sans: "*.example.com"
            traefik.http.routers.squoosh.rule: "Host(`squoosh.example.com`)"
            traefik.http.routers.squoosh.tls: "true"
            traefik.http.routers.squoosh.entrypoints: "websecure"
            traefik.http.services.squoosh.loadbalancer.server.port: "80"
            traefik.docker.network: rp

networks:
    rp:
        name: rp
```