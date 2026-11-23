// Register TypeScript loader via tsx
require('tsx');
require('dotenv').config();

// Load and execute the modular Express application
import('./src/index.ts').catch((err) => {
  console.error('Failed to start Rishihood One server:', err);
  process.exit(1);
});
