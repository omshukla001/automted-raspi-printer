const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendToRaspberryPi } = require('../utils/raspiprinter');
const Job = require('../models/Job');
const { calculatePrice } = require('../utils/pricing');

// Configure multer for file uploads
const uploadPath = process.env.UPLOAD_PATH || './uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
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
    fileSize: maxFileSize // Use environment variable
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

// New upload endpoint for frontend (creates job)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Calculate price (default: A4, black-white, 1 copy, estimate 10 pages)
    // In production, you'd parse the PDF to get actual page count
    const estimatedPages = 10;
    const pricing = calculatePrice({
      paperSize: 'A4',
      color: 'black-white',
      copies: 1,
      totalPages: estimatedPages
    });

    const amountPaise = Math.round(pricing.finalCost * 100);

    // Create job
    const job = new Job({
      filename: req.file.originalname,
      filepath: req.file.path,
      state: 'UPLOADED',
      amount_paise: amountPaise
    });

    await job.save();

    res.json({
      status: 'success',
      job_id: job.id,
      filename: job.filename,
      amount_paise: job.amount_paise
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to upload file'
    });
  }
});

// Upload single file and immediately send to Raspberry Pi
router.post('/file', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    let printResult = null;
    try {
      printResult = await sendToRaspberryPi(req.file.path, req.file.originalname);
      if (printResult && printResult.success === false) {
        console.log('⚠️ Raspberry Pi communication failed, but file was uploaded successfully');
      }
    } catch (err) {
      console.error('❌ Could not send file to Raspberry Pi:', err.message);
      printResult = { success: false, message: err.message };
    }

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      print: printResult || { success: false, message: 'Failed to dispatch to Raspberry Pi' }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

// Upload multiple files and immediately send to Raspberry Pi
router.post('/files', upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const uploadedFiles = [];
    for (const file of req.files) {
      let printResult = null;
      try {
        printResult = await sendToRaspberryPi(file.path, file.originalname);
      } catch (err) {
        console.error('❌ Could not send file to Raspberry Pi:', err.message);
      }
      uploadedFiles.push({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        print: printResult || { success: false, message: 'Failed to dispatch to Raspberry Pi' }
      });
    }

    res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files'
    });
  }
});

// Delete uploaded file
router.delete('/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(uploadPath, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

// Get file info
router.get('/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(uploadPath, filename);
    
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      res.json({
        success: true,
        file: {
          filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file info'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

module.exports = router; 