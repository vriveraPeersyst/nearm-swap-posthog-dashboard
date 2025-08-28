import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// API endpoint to get swap metrics
app.get('/api/swap-metrics', async (req, res) => {
  try {
    console.log('Fetching swap metrics...');
    
    // Change to the API directory and run the script directly
    const apiDir = path.join(process.cwd(), '../api');
    const { stdout, stderr } = await execAsync('npx tsx src/index.ts', { 
      cwd: apiDir,
      timeout: 60000 // 60 second timeout
    });
    
    if (stderr) {
      console.warn('Script warnings:', stderr);
    }
    
    // Clean up the output - find the JSON part (starts with { and ends with })
    const lines = stdout.split('\n');
    let jsonLines = [];
    let insideJson = false;
    let braceCount = 0;
    
    for (const line of lines) {
      if (!insideJson && line.trim().startsWith('{')) {
        insideJson = true;
        jsonLines.push(line);
        braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      } else if (insideJson) {
        jsonLines.push(line);
        braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        
        if (braceCount === 0) {
          break; // Complete JSON object found
        }
      }
    }
    
    if (jsonLines.length === 0) {
      throw new Error('No JSON output found in script response');
    }
    
    const jsonOutput = jsonLines.join('\n');
    
    // Parse the JSON output from the script
    const data = JSON.parse(jsonOutput);
    
    console.log('Successfully fetched metrics');
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching swap metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch swap metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Metrics endpoint: http://localhost:${PORT}/api/swap-metrics`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
