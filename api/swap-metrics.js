// This file imports and re-exports the compiled handler from the TypeScript API
// This allows us to keep the main API logic in packages/api while satisfying Vercel's requirements

// Import the compiled handler after build
import handler from '../packages/api/dist/handler.js';

export default handler;
