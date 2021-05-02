const nightmare = require('nightmare')();

//"https://www.amazon.it/Kingston-SA400S37-240GB-SSD-Interno/dp/B01N5IB20Q/"

const args = process.argv.slice(2);
const articleUrl = args[0];
const articleMinPrice = args[1];

async function checkPrice() {
    try {
        const priceString = await nightmare
            .goto(articleUrl)
            .wait("#priceblock_ourprice")
            .evaluate(() => document.getElementById("priceblock_ourprice").innerText)
            .end();

        const priceNumber = parseFloat(priceString.replace('€', '').replace(',', '.'));

        if (priceNumber < articleMinPrice) {
            console.log(`${priceNumber} it is cheap`);
        } else {
            console.log(`${priceNumber} it is expensive`);
        }
    } catch (e) {
        console.log(e);
    }
}

checkPrice();