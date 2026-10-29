const express = require('express');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN || 'velarina.com';

// Security and utility helpers for password hashing without external dependencies
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, originalHash] = stored.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

async function generateToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.createSession(token, {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
  });
  return token;
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const session = await db.getSession(token);
    if (!session || session.expiresAt < Date.now()) {
      if (session) await db.deleteSession(token);
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    req.userId = session.userId;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Canonical Domain & Host validation headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Velarina-Domain', CUSTOM_DOMAIN);
  next();
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html', 'htm']
}));

// API Routes

// System / DB Status
app.get('/api/status', (req, res) => {
  const dbStatus = db.getDbStatus();
  res.json({
    brand: 'Velarina Atelier',
    version: '1.0.0',
    customDomain: CUSTOM_DOMAIN,
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Products: List and search
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    const products = await db.getProducts(category, search);
    res.json({ products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// Products: Get Single Product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to retrieve product details' });
  }
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const passwordHash = hashPassword(password);
    const newUser = await db.createUser({
      email,
      passwordHash,
      firstName,
      lastName
    });

    const token = await generateToken(newUser.id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Account registration failed' });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordValid = verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = await generateToken(user.id);

    res.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Auth: Current User Profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Auth: Logout
app.post('/api/auth/logout', authMiddleware, async (req, res, next) => {
  try {
    await db.deleteSession(req.token);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// Orders: Process New Order
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, shippingAddress, items, paymentMethod, shippingMethod } = req.body;

    // Validate request structure
    if (!customer || !customer.email || !customer.firstName || !customer.lastName) {
      return res.status(400).json({ error: 'Customer contact details are incomplete' });
    }

    if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      return res.status(400).json({ error: 'Shipping address is incomplete' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Verify products and calculate authentic totals server-side
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await db.getProductById(item.id);
      if (!product) {
        return res.status(400).json({ error: `Product with ID ${item.id} is no longer available` });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const lineTotal = product.price * qty;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
        image: product.image,
        lineTotal
      });
    }

    // Shipping calculation
    const shippingFee = calculatedSubtotal >= 500 ? 0 : 25;
    const estimatedTax = Math.round(calculatedSubtotal * 0.08); // 8% sales tax calculation
    const grandTotal = calculatedSubtotal + shippingFee + estimatedTax;

    const orderRecord = await db.createOrder({
      customer,
      shippingAddress,
      shippingMethod: shippingMethod || (calculatedSubtotal >= 500 ? 'Complimentary Express Courier' : 'Standard Insured Courier ($25)'),
      paymentMethod: paymentMethod || 'Credit / Debit Card',
      items: validatedItems,
      pricing: {
        subtotal: calculatedSubtotal,
        shipping: shippingFee,
        tax: estimatedTax,
        total: grandTotal,
        currency: 'USD'
      }
    });

    res.status(201).json({
      message: 'Order created and confirmed',
      order: orderRecord
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Orders: Get order by order number or ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
});

// Orders: Get user orders (requires authentication or email match)
app.get('/api/orders/user/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const orders = await db.getOrdersByUserId(user.id, user.email);
    res.json({ orders });
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ error: 'Failed to retrieve user orders' });
  }
});

// Fallback for HTML routes
app.get('*', (req, res, next) => {
  if (req.accepts('html')) {
    // If route doesn't match an API endpoint, serve index.html or 404
    const requestedPath = path.join(__dirname, 'public', req.path);
    if (requestedPath.endsWith('.html') || path.extname(requestedPath) === '') {
      return next();
    }
  }
  next();
});

// Start server
async function start() {
  await db.initDb();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  VELARINA ATELIER E-COMMERCE SERVER`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Local URL:   http://localhost:${PORT}`);
    console.log(`  Custom Host: https://${CUSTOM_DOMAIN}`);
    console.log(`=======================================================`);
  });
}

if (require.main === module) {
  start().catch(err => {
    console.error('Server startup failed:', err);
    process.exitCode = 1;
  });
}

module.exports = app;
