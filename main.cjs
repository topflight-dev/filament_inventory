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
