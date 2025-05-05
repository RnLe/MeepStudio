// main.js
const preload = path.join(__dirname, 'preload.js')
const indexHtml = `file://${path.join(__dirname, 'dist', 'renderer', 'index.html')}`

win = new BrowserWindow({
  width: 1280,
  height: 800,
  webPreferences: {
    contextIsolation: true,
    preload: preloadScript
  }
});

const frontendURL =
  process.env.NODE_ENV === 'development'
    ? 'http://frontend:3000'
    : `file://${indexHtml}`;

await win.loadURL(frontendURL);