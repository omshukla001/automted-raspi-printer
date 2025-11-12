# Complete Setup Guide - Raspberry Pi Printer Application

## Architecture Overview

```
Frontend (React) → Backend (Node.js) → Raspberry Pi Service → Printer
     :3000              :5001              :4000
```

## Prerequisites

1. **Node.js** (v14+)
2. **MongoDB** (for backend database)
3. **Cloudflare Tunnel** (cloudflared) - on Raspberry Pi
4. **CUPS/LP** (for printing) - on Raspberry Pi

## Step 1: Raspberry Pi Setup

### 1.1 Install Dependencies on Raspberry Pi

```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install CUPS for printing
sudo apt-get update
sudo apt-get install -y cups

# Install cloudflared (Cloudflare Tunnel)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### 1.2 Setup Printer in CUPS

```bash
# Add your printer (replace with your printer name/IP)
lpadmin -p MyPrinter -E -v socket://192.168.1.100:9100 -i usb
# Or for USB printer:
lpadmin -p MyPrinter -E -v usb://HP/Deskjet
```

### 1.3 Create Raspberry Pi Service File

Create `raspi-printer.js` on your Raspberry Pi (the code you provided).

Create `.env` file on Raspberry Pi:
```env
PORT=4000
UPLOAD_PATH=./downloads
MAX_FILE_SIZE=52428800
PRINTER_NAME=MyPrinter
```

### 1.4 Start Cloudflare Tunnel on Raspberry Pi

```bash
# Start cloudflared tunnel (this exposes the Raspberry Pi service)
cloudflared tunnel --url http://localhost:4000
```

**Note:** The tunnel URL will be displayed (e.g., `https://abc123.trycloudflare.com`). Copy this URL.

### 1.5 Start Raspberry Pi Service

```bash
# On Raspberry Pi
cd /path/to/raspi-printer
npm install express axios dotenv
node raspi-printer.js
```

The service should be running on port 4000 and accessible via Cloudflare Tunnel.

## Step 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

### 2.2 Configure Environment Variables

Create `backend/.env` file:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/printer_business
FRONTEND_URL=http://localhost:3000
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Raspberry Pi Configuration
RASPI_URL=https://your-tunnel-url.trycloudflare.com
# OR use discovery (if Raspberry Pi is on same network)
RASPI_DISCOVERY_URL=http://raspberry-pi-local-ip:4000

# Backend URL (for file downloads)
BACKEND_URL=http://localhost:5001
```

**Important:** Replace `https://your-tunnel-url.trycloudflare.com` with your actual Cloudflare Tunnel URL from Step 1.4.

### 2.3 Start Backend

```bash
cd backend
npm start
```

Backend should be running on `http://localhost:5001`

## Step 3: Frontend Setup

### 3.1 Install Dependencies

```bash
cd frontend
npm install
```

### 3.2 Configure Environment (Optional)

Create `frontend/.env` file (optional):
```env
REACT_APP_API_BASE=/
```

The frontend uses proxy configuration in `package.json` to connect to backend.

### 3.3 Start Frontend

```bash
cd frontend
npm start
```

Frontend should be running on `http://localhost:3000`

## Step 4: Verify Setup

### 4.1 Check Raspberry Pi Service

```bash
# From your computer, test Raspberry Pi health
curl https://your-tunnel-url.trycloudflare.com/health

# Should return: {"ok":true,"service":"raspi-printer","port":4000}
```

### 4.2 Check Backend

```bash
# Test backend health
curl http://localhost:5001/api/health

# Test tunnel endpoint
curl http://localhost:5001/tunnel

# Should return: {"url":"https://your-tunnel-url.trycloudflare.com"}
```

### 4.3 Test Frontend

1. Open `http://localhost:3000` in browser
2. Upload a file (PDF, PNG, JPG, or DOCX)
3. Click "Get Tunnel URL" - should show your tunnel URL
4. Click "Print File" - should send file to Raspberry Pi and print

## Troubleshooting

### Issue: "getaddrinfo ENOTFOUND" error

**Solution:** The Cloudflare Tunnel URL is incorrect or the tunnel is not running.
- Verify tunnel is running on Raspberry Pi: `cloudflared tunnel --url http://localhost:4000`
- Update `RASPI_URL` in backend `.env` with correct tunnel URL
- Restart backend server

### Issue: "No active tunnels found"

**Solution:** Cloudflare Tunnel metrics API not accessible.
- Ensure cloudflared is running with metrics: `cloudflared tunnel --url http://localhost:4000`
- Check if port 4040 is accessible on Raspberry Pi
- Use direct `RASPI_URL` in backend `.env` instead of discovery

### Issue: Print job fails

**Solution:** Check printer configuration.
- Verify printer is added in CUPS: `lpstat -p`
- Test printing manually: `echo "test" | lp`
- Check `PRINTER_NAME` in Raspberry Pi `.env` matches CUPS printer name

### Issue: File too large

**Solution:** Increase file size limits.
- Update `MAX_FILE_SIZE` in both backend and Raspberry Pi `.env` files
- Restart both services

## File Flow

1. **Frontend** → User uploads file → Converts to base64
2. **Frontend** → Sends POST to `/print` with `{fileName, fileContent}`
3. **Backend** → Receives request → Calls `sendToRaspberryPi()` with base64
4. **Backend** → Sends POST to Raspberry Pi `/print` with `{fileContent, fileName}`
5. **Raspberry Pi** → Decodes base64 → Saves file → Executes `lp` command → Prints

## Environment Variables Summary

### Raspberry Pi (.env)
```
PORT=4000
UPLOAD_PATH=./downloads
MAX_FILE_SIZE=52428800
PRINTER_NAME=MyPrinter
```

### Backend (.env)
```
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/printer_business
RASPI_URL=https://your-tunnel-url.trycloudflare.com
BACKEND_URL=http://localhost:5001
```

### Frontend (.env) - Optional
```
REACT_APP_API_BASE=/
```

## Quick Start Commands

```bash
# Terminal 1: Raspberry Pi (on Raspberry Pi)
cd /path/to/raspi-printer
cloudflared tunnel --url http://localhost:4000 &
node raspi-printer.js

# Terminal 2: Backend (on your computer)
cd backend
npm start

# Terminal 3: Frontend (on your computer)
cd frontend
npm start
```

## Production Deployment

For production:
1. Use PM2 or systemd to run services
2. Set up proper SSL certificates
3. Use persistent Cloudflare Tunnel configuration
4. Configure proper CORS settings
5. Set up logging and monitoring


