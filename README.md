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

1. Clone the repository
1. To install node packages, run:
   ```sh
   npm install
   ```
1. Then build the app by running:
   ```sh
   npm run build
   ```
1. After building, start the development server by running:
   ```sh
   npm run dev
   ```

# Contributing

Squoosh is an open-source project that appreciates all community involvement. To contribute to the project, follow the [contribute guide](/CONTRIBUTING.md).

[squoosh]: https://squoosh.app




As for new users like me who is using windows the script is not working so i made changes so that windows user can easily run this project on their machine

you just have to change the script to

"scripts": {
    "build": "rollup -c && node lib\\move-output.js",
    "debug": "node --inspect-brk node_modules\\.bin\\rollup -c",
    "dev": "set DEV_PORT=5000 && run-p watch serve",
    "watch": "rollup -cw",
    "serve": "serve --listen=%DEV_PORT% --config ../../../serve.json .tmp\\build\\static",
    "prepare": "husky install"
  },

in package.json and after that run as mentioned
npm i
then npm run build
then npm run dev
then go to http://localhost:5000

and after few seconds refresh it