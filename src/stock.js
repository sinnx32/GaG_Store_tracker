const https = require('https');

async function fetchInStockItems() {
  const url = 'https://www.gamersberg.com/grow-a-garden/stock';

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let html = '';

      res.on('data', (chunk) => {
        html += chunk;
      });

      res.on('end', () => {
        const stock = {
          seeds: parseSection(html, 'seed-stock'),
          gear: parseSection(html, 'gear-stock'),
          eggs: parseSection(html, 'egg-stock')
        };
        resolve(stock);
      });
    }).on('error', (err) => {
      console.error('❌ Failed to fetch stock page:', err.message);
      resolve(null);
    });
  });
}

// Helper to extract items using regex and section IDs
function parseSection(html, sectionId) {
  const items = [];

  const sectionRegex = new RegExp(
    `<div[^>]*id="${sectionId}"[^>]*>([\\s\\S]*?)<\\/div>\\s*<\\/div>`,
    'i'
  );
  const sectionMatch = html.match(sectionRegex);
  if (!sectionMatch) return items;

  const sectionHtml = sectionMatch[1];

  // Match each item inside the section
  const itemRegex = /<div class="item">[\s\S]*?<div class="item-name">([^<]+)<\/div>[\s\S]*?<div class="item-qty">([^<]+)<\/div>/g;

  let match;
  while ((match = itemRegex.exec(sectionHtml)) !== null) {
    const name = match[1].trim();
    const qty = match[2].trim().replace(/[^\d]/g, '');
    if (name && qty) {
      items.push({ name, stock: parseInt(qty) });
    }
  }

  return items;
}
