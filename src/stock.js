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
        // Parse the HTML and extract stock info
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

function parseSection(html, sectionId) {
  const items = [];
  
  // Adjust regex to match the website's current HTML structure
  const sectionRegex = new RegExp(`<div[^>]+id="${sectionId}"[^>]*>([\\s\\S]*?)<\\/div>`, 'i');
  const sectionMatch = html.match(sectionRegex);
  if (!sectionMatch) return items;

  const sectionHtml = sectionMatch[1];

  // This regex captures each item block inside the section
  const itemRegex = /<div class="item">[\s\S]*?<div class="item-name">([^<]+)<\/div>[\s\S]*?<div class="item-qty">([^<]+)<\/div>/g;

  let match;
  while ((match = itemRegex.exec(sectionHtml)) !== null) {
    const name = match[1].trim();
    const qtyText = match[2].trim();
    const qty = parseInt(qtyText.replace(/[^\d]/g, ''), 10);
    if (name && qty && qty > 0) {
      items.push({ name, stock: qty });
    }
  }

  return items;
}

const { EmbedBuilder } = require('discord.js');

const emojiMap = {
  Blueberry: '🫐',
  Carrot: '🥕',
  Strawberry: '🍓',
  Tomato: '🍅',
  Corn: '🌽',
  Pumpkin: '🎃',
  'Orange Tulip': '🌷',
  Pepper: '🌶️',

  'Cleaning Spray': '🧼',
  Trowel: '🛠️',
  'Watering Can': '💧',
  'Recall Wrench': '🔧',
  'Favorite Tool': '🧰',
  'Harvest Tool': '🔪'
};

function formatStockEmbed(data) {
  if (!data) {
    return new EmbedBuilder()
      .setTitle('Grow a Garden Stock')
      .setDescription('⚠️ Failed to fetch stock data.')
      .setColor('Red');
  }

  const seeds = data.seeds.length ? data.seeds : [];
  const gear = data.gear.length ? data.gear : [];
  const eggs = data.eggs.length ? data.eggs : [];

  const formatItems = (items) => {
    if (!items.length) return 'No stock';
    return items.map(i => `**x${i.stock}** ${emojiMap[i.name] || ''} ${i.name}`).join('\n');
  };

  const embed = new EmbedBuilder()
    .setTitle('🌱 Grow a Garden Stock')
    .setColor(0x57F287)
    .addFields(
      { name: 'Seeds Stock', value: formatItems(seeds), inline: true },
      { name: 'Gear Stock', value: formatItems(gear), inline: true },
      { name: 'Eggs Stock', value: formatItems(eggs), inline: true }
    )
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/4769/4769989.png')
    .setFooter({ text: 'Grow a Garden Bot' });

  return embed;
}

module.exports = { fetchInStockItems, formatStockEmbed };
