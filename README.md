# [Squoosh]!

[Squoosh] is an image compression web app that allows you to dive into the advanced options provided
by various image compressors.

# Privacy

Google Analytics is used to record the following:

* [Basic visit data](https://support.google.com/analytics/answer/6004245?ref_topic=2919631).
* Before and after image size once an image is downloaded. These values are rounded to the nearest
  kilobyte.

Image compression is handled locally; no additional data is sent to the server.

# Building locally

Clone the repo, and:

```sh
npm install
npm run build
```

You can run the development server with:

```sh
npm start
```

# Build with Docker

```sh
docker build -t squoosh .
```

with new version

```sh
docker build -t squoosh-1.8.0 --build-arg VERSION=v1.8.0 .
```

run the container

```sh
docker run --name squoosh -p 8080:8080 squoosh-1.8.0
```

[Squoosh]: https://squoosh.app
