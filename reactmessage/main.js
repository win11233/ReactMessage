const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        title: "ЗЕВС: Messenger",
        icon: path.join(__dirname, 'icon.png'), // Если есть иконка
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Указываем адрес твоего запущенного React-проекта
    win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});