# [Squoosh]! [![Build Status](https://travis-ci.org/GoogleChromeLabs/squoosh.svg?branch=master)](https://travis-ci.org/GoogleChromeLabs/squoosh)

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

You'll get an error on first build because of [a stupid bug we haven't fixed
yet](https://github.com/GoogleChromeLabs/squoosh/issues/251).

You can run the development server with:

```sh
npm start
```

[Squoosh]: https://squoosh.app
