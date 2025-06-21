const https = require('https');

// Fetch stock HTML and parse items
async function fetchInStockItems() {
  const url = 'https://www.gamersberg.com/grow-a-garden/stock';

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let html = '';

      res.on('data', (chunk) => {
        html += chunk;
      });

      res.on('end', () => {
        // Parse each section by id
        const stock = {
          seeds: parseSection(html, 'seed-stock'),
          gear: parseSection(html, 'gear-stock'),
          eggs: parseSection(html, 'egg-stock')
        };
        console.log('Parsed stock:', stock); // DEBUG log parsed stock
        resolve(stock);
      });

    }).on('error', (err) => {
      console.error('❌ Failed to fetch stock page:', err.message);
      resolve(null);
    });
  });
}

// Parse a section from HTML by ID and extract items with name and stock quantity
function parseSection(html, sectionId) {
  const items = [];

  // Match the div with the specific id
  const sectionRegex = new RegExp(`<div[^>]+id="${sectionId}"[^>]*>([\\s\\S]*?)<\\/div>`, 'i');
  const sectionMatch = html.match(sectionRegex);

  if (!sectionMatch) {
    console.log(`❌ Section ID not found: ${sectionId}`); // Debug log if section missing
    return items; // return empty list if not found
  }

  const sectionHtml = sectionMatch[1];

  // Match each item div and capture name and quantity
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

  console.log(`Parsed ${items.length} items from section: ${sectionId}`); // Debug parsed count
  return items;
}

// Embed formatting for Discord response (your existing code)
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

  const seeds = data.seeds || [];
  const gear = data.gear || [];
  const eggs = data.eggs || [];

  const seedsField = seeds.length
    ? seeds.map(item => `**x${item.stock}** ${emojiMap[item.name] || ''} ${item.name}`).join('\n')
    : 'No stock';

  const gearField = gear.length
    ? gear.map(item => `**x${item.stock}** ${emojiMap[item.name] || ''} ${item.name}`).join('\n')
    : 'No stock';

  const eggsField = eggs.length
    ? eggs.map(item => `**x${item.stock}** 🥚 ${item.name}`).join('\n')
    : 'No stock';

  return new EmbedBuilder()
    .setTitle('Grow a Garden Stock')
    .setColor(0x57F287)
    .addFields(
      { name: '🌱 Seeds Stock', value: seedsField, inline: true },
      { name: '⚙️ Gear Stock', value: gearField, inline: true },
      { name: '🥚 Eggs Stock', value: eggsField, inline: true }
    )
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/4769/4769989.png')
    .setFooter({ text: 'Grow a Garden Bot' });
}

module.exports = { fetchInStockItems, formatStockEmbed };
