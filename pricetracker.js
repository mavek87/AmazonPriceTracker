#!/usr/bin/env node

const nightmare = require('nightmare')();
const argv = require('minimist')(process.argv.slice(2));

const appName = "pricetracker";

// Debug log
console.log(argv);

const articleUrl = argv.url;
const articleMinPrice = argv.lt;
const articleMaxPrice = argv.gt;

if (articleUrl === undefined || (articleMinPrice === undefined && articleMaxPrice === undefined)) {
    notifyArgsHelp();
    process.exit(-1);
}

async function checkPrice() {
    try {
        const priceString = await nightmare
            .goto(articleUrl)
            .wait("#priceblock_ourprice")
            .evaluate(() => document.getElementById("priceblock_ourprice").innerText)
            .end();

        const priceNumber = parseFloat(priceString.replace('€', '').replace(',', '.'));

        if (priceNumber < articleMinPrice) {
            console.log(`Article is under the price ${articleMinPrice}`)
        } else if (priceNumber > articleMaxPrice) {
            console.log(`Article is over the price ${articleMaxPrice}`)
        }

    } catch (e) {
        console.log(e);
    }
}

checkPrice();



function notifyArgsHelp() {
    const helpUrlExample = "https://www.amazon.it/Kingston-SA400S37-240GB-SSD-Interno/dp/B01N5IB20Q/"

    const usageHelp = `
        Usage 
            $ ${appName} <input>
        
        Options 
            --url  (String)   The url of the article to monitor  (Required)
            --lt   (Number)   Get notified if the price drops below this value
            --gt   (Number)   Get notified if the price rises over this value

            (At least one between -lt and -gt is required)

        Example
            $ ${appName} -url ${helpUrlExample} -lt 200
    `;
    console.log(usageHelp)
}