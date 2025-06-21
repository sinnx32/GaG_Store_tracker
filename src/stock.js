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
        // Parse sections (update IDs if site changed)
        const stock = {
          seeds: parseSection(html, 'seed-stock'),
          gear: parseSection(html, 'gear-stock'),
          eggs: parseSection(html, 'egg-stock'),
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

  // This regex matches the div with id=sectionId and captures inner HTML
  const sectionRegex = new RegExp(
    `<div[^>]*id="${sectionId}"[^>]*>([\\s\\S]*?)<\\/div>\\s*<\\/div>`,
    'i'
  );
  const sectionMatch = html.match(sectionRegex);

  if (!sectionMatch) {
    console.log(`No section found for id: ${sectionId}`);
    return items;
  }

  const sectionHtml = sectionMatch[1];

  // Match each item div with .item-name and .item-qty inside
  const itemRegex = /<div class="item">[\s\S]*?<div class="item-name">([^<]+)<\/div>[\s\S]*?<div class="item-qty">([^<]+)<\/div>/g;

  let match;
  while ((match = itemRegex.exec(sectionHtml)) !== null) {
    const name = match[1].trim();
    const qtyRaw = match[2].trim();
    const qty = parseInt(qtyRaw.replace(/[^\d]/g, '')) || 0;
    if (name && qty > 0) {
      items.push({ name, stock: qty });
    }
  }

  return items;
}

// Emoji mapping (optional)
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
  'Harvest Tool': '🔪',
};

// Format embed for Discord
function formatStockEmbed(data) {
  if (!data) {
    return new EmbedBuilder()
      .setTitle('Grow a Garden Stock')
      .setDescription('⚠️ Failed to fetch stock data.')
      .setColor('Red');
  }

  const seeds = data.seeds || [];
  const gear = data.gear || [];
  const eggs = data.eggs || [];

  const formatItems = (items) =>
    items.length
      ? items.map(i => `**x${i.stock}** ${emojiMap[i.name] || ''} ${i.name}`).join('\n')
      : 'No stock';

  return new EmbedBuilder()
    .setTitle('🌱 Grow a Garden Stock')
    .setColor(0x57F287)
    .addFields(
      { name: 'Seeds', value: formatItems(seeds), inline: true },
      { name: 'Gear', value: formatItems(gear), inline: true },
      { name: 'Eggs', value: formatItems(eggs), inline: true }
    )
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/4769/4769989.png')
    .setFooter({ text: 'Grow a Garden Bot' });
}

module.exports = { fetchInStockItems, formatStockEmbed };
