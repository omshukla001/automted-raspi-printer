# PrintPro Setup Guide

## Quick Setup Instructions

### 1. Environment Files Setup

#### Backend Environment (.env)
Create a file named `.env` in the `backend` folder with the following content:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/printer_business

# Server Configuration
PORT=5000
NODE_ENV=development

# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment (.env)
Create a file named `.env` in the `frontend` folder with the following content:

```env
# Razorpay Configuration (Test Mode)
REACT_APP_RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID

# Backend API URL
REACT_APP_API_URL=http://localhost:5000
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Start the Application

#### Terminal 1 - Backend
```bash
cd backend
npm start
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Important Notes

1. **MongoDB**: Make sure MongoDB is running locally or update the URI to your cloud MongoDB instance
2. **Razorpay Keys**: Get test keys from your Razorpay dashboard
3. **File Uploads**: The `uploads` folder will be created automatically in the backend directory
4. **Ports**: Ensure ports 3000 and 5000 are available

## Troubleshooting

- If you get CORS errors, check that the `FRONTEND_URL` in backend `.env` matches your frontend URL
- If file uploads fail, ensure the `uploads` directory has write permissions
- If MongoDB connection fails, verify your MongoDB instance is running and accessible

## Testing the Application

1. Navigate to the Upload & Print page
2. Upload a PDF or DOC file
3. Select print options
4. Fill in customer information
5. Complete the payment flow (test mode)
6. Check the success/failure pages

The application is now ready to use! 🎉
