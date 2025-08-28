// This file imports and re-exports the compiled handler from the TypeScript API
// Using CommonJS for better Vercel compatibility

const handler = require('../packages/api/dist/handler.js');

module.exports = handler.default || handler;
