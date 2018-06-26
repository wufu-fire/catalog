const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

let pageUrl = "http://git.dianpingoa.com/v1/sh/projects/BABYFE/repos/baby-activity-playing-car/browse/src/fetch?at=master"
const cookies = [
    {
        name: 'shanghai_sessionid',
        value: '394B513AF40B0211E8F53FE93D455683',
        domain: 'git.dianpingoa.com',
        path: '/',
        httpOnly: false,
        secure: false,
        session: true,
    }
]
async function crawlPage() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.goto(pageUrl);
    await page.waitForSelector('.code-repository-overview');
    const html = await page.content();
    fs.writeFile('crawlStr/content.html', html, _ => console.log('done'));
    const $ = cheerio.load(html);
    fs.writeFile('crawlStr/str.html', $('.code-repository-overview'), _ => console.log('string is done'));
    // $('.code-repository-overview').html()
    await browser.close();
}
crawlPage();