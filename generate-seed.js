const fs = require('fs');
const cheerio = require('cheerio');
const PARTY_ALLIANCE = {
  "CPI(M)": "LDF", "CPIM": "LDF", "Communist Party of India  (Marxist)": "LDF", "Communist Party of India (Marxist)": "LDF", "CPI": "LDF", "Communist Party of India": "LDF", "KC(M)": "LDF", "Kerala Congress (M)": "LDF", "NCP": "LDF", "Nationalist Congress Party": "LDF", "JD(S)": "LDF", "Janata Dal (Secular)": "LDF", "INL": "LDF", "Indian National League": "LDF", "RJD": "LDF", "Rashtriya Janata Dal": "LDF", "Congress (S)": "LDF", "JKC": "LDF", "Janadhipathiya Kerala Congress": "LDF", "LJD": "LDF", "Loktantrik Janata Dal": "LDF",
  "INC": "UDF", "Indian National Congress": "UDF", "IUML": "UDF", "Indian Union Muslim League": "UDF", "KC(J)": "UDF", "Kerala Congress (Joseph)": "UDF", "KC": "UDF", "Kerala Congress": "UDF", "RSP": "UDF", "Revolutionary Socialist Party": "UDF", "RMPI": "UDF", "Revolutionary Marxist Party of India": "UDF", "KC(Jacob)": "UDF", "CMP": "UDF", "Communist Marxist Party": "UDF",
  "BJP": "NDA", "Bharatiya Janata Party": "NDA", "BDJS": "NDA", "Bharath Dharma Jana Sena": "NDA", "AIADMK": "NDA",
  "IND": "OTH", "Independent": "OTH", "SDPI": "OTH", "WPI": "OTH", "BSP": "OTH",
};

async function generate() {
  const BROWSER_HEADERS = { "User-Agent": "Mozilla/5.0" };
  const allResults = [];
  
  for (let p = 1; p <= 7; p++) {
    const res = await fetch(`https://results.eci.gov.in/ResultAcGenMay2026/statewiseS11${p}.htm`, {headers: BROWSER_HEADERS});
    if (!res.ok) continue;
    const html = await res.text();
    const $ = cheerio.load(html);
    
    $('table.table > tbody > tr').each((_, row) => {
      const cells = [];
      $(row).find('> td').each((_, cell) => {
        const cellText = $(cell).clone().children().remove().end().text().trim() || $(cell).text().replace(/\s+/g, ' ').trim();
        cells.push(cellText);
      });

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
        
        allResults.push({
          name: constituencyName,
          status,
          margin,
          candidates: leaderName ? [{
            name: leaderName,
            party: leaderParty || cells[3],
            alliance,
            votes: 0,
            isLeading: status === "counting",
            isWinner: status === "result_declared",
          }] : [],
          totalVotes: 0,
          roundsCompleted: 0,
          totalRounds: 20,
          lastUpdated: new Date().toISOString(),
        });
      }
    });
  }
  
  fs.writeFileSync('src/app/apps/kerala-results/data/seed-data.json', JSON.stringify(allResults, null, 2));
  console.log('Seed data generated with', allResults.length, 'constituencies.');
}
generate().catch(console.error);
