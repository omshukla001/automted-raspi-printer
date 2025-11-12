const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const { initializeRaspiTunnelWatcher, getRaspiApiUrl } = require('./utils/raspiDiscovery');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Configure body-parser limits from environment variables
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
const uploadPath = process.env.UPLOAD_PATH || './uploads';

app.use(express.json({ limit: maxFileSize }));
app.use(express.urlencoded({ extended: true, limit: maxFileSize }));

// ✅ Serve uploaded files so Raspberry Pi can fetch them
app.use('/uploads', express.static(uploadPath));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxFileSize // Use the same limit as body-parser
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC files are allowed!'));
    }
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printer_business', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Raspberry Pi printer endpoints (must be before /api routes to avoid 404)
app.get('/tunnel', async (req, res) => {
  try {
    const url = getRaspiApiUrl() || process.env.RASPI_API_URL || process.env.RASPI_URL || null;
    res.json({ url });
  } catch (error) {
    console.error('Error getting tunnel URL:', error);
    res.status(500).json({ error: 'Failed to get tunnel URL' });
  }
});

app.post('/print', async (req, res) => {
  try {
    const { fileName, fileContent } = req.body;
    
    if (!fileName || !fileContent) {
      return res.status(400).json({ error: 'fileName and fileContent are required' });
    }

    const { sendToRaspberryPi } = require('./utils/raspiprinter');
    
    // Send base64 content directly to Raspberry Pi (no need to save file)
    const result = await sendToRaspberryPi(null, fileName, fileContent);

    if (result && result.success === false) {
      return res.status(500).json({ error: result.message || result.error || 'Failed to print' });
    }

    res.json({ success: true, message: result.message || 'File sent to printer successfully' });
  } catch (error) {
    console.error('Error printing file:', error);
    res.status(500).json({ error: error.message || 'Failed to print file' });
  }
});

// Routes
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/upload', require('./routes/upload'));

// Job status endpoint
const Job = require('./models/Job');
app.get('/api/job/:jobId', async (req, res) => {
  try {
    const job = await Job.findOne({ id: req.params.jobId });
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }

    res.json({
      status: 'success',
      job: {
        id: job.id,
        filename: job.filename,
        state: job.state,
        order_id: job.razorpay_order_id,
        payment_id: job.razorpay_payment_id,
        created_at: job.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch job status'
    });
  }
});

// Expose current Raspberry Pi API URL for debugging
app.get('/api/raspi-url', (req, res) => {
  res.json({
    discoveredUrl: getRaspiApiUrl() || null,
    envUrl: process.env.RASPI_API_URL || null,
    directUrl: process.env.RASPI_URL || null
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Printer Business API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle payload size errors
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      error: 'Payload too large',
      message: `File size exceeds the limit of ${maxFileSize / (1024 * 1024)}MB`
    });
  }
  
  // Handle multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: 'File too large',
      message: `File size exceeds the limit of ${maxFileSize / (1024 * 1024)}MB`
    });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start background watcher to discover Cloudflare Tunnel URL
  initializeRaspiTunnelWatcher().catch(err => {
    console.error('Failed to start Raspi tunnel watcher:', err.message);
  });
});
