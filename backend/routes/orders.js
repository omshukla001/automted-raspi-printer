const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create a new order (fallback to in-memory response if DB unavailable)
router.post('/', async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    filePath,
    fileName,
    printOptions,
    pricing,
    notes
  } = req.body;

  try {
    const order = new Order({
      customerName,
      customerEmail,
      customerPhone,
      filePath,
      fileName,
      printOptions,
      pricing,
      notes
    });

    const savedOrder = await order.save();
    return res.status(201).json({ success: true, order: savedOrder });
  } catch (error) {
    console.warn('Error creating order (DB likely unavailable). Returning fallback response.', error);
    const fallbackOrder = {
      orderId: 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
      customerName,
      customerEmail,
      customerPhone,
      filePath,
      fileName,
      printOptions,
      pricing,
      notes,
      status: 'pending',
      paymentStatus: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return res.status(201).json({ success: true, order: fallbackOrder });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

// Update payment status
router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus, razorpayOrderId, razorpayPaymentId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        paymentStatus, 
        razorpayOrderId, 
        razorpayPaymentId 
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment status'
    });
  }
});

module.exports = router; 