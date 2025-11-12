# PrintPro - Complete Printer Business Website

A full-stack printer business website with React frontend, Node.js backend, MongoDB database, Razorpay payment integration, and Raspberry Pi printer support.

## 🚀 Features

- **Modern UI/UX**: Built with React and Tailwind CSS
- **File Upload**: Secure PDF/DOC file upload and storage
- **Print Options**: Color/B&W, Paper sizes (A4/A3), Multiple copies
- **Price Calculator**: Real-time pricing based on selections
- **Payment Integration**: Razorpay payment gateway integration
- **Responsive Design**: Mobile and desktop optimized
- **Order Management**: Complete order tracking system
- **Raspberry Pi Integration**: Direct printing support via Cloudflare Tunnel
- **Cloudflare Tunnel Discovery**: Automatic discovery of Raspberry Pi printer URL

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Router DOM
- React Dropzone
- React Hot Toast
- Axios
- Radix UI Components

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Multer (file upload)
- Razorpay SDK
- CORS enabled

### Database
- MongoDB

### Payment Gateway
- Razorpay

### Printer Integration
- Raspberry Pi
- Cloudflare Tunnel
- CUPS (Common Unix Printing System)

## 📁 Project Structure

```
├── frontend/                 # React frontend application
│   ├── public/              # Static files
│   ├── src/                 # Source code
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   ├── lib/             # Utility libraries
│   │   ├── hooks/           # Custom React hooks
│   │   └── App.tsx          # Main app component
│   ├── package.json         # Frontend dependencies
│   ├── tailwind.config.js   # Tailwind configuration
│   └── tsconfig.json        # TypeScript configuration
├── backend/                  # Node.js backend application
│   ├── models/              # MongoDB models
│   │   ├── Job.js           # Job model
│   │   └── Order.js         # Order model
│   ├── routes/              # API routes
│   │   ├── orders.js        # Order routes
│   │   ├── payments.js      # Payment routes
│   │   └── upload.js        # File upload routes
│   ├── utils/               # Utility functions
│   │   ├── pricing.js       # Pricing calculator
│   │   ├── raspiDiscovery.js # Raspberry Pi discovery
│   │   └── raspiprinter.js  # Printer integration
│   ├── uploads/             # Uploaded files directory
│   ├── server.js            # Main server file
│   ├── env.example          # Environment variables example
│   └── package.json         # Backend dependencies
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Razorpay account (test or production)
- Raspberry Pi (optional, for direct printing)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd printer-project-github

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

#### Backend (.env)
Create a `.env` file in the `backend` folder (use `env.example` as reference):

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/printer_business

# Server Configuration
PORT=5000
NODE_ENV=development

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Raspberry Pi Configuration (Optional)
RASPI_DISCOVERY_URL=http://192.168.1.50:4000
RASPI_URL=https://your-tunnel-url.trycloudflare.com
BACKEND_URL=http://localhost:5000
```

### 3. Start the Application

#### Start Backend
```bash
cd backend
npm start
# or for development with nodemon
npm run dev
```

#### Start Frontend
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🔧 Configuration

### MongoDB Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `printer_business`
3. Update the `MONGODB_URI` in backend `.env`

### Razorpay Setup
1. Sign up for a Razorpay account
2. Get your API keys from the dashboard
3. Update the Razorpay keys in backend `.env` file

### Raspberry Pi Setup (Optional)
1. Set up Raspberry Pi with CUPS printer
2. Install and configure Cloudflare Tunnel
3. Update `RASPI_URL` or `RASPI_DISCOVERY_URL` in backend `.env`
4. See `QUICK-START.md` for detailed setup instructions

### File Upload
- Files are stored in the `backend/uploads/` directory
- Supported formats: PDF, DOC, DOCX
- Maximum file size: 10MB (configurable)

## 📱 Features

### File Upload & Printing
- Drag & drop file upload
- Support for PDF, DOC, DOCX files
- Real-time price calculation
- Print options selection (color, paper size, copies)

### Payment Integration
- Razorpay payment gateway
- Secure payment processing
- Payment verification
- Order status tracking

### Order Management
- Order creation and tracking
- Job status monitoring
- Payment status updates
- Order history

### Raspberry Pi Integration
- Cloudflare Tunnel discovery
- Direct file transfer to Raspberry Pi
- Automatic printer queue management
- Print status tracking

## 🔒 Security Features

- File type validation
- File size limits
- Secure file storage
- Payment signature verification
- CORS configuration
- Input validation
- Environment variable protection

## 📱 Responsive Design

- Mobile-first approach
- Responsive navigation
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the build folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm start
# Use PM2 or similar for production
```

### Environment Variables
- Update all environment variables for production
- Use production Razorpay keys
- Configure production MongoDB URI
- Set appropriate CORS origins
- Configure production Raspberry Pi URLs

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📖 Documentation

- `QUICK-START.md` - Quick setup guide
- `SETUP-GUIDE.md` - Complete setup instructions
- `PRINTER-FRONTEND-SETUP.md` - Frontend setup details

## 📞 Support

For support or questions, please open an issue on GitHub.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 🔄 Updates & Maintenance

- Regular dependency updates
- Security patches
- Feature enhancements
- Performance optimizations

---

**Note**: This is a production-ready application. For production use, ensure proper security measures, SSL certificates, and production-grade hosting.
