const fetch = require('node-fetch'); // If you can't npm install, you can replace with https manually (let me know)

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

async function fetchInStockItems() {
  const url = 'https://growagardenapi.vercel.app/api/stock/GetStock';

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Data.Data has keys seeds, gear, eggs each an array of {name, stock}
    const result = {};
    for (const category of ['seeds', 'gear', 'eggs']) {
      if (data.Data[category]) {
        result[category] = data.Data[category]
          .filter(item => item.stock > 0)
          .map(item => ({ name: item.name, stock: item.stock }));
      } else {
        result[category] = [];
      }
    }
    return result;

  } catch (err) {
    console.error('❌ Failed to fetch stock from API:', err);
    return null;
  }
}

const { EmbedBuilder } = require('discord.js');

function formatStockEmbed(stockData) {
  if (!stockData) {
    return new EmbedBuilder()
      .setTitle('Grow a Garden Stock')
      .setDescription('⚠️ Failed to fetch stock data.')
      .setColor('Red');
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatItems = items =>
    items.length
      ? items.map(i => `**x${i.stock}** ${emojiMap[i.name] || ''} ${i.name}`).join('\n')
      : 'No stock';

  const embed = new EmbedBuilder()
    .setTitle(`Grow a Garden Stock (Updated: ${timeStr})`)
    .setColor(0x57f287) // green
    .addFields(
      { name: '🌱 Seeds', value: formatItems(stockData.seeds), inline: true },
      { name: '⚙️ Gear', value: formatItems(stockData.gear), inline: true },
      { name: '🥚 Eggs', value: formatItems(stockData.eggs), inline: true }
    )
    .setFooter({ text: 'Grow a Garden Bot' })
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/4769/4769989.png');

  return embed;
}

module.exports = { fetchInStockItems, formatStockEmbed };
