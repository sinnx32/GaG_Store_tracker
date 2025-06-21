require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { fetchInStockItems, formatStockEmbed } = require('./src/stock');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Simple Express server
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

  // ... your other commands ...
});

client.login(process.env.TOKEN);

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  // Optionally auto update shop here if you want
});
