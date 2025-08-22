// main.js

const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');

// Configuração do electron-reload
try {
  require('electron-reload')(__dirname, {
    electron: require('electron'),
    awaitWriteFinish: true,
    ignored: /node_modules|[\/\\]\.|videos-data\.json/
  });
} catch (err) {
  console.log('Electron Reload não carregado em produção');
}

// Constantes
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];
const DATA_FILE_NAME = 'videos-data.json';

app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-gpu-rasterization');

// Handlers dos controles da janela - colocar antes da função createWindow
ipcMain.handle('window:minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
    return true;
});

ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
    return true;
});

ipcMain.handle('window:close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
    return true;
});

// Função para criar a janela principal da aplicação
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      // Remover configurações potencialmente inseguras
      // enableBlinkFeatures: 'MediaSource,MediaSourceExperimental',
      // chromiumMediaSourceEnabled: true,
    },
    backgroundColor: '#ffffff',
    frame: true,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
  });

  // Configurar CSP mais segura
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; media-src 'self' file: app-video:; img-src 'self' data: blob:"
        ]
      }
    });
  });

  // Habilitar aceleração de hardware
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'mediaKeySystem'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  win.webContents.openDevTools(); // Descomente para debugar
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  // Registrar protocolo personalizado para vídeos
  protocol.registerFileProtocol('app-video', (request, callback) => {
    const filePath = decodeURI(request.url.replace('app-video://', ''));
    callback({ path: filePath });
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- Lógica de IPC (Comunicação entre Processos) ---

ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (!canceled) {
    return filePaths[0];
  }
  return null;
});

/**
 * Escaneia recursivamente um diretório e constrói uma estrutura de árvore de pastas e arquivos de vídeo.
 * @param {string} dir - O diretório a ser escaneado.
 * @param {object} videoData - O objeto que armazena os metadados de progresso dos vídeos.
 * @returns {Promise<Array>} - Uma promessa que resolve para a estrutura de árvore.
 */
async function scanDirectoryStructure(dir, videoData) {
    const structure = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name === DATA_FILE_NAME) continue; // Pula nosso arquivo de dados

        if (entry.isDirectory()) {
            const children = await scanDirectoryStructure(fullPath, videoData);
            if (children.length > 0) { // Só adiciona a pasta se ela não estiver vazia
                 structure.push({
                    type: 'folder',
                    name: entry.name,
                    children: children,
                });
            }
        } else if (VIDEO_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
            const id = fullPath;
            let videoInfo = videoData[id] || {
                id: id,
                path: fullPath,
                name: entry.name,
                watchedTime: 0,
                totalDuration: 0,
                completed: false,
            };
            
            // Sempre garante que o nome existe
            videoInfo.name = videoInfo.name || entry.name;
            videoData[id] = videoInfo;
            
            structure.push({
                type: 'file',
                ...videoInfo
            });
        }
    }
    // Ordena para que as pastas apareçam antes dos arquivos
    structure.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        // Agora isso funciona para ambos, pois ambos têm a propriedade 'name'
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
    return structure;
}


ipcMain.handle('videos:scan', async (event, folderPath) => {
  const dataFilePath = path.join(folderPath, DATA_FILE_NAME);
  let videoData = {};

  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    videoData = JSON.parse(data);
  } catch (error) {
    console.log('Arquivo de dados não encontrado, um novo será criado.');
  }

  const videoStructure = await scanDirectoryStructure(folderPath, videoData);
  
  // Garante que o arquivo de dados seja salvo com quaisquer vídeos novos encontrados
  await fs.writeFile(dataFilePath, JSON.stringify(videoData, null, 2));

  // Retorna a estrutura de árvore e a lista plana de vídeos para fácil acesso
  return { structure: videoStructure, dataPath: dataFilePath, videos: Object.values(videoData) };
});

ipcMain.on('video:updateProgress', async (event, { dataPath, video }) => {
    if (!dataPath || !video || !video.id) return;
    try {
        const data = await fs.readFile(dataPath, 'utf-8');
        const videoData = JSON.parse(data);
        if (videoData[video.id]) {
            videoData[video.id].watchedTime = video.watchedTime;
            videoData[video.id].totalDuration = video.totalDuration;
            videoData[video.id].completed = video.completed;
            fsSync.writeFileSync(dataPath, JSON.stringify(videoData, null, 2));
        }
    } catch (error) {
        console.error('Falha ao atualizar o progresso do vídeo:', error);
    }
});

