// renderer.js

// --- Elementos da DOM ---
const selectFolderBtn = document.getElementById('select-folder-btn');
const videoListEl = document.getElementById('video-list');
const videoPlayer = document.getElementById('video-player');
const currentVideoTitleEl = document.getElementById('current-video-title');
const playerContainer = document.getElementById('player-container');
const placeholder = document.getElementById('placeholder');

// --- Estado da Aplicação ---
dataPath = null; // Caminho do diretório atual
structure = []; // Estrutura de pastas e arquivos
videos = []; // Lista plana de todos os vídeos para fácil acesso
let currentDataPath = null;
let currentVideos = []; // Lista plana de todos os vídeos para fácil acesso
let currentlyPlaying = null;
let lastUpdateTime = 0;

/**
 * Formata segundos para uma string de tempo (HH:MM:SS ou MM:SS).
 * @param {number} totalSeconds - O total de segundos.
 * @returns {string} - O tempo formatado.
 */
function formatTime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return '00:00';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Renderiza recursivamente a lista de vídeos e pastas.
 * @param {Array} nodes - A lista de nós (pastas ou arquivos).
 * @param {HTMLElement} parentElement - O elemento DOM pai onde a lista será renderizada.
 */
function renderVideoList(nodes, parentElement) {
    nodes.forEach(node => {
        if (node.type === 'folder') {
            const details = document.createElement('details');
            details.className = 'mb-2';
            details.open = true; // Começa com as pastas abertas

            const summary = document.createElement('summary');
            summary.className = 'font-bold text-lg cursor-pointer p-2 rounded-md hover:bg-gray-700 list-none';
            summary.innerHTML = `
                <span class="folder-arrow">▼</span> ${node.name}
            `;
            details.appendChild(summary);
            
            summary.addEventListener('click', (e) => {
                e.preventDefault();
                details.open = !details.open;
                summary.querySelector('.folder-arrow').textContent = details.open ? '▼' : '►';
            });

            const folderContent = document.createElement('div');
            folderContent.className = 'pl-4 border-l-2 border-gray-600';
            details.appendChild(folderContent);

            renderVideoList(node.children, folderContent);
            parentElement.appendChild(details);

        } else if (node.type === 'file') {
            const video = node;
            const progressPercentage = video.totalDuration > 0 ? (video.watchedTime / video.totalDuration) * 100 : 0;
            const watchedStr = formatTime(video.watchedTime);
            const durationStr = video.totalDuration > 0 ? formatTime(video.totalDuration) : '--:--';

            const item = document.createElement('div');
            item.className = `video-item p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-700/50 border border-gray-700/50 ${video.completed ? 'border-l-4 border-green-500' : 'border-l-4 border-transparent'}`;
            item.dataset.videoId = video.id;
            
            item.innerHTML = `
                <div class="flex items-center justify-between">
                    <p class="font-medium truncate pr-2">${video.name}</p>
                    ${video.completed ? '<span class="text-green-400">✔</span>' : ''}
                </div>
                <div class="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
                    <div class="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style="width: ${progressPercentage}%"></div>
                </div>
                <p class="text-xs text-gray-400 mt-1 text-right">${watchedStr} / ${durationStr}</p>
            `;

            item.addEventListener('click', () => {
                playVideo(video);
            });

            parentElement.appendChild(item);
        }
    });
}

/**
 * Inicia a reprodução de um vídeo selecionado.
 * @param {object} video - O objeto de vídeo a ser reproduzido.
 */
function playVideo(video) {
    currentlyPlaying = video;
    
    playerContainer.style.display = 'flex';
    placeholder.style.display = 'none';

    try {
        // Limpar o player
        videoPlayer.pause();
        videoPlayer.removeAttribute('src');
        videoPlayer.load();

        // Usar protocolo personalizado
        const videoPath = encodeURI(video.path.replace(/\\/g, '/'));
        videoPlayer.src = `app-video://${videoPath}`;
        
        // Configurações otimizadas para Chrome/Chromium
        videoPlayer.preload = 'metadata';
        videoPlayer.controls = true;
        videoPlayer.autoplay = false;
        videoPlayer.volume = 1;
        
        // Adicionar atributos específicos do Chrome
        videoPlayer.setAttribute('x-webkit-airplay', 'allow');
        videoPlayer.setAttribute('webkit-playsinline', 'true');
        videoPlayer.setAttribute('playsinline', 'true');
        
        // Restaurar tempo anterior
        if (video.watchedTime) {
            videoPlayer.currentTime = video.watchedTime;
        }

        // Atualizar UI
        document.querySelectorAll('.video-item').forEach(el => {
            el.classList.remove('playing');
            if (el.dataset.videoId === video.id) {
                el.classList.add('playing');
            }
        });

        currentVideoTitleEl.textContent = video.name;

        // Iniciar reprodução com tratamento de erro melhorado
        videoPlayer.play().catch(error => {
            console.error('Erro ao reproduzir:', error);
            // Tentar novamente após um pequeno delay
            setTimeout(() => videoPlayer.play(), 100);
        });

    } catch (error) {
        console.error('Erro ao configurar vídeo:', error);
    }
}

/**
 * Atualiza o progresso do vídeo no estado e na UI.
 */
function updateProgress() {
    if (!currentlyPlaying || !videoPlayer) return;

    const video = currentVideos.find(v => v.id === currentlyPlaying.id);
    if (!video) return;

    const currentTime = videoPlayer.currentTime;
    const duration = videoPlayer.duration;

    if (!isNaN(currentTime) && !isNaN(duration)) {
        video.watchedTime = currentTime;
        video.totalDuration = duration;

        if (currentTime / duration >= 0.99) {
            video.completed = true;
        }

        const itemEl = document.querySelector(`[data-video-id="${video.id}"]`);
        if (itemEl) {
            const progressBar = itemEl.querySelector('.bg-indigo-500');
            const progressPercentage = (currentTime / duration) * 100;
            if (progressBar) {
                progressBar.style.width = `${progressPercentage}%`;
            }
            
            const timeDisplay = itemEl.querySelector('.text-xs');
            if (timeDisplay) {
                timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
            }

            if (video.completed && !itemEl.classList.contains('border-green-500')) {
                itemEl.classList.add('border-l-4', 'border-green-500');
                if (!itemEl.querySelector('.text-green-400')) {
                    itemEl.querySelector('.flex').insertAdjacentHTML('beforeend', '<span class="text-green-400">✔</span>');
                }
            }
        }

        // Salvar progresso
        const now = Date.now();
        if (now - lastUpdateTime > 3000) {
            window.electronAPI.updateProgress({ dataPath: currentDataPath, video });
            lastUpdateTime = now;
        }
    }
}

// --- Event Listeners ---
selectFolderBtn.addEventListener('click', async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
        videoListEl.innerHTML = '<p class="text-gray-400">Escaneando vídeos...</p>';
        const { structure, dataPath, videos } = await window.electronAPI.scanVideos(folderPath);
        
        currentDataPath = dataPath;
        currentVideos = videos;
        
        videoListEl.innerHTML = '';
        if (structure.length === 0) {
            videoListEl.innerHTML = '<p class="text-gray-400">Nenhum vídeo encontrado na pasta.</p>';
        } else {
            renderVideoList(structure, videoListEl);
        }
    }
});

videoPlayer.addEventListener('timeupdate', updateProgress);
videoPlayer.addEventListener('ended', () => {
    if (!currentlyPlaying) return;
    const video = currentVideos.find(v => v.id === currentlyPlaying.id);
    if (video) {
        video.completed = true;
        updateProgress();
        window.electronAPI.updateProgress({ dataPath: currentDataPath, video });
    }
});

// Controles da janela
document.getElementById('minimizeBtn').addEventListener('click', async () => {
    await window.electronAPI.windowControls.minimize();
});

document.getElementById('maximizeBtn').addEventListener('click', async () => {
    await window.electronAPI.windowControls.maximize();
});

document.getElementById('closeBtn').addEventListener('click', async () => {
    await window.electronAPI.windowControls.close();
});

// Estado inicial da UI
playerContainer.style.display = 'none';
placeholder.style.display = 'block';
        currentDataPath = dataPath;
        currentVideos = videos; // Mantém a lista plana para buscas rápidas
        
        videoListEl.innerHTML = ''; // Limpa a lista
        if (structure.length === 0) {
            videoListEl.innerHTML = '<p class="text-gray-400">Nenhum vídeo encontrado na pasta.</p>';
        } else {
            renderVideoList(structure, videoListEl);
        }
   

videoPlayer.addEventListener('timeupdate', updateProgress);
videoPlayer.addEventListener('ended', () => {
    if (!currentlyPlaying) return;
    const video = currentVideos.find(v => v.id === currentlyPlaying.id);
    if (video) {
        video.completed = true;
        updateProgress();
        window.electronAPI.updateProgress({ dataPath: currentDataPath, video });
    }
});

// Controles da janela
document.getElementById('minimizeBtn').addEventListener('click', async () => {
    await window.electronAPI.windowControls.minimize();
});

document.getElementById('maximizeBtn').addEventListener('click', async () => {
    await window.electronAPI.windowControls.maximize();
});

document.getElementById('closeBtn').addEventListener('click', async () => {
    await window.electronAPI.windowControls.close();
});

// Estado inicial da UI
playerContainer.style.display = 'none';
placeholder.style.display = 'block';
placeholder.style.display = 'block';
