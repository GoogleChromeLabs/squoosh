# [Squoosh]!

[Squoosh] is an image compression web app that allows you to dive into the advanced options provided
by various image compressors.

# CLI

[Squoosh now has a CLI](https://github.com/GoogleChromeLabs/squoosh/tree/dev/cli) that allows you to compress many images at once.

# Privacy

Google Analytics is used to record the following:

- [Basic visit data](https://support.google.com/analytics/answer/6004245?ref_topic=2919631).
- Before and after image size once an image is downloaded. These values are rounded to the nearest
  kilobyte.
- If install is available, when Squoosh is installed, and what method was used to install Squoosh.

Image compression is handled locally; no additional data is sent to the server.

# Building locally

Clone the repo, and:

```sh
npm install
npm run build
```

You can run the development server with:

```sh
npm run dev
```

[squoosh]: https://squoosh.app
