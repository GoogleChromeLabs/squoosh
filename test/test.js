const {TestRunner, Reporter, Matchers} = require('@pptr/testrunner');
const puppeteer = require('puppeteer');
const os = require('os');
const handler = require('serve-handler');
const http = require('http');
const path = require('path');
(async () => {  
  const server = http.createServer((request, response) => {
    return handler(request, response, {
      public: path.join(__dirname, '..', 'build')
    });
  });
  await new Promise(x => server.listen(x));
  const slowMo = parseInt(process.env.SLOWMO || '0');
  const headless = (process.env.HEADLESS || 'true').toLowerCase() !== 'false';
  const browser = await puppeteer.launch({
    headless,
    slowMo,
    handleSIGINT: false,
    handleSIGHUP: false,
    handleSIGTERM: false
  });
  const runner = new TestRunner({
    parallel: headless ? os.cpus().length : 1,
    timeout: slowMo ? 60000 : 6000,
  });

  const {expect} = new Matchers();
  const {describe, xdescribe, fdescribe} = runner;
  const {it, fit, xit} = runner;
  const {beforeAll, beforeEach, afterAll, afterEach} = runner;
  const indexURL = `http://localhost:${server.address().port}/index.html`;

  describe('Squoosh', () => {
    beforeAll(async state => {
      state.browserContext = await browser.createIncognitoBrowserContext();
    });
    afterAll(async state => {
      await state.browserContext.close()
    });

    beforeEach(async state => {
      state.page = await state.browserContext.newPage();
    });
    afterEach(async state => {
      await state.page.close();
    });

    it('to have a title', async ({page}) => {
      await page.goto(indexURL);
      expect(await page.title()).toBe('Squoosh');      
    });

    it('to be able to select an image', async ({page}) => {
      await page.goto(indexURL);
      const fileInput = await page.$('input[type=file]');
      await Promise.all([
        page.waitForSelector('two-up'),
        fileInput.uploadFile(path.join(__dirname, '..', 'src', 'assets', 'icon-small.png'))
      ]);
      await page.waitForFunction(() => document.title === 'icon-small.png - Squoosh');
    });

    it('should work offline', async({page, browserContext}) => {
      await page.goto(indexURL);
      await browserContext.waitForTarget(target => target.type() === 'service_worker');
      await page.setOfflineMode(true);
      await page.goto(indexURL);
    });

    it('should not have any console errors', async({page}) => {
      const errors = [];
      page.on('console', message => {
        if (message.type() === 'error' || message.type() === 'warning')
          errors.push(message.text());
      });
      await page.goto(indexURL);
      expect(errors).toEqual([]);
    })
  });
  
  new Reporter(runner);
  await runner.run();
  await browser.close();
  server.close();
})();
