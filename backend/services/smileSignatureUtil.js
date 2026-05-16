// services/smileSignatureUtil.js
// Utility to generate Smile.One signatures
// Reads credentials from environment variables

const crypto = require('crypto');

/**
 * Generate Smile.One double MD5 signature
 * @param {Object} params - Parameters to sign (uid, email, product, time, etc.)
 * @returns {string} - Double MD5 hash signature
 */
function generateSignature(params) {
  const API_KEY = process.env.SMILE_API_KEY;

  if (!API_KEY) {
    throw new Error('SMILE_API_KEY not found in environment variables');
  }

  // Sort keys alphabetically
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');

  // Add API key at the end
  const signString = sorted + '&' + API_KEY;

  // First MD5 hash
  const firstHash = crypto.createHash('md5').update(signString).digest('hex');

  // Second MD5 hash (double MD5)
  const signature = crypto.createHash('md5').update(firstHash).digest('hex');

  return signature;
}

/**
 * Get Smile credentials from environment
 * @returns {Object} - Object with uid, email, apiKey
 */
function getSmileCredentials() {
  const uid = process.env.SMILE_UID;
  const email = process.env.SMILE_EMAIL;
  const apiKey = process.env.SMILE_API_KEY;

  if (!uid || !email || !apiKey) {
    throw new Error(
      'Missing Smile.One credentials in environment variables. ' +
      'Please set SMILE_UID, SMILE_EMAIL, and SMILE_API_KEY in .env file'
    );
  }

  return { uid, email, apiKey };
}

/**
 * Build request params for Smile.One API
 * @param {Object} customParams - Additional parameters (product, userid, zoneid, etc.)
 * @returns {Object} - Complete params object with uid, email, time, sign
 */
function buildSmileRequestParams(customParams = {}) {
  const { uid, email } = getSmileCredentials();

  const params = {
    uid,
    email,
    time: Math.floor(Date.now() / 1000),
    ...customParams
  };

  // Generate signature after all params are set
  params.sign = generateSignature(params);

  return params;
}

module.exports = {
  generateSignature,
  getSmileCredentials,
  buildSmileRequestParams
};