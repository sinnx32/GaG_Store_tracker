const https = require('https');
const { EmbedBuilder } = require('discord.js');

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
          seeds: parseSection(html, 'seeds'),
          gear: parseSection(html, 'gear'),
          eggs: parseSection(html, 'eggs')
        };
        resolve(stock);
      });
    }).on('error', (err) => {
      console.error('❌ Failed to fetch stock page:', err.message);
      resolve(null);
    });
  });
}

// Helper to extract items by section class name
function parseSection(html, className) {
  const items = [];

  // Find the section with the given class name (e.g. 'seeds', 'gear', 'eggs')
  const sectionRegex = new RegExp(
    `<div[^>]*class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/div>`,
    'i'
  );

  const sectionMatch = html.match(sectionRegex);
  if (!sectionMatch) {
    console.error(`❌ Section with class '${className}' not found`);
    return items;
  }

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

function formatStockEmbed(stock) {
  const embed = new EmbedBuilder()
    .setTitle('Current Stock')
    .setColor(0x00ff00);

  for (const section in stock) {
    const items = stock[section]
      .map(item => `${item.name}: ${item.stock}`)
      .join('\n') || 'No items';

    embed.addFields({ name: section.charAt(0).toUpperCase() + section.slice(1), value: items });
  }

  return embed;
}

module.exports = { fetchInStockItems, formatStockEmbed };
