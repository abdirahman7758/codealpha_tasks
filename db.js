/**
 * Velarina Database Adapter
 * Supports Firebase Firestore with automatic fallback to persistent JSON storage
 * for zero-downtime local testing and verified operation.
 */

const fs = require('fs');
const path = require('path');

let admin = null;
let firestore = null;
let isFirebase = false;

// Seed products from products.json
const seedProductsPath = path.join(__dirname, 'data', 'products.json');
let initialProducts = [];
try {
  if (fs.existsSync(seedProductsPath)) {
    initialProducts = JSON.parse(fs.readFileSync(seedProductsPath, 'utf8'));
  }
} catch (err) {
  console.error('[Velarina DB] Error reading initial products:', err.message);
}

// Local JSON storage path for fallback mode
const localDbPath = path.join(__dirname, 'data', 'local-db.json');

function readLocalDb() {
  try {
    if (!fs.existsSync(localDbPath)) {
      const initial = {
        products: initialProducts,
        users: [],
        orders: [],
        sessions: []
      };
      fs.writeFileSync(localDbPath, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const data = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
    if (!data.products || data.products.length === 0) {
      data.products = initialProducts;
      fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), 'utf8');
    }
    if (!Array.isArray(data.sessions)) data.sessions = [];
    return data;
  } catch (err) {
    console.error('[Velarina DB] Local DB read error:', err.message);
    return { products: initialProducts, users: [], orders: [], sessions: [] };
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Velarina DB] Local DB write error:', err.message);
  }
}

// Initialize database
async function initDb() {
  try {
    // Check if firebase-admin is available
    admin = require('firebase-admin');
    
    // Check for service account file or environment variables
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firestore = admin.firestore();
      isFirebase = true;
      console.log('[Velarina DB] Connected successfully to Firebase Firestore using serviceAccountKey.json');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      firestore = admin.firestore();
      isFirebase = true;
      console.log('[Velarina DB] Connected successfully to Firebase Firestore using environment credentials');
    } else {
      if (process.env.NETLIFY === 'true') {
        throw new Error('Firebase credentials are required for Netlify deployments.');
      }
      console.log('[Velarina DB] No Firebase credentials detected in environment or serviceAccountKey.json.');
      console.log('[Velarina DB] Using persistent local JSON database (data/local-db.json).');
      console.log('[Velarina DB] To switch to Firebase, set FIREBASE_PROJECT_ID or add serviceAccountKey.json.');
      readLocalDb(); // Ensure initial local data is created
    }

    if (isFirebase && firestore) {
      // Seed initial products to Firestore if empty
      const snapshot = await firestore.collection('products').limit(1).get();
      if (snapshot.empty && initialProducts.length > 0) {
        console.log('[Velarina DB] Seeding initial products to Firestore...');
        const batch = firestore.batch();
        for (const prod of initialProducts) {
          const docRef = firestore.collection('products').doc(prod.id);
          batch.set(docRef, prod);
        }
        await batch.commit();
        console.log('[Velarina DB] Seeded ' + initialProducts.length + ' products to Firestore.');
      }
    }
  } catch (err) {
    console.warn('[Velarina DB] Firebase initialization skipped or failed:', err.message);
    if (process.env.NETLIFY === 'true') {
      throw err;
    }
    console.log('[Velarina DB] Operating with local database storage.');
    isFirebase = false;
    readLocalDb();
  }
}

// Product operations
async function getProducts(category, search) {
  if (isFirebase && firestore) {
    let query = firestore.collection('products');
    if (category && category !== 'All') {
      query = query.where('category', '==', category);
    }
    const snap = await query.get();
    let prods = [];
    snap.forEach(doc => prods.push({ id: doc.id, ...doc.data() }));
    if (search) {
      const q = search.toLowerCase();
      prods = prods.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    return prods;
  } else {
    const db = readLocalDb();
    let prods = [...db.products];
    if (category && category !== 'All') {
      prods = prods.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      prods = prods.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    return prods;
  }
}

async function getProductById(id) {
  if (isFirebase && firestore) {
    const doc = await firestore.collection('products').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } else {
    const db = readLocalDb();
    return db.products.find(p => p.id === id) || null;
  }
}

// User operations
async function createUser(userData) {
  const userRecord = {
    id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    email: userData.email.toLowerCase().trim(),
    passwordHash: userData.passwordHash,
    firstName: userData.firstName.trim(),
    lastName: userData.lastName.trim(),
    createdAt: new Date().toISOString()
  };

  if (isFirebase && firestore) {
    await firestore.collection('users').doc(userRecord.id).set(userRecord);
    return userRecord;
  } else {
    const db = readLocalDb();
    db.users.push(userRecord);
    writeLocalDb(db);
    return userRecord;
  }
}

async function getUserByEmail(email) {
  const cleanEmail = email.toLowerCase().trim();
  if (isFirebase && firestore) {
    const snap = await firestore.collection('users').where('email', '==', cleanEmail).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  } else {
    const db = readLocalDb();
    return db.users.find(u => u.email === cleanEmail) || null;
  }
}

async function getUserById(id) {
  if (isFirebase && firestore) {
    const doc = await firestore.collection('users').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } else {
    const db = readLocalDb();
    return db.users.find(u => u.id === id) || null;
  }
}

async function createSession(token, sessionData) {
  if (isFirebase && firestore) {
    await firestore.collection('sessions').doc(token).set(sessionData);
    return;
  }
  const db = readLocalDb();
  db.sessions.push({ token, ...sessionData });
  writeLocalDb(db);
}

async function getSession(token) {
  if (isFirebase && firestore) {
    const doc = await firestore.collection('sessions').doc(token).get();
    return doc.exists ? doc.data() : null;
  }
  const db = readLocalDb();
  return db.sessions.find(session => session.token === token) || null;
}

async function deleteSession(token) {
  if (isFirebase && firestore) {
    await firestore.collection('sessions').doc(token).delete();
    return;
  }
  const db = readLocalDb();
  db.sessions = db.sessions.filter(session => session.token !== token);
  writeLocalDb(db);
}

// Order operations
async function createOrder(orderData) {
  const orderNumber = 'VEL-' + Math.floor(100000 + Math.random() * 900000);
  const orderRecord = {
    id: orderNumber,
    orderNumber: orderNumber,
    items: orderData.items,
    customer: orderData.customer,
    shippingAddress: orderData.shippingAddress,
    shippingMethod: orderData.shippingMethod || 'Standard Delivery (2 to 4 business days)',
    paymentMethod: orderData.paymentMethod || 'Credit / Debit Card',
    pricing: orderData.pricing,
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  if (isFirebase && firestore) {
    await firestore.collection('orders').doc(orderNumber).set(orderRecord);
    return orderRecord;
  } else {
    const db = readLocalDb();
    db.orders.unshift(orderRecord);
    writeLocalDb(db);
    return orderRecord;
  }
}

async function getOrderById(id) {
  if (isFirebase && firestore) {
    const doc = await firestore.collection('orders').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } else {
    const db = readLocalDb();
    return db.orders.find(o => o.id === id || o.orderNumber === id) || null;
  }
}

async function getOrdersByUserId(userId, email) {
  if (isFirebase && firestore) {
    let orders = [];
    if (userId) {
      const snap = await firestore.collection('orders').where('customer.userId', '==', userId).get();
      snap.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    }
    if (orders.length === 0 && email) {
      const snap = await firestore.collection('orders').where('customer.email', '==', email.toLowerCase().trim()).get();
      snap.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    }
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    const db = readLocalDb();
    return db.orders
      .filter(o => (userId && o.customer && o.customer.userId === userId) || (email && o.customer && o.customer.email.toLowerCase() === email.toLowerCase().trim()))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

function getDbStatus() {
  return {
    engine: isFirebase ? 'Firebase Firestore' : 'Local JSON Storage',
    isFirebase: isFirebase
  };
}

module.exports = {
  initDb,
  getProducts,
  getProductById,
  createUser,
  getUserByEmail,
  getUserById,
  createSession,
  getSession,
  deleteSession,
  createOrder,
  getOrderById,
  getOrdersByUserId,
  getDbStatus
};
