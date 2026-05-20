const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://localhost:8080/preview.html?project=sample-tour');
  await new Promise(r => setTimeout(r, 1000));
  const html = await page.evaluate(() => {
    return document.querySelector('#sceneList').innerHTML;
  });
  console.log('SCENELIST HTML:', html);
  const data = await page.evaluate(() => window.data);
  console.log('DATA:', JSON.stringify(data).substring(0, 500));
  await browser.close();
})();
