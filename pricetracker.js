#!/usr/bin/env node

// https://sendgrid.com/

require('dotenv').config();
const Nightmare = require('nightmare');
const argv = require('minimist')(process.argv.slice(2));
const sendGridMail = require('@sendgrid/mail');

sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

const conf = {
    appName: "pricetracker",
    argv: argv,
    articleUrl: argv.url,
    articleMinPrice: argv.lt,
    articleMaxPrice: argv.gt,
    emailTo: process.env.EMAIL_TO,
    emailFrom: process.env.EMAIL_FROM,
    checkInterval: process.env.CHECK_INTERVAL,
    checkAfterFindInterval: process.env.CHECK_AFTER_FIND_INTERVAL
}

// Debug logs
// console.log(conf);

if (conf.articleUrl === undefined || (conf.articleMinPrice === undefined && conf.articleMaxPrice === undefined)) {
    notifyArgsHelp();
    process.exit(-1);
}

async function checkPrice(conf) {
    try {
        const nightmare = new Nightmare({ show: false });

        const priceString = await nightmare
            .goto(conf.articleUrl)
            .wait("#priceblock_ourprice")
            .evaluate(() => document.getElementById("priceblock_ourprice").innerText)
            .end();

        const priceNumber = parseFloat(priceString.replace('€', '').replace(',', '.'));

        if (priceNumber < conf.articleMinPrice) {
            const msg = `The price on ${conf.articleUrl} has dropped below ${conf.articleMinPrice}`
            console.log(msg);
            await sendEmail(
                'Price is low',
                msg
            );

            return {
                priceStatus: 'low'
            }
        } else if (priceNumber > conf.articleMaxPrice) {
            const msg = `The price on ${conf.articleUrl} has exceeded ${conf.articleMaxPrice}`
            console.log(msg)
            await sendEmail(
                'Price is high',
                msg
            );
            return {
                priceStatus: 'high'
            }
        } else {
            return {
                priceStatus: 'not_relevant'
            }
        }

    } catch (e) {
        await sendEmail('Amazon price checker error', e.message);
        throw e;
    }
}

async function sendEmail(subject, body) {
    console.log('mando la mail');
    /*try {
        const email = {
            to: conf.emailTo,
            from: conf.emailFrom,
            subject: subject,
            text: body,
            html: body
        }
        await sendGridMail.send(email);
    } catch (e) {
        console.log("Error trying to send the email: " + e);
    }*/
}

function notifyArgsHelp() {
    const helpUrlExample = "https://www.amazon.it/Kingston-SA400S37-240GB-SSD-Interno/dp/B01N5IB20Q/"

    const usageHelp = `
        Usage 
            $ ${conf.appName} <input>
        
        Options 
            --url  (String)   The url of the article to monitor  (Required)
            --lt   (Number)   Get notified if the price drops below this value
            --gt   (Number)   Get notified if the price rises over this value

            (At least one between -lt and -gt is required)

        Example
            $ ${conf.appName} --url ${helpUrlExample} --lt 200
    `;
    console.log(usageHelp)
}

setTimeout(async function run() {
    const PriceCheckResult = await checkPrice(conf);
    console.log(PriceCheckResult);
    if (PriceCheckResult.priceStatus === 'not_relevant') {
        setTimeout(run, conf.checkInterval);
    } else {
        setTimeout(run, conf.checkAfterFindInterval);
    }
})