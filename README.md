# Velarina Atelier E-Commerce Platform

A bespoke, high-aesthetic e-commerce platform for Velarina, an artisanal atelier producing limited-run leather goods, structured outerwear, and bronze objects.

## Tech Stack

- **Frontend**: Semantic HTML5, Vanilla JavaScript (ES6+ modular architecture), Bespoke CSS Design System.
- **Backend**: Node.js & Express.js REST API.
- **Database**: Firebase Firestore (with automatic fallback to persistent local JSON storage for instant, zero-setup local execution).
- **Security**: Native cryptographic PBKDF2 password hashing with random salt, session verification tokens, and security headers.

---

## Architectural Principles & Design Rules

This application strictly implements:

- **No purple gradients or SaaS aesthetic**: Palette based on warm linen (`#F9F8F6`), deep charcoal (`#151515`), and burnished bronze (`#8A6B47`).
- **No pill-shaped buttons**: Architectural geometry with sharp 2px corners.
- **No fake metrics, counters, or fake reviews**: Only genuine specifications, material provenance, and real orders.
- **No vague copy or AI tags**: Direct editorial copywriting focusing on tangible craftsmanship in Florence and Porto.
- **No emoji icons**: Handcrafted SVG vector line iconography.
- **No em dashes**: Clean, precise standard punctuation.
- **Favicon & Custom Domain**: Includes custom SVG monogram favicon, `CNAME`, and full domain routing documentation.
- **Legal Compliance**: Comprehensive Privacy Policy (`privacy-policy.html`) and Terms and Conditions (`terms.html`).

---

## Project Structure

```text
velarina/
├── CUSTOM_DOMAIN_SETUP.md   # Domain registration and DNS instructions
├── CNAME                    # Custom domain pointer (velarina.com)
├── package.json             # Node dependencies and scripts
├── server.js                # Express REST API and static server
├── db.js                    # Firebase Firestore adapter and JSON fallback
├── .env                     # Server and domain environment variables
├── .env.example             # Environment template with Firebase keys
├── data/
│   ├── products.json        # Curated catalog seed data
│   └── local-db.json        # Local storage (created automatically)
└── public/
    ├── favicon.svg          # Bespoke Velarina monogram favicon
    ├── index.html           # Atelier homepage
    ├── products.html        # Catalog with filters, search, and sorting
    ├── product.html         # Product specifications and details
    ├── cart.html            # Shopping bag view
    ├── checkout.html        # Order processing and payment flow
    ├── order-confirmation.html # Printable order receipt
    ├── auth.html            # Client sign-in and registration
    ├── account.html         # Customer account dashboard & orders
    ├── privacy-policy.html  # Legal privacy policy
    ├── terms.html           # Legal terms and conditions
    ├── css/
    │   └── styles.css       # Unified luxury stylesheet
    └── js/
        ├── api.js           # REST API client
        ├── auth.js          # Authentication state manager
        ├── cart.js          # Shopping bag and drawer logic
        ├── catalog.js       # Catalog filtering and search
        ├── product-detail.js# Product specification renderer
        ├── checkout.js      # Order processing controller
        ├── account.js       # Customer orders history controller
        └── main.js          # Global layout and drawer listeners
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Application

```bash
npm start
```

Open your browser to:

```text
http://localhost:3000
```

---

## Connecting Firebase Firestore

Velarina includes native Firebase Admin SDK integration. To connect your live Firebase project:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create or select your Firebase project.
3. In **Project Settings > Service Accounts**, click **Generate new private key**.
4. Save the downloaded JSON file as `serviceAccountKey.json` in the root folder of this project (it will be loaded automatically on server start).

_Alternatively_, populate your `.env` file with environment variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

On first startup with Firebase configured, the server automatically initializes your Firestore database and seeds the collection with the initial Velarina product catalog.

---

## Custom Domain Deployment (Self-Hosted Server)

To bind your custom domain (`velarina.com`):

1. Point your domain DNS A Record to your server's public IP address.
2. Point your `www` CNAME to `velarina.com`.
3. Read `CUSTOM_DOMAIN_SETUP.md` for Nginx reverse proxy configuration and free SSL certificates with Certbot.

## Deploying to Netlify

This project uses Netlify to host the static site and a Netlify Function for its Express API. Firestore is required for persistent users, sessions, and orders; Netlify's local filesystem is not persistent.

1. Push this project to a Git provider and import the repository in Netlify. Netlify reads the build and function settings from `netlify.toml`.
2. In **Site configuration > Environment variables**, add:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (the complete private key, including its PEM header and footer)
   - `CUSTOM_DOMAIN` (your primary domain, if configured)
3. Use your Firebase service account's private key for `FIREBASE_PRIVATE_KEY`. Store it only as a Netlify environment variable; do not commit `serviceAccountKey.json` or `.env`.
4. Trigger a deploy. Check `/api/status` on the deployed site; it should report `isFirebase: true`.
5. To use a custom domain, add it under Netlify's **Domain management** and follow the DNS records Netlify provides. Netlify provisions HTTPS automatically.

Firebase credentials must be configured as Netlify environment variables before deploy. After adding or changing them in Netlify, trigger a new deploy so the function receives the updated values.
