require('dotenv').config();
const https = require('https');
const express = require('express');
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');

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
  'Harvest Tool': '🔪'
};

// Function to fetch stock data from Grow a Garden API (using https)
async function fetchInStockItems() {
  const url = 'https://growagardenapi.vercel.app/api/stock/GetStock';

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);

      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          const result = {};
          for (const category of ['seeds', 'gear', 'eggs']) {
            if (json.Data && json.Data[category]) {
              result[category] = json.Data[category]
                .filter(item => item.stock > 0)
                .map(item => ({ name: item.name, stock: item.stock }));
            } else {
              result[category] = [];
            }
          }

          resolve(result);
        } catch (e) {
          console.error('❌ Failed to parse JSON from API:', e);
          resolve(null);
        }
      });

    }).on('error', (err) => {
      console.error('❌ Failed to fetch stock from API:', err);
      resolve(null);
    });
  });
}

// Format data as Discord Embed
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

  return new EmbedBuilder()
    .setTitle(`Grow a Garden Stock (Updated: ${timeStr})`)
    .setColor(0x57f287) // green
    .addFields(
      { name: '🌱 Seeds', value: formatItems(stockData.seeds), inline: true },
      { name: '⚙️ Gear', value: formatItems(stockData.gear), inline: true },
      { name: '🥚 Eggs', value: formatItems(stockData.eggs), inline: true }
    )
    .setFooter({ text: 'Grow a Garden Bot' })
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/4769/4769989.png');
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Simple Express server for Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`HTTP server listening on port ${PORT}`));

// Discord message handler
client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.content.startsWith('.')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'stock') {
    const stockData = await fetchInStockItems();
    const embed = formatStockEmbed(stockData);
    message.reply({ embeds: [embed] });
  }
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
