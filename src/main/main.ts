import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron';
import path from 'path';
import * as fs from 'fs'; // Changed from `import fs from 'fs';` to `import * as fs from 'fs';` for better compatibility with commonjs/es module interop in Electron context.
import { RecorderEngine } from './recorder/RecorderEngine';

let mainWindow: BrowserWindow | null = null;
let controlWindow: BrowserWindow | null = null;
const recorder = new RecorderEngine();
let isRecording = false;

interface AppConfig {
  windowBounds?: Electron.Rectangle;
  isMaximized?: boolean;
  format?: string;
  fps?: number;
  showMouse?: boolean;
}

const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig(): AppConfig {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return {};
}

function saveConfig(config: AppConfig) {
  try {
    fs.writeFile(configPath, JSON.stringify(config, null, 2), (err) => {
      if (err) console.error('Failed to save config:', err);
    });
  } catch (e) {
    console.error('Failed to initiate save config:', e);
  }
}

let currentConfig = loadConfig();

function createControlWindow() {
  if (controlWindow) return;

  let x: number | undefined;
  let y: number | undefined;

  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    const maxWidth = 200;
    const width = Math.min(maxWidth, bounds.width);
    // Align top-right
    x = bounds.x + bounds.width - width;
    y = bounds.y;
    
    controlWindow = new BrowserWindow({
      width,
      height: 36,
      x,
      y,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
  } else {
    return;
  }

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    controlWindow.loadURL('http://localhost:5173?window=control');
  } else {
    controlWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { search: 'window=control' });
  }

  controlWindow.on('closed', () => {
    controlWindow = null;
  });
}

function createWindow() {
  let x: number | undefined = currentConfig.windowBounds?.x;
  let y: number | undefined = currentConfig.windowBounds?.y;
  let width = currentConfig.windowBounds?.width || 800;
  let height = currentConfig.windowBounds?.height || 600;

  if (x === undefined || y === undefined) {
    const cursorPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPoint);
    
    // Center window on the display where the cursor is
    x = Math.round(display.bounds.x + (display.bounds.width - width) / 2);
    y = Math.round(display.bounds.y + (display.bounds.height - height) / 2);
  }

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: true, // Keep it visible
    minWidth: 50,
    minHeight: 50,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (currentConfig.isMaximized) {
    mainWindow.maximize();
  }

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
  
  // Basic click-through: if mouse is on transparent part, forward to OS.
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    if (!isRecording) {
      const win = BrowserWindow.fromWebContents(event.sender);
      win?.setIgnoreMouseEvents(ignore, options);
    }
  });

  // Save window state with debounce
  let saveTimeout: NodeJS.Timeout | null = null;
  const saveState = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (!mainWindow) return;
      if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
        currentConfig.windowBounds = mainWindow.getBounds();
      }
      currentConfig.isMaximized = mainWindow.isMaximized();
      saveConfig(currentConfig);
    }, 1000);
  };

  mainWindow.on('resize', saveState);
  mainWindow.on('move', saveState);
  mainWindow.on('maximize', saveState);
  mainWindow.on('unmaximize', saveState);
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

ipcMain.on('close-app', () => {
  app.quit();
});

ipcMain.on('minimize-app', () => {
  mainWindow?.minimize();
});

ipcMain.on('maximize-app', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('select-save-path', async (event, format) => {
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save',
    defaultPath: `recording.${format.toLowerCase()}`,
    filters: [{ name: format, extensions: [format.toLowerCase()] }]
  });
  return filePath;
});

ipcMain.handle('start-recording', async (event, { format, outputPath, fps, showMouse, audioOptions }) => {
  try {
    console.log('Main: start-recording called');
    if (!mainWindow) return;
    
    // Enable recording mode
    isRecording = true;
    
    // Make main window transparent to clicks
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    
    // Create control window
    createControlWindow();

    let finalPath = outputPath;
    if (!finalPath) {
      const homeDir = app.getPath('videos');
      const fs = require('fs');
      const dir = path.join(homeDir, 'Peekaboo');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      finalPath = path.join(dir, `recording-${timestamp}.${format.toLowerCase()}`);
    }

    const bounds = mainWindow.getBounds();
    
    // Adjust for top bar (approx 40px) and border inset (2px)
    const topBarHeight = 40;
    const borderInset = 2; // To avoid recording the red border
    const extraTopInset = 4; // Extra inset to hide the top red border completely
    
    const recordingBounds = {
      x: bounds.x + borderInset,
      y: bounds.y + topBarHeight + borderInset + extraTopInset,
      width: bounds.width - (borderInset * 2),
      height: bounds.height - topBarHeight - (borderInset * 2) - extraTopInset
    };

    console.log('Main: Calling recorder.startRecording', recordingBounds, finalPath);
    await recorder.startRecording(recordingBounds, format, finalPath, fps, showMouse, audioOptions);
    console.log('Main: recorder.startRecording returned');
    
    // Lock window
    mainWindow.setResizable(false);
    mainWindow.setMovable(false);
  } catch (err) {
    console.error('Main: Error in start-recording:', err);
    isRecording = false;
    if (controlWindow) controlWindow.close();
    if (mainWindow) mainWindow.setIgnoreMouseEvents(false);
    throw err;
  }
});

ipcMain.handle('stop-recording', async () => {
  await recorder.stopRecording();
  
  isRecording = false;
  
  if (controlWindow) {
    controlWindow.close();
  }

  if (mainWindow) {
    mainWindow.setResizable(true);
    mainWindow.setMovable(true);
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.webContents.send('recording-stopped');
  }
});

ipcMain.handle('get-settings', () => {
  return {
    format: currentConfig.format || 'MP4',
    fps: currentConfig.fps || 30,
    showMouse: currentConfig.showMouse ?? true
  };
});

ipcMain.handle('save-settings', (event, settings) => {
  currentConfig = { ...currentConfig, ...settings };
  saveConfig(currentConfig);
});
