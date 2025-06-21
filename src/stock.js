const fetch = require('node-fetch'); // we'll use this for HTTP requests
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
  'Harvest Tool': '🔪',
};

async function fetchInStockItems() {
  const url = 'https://growagardenapi.vercel.app/api/stock/GetStock';

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (!json || !json.Data) return null;

    const stock = {};

    // We expect Data to have categories with arrays of items
    for (const category in json.Data) {
      if (Array.isArray(json.Data[category])) {
        const items = json.Data[category]
          .filter(item => parseInt(item.stock) > 0)
          .map(item => ({ name: item.name, stock: parseInt(item.stock) }));
        if (items.length > 0) {
          stock[category.toLowerCase()] = items;
        }
      }
    }

    return stock;

  } catch (err) {
    console.error('❌ Failed to fetch stock from API:', err);
    return null;
  }
}

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
