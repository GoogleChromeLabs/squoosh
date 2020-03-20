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

# Online one-click setup

You can use Gitpod (a free online VS Code-like IDE) for contributng. With a single click it will launch a workspace and automatically:

- clone the squoosh repo.
- install the dependencies.
- run `npm start`.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/GoogleChromeLabs/squoosh)

[Squoosh]: https://squoosh.app
