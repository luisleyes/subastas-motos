// next.config.js
const path = require('path');

module.exports = {
  turbopack: {
    root: path.join(__dirname), // esto limita el escaneo SOLO a tu carpeta de proyecto
  },
};