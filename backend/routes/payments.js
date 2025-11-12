const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Job = require('../models/Job');
const { sendToRaspberryPi } = require('../utils/raspiprinter');
const Razorpay = require('razorpay');

// Initialize Razorpay (fallback to stub if keys not available)
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
} catch (error) {
  console.warn('Razorpay initialization failed, using stub mode');
}

// Create order endpoint for frontend
router.post('/create_order', async (req, res) => {
  try {
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({
        status: 'error',
        message: 'job_id is required'
      });
    }

    const job = await Job.findOne({ id: job_id });
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }

    if (razorpay) {
      // Real Razorpay integration
      const razorpayOrder = await razorpay.orders.create({
        amount: job.amount_paise,
        currency: 'INR',
        receipt: `job_${job_id}`
      });

      job.state = 'ORDER_CREATED';
      job.razorpay_order_id = razorpayOrder.id;
      await job.save();

      res.json({
        status: 'success',
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpay_key_id: process.env.RAZORPAY_KEY_ID
      });
    } else {
      // Stub mode for development
      const fakeOrderId = 'order_' + Date.now() + Math.random().toString(36).substr(2, 9);
      
      job.state = 'ORDER_CREATED';
      job.razorpay_order_id = fakeOrderId;
      await job.save();

      res.json({
        status: 'success',
        order_id: fakeOrderId,
        amount: job.amount_paise,
        currency: 'INR',
        razorpay_key_id: 'rzp_test_stub_key'
      });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create order'
    });
  }
});

// Stub order creation (no Razorpay) - legacy endpoint
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    const fakeOrder = {
      id: 'FAKE_ORDER_' + Date.now(),
      amount: (amount || 0) * 100,
      currency,
      receipt: receipt || 'N/A',
      status: 'created'
    };
    res.json({ success: true, order: fakeOrder });
  } catch (error) {
    console.error('Error creating stub order:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Verify payment endpoint for frontend
router.post('/verify_payment', async (req, res) => {
  try {
    const { job_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!job_id || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    const job = await Job.findOne({ id: job_id });
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }

    if (razorpay && razorpay_signature) {
      // Verify signature with Razorpay
      const crypto = require('crypto');
      const text = razorpay_order_id + '|' + razorpay_payment_id;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        job.state = 'PAYMENT_FAILED';
        await job.save();
        return res.status(400).json({
          status: 'error',
          message: 'Invalid payment signature'
        });
      }
    }

    // Mark as paid and start printing
    job.state = 'PAID';
    job.razorpay_payment_id = razorpay_payment_id;
    await job.save();

    // Send to printer
    try {
      job.state = 'PRINTING';
      await job.save();
      
      const result = await sendToRaspberryPi(job.filepath, job.filename);
      console.log('✅ File sent to Raspberry Pi:', result);
      
      if (result && result.success === false) {
        job.state = 'PRINT_ERROR';
        await job.save();
      }
    } catch (err) {
      console.error('❌ Could not send file to Raspberry Pi:', err.message);
      job.state = 'PRINT_ERROR';
      await job.save();
    }

    res.json({
      status: 'success',
      message: 'Payment verified and printing started'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to verify payment'
    });
  }
});

// Skip verification and directly mark as paid, then send file to Raspberry Pi - legacy endpoint
router.post('/verify-payment', async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOneAndUpdate(
      { orderId },
      {
        paymentStatus: 'completed',
        status: 'processing'
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    try {
      const result = await sendToRaspberryPi(order.filePath, order.fileName);
      console.log('✅ File sent to Raspberry Pi:', result);
    } catch (err) {
      console.error('❌ Could not send file to Raspberry Pi:', err.message);
    }

    res.json({
      success: true,
      message: 'Payment bypassed & file sent to printer',
      order
    });
  } catch (error) {
    console.error('Error bypassing payment:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment bypass' });
  }
});

// Get payment details
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      order
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment details' });
  }
});

// Refunds disabled while payments are bypassed
router.post('/refund', async (req, res) => {
  res.status(400).json({ success: false, error: 'Refunds unavailable while payments are disabled' });
});

module.exports = router;
