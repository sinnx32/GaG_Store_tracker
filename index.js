require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { fetchInStockItems, formatStockEmbed } = require('./src/stock');
const { autoUpdateShop } = require('./src/autoShopUpdate');
const { setShopChannel, addShopRole, removeShopRole, addItemRole, removeItemRole } = require('./src/configManager');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Simple Express server to keep the bot alive
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HTTP server listening on port ${PORT}`));

// Message command handling
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith('.')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  switch (command) {
    case 'stock': {
      try {
        const data = await fetchInStockItems();
        const embed = formatStockEmbed(data);
        await message.reply({ embeds: [embed] });
      } catch (err) {
        console.error('❌ Error in stock command:', err);
        await message.reply('❌ Failed to fetch stock data.');
      }
      break;
    }
    case 'setshopchannel': {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply('❌ You need administrator permission to do this.');
      }
      setShopChannel(message.channel.id);
      message.reply(`✅ Shop updates will now post in <#${message.channel.id}>`);
      break;
    }
    case 'additemrole': {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply('❌ Admin only.');
      }
      const [itemName, roleMention] = args;
      const role = message.mentions.roles.first();
      if (!itemName || !role) return message.reply('❌ Usage: `!additemrole <ItemName> @Role`');
      addItemRole(itemName, role.id);
      message.reply(`✅ Now pinging <@&${role.id}> when **${itemName}** is in stock.`);
      break;
    }
    case 'removeitemrole': {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply('❌ Admin only.');
      }
      const itemName = args.join(' ');
      if (!itemName) return message.reply('❌ Usage: `!removeitemrole <ItemName>`');
      removeItemRole(itemName);
      message.reply(`✅ No longer pinging for **${itemName}**.`);
      break;
    }
    case 'config': {
      try {
        const rawData = fs.readFileSync('config.json', 'utf-8');
        message.reply('```json\n' + rawData + '\n```');
      } catch (e) {
        message.reply('❌ Could not read config file.');
      }
      break;
    }
    default:
      // Optional: handle unknown commands
      break;
  }
});

// Slash command handling
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'stock': {
      await interaction.deferReply();
      try {
        const data = await fetchInStockItems();
        const embed = formatStockEmbed(data);
        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('❌ Error in slash stock command:', err);
        await interaction.editReply('❌ Failed to fetch stock data.');
      }
      break;
    }
  }
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  autoUpdateShop(client);
});

client.login(process.env.TOKEN);
