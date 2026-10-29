# VibeNet | Production Social Platform

> **Tagline:** Connect. Share. Vibe.  
> **Brand Identity:** Modern, energetic, clean, user-friendly social media platform.

---

## 1. Project Overview & Architecture

VibeNet is built on native, standards-compliant web technologies paired with Firebase Backend-as-a-Service (Firebase Authentication and Cloud Firestore).

### Tech Stack
- **Frontend:** HTML5, CSS3 (Modern Flexbox, CSS Variables, SVG Graphics), Native JavaScript (ES6+ Modules).
- **Backend / BaaS:** Firebase Web SDK v10 (Firebase Auth, Cloud Firestore real-time listeners via `onSnapshot`).
- **Persistence & Synchronization:** Dual-mode architecture supporting live Cloud Firestore alongside a local storage adapter for offline testing.
- **Deployment:** Firebase Hosting ready with `firebase.json` and production `firestore.rules`.

### Strict Design Guidelines Enforced
- **Primary Color:** Royal Blue (`#2563EB`)
- **Primary Hover:** Darker Blue (`#1D4ED8`)
- **Background:** Slate / Light Gray (`#F8FAFC`)
- **Surface:** Pure White (`#FFFFFF`)
- **Text:** Primary (`#0F172A`), Secondary (`#64748B`)
- **Accent:** Emerald Green (`#10B981`) for confirmation actions
- **No Purple Gradients:** Exclusively clean solids and blue/slate surfaces.
- **No Pill-Shaped Buttons:** All interactive controls use crisp, professional corners (`border-radius: 6px` or `8px`).
- **No Emojis:** Replaced with crisp vector SVGs for all icons (hearts, comments, trash, share, user, edit, check).
- **No Fake Metrics or Counters:** Zero artificial "social proof" counters.
- **No Em Dashes:** Strict clean typographic standards.
- **No AI Tags:** Free of any "Made with AI" watermarks or badges.

---

## 2. Directory Structure

```
mini social media/
├── index.html              # Main social feed, composer, modals, and profile view
├── style.css               # Complete stylesheet with theme variables and responsive layout
├── firebase-config.js      # Modular Firebase SDK initialization and fallback adapter
├── app.js                  # Application controller (Auth, Feed, Likes, Comments, Profiles)
├── privacy.html            # GDPR/CCPA-compliant Privacy Policy
├── terms.html              # Terms of Service and Acceptable Use Policy
├── favicon.svg             # Custom vector brand favicon
├── firebase.json           # Firebase Hosting and Firestore configuration
├── firestore.rules         # Production Firestore security rules
├── .firebaserc             # Firebase CLI project binding
└── README.md               # Operations, deployment, and custom domain guide
```

---

## 3. Launch Checklist Verification

- [x] **Vector SVG Logo:** Stylized 'V' network mark coded directly into navigation and markup in `#2563EB`.
- [x] **Favicon Added:** High-definition `favicon.svg` matching the brand identity linked in all pages.
- [x] **Privacy Policy Page:** Complete `privacy.html` accessible from navigation and footer.
- [x] **Terms & Conditions Page:** Complete `terms.html` accessible from navigation and footer.
- [x] **No AI Watermarks:** Zero "Made with AI" tags across all files.
- [x] **No Purple Gradients / No Pill Buttons:** Checked and verified in `style.css`.
- [x] **Real-Time Data Feed:** `onSnapshot` listener handles posts, likes, and comments.
- [x] **Profiles & Follow System:** Dynamic follower and following tracking stored in Firestore.
- [x] **Custom Domain Ready:** Complete configuration guide provided below.

---

## 4. Connecting Your Custom Domain (Firebase Hosting)

Follow these steps to connect your registered custom domain (e.g. `vibenet.network` or `yourdomain.com`) to Firebase Hosting:

### Step 1: Open Firebase Console
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. In the left navigation menu, click **Build** > **Hosting**.

### Step 2: Add Custom Domain
1. In the Hosting dashboard, click **Add custom domain**.
2. Enter your domain name (e.g., `vibenet.network` or `www.vibenet.network`).
3. If you want traffic to redirect automatically (e.g., redirecting `vibenet.network` to `www.vibenet.network`), check **Redirect to an existing website** or leave unchecked for apex domain mapping.

### Step 3: Verify Ownership & Configure DNS Records
Firebase will provide the exact DNS records to add at your domain registrar (GoDaddy, Namecheap, Cloudflare, Google Domains/Squarespace, etc.):

- **TXT Record (Verification):**
  - Host / Name: `@`
  - Value: Provided by Firebase Console (e.g., `firebase=vibenet-platform`)
- **A Records (Apex Domain):**
  - Type: `A`
  - Host / Name: `@`
  - Value: Firebase IP addresses (typically two IPv4 addresses, e.g., `199.36.158.100`)
- **CNAME Record (Subdomain, e.g. www):**
  - Type: `CNAME`
  - Host / Name: `www`
  - Value: `<your-project-id>.web.app`

### Step 4: Automatic SSL Provisioning
Once the DNS records propagate (typically within 10 to 60 minutes), Firebase automatically provisions a free, zero-maintenance SSL certificate (Let's Encrypt TLS) for your custom domain. Your site will automatically enforce HTTPS.

---

## 5. Live Firebase Setup & Deployment

### Step 1: Insert Firebase Keys
Verify that `firebase-config.js` contains the web app settings for the Firebase project you intend to use. If they do not, replace them with the values from Firebase Console (**Project Settings** > **General** > **Your apps** > **Web app**):

```javascript
export const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```

### Step 2: Enable Authentication & Firestore in Console
1. In Firebase Console, go to **Authentication** > **Sign-in method**, and enable **Email/Password**.
2. Go to **Firestore Database** > **Create database**, select a production location, and enable it.

### Step 3: Deploy Firestore rules
Install the Firebase CLI (if not already installed) and run:

```bash
# Log in to your Google / Firebase account (if needed)
firebase login

# Deploy the rules to the same project configured in firebase-config.js
firebase deploy --only firestore:rules --project vibenet1
```

The explicit project flag matters because `.firebaserc` may point to a different project. Confirm the target project before deploying.

### Step 4: Deploy to Netlify
This is a static site: Netlify publishes the project root (`netlify.toml`) and does not need a build command.

**Using the Netlify web dashboard:**
1. Sign in at [Netlify](https://app.netlify.com/).
2. Choose **Add new site** > **Deploy manually**.
3. Drag the project folder into the deploy area. Include `index.html`, `app.js`, `firebase-config.js`, `style.css`, `favicon.svg`, `privacy.html`, and `terms.html`.
4. Open the deployed site URL and check the home page and both legal pages.

For ongoing deployments, push the project to a Git provider and choose **Add new site** > **Import an existing project**. Keep the publish directory as `.` and leave the build command empty.

### Step 5: Allow the Netlify domain in Firebase
In Firebase Console, open **Authentication** > **Settings** > **Authorized domains** and add the site's Netlify hostname (for example, `your-site.netlify.app`). Firebase Authentication will reject sign-in from domains that are not authorized. If you connect a custom domain, add that hostname too.

The Firebase web app configuration in `firebase-config.js` is client-side configuration, not a server secret. Firestore access must be protected by the deployed Firestore rules; never use open production rules.

### Optional: Deploy to Firebase Hosting instead
To host on Firebase rather than Netlify, deploy the existing Firebase Hosting configuration:

```bash
firebase deploy --project vibenet1
```

---

## 6. Testing Locally

You can preview the platform immediately using any local static web server:

```bash
# Option A: Using Python built-in server
python -m http.server 8000

# Option B: Using Node.js npx serve
npx serve .

# Option C: Using Firebase CLI emulator
firebase emulators:start
```

Open `http://localhost:8000` in your browser. If Firebase keys have not been added yet, VibeNet will automatically run in local mode with mock data and full interactive functionality. Once you insert your real Firebase keys, it transitions seamlessly to live cloud database synchronization.
