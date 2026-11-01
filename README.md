# [Squoosh]!

[Squoosh] is an image compression web app that reduces image sizes through numerous formats.

# Privacy

Squoosh does not send your image to a server. All image compression processes locally.

However, Squoosh utilizes Google Analytics to collect the following:

- [Basic visitor data](https://support.google.com/analytics/answer/6004245?ref_topic=2919631).
- The before and after image size value.
- If Squoosh PWA, the type of Squoosh installation.
- If Squoosh PWA, the installation time and date.

# Developing

To develop for Squoosh:

1. Install [Bun](https://bun.sh) (1.3 or later)
1. Clone the repository
1. To install dependencies, run:
   ```sh
   bun install
   ```
1. Then build the app by running:
   ```sh
   bun run build
   ```
1. After building, start the development server by running:
   ```sh
   bun run dev
   ```
   It serves on port 5000 by default. Set `DEV_PORT` to use another port.

# Contributing

Squoosh is an open-source project that appreciates all community involvement. To contribute to the project, follow the [contribute guide](/CONTRIBUTING.md).

[squoosh]: https://squoosh.app
