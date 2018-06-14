const express = require("express");
const app = express();
const http = require("http");
const puppeteer = require("puppeteer");
const { fingerDown } = require("./finger.js");
const { expect } = require("chai");

async function staticWebServer(path) {
  // Start a static web server
  const app = express();
  app.use(express.static(path));
  // Port 0 means let the OS select a port
  const server = http.createServer(app).listen(0, "localhost");
  await new Promise(resolve => server.on("listening", resolve));

  // Read back the bound address
  const address = server.address();
  return { server, address };
}

describe("some e2e test", function() {
  before(async function() {
    // Start webserver
    const { address, server } = await staticWebServer(".");
    this.address = `http://${address.address}:${address.port}`;
    this.server = server;

    // Start browser
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
    await this.page.goto(`${this.address}/test/sample.html`, {
      waitUntil: "networkidle2"
    });
  });

  it("can tap", async function() {
    const btn = await this.page.$("button");
    await btn.tap();
    const result = await this.page.evaluate(_ => {
      return window.lol;
    });
    expect(result).to.equal(true);
  });

  it("can tap manually", async function() {
    const btn = await this.page.$("button");
    const box = await btn.boundingBox();
    const finger = fingerDown(
      this.page,
      box.x + box.width / 2,
      box.y + box.height / 2
    );
    finger.up();
    const result = await this.page.evaluate(_ => {
      return window.lol;
    });
    expect(result).to.equal(true);
  });

  it("does some taps", async function() {});

  after(async function() {
    this.server.close();
    await this.browser.close();
  });
});
