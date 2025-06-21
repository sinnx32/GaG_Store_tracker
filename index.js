require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { fetchInStockItems, formatStockEmbed } = require('./src/stock');
const { autoUpdateShop } = require('./src/autoShopUpdate');
const { setShopChannel, addShopRole, removeShopRole, addItemRole, removeItemRole } = require('./src/configManager');
const fs = require("fs");

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
    try {
      const data = await fetchInStockItems();
      const embed = formatStockEmbed(data);
      await message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('❌ Error in stock command:', err);
      await message.reply('❌ Failed to fetch stock data.');
    }
    return;
  }

  // Other commands (setshopchannel, additemrole, removeitemrole, config) remain unchanged...
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'stock') {
    await interaction.deferReply();
    try {
      const data = await fetchInStockItems();
      const embed = formatStockEmbed(data);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('❌ Error in slash stock command:', err);
      await interaction.editReply('❌ Failed to fetch stock data.');
    }
  }
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  autoUpdateShop(client);
});

client.login(process.env.TOKEN);
