const https = require('https');
const { JSDOM } = require('jsdom'); // You already likely have this, but see note below
const { EmbedBuilder } = require('discord.js');

// Manual fetch without axios
async function fetchInStockItems() {
  const url = 'https://www.gamersberg.com/grow-a-garden/stock';

  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';

      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const dom = new JSDOM(data);
          const document = dom.window.document;

          const parseSection = (selector) => {
            const items = [];
            const elements = document.querySelectorAll(`${selector} .item`);
            elements.forEach(el => {
              const name = el.querySelector('.item-name')?.textContent.trim();
              const qtyText = el.querySelector('.item-qty')?.textContent.trim().replace(/[^\d]/g, '');
              if (name && qtyText) {
                items.push({ name, stock: parseInt(qtyText) });
              }
            });
            return items;
          };

          const stock = {
            seeds: parseSection('#seed-stock'),
            gear: parseSection('#gear-stock'),
            eggs: parseSection('#egg-stock')
          };

          resolve(stock);
        } catch (e) {
          console.error('❌ Error parsing stock page:', e.message);
          resolve(null);
        }
      });
    }).on('error', err => {
      console.error('❌ Failed to load stock page:', err.message);
      resolve(null);
    });
  });
}
