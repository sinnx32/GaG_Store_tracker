const { response } = require('express');
const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('./configManager');

let previousActiveWeather = null;

async function fetchWeatherData() {
  const res = await fetch('https://api.joshlei.com/v2/growagarden/weather');
  if (!res.ok) throw new Error('Failed to fetch weather data');
  const json = await res.json();
  return json.weather;
}

function createWeatherEmbed(weather) {
  return new EmbedBuilder()
    .setTitle(`🌦️ New Weather: ${weather.weather_name}`)
    .setDescription(`A **${weather.weather_name}** event has just started!`)
    .setImage()
    .setColor(0x1D82B6)
    .setFooter({ text: 'Grow a Garden Bot - Weather Update' });
}

async function autoUpdateWeather(client) {
  const { weatherChannelId } = getConfig();
  if (!weatherChannelId) return;

  const channel = await client.channels.fetch(weatherChannelId).catch(console.error);
  if (!channel || !channel.isTextBased()) return;

  setInterval(async () => {
    try {
      const weatherData = await fetchWeatherData();
      const active = weatherData.find(w => w.active);

      if (active && active.weather_id !== previousActiveWeather) {
        console.log(`[Weather] New weather event detected: ${active.weather_name}`);
        const embed = createWeatherEmbed(active);
        await channel.send({ embeds: [embed] });
        previousActiveWeather = active.weather_id;
      }

      if (!active) {
        previousActiveWeather = null; // reset when nothing is active
      }

    } catch (err) {
      console.error('Weather update error:', err);
    }
  }, 15000); // check every 15 seconds
}

module.exports = { autoUpdateWeather };
