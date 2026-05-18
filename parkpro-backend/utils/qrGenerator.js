const QRCode = require('qrcode');

/**
 * Generate a QR code as a base64 data URL
 * @param {string} data - The data to encode in the QR
 * @returns {Promise<string>} base64 data URL of the QR image
 */
async function generateQR(data) {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generando QR:', error);
    throw error;
  }
}

module.exports = { generateQR };
