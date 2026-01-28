# CipherVault 🔐

A minimal, end‑to‑end encrypted personal password vault that backs up your secrets to your own Google Drive. CipherVault encrypts data **in the browser** using a master password that never leaves your device, then stores the ciphertext in Drive via a small Node.js backend.

---

## Features

- **Google Sign‑In** via Firebase Authentication
- **Client‑side AES encryption** using CryptoJS (master password stays in the browser)
- **Google Drive backup** through a Node.js/Express API and a service account
- **Simple vault model**: store website/service titles and associated secrets
- **One‑click decrypt** of your vault from any logged‑in device
- **Responsive UI** with a navbar + dashboard layout

---

## Tech Stack

- **Frontend**
  - HTML5, CSS3 (responsive layout, custom palette)
  - Vanilla JavaScript (ES modules)
  - [Firebase Web SDK](https://firebase.google.com/docs/web/setup) for Google Auth
  - [CryptoJS](https://github.com/brix/crypto-js) for AES encryption

- **Backend**
  - Node.js
  - Express (or similar HTTP server, see `server.js`)
  - Google APIs (Drive) via a Google Cloud service account

---

## How It Works (High‑Level)

1. **Authenticate**
   - User signs in with Google using Firebase Auth in the browser.

2. **Connect Drive**
   - Frontend calls the backend (`/api/auth-url`), which handles the OAuth / service account flow to access Google Drive.

3. **Encrypt & Upload**
   - User enters a **master password** and a secret (e.g., a site password).
   - Frontend encrypts the payload `{ title, secret }` using `CryptoJS.AES.encrypt` with the master password.
   - Encrypted string is sent to `/api/save-vault`, and the backend writes it to a file on Google Drive.

4. **Load & Decrypt**
   - When requested, the frontend calls `/api/get-vault`.
   - Backend returns the encrypted string.
   - Frontend uses the master password to decrypt it locally and shows the original title + secret.

> **Important:** The master password is never sent to the server or Google APIs. Decryption is purely client‑side.

---

## Project Structure

```text
.
├─ public/
│  ├─ index.html      # Main UI (Navbar + Dashboard vault interface)
│  ├─ login.html      # (Optional) Separate login page if used
│  ├─ app.js          # Frontend JS (if additional logic is split out)
│  └─ style.css       # Additional styles (if separated from inline styles)
├─ server.js          # Node.js backend (API endpoints, Drive integration)
├─ serviceAccountKey.json  # Google service account credentials (ignored by git)
├─ package.json       # NPM scripts & dependencies
├─ .env               # Environment variables (ignored by git)
└─ .gitignore
```

> Paths and some files like `login.html`, `app.js`, and `style.css` may vary depending on how you evolve the project, but `public/index.html` and `server.js` are central.

---

## Security Model

- Secrets are encrypted in the browser using **AES** from CryptoJS.
- The **master password is never stored** or sent to the backend.
- Backend only sees and stores **ciphertext** on Google Drive.
- Authentication is delegated to **Google (Firebase Auth)**.
- Back‑end access to Drive is controlled with a **service account** / OAuth credentials.

You should still treat this as a learning/portfolio project, not a production‑grade password manager, unless you thoroughly audit and harden it.

---

## Prerequisites

- Node.js (LTS recommended)
- A Google Cloud project with **Drive API** enabled
- A **service account** with access to a Drive folder (or My Drive)
- A **Firebase project** configured for Web with Google Sign‑In enabled

---

## Setup

### 1. Clone the Repo

```bash
git clone https://github.com/vedantpvr/Cipher-Vault.git
cd Cipher-Vault
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Google Service Account

1. In the Google Cloud Console, create a **service account**.
2. Download the JSON key and save it in the project root as:

   ```text
   serviceAccountKey.json
   ```

3. Share the Drive folder (or a specific file) with the service account email if using a regular Google Drive.

> `serviceAccountKey.json` is already listed in `.gitignore` so it won’t be committed.

### 4. Create `.env`

Create a `.env` file in the project root to hold sensitive configuration used by `server.js`, for example:

```ini
PORT=3000
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
FIREBASE_PROJECT_ID=your_firebase_project_id
# Add any other needed secrets / IDs here
```

Do **not** commit `.env` to version control.

### 5. Configure Firebase on the Frontend

In `public/index.html`, there is a `firebaseConfig` object. Replace its values with your own Firebase Web app configuration from the Firebase console (**Project Settings → General → Your apps → Web app**):

```js
const firebaseConfig = {
  apiKey: "<YOUR_API_KEY>",
  authDomain: "<YOUR_PROJECT_ID>.firebaseapp.com",
  projectId: "<YOUR_PROJECT_ID>",
  storageBucket: "<YOUR_PROJECT_ID>.appspot.com",
  messagingSenderId: "<YOUR_SENDER_ID>",
  appId: "<YOUR_APP_ID>"
};
```

---

## Running the App

### Development

```bash
npm start
# or
node server.js
```

Then open:

```text
http://localhost:3000
```

(Port may differ if you change `PORT`.)

---

## Using CipherVault

1. **Open the app** in your browser.
2. **Login**
   - Use the main **Sign in with Google** button or the navbar **Login** button.
3. **Connect Drive**
   - Click **Connect Google Drive** to authorize backend access to your Drive.
4. **Set Master Password**
   - Enter a strong master password; remember it, as it cannot be recovered.
5. **Add a Secret**
   - Provide a title (e.g., "Facebook") and the password/secret.
   - Click **Encrypt & Upload to Drive**; the data is encrypted locally then stored.
6. **Load & Decrypt Vault**
   - When you return, log in, enter your master password, and click **Load & Decrypt Vault**.
   - If the master password is correct, your stored secret is decrypted and displayed.

---

## Scripts

Common scripts (check `package.json` for exact names):

- `npm start` – start the Node.js server
- `npm run dev` – optional: start with nodemon/hot reload if configured

---

## Notes & Limitations

- Currently optimized for a small number of secrets (simple payload structure). You can extend the model to store multiple entries.
- There is no built‑in password strength meter or brute‑force protection.
- Always keep your **service account key** and **.env** files private.

---

## License

This project is intended as a learning / portfolio project. Add an explicit license here if you plan to open source it (e.g., MIT, Apache‑2.0).

---

## Contributing

Pull requests and suggestions are welcome. If you find a bug or have an idea for improvement (multiple vault entries, sharing, UI tweaks, etc.), feel free to open an issue or PR in the GitHub repository.
