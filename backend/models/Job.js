const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'JOB' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
  },
  filename: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  state: {
    type: String,
    enum: ['UPLOADED', 'ORDER_CREATED', 'PAID', 'PRINTING', 'PRINT_ERROR', 'PAYMENT_FAILED'],
    default: 'UPLOADED'
  },
  order_id: {
    type: String
  },
  payment_id: {
    type: String
  },
  amount_paise: {
    type: Number,
    required: true
  },
  razorpay_order_id: {
    type: String
  },
  razorpay_payment_id: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before save
jobSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Job', jobSchema);

