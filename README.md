# [Squoosh]!

[Squoosh] is an image compression web app that provides lossless image quality with a significant reduction to file size.

# API & CLI

Squoosh has [an API](https://github.com/GoogleChromeLabs/squoosh/tree/dev/libsquoosh) and [a CLI](https://github.com/GoogleChromeLabs/squoosh/tree/dev/cli) to compress many images at once.

# Privacy

Squoosh does not send your image to a server. All image compression processes locally.

However, Squoosh utilizes Google Analytics to collect the following:

- [Basic visitor data](https://support.google.com/analytics/answer/6004245?ref_topic=2919631).
- The before and after image size value.
- If Squoosh CLI, the type of Squoosh installation.
- If Squoosh CLI, the installation time and date.

# Developing

To develop for Squoosh, use the following:

1. Clone the repository.
1. To install node packages, run `npm install`.
1. To build the app, run `npm run build`.
1. To start the development server, run `npm run dev`.

# Contributing

Squoosh is an open-source project that appreciates all community involvement. To contribute to the project, follow the [contribute guide](/CONTRIBUTING.md).

[squoosh]: https://squoosh.app
