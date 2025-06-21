const https = require('https');
const { EmbedBuilder } = require('discord.js');

// Emoji map for items
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
  Egg: '🥚',
  'Golden Egg': '🥚✨'
};

// Fetch and parse live stock from the site
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

// Parse individual stock section by id using regex
function parseSection(html, sectionId) {
  const items = [];

  // Capture the section div content
  const sectionRegex = new RegExp(
    `<div[^>]*id="${sectionId}"[^>]*>([\\s\\S]*?)<\\/div>\\s*<\\/div>`,
    'i'
  );
  const sectionMatch = html.match(sectionRegex);
  if (!sectionMatch) return items;

  const sectionHtml = sectionMatch[1];

  // Regex to capture item name and quantity inside that section
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

// Format Discord embed from parsed stock data
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

  const seedsField = seeds.length > 0
    ? seeds.map(item => `**x${item.stock}** ${emojiMap[item.name] || ''} ${item.name}`).join('\n')
    : 'No stock';

  const gearField = gear.length > 0
    ? gear.map(item => `**x${item.stock}** ${emojiMap[item.name] || ''} ${item.name}`).join('\n')
    : 'No stock';

  const eggsField = eggs.length > 0
    ? eggs.map(item => `**x${item.stock}** ${emojiMap[item.name] || ''} ${item.name}`).join('\n')
    : 'No stock';

  return new EmbedBuilder()
    .setTitle('🌱 Grow a Garden - Current Stock')
    .setColor(0x57F287) // green color
    .addFields(
      { name: 'Seeds Stock', value: seedsField, inline: true },
      { name: 'Gear Stock', value: gearField, inline: true },
      { name: 'Eggs Stock', value: eggsField, inline: true }
    )
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/4769/4769989.png')
    .setFooter({ text: 'Grow a Garden Bot • Live data from gamersberg.com' });
}

module.exports = { fetchInStockItems, formatStockEmbed };
