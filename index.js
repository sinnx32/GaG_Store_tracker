require('dotenv').config();
const express = require('express');
const https = require('https');
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');
const { autoUpdateShop } = require('./src/autoShopUpdate');
const { setShopChannel, addShopRole, removeShopRole, addItemRole, removeItemRole } = require('./src/configManager');
const fs = require('fs');

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

function fetchInStockItems() {
  const url = 'https://www.gamersberg.com/grow-a-garden/stock';

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let html = '';

      res.on('data', chunk => html += chunk);
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

function parseSection(html, sectionId) {
  const items = [];
  // This regex looks for the <div id="sectionId"> ... </div> container
  // Adjusted for the current page structure (inspect the page to verify!)
  const sectionRegex = new RegExp(`<div[^>]+id="${sectionId}"[^>]*>([\\s\\S]*?)<\\/div>`, 'i');
  const sectionMatch = html.match(sectionRegex);
  if (!sectionMatch) return items;

  const sectionHtml = sectionMatch[1];

  // Each item block looks like:
  // <div class="item">
  //   <div class="item-name">Carrot</div>
  //   <div class="item-qty">15</div>
  // </div>
  const itemRegex = /<div class="item">[\s\S]*?<div class="item-name">([^<]+)<\/div>[\s\S]*?<div class="item-qty">([^<]+)<\/div>/g;

  let match;
  while ((match = itemRegex.exec(sectionHtml)) !== null) {
    const name = match[1].trim();
    const qtyStr = match[2].trim();
    const qty = parseInt(qtyStr.replace(/[^\d]/g, ''));
    if (name && qty) items.push({ name, stock: qty });
  }

  return items;
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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HTTP server listening on port ${PORT}`));

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith('.')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'stock') {
    const data = await fetchInStockItems();
    const embed = formatStockEmbed(data);
    message.reply({ embeds: [embed] });
    return;
  }

  // Your other commands here...
  // setshopchannel, additemrole, etc
});

client.login(process.env.TOKEN);

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  autoUpdateShop(client);
});
