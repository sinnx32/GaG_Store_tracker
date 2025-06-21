require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');
const { autoUpdateShop } = require('./src/autoShopUpdate');
const { setShopChannel, addShopRole, removeShopRole, addItemRole, removeItemRole } = require('./src/configManager');
const fs = require("fs");

// Emoji map for stock display
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

// Fetch stock data from Grow a Garden API
async function fetchInStockItems() {
  const url = 'https://growagardenapi.vercel.app/api/stock/GetStock';

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (!json || !json.Data) return null;

    const stock = {};

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

// Format stock data into a Discord embed
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

// Simple Express server for health check
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HTTP server listening on port ${PORT}`));

// Discord message commands
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith('.')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  switch (command) {
    case 'stock': {
      const data = await fetchInStockItems();
      const embed = formatStockEmbed(data);
      message.reply({ embeds: [embed] });
      break;
    }
    case "setshopchannel":
      if (!message.member.permissions.has("Administrator")) {
        return message.reply("❌ You need administrator permission to do this.");
      }
      setShopChannel(message.channel.id);
      message.reply(`✅ Shop updates will now post in <#${message.channel.id}>`);
      break;
    case 'additemrole': {
      if (!message.member.permissions.has('Administrator')) return message.reply('❌ Admin only.');

      const [itemName, roleMention] = args;
      const role = message.mentions.roles.first();
      if (!itemName || !role) return message.reply('❌ Usage: `!additemrole <ItemName> @Role`');

      addItemRole(itemName, role.id);
      return message.reply(`✅ Now pinging <@&${role.id}> when **${itemName}** is in stock.`);
    }
    case 'removeitemrole': {
      if (!message.member.permissions.has('Administrator')) return message.reply('❌ Admin only.');
      const itemName = args.join(' ');
      if (!itemName) return message.reply('❌ Usage: `!removeitemrole <ItemName>`');

      removeItemRole(itemName);
      return message.reply(`✅ No longer pinging for **${itemName}**.`);
    }
    case "config":
      const rawData = fs.readFileSync("config.json", "utf-8");
      message.reply(String(rawData));
  }
});

// Slash command handling
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  switch (commandName) {
    case 'stock': {
      await interaction.deferReply();
      const data = await fetchInStockItems();
      const embed = formatStockEmbed(data);
      await interaction.editReply({ embeds: [embed] });
      break;
    }
  }
});

client.login(process.env.TOKEN);

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  autoUpdateShop(client);
});
