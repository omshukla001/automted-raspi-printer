// raspi-printer.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

// ---------------- CONFIG ----------------
const PORT = process.env.PORT || 4000;
const DOWNLOAD_DIR = process.env.UPLOAD_PATH || path.join(__dirname, "downloads");
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // default 50 MB
const PRINTER_NAME = process.env.PRINTER_NAME || "";

// ---------------- BODY PARSER ----------------
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_FILE_SIZE }));

// ---------------- HEALTH ----------------
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "raspi-printer", port: PORT });
});

// ---------------- TUNNEL DISCOVERY ----------------
app.get("/tunnel", async (req, res) => {
  try {
    const r = await axios.get("http://127.0.0.1:4040/metrics");
    const body = r.data;
    const match = body.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      return res.json({ url: match[0] });
    } else {
      return res.status(404).json({ error: "No active tunnels found" });
    }
  } catch (err) {
    console.error("Tunnel fetch error:", err.message);
    return res.status(500).json({ error: "Could not fetch tunnel info" });
  }
});

// ---------------- PRINT ----------------
// POST /print
// Accepts either { fileUrl, fileName } OR { fileContent (base64), fileName }
app.post("/print", async (req, res) => {
  try {
    const { fileUrl, fileName, fileContent } = req.body || {};
    if (!fileName || (!fileUrl && !fileContent)) {
      return res
        .status(400)
        .json({ success: false, error: "Missing fileName and fileUrl/fileContent" });
    }

    // Sanitize filename
    const safeName = path
      .basename(String(fileName))
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    const localPath = path.join(DOWNLOAD_DIR, safeName);

    const saveAndPrint = () => {
      const lpCmd = PRINTER_NAME
        ? `lp -d "${PRINTER_NAME}" "${localPath}"`
        : `lp "${localPath}"`;
      exec(lpCmd, (err, stdout, stderr) => {
        if (err) {
          console.error("Print error:", stderr || err.message);
          return res
            .status(500)
            .json({ success: false, error: stderr || err.message });
        }
        console.log("Print job submitted:", stdout.trim());

        // Cleanup file after 1 minute
        setTimeout(() => fs.unlink(localPath, () => {}), 60 * 1000);

        return res.json({
          success: true,
          message: "Print job submitted",
          job: stdout.trim(),
        });
      });
    };

    if (fileContent) {
      // If base64 content is provided
      const buffer = Buffer.from(fileContent, "base64");
      fs.writeFileSync(localPath, buffer);
      saveAndPrint();
    } else {
      // Download file from URL
      const response = await axios({ method: "GET", url: fileUrl, responseType: "stream" });
      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);

      writer.on("finish", saveAndPrint);
      writer.on("error", (e) => {
        console.error("Write error:", e.message);
        res.status(500).json({ success: false, error: "Failed to write downloaded file" });
      });
    }
  } catch (e) {
    console.error("POST /print error:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Raspi Printer running on port ${PORT}`);
});
