// Pricing configuration for different print options
const PRICING = {
  'A4': {
    'black-white': 2, // ₹2 per page
    'color': 8        // ₹8 per page
  },
  'A3': {
    'black-white': 4, // ₹4 per page
    'color': 16       // ₹16 per page
  }
};

// Bulk discount tiers
const BULK_DISCOUNTS = [
  { minPages: 1, maxPages: 50, discount: 0 },
  { minPages: 51, maxPages: 100, discount: 0.05 }, // 5% discount
  { minPages: 101, maxPages: 200, discount: 0.10 }, // 10% discount
  { minPages: 201, maxPages: 500, discount: 0.15 }, // 15% discount
  { minPages: 501, maxPages: 1000, discount: 0.20 }, // 20% discount
  { minPages: 1001, maxPages: Infinity, discount: 0.25 } // 25% discount
];

/**
 * Calculate the total cost for printing
 * @param {Object} options - Print options
 * @param {string} options.paperSize - Paper size (A4 or A3)
 * @param {string} options.color - Color option (color or black-white)
 * @param {number} options.copies - Number of copies
 * @param {number} options.totalPages - Total pages in the document
 * @returns {Object} Pricing details
 */
function calculatePrice(options) {
  const { paperSize, color, copies, totalPages } = options;
  
  // Get base price per page
  const basePricePerPage = PRICING[paperSize][color];
  
  // Calculate total pages to be printed
  const totalPagesToPrint = totalPages * copies;
  
  // Calculate base cost
  const baseCost = totalPagesToPrint * basePricePerPage;
  
  // Apply bulk discount
  const discount = calculateBulkDiscount(totalPagesToPrint);
  const discountAmount = baseCost * discount;
  const finalCost = baseCost - discountAmount;
  
  return {
    basePricePerPage,
    totalPages,
    copies,
    totalPagesToPrint,
    baseCost: Math.round(baseCost * 100) / 100,
    discount: Math.round(discount * 100),
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalCost: Math.round(finalCost * 100) / 100,
    pricePerPage: Math.round((finalCost / totalPagesToPrint) * 100) / 100
  };
}

/**
 * Calculate bulk discount percentage based on total pages
 * @param {number} totalPages - Total pages to be printed
 * @returns {number} Discount percentage (0-1)
 */
function calculateBulkDiscount(totalPages) {
  for (const tier of BULK_DISCOUNTS) {
    if (totalPages >= tier.minPages && totalPages <= tier.maxPages) {
      return tier.discount;
    }
  }
  return 0;
}

/**
 * Get all available pricing options
 * @returns {Object} All pricing information
 */
function getAllPricing() {
  return {
    pricing: PRICING,
    bulkDiscounts: BULK_DISCOUNTS,
    examples: {
      'A4 Black & White': {
        '1-50 pages': '₹2 per page',
        '51-100 pages': '₹1.90 per page (5% off)',
        '101-200 pages': '₹1.80 per page (10% off)',
        '201-500 pages': '₹1.70 per page (15% off)',
        '501-1000 pages': '₹1.60 per page (20% off)',
        '1000+ pages': '₹1.50 per page (25% off)'
      },
      'A4 Color': {
        '1-50 pages': '₹8 per page',
        '51-100 pages': '₹7.60 per page (5% off)',
        '101-200 pages': '₹7.20 per page (10% off)',
        '201-500 pages': '₹6.80 per page (15% off)',
        '501-1000 pages': '₹6.40 per page (20% off)',
        '1000+ pages': '₹6.00 per page (25% off)'
      },
      'A3 Black & White': {
        '1-50 pages': '₹4 per page',
        '51-100 pages': '₹3.80 per page (5% off)',
        '101-200 pages': '₹3.60 per page (10% off)',
        '201-500 pages': '₹3.40 per page (15% off)',
        '501-1000 pages': '₹3.20 per page (20% off)',
        '1000+ pages': '₹3.00 per page (25% off)'
      },
      'A3 Color': {
        '1-50 pages': '₹16 per page',
        '51-100 pages': '₹15.20 per page (5% off)',
        '101-200 pages': '₹14.40 per page (10% off)',
        '201-500 pages': '₹13.60 per page (15% off)',
        '501-1000 pages': '₹12.80 per page (20% off)',
        '1000+ pages': '₹12.00 per page (25% off)'
      }
    }
  };
}

module.exports = {
  calculatePrice,
  calculateBulkDiscount,
  getAllPricing,
  PRICING,
  BULK_DISCOUNTS
}; 