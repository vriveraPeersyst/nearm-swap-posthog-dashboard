import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

// Production logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Enable CORS for all routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || false
    : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Simple rate limiting
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = process.env.NODE_ENV === 'production' ? 30 : 100;

const rateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = requestCounts.get(clientIP);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (clientData.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

app.use('/api', rateLimit);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

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

// API endpoint to get account values
app.get('/api/account-values', async (req, res) => {
  try {
    console.log('Fetching account values...');
    
    // Change to the API directory and run the account values script
    const apiDir = path.join(process.cwd(), '../api');
    const { stdout, stderr } = await execAsync('npx tsx src/getTotalAccountValues.ts', { 
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
    
    console.log('Successfully fetched account values');
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching account values:', error);
    res.status(500).json({ 
      error: 'Failed to fetch account values',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API endpoint to get top accounts by value
app.get('/api/top-accounts', async (req, res) => {
  try {
    console.log('Fetching top accounts by value...');
    
    // Change to the API directory and run the top accounts script
    const apiDir = path.join(process.cwd(), '../api');
    const { stdout, stderr } = await execAsync('npx tsx src/getTopAccountsByValue.ts', { 
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
    
    console.log('Successfully fetched top accounts by value');
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching top accounts by value:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top accounts by value',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API endpoint to get validator stats
app.get('/api/validator-stats', async (req, res) => {
  try {
    console.log('Fetching validator stats...');
    
    // Change to the API directory and run the validator stats script
    const apiDir = path.join(process.cwd(), '../api');
    const { stdout, stderr } = await execAsync('npx tsx src/getValidatorStats.ts', { 
      cwd: apiDir,
      timeout: 120000 // 2 minute timeout
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
    
    console.log('Successfully fetched validator stats');
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching validator stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch validator stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 API available at http://localhost:${PORT}/api/swap-metrics`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
