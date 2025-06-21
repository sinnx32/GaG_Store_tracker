const fs = require('fs');
const configPath = './config.json';

function getConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function saveConfig(updatedConfig) {
  fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
}

function setShopChannel(id) {
  const config = getConfig();
  config.shopChannelId = id;
  saveConfig(config);
}

function setWeatherChannel(id) {
  const config = getConfig();
  config.weatherChannelId = id;
  saveConfig(config);
}

function addItemRole(itemName, roleId) {
  const config = getConfig();
  if (!config.itemRoleMap) config.itemRoleMap = {};
  config.itemRoleMap[itemName] = roleId;
  saveConfig(config);
}

function removeItemRole(itemName) {
  const config = getConfig();
  if (config.itemRoleMap) {
    delete config.itemRoleMap[itemName];
    saveConfig(config);
  }
}

module.exports = {
  getConfig,
  setShopChannel,
  setWeatherChannel,
  addItemRole,
  removeItemRole,
  setWeatherChannel
};
