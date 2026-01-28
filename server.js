require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// --- CONFIGURATION ---
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// MEMORY STORAGE (Warning: For MVP only. In production, use a Database!)
// If you restart the server, users must reconnect Drive.
let userTokens = {}; 

// --- ROUTE 1: Start Auth Flow ---
// Frontend calls this to get the Google Login URL
app.get('/api/auth-url', (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/drive.file'];
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });
    res.json({ url });
});

// --- ROUTE 2: Callback from Google ---
// Google redirects here after user clicks "Allow"
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        userTokens = tokens; // Save tokens in memory
        console.log("Authentication successful!");
        res.redirect('/'); // Send them back to the homepage
    } catch (error) {
        console.error('Error retrieving access token', error);
        res.status(500).send("Authentication Failed");
    }
});

// --- ROUTE 3: Save Encrypted Data to Drive ---
app.post('/api/save-vault', async (req, res) => {
    // Check if we have tokens
    if (!userTokens.access_token) {
        // Restore credentials if they exist in memory
        if (userTokens.refresh_token) {
             oauth2Client.setCredentials(userTokens);
        } else {
             return res.status(401).json({ error: "Not authenticated with Drive" });
        }
    } else {
        oauth2Client.setCredentials(userTokens);
    }
    
    const { encryptedData } = req.body;
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
        // 1. Search if file already exists
        const searchRes = await drive.files.list({
            q: "name = 'cipher_vault.json' and trashed = false",
            fields: 'files(id, name)',
        });

        const fileMetadata = {
            name: 'cipher_vault.json',
            mimeType: 'application/json'
        };
        
        const media = {
            mimeType: 'application/json',
            body: JSON.stringify({ data: encryptedData, updatedAt: new Date() })
        };

        if (searchRes.data.files.length > 0) {
            // Update existing file
            const fileId = searchRes.data.files[0].id;
            await drive.files.update({
                fileId: fileId,
                media: media
            });
            res.json({ message: "Vault Updated Successfully!" });
        } else {
            // Create new file
            await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id'
            });
            res.json({ message: "Vault Created Successfully!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Drive Upload Failed: " + error.message });
    }
});

// --- ROUTE 4: Get Vault from Drive ---
app.get('/api/get-vault', async (req, res) => {
    // Check Auth
    if (!userTokens.access_token) return res.status(401).json({ error: "Connect Drive first" });
    oauth2Client.setCredentials(userTokens);
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
        // 1. Find the file ID
        const searchRes = await drive.files.list({
            q: "name = 'cipher_vault.json' and trashed = false",
            fields: 'files(id, name)',
        });

        if (searchRes.data.files.length === 0) {
            return res.status(404).json({ error: "No vault found. Create one first!" });
        }

        const fileId = searchRes.data.files[0].id;

        // 2. Download the content
        const file = await drive.files.get({
            fileId: fileId,
            alt: 'media' // Important: This tells Drive to send the file content, not metadata
        });

        // 3. Send encrypted data to frontend
        res.json(file.data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Download Failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});