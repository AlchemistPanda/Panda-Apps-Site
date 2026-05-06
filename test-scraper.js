const cheerio = require('cheerio');
const PARTY_ALLIANCE = {
  // LDF
  "CPI(M)": "LDF",
  "CPIM": "LDF",
  "Communist Party of India  (Marxist)": "LDF",
  "Communist Party of India (Marxist)": "LDF",
  "CPI": "LDF",
  "Communist Party of India": "LDF",
  "KC(M)": "LDF",
  "Kerala Congress (M)": "LDF",
  "NCP": "LDF",
  "Nationalist Congress Party": "LDF",
  "JD(S)": "LDF",
  "Janata Dal (Secular)": "LDF",
  "INL": "LDF",
  "Indian National League": "LDF",
  "RJD": "LDF",
  "Rashtriya Janata Dal": "LDF",
  "Congress (S)": "LDF",
  "JKC": "LDF",
  "Janadhipathiya Kerala Congress": "LDF",
  "LJD": "LDF",
  "Loktantrik Janata Dal": "LDF",
  
  // UDF
  "INC": "UDF",
  "Indian National Congress": "UDF",
  "IUML": "UDF",
  "Indian Union Muslim League": "UDF",
  "KC(J)": "UDF",
  "Kerala Congress (Joseph)": "UDF",
  "KC": "UDF",
  "Kerala Congress": "UDF",
  "RSP": "UDF",
  "Revolutionary Socialist Party": "UDF",
  "RMPI": "UDF",
  "Revolutionary Marxist Party of India": "UDF",
  "KC(Jacob)": "UDF",
  "CMP": "UDF",
  "Communist Marxist Party": "UDF",
  
  // NDA
  "BJP": "NDA",
  "Bharatiya Janata Party": "NDA",
  "BDJS": "NDA",
  "Bharath Dharma Jana Sena": "NDA",
  "AIADMK": "NDA",
  
  // OTH
  "IND": "OTH",
  "Independent": "OTH",
  "SDPI": "OTH",
  "WPI": "OTH",
  "BSP": "OTH",
};

async function test() {
  const BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };
  const res = await fetch("https://results.eci.gov.in/ResultAcGenMay2026/statewiseS111.htm", {headers: BROWSER_HEADERS});
  const html = await res.text();
  const results = [];
  const $ = cheerio.load(html);
  
  $('table.table tbody tr').each((_, row) => {
    const cells = [];
    $(row).find('> td').each((_, cell) => {
      const cellText = $(cell).clone().children().remove().end().text().trim() || $(cell).text().replace(/\s+/g, ' ').trim();
      cells.push(cellText);
    });

    console.log("Found cells:", cells.length, cells.slice(0, 4));

    if (cells.length >= 8 && cells[0] && cells[0].toLowerCase() !== "constituency") {
      const constituencyName = cells[0];
      const leaderName = cells[2];
      const leaderParty = cells[3].split('-')[0].trim(); 
      const marginRaw = cells[6] || "0";
      const margin = parseInt(marginRaw.replace(/,/g, '')) || 0;
      const statusRaw = (cells[8] || cells[7] || "").toLowerCase();
      
      let status = "not_started";
      if (statusRaw.includes("declared")) status = "result_declared";
      else if (statusRaw.includes("progress") || statusRaw.includes("counting") || leaderName) status = "counting";
      
      let alliance = "OTH";
      const partyUpper = cells[3].toUpperCase();
      for (const [party, a] of Object.entries(PARTY_ALLIANCE)) {
        if (partyUpper.includes(party.toUpperCase())) {
          alliance = a;
          break;
        }
      }
      results.push({name: constituencyName, leader: leaderName, party: leaderParty, alliance, status});
    }
  });
  console.log("Total parsed:", results.length);
  if (results.length > 0) console.log("Sample:", results[0]);
}
test();
