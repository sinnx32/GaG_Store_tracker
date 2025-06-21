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
        // Extract all stock sections by looking for section headers and items
        const stock = parseStockSections(html);
        resolve(stock);
      });
    }).on('error', (err) => {
      console.error('❌ Failed to fetch stock page:', err.message);
      resolve(null);
    });
  });
}

// Parse stock sections by looking for <h3> or similar headers, then items below
function parseStockSections(html) {
  const stock = {};

  // Regex to match each stock section block: section header + item list
  // We look for something like: <h3>Seeds</h3> ... <div class="item">...</div>
  const sectionRegex = /<h3[^>]*>([^<]+)<\/h3>\s*<div class="items">([\s\S]*?)<\/div>/g;

  let match;
  while ((match = sectionRegex.exec(html)) !== null) {
    const sectionNameRaw = match[1].trim().toLowerCase(); // e.g. "Seeds", "Gear"
    const sectionItemsHtml = match[2];

    // Normalize section names as keys
    let sectionKey = null;
    if (sectionNameRaw.includes('seed')) sectionKey = 'seeds';
    else if (sectionNameRaw.includes('gear')) sectionKey = 'gear';
    else if (sectionNameRaw.includes('egg')) sectionKey = 'eggs';
    else sectionKey = sectionNameRaw.replace(/\s/g, '');

    // Extract items inside this section
    const items = [];
    const itemRegex = /<div class="item">[\s\S]*?<div class="item-name">([^<]+)<\/div>[\s\S]*?<div class="item-qty">([^<]+)<\/div>/g;

    let itemMatch;
    while ((itemMatch = itemRegex.exec(sectionItemsHtml)) !== null) {
      const name = itemMatch[1].trim();
      const qtyRaw = itemMatch[2].trim();
      const qty = parseInt(qtyRaw.replace(/[^\d]/g, '')) || 0;

      if (qty > 0) {
        items.push({ name, stock: qty });
      }
    }

    stock[sectionKey] = items;
  }

  return stock;
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
