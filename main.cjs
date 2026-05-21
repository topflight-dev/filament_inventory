/**
 * main.cjs — Electron Main Process
 * ─────────────────────────────────────────────────────────────────────────────
 * Boots the C3DW Admin Hub desktop application.
 * Loads secrets from the local .env file via dotenv and injects them into the
 * Electron BrowserWindow context via executeJavaScript() after page load.
 * This keeps all secrets out of committed source files entirely.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "C3DW | Workshop Admin Hub",
        autoHideMenuBar: true, // Automatically hides the file/edit menu bar
        icon: path.join(__dirname, 'img/icon.png'), // Sets your custom app icon
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Point this directly to your local Admin Hub HTML file
    win.loadFile(path.join(__dirname, 'src/pages/admin/hub.html'));

    // ─────────────────────────────────────────────────────────────────────────
    // SECURE SECRET INJECTION
    // After the page finishes loading, inject environment secrets directly into
    // the window global context via executeJavaScript(). This is the only safe
    // way to pass secrets to a contextIsolation:true Electron window without a
    // preload script. The values come from the local .env file (never committed).
    // ─────────────────────────────────────────────────────────────────────────
    win.webContents.on('did-finish-load', () => {
        const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
        const adminKey          = process.env.ADMIN_KEY          || '';

        // Escape any backticks or backslashes in the values to prevent injection
        const safeDiscordUrl = discordWebhookUrl.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
        const safeAdminKey   = adminKey.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

        win.webContents.executeJavaScript(`
            window.DISCORD_WEBHOOK_URL = \`${safeDiscordUrl}\`;
            window.ADMIN_KEY           = \`${safeAdminKey}\`;
            console.log('[C3DW Desktop] ✅ Environment secrets injected by main.cjs');
        `).catch(err => {
            console.error('[C3DW Desktop] ❌ Secret injection failed:', err);
        });
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
