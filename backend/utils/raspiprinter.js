const axios = require("axios");
const { getRaspiApiUrl } = require("./raspiDiscovery");
const fs = require('fs');
const path = require('path');

/**
 * Send file to Raspberry Pi for printing
 * Supports both fileUrl (download) and fileContent (base64) methods
 * @param {string} filePath - File path stored in backend (e.g., "uploads/abc.pdf")
 * @param {string} fileName - Original file name
 * @param {string} base64Content - Optional: base64 encoded file content (if provided, uses this instead of fileUrl)
 */
async function sendToRaspberryPi(filePath, fileName, base64Content = null) {
  try {
    // Get Raspberry Pi URL (from discovery or env)
    let raspiBaseUrl = getRaspiApiUrl() || process.env.RASPI_API_URL || process.env.RASPI_URL;
    
    if (!raspiBaseUrl) {
      throw new Error('Raspberry Pi URL not configured. Set RASPI_URL or ensure tunnel discovery is working.');
    }

    // Remove trailing slash
    raspiBaseUrl = raspiBaseUrl.replace(/\/$/, '');
    const raspiUrl = `${raspiBaseUrl}/print`;

    let payload;
    
    if (base64Content) {
      // Method 1: Send base64 content directly
      payload = {
        fileContent: base64Content,
        fileName: fileName
      };
      console.log(`[RaspiPrinter] Sending file as base64 to: ${raspiUrl}`);
      console.log(`[RaspiPrinter] File name: ${fileName}`);
      console.log(`[RaspiPrinter] Base64 size: ${base64Content.length} characters`);
    } else {
      // Method 2: Send file URL for Raspberry Pi to download
      const fileStats = fs.statSync(filePath);
      const fileSizeMB = fileStats.size / (1024 * 1024);
      
      if (fileSizeMB > 10) {
        console.warn(`⚠️ Warning: File size is ${fileSizeMB.toFixed(2)}MB, which might cause issues`);
      }

      const backendBaseUrl = process.env.BACKEND_URL || "http://localhost:5001";
      const fileUrl = `${backendBaseUrl}/uploads/${path.basename(filePath)}`;

      payload = {
        fileUrl: fileUrl,
        fileName: fileName
      };
      
      console.log(`[RaspiPrinter] Sending file URL to: ${raspiUrl}`);
      console.log(`[RaspiPrinter] File URL: ${fileUrl}`);
      console.log(`[RaspiPrinter] File name: ${fileName}`);
      console.log(`[RaspiPrinter] File size: ${fileStats.size} bytes (${fileSizeMB.toFixed(2)}MB)`);
    }

    const response = await axios.post(raspiUrl, payload, {
      timeout: 60000, // 60 second timeout (for large files)
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`[RaspiPrinter] ✅ Success! Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error sending file to Raspberry Pi:", error.message);
    if (error.response) {
      console.error("❌ Response status:", error.response.status);
      console.error("❌ Response data:", error.response.data);
    }
    // Don't throw error, just return failure info
    return { 
      success: false, 
      message: `Failed to send file to Raspberry Pi: ${error.message}`,
      error: error.message
    };
  }
}

module.exports = { sendToRaspberryPi };
