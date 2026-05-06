const cheerio = require('cheerio');

async function test() {
  const BROWSER_HEADERS = { "User-Agent": "Mozilla/5.0" };
  const res = await fetch("https://results.eci.gov.in/ResultAcGenMay2026/statewiseS111.htm", {headers: BROWSER_HEADERS});
  const html = await res.text();
  const $ = cheerio.load(html);
  
  // Get the first direct row
  const row = $('table.table > tbody > tr').first();
  console.log("Row cells HTML:");
  row.find('> td').each((i, cell) => {
    console.log(`Cell ${i}:`, $(cell).html());
  });
}
test();
