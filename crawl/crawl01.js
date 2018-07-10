const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

let pageUrl = "http://git.dianpingoa.com/v2/sh/projects/babyfe/repos/baby-activity-playing-car/browse?branch=lightmerge&path="
const cookies = [
    {
        name: 'shanghai_sessionid',
        value: 'D11D52BC8428A74D8561A2BE66132450',
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
    await page.waitForSelector('.markdown-body');
    const html = await page.content();
    fs.writeFile('crawlStr/content.html', html, _ => console.log('done'));
    const $ = cheerio.load(html);
    fs.writeFile('crawlStr/str.html', $('.repository'), _ => console.log('string is done'));
    // $('.code-repository-overview').html()
    await browser.close();
}
crawlPage();