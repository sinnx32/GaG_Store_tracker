const { EmbedBuilder } = require('discord.js');
const { response } = require('express');

// Optional: emoji mapping (customize as needed)
const emojiMap = {
  Blueberry: '<:Blueberry:1385688607938973797>',
  Carrot: '<:Carrot:1385688465152151572>',
  Strawberry: '<:Strawberry:1385688021185073193>',
  Tomato: '<:Tomato:1385688518017159168>',
  Corn: '<:Corn:1385688423037141052>',
  Pumpkin: '<:Pumpkin:1385688130702540930>',
  'Orange Tulip': '<:OrangeTulip:1385688216337649705>',
  Pepper: '<:Pepper:1385688232821522532>',

  'Cleaning Spray': '🧼',
  Trowel: '🛠️',
  'Watering Can': '💧',
  'Recall Wrench': '🔧',
  'Favorite Tool': '🧰',
  'Harvest Tool': '🔪'
};

// Fetch function
async function fetchInStockItems() {
  //const url = 'https://growagardenapi.vercel.app/api/stock/GetStock';
  const url = "http://localhost:3000/api/stock/GetStock";
  try {
    const response = await fetch(url);
    const data = await response.json();

    const result = {};
    const sections = Object.keys(data.Data);

    for (const section of sections) {
      if (Array.isArray(data.Data[section])) {
        const inStockItems = data.Data[section].filter(item => parseInt(item.stock) > 0);
        if (inStockItems.length > 0) {
          result[section] = inStockItems.map(item => ({
            name: item.name,
            stock: parseInt(item.stock)
          }));
        }
      }
    }

    return result;

  } catch (err) {
    console.error("Failed to fetch stock:", err);
    console.error(response)
    return null;
  }
}

// Format to Discord embed
function formatStockEmbed(data) {
  if (!data) {
    return new EmbedBuilder()
      .setTitle('Grow a Garden Stock')
      .setDescription('⚠️ Failed to fetch stock data.')
      .setColor('Red');
  }

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const seeds = data.seeds || [];
  const gear = data.gear || [];

  const seedsField = seeds.map(item =>
    `**x${item.stock}** ${emojiMap[item.name] || ''} ${item.name}`
  ).join('\n') || 'No stock';

  const gearField = gear.map(item =>
    `**x${item.stock}** ${emojiMap[item.name] || ''} ${item.name}`
  ).join('\n') || 'No stock';

  const embed = new EmbedBuilder()
    .setTitle(`Grow a Garden Stock`)
    .setColor(0x57F287) // green
    .addFields(
      { name: '🌱 Seeds Stock', value: seedsField, inline: true },
      { name: '⚙️ Gear Stock', value: gearField, inline: true }
    )
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/4769/4769989.png')
    .setFooter({ text: 'Grow a Garden Bot' });

  return embed;
}

module.exports = { fetchInStockItems, formatStockEmbed };
