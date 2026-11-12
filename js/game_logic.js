// Block Blast! Web Engine v3.4 - Authentic Reproduction
(function () {
    'use strict';

    // Game Data from window.BB_DATA
    const DATA = window.BB_DATA || {};
    const AUDIO_MANIFEST = DATA.audio_manifest || {};
    const UI_SPRITES = DATA.ui_sprites || {};
    const ENCOURAGE_MAP = DATA.encourage_map || {};
    const COMBO_GLYPHS = DATA.combo_glyphs || {};
    const BLOCK_COLORS = DATA.block_colors || {};
    const ADVENTURE_LEVELS = (DATA.adventure_levels && DATA.adventure_levels.levels) || [];
    const SHAPES_CATALOG = DATA.shapes || [];

    // High-Performance Zero-Latency Web Audio & Sound System
    const audioCache = {};
    const audioBuffers = {};
    const audioLoadPromises = {};
    let soundEnabled = true;
    let pendingAudioTimers = [];
    let sharedAudioCtx = null;
    let isAudioUnlocked = false;

    function getAudioContext() {
        if (!sharedAudioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                sharedAudioCtx = new AudioContextClass();
            }
        }
        if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
            sharedAudioCtx.resume().catch(() => {});
        }
        return sharedAudioCtx;
    }

    // Unlock Web Audio pipeline instantly on first user interaction (essential for iOS Safari & Android)
    function unlockAudioSystem() {
        if (isAudioUnlocked) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        try {
            // Play an inaudible 1-sample buffer to warm up device audio DAC
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
            isAudioUnlocked = true;
        } catch (e) {}
    }

    ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'keydown'].forEach(evt => {
        window.addEventListener(evt, unlockAudioSystem, { passive: true, once: true });
    });

    if (!AUDIO_MANIFEST.btn_click) {
        AUDIO_MANIFEST.btn_click = 'assets/audio/b7501ba6-7a59-421f-98da-a5c045705797.a8934.ogg';
    }

    // Preload audio into memory buffer for instantaneous playback
    function preloadAudioKey(key) {
        const relPath = AUDIO_MANIFEST[key];
        if (!relPath || audioLoadPromises[key]) return audioLoadPromises[key];

        // Also prepare HTMLAudioElement as immediate fallback
        if (!audioCache[key]) {
            const el = new Audio();
            el.preload = 'auto';
            el.src = relPath;
            audioCache[key] = el;
        }

        audioLoadPromises[key] = fetch(relPath)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.arrayBuffer();
            })
            .then(buf => {
                const ctx = getAudioContext();
                if (!ctx) throw new Error('No AudioContext');
                return new Promise((resolve, reject) => {
                    ctx.decodeAudioData(buf.slice(0), resolve, reject);
                });
            })
            .then(decoded => {
                audioBuffers[key] = decoded;
                return decoded;
            })
            .catch(() => {
                // Return null if Web Audio decode fails, HTMLAudio fallback remains available
                return null;
            });

        return audioLoadPromises[key];
    }

    // Preload all audio assets eagerly so online play has zero network delay
    function initAudioPreloader() {
        const priorityKeys = ['btn_click', 'touch', 'put', 'combo_1', 'combo_2', 'combo_3', 'fill_line_start', 'fill_line_success', 'streak_rock1', 'win', 'fail'];
        priorityKeys.forEach(k => {
            if (AUDIO_MANIFEST[k]) preloadAudioKey(k);
        });

        // Background preload remaining keys
        setTimeout(() => {
            Object.keys(AUDIO_MANIFEST).forEach(k => {
                if (!priorityKeys.includes(k)) {
                    preloadAudioKey(k);
                }
            });
        }, 150);
    }

    // Eagerly trigger preloader
    initAudioPreloader();

    function clearPendingAudioTimers() {
        pendingAudioTimers.forEach(id => clearTimeout(id));
        pendingAudioTimers = [];
    }

    function scheduleAudio(key, delayMs) {
        const id = setTimeout(() => {
            playAudio(key);
        }, delayMs);
        pendingAudioTimers.push(id);
        return id;
    }

    function playAudio(key, playbackRate = 1.0) {
        if (!soundEnabled) return;
        const relPath = AUDIO_MANIFEST[key];
        if (!relPath) return;

        unlockAudioSystem();
        const ctx = getAudioContext();

        // 1. High-Performance Web Audio API path (0ms hardware latency, polyphonic)
        if (ctx && audioBuffers[key]) {
            try {
                const source = ctx.createBufferSource();
                source.buffer = audioBuffers[key];
                source.playbackRate.value = Math.min(Math.max(playbackRate, 0.5), 2.0);
                source.connect(ctx.destination);
                source.start(0);
                return;
            } catch (e) {}
        }

        // 2. Fallback path: HTMLAudioElement with cloneNode to prevent seek lag
        try {
            let snd = audioCache[key];
            if (!snd) {
                snd = new Audio(relPath);
                snd.preload = 'auto';
                audioCache[key] = snd;
            }
            const clone = snd.cloneNode();
            clone.playbackRate = Math.min(Math.max(playbackRate, 0.5), 2.0);
            clone.play().catch(() => {});
        } catch (e) {}
    }

    function playButtonClack() {
        if (!soundEnabled) return;

        // 1. Play the authentic mechanical button audio file
        playAudio('btn_click');

        // 2. Synthesize clean layered physical "clack" transient
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(900, now);
            osc1.frequency.exponentialRampToValueAtTime(140, now + 0.02);
            gain1.gain.setValueAtTime(0.3, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.02);
        } catch (e) {}
    }

    // Image Preloader
    const imageCache = {};
    function preloadImage(key, src, callback) {
        const img = new Image();
        img.onload = () => {
            imageCache[key] = img;
            if (callback) callback(img);
        };
        img.src = src;
    }

    // Preload Sprite Sheets
    if (UI_SPRITES.encourage_tex) {
        preloadImage('encourage_tex', UI_SPRITES.encourage_tex);
    }
    if (UI_SPRITES.combo_num_white) {
        preloadImage('combo_num_white', UI_SPRITES.combo_num_white);
    }
    if (DATA.gem_manifest) {
        Object.entries(DATA.gem_manifest).forEach(([k, src]) => {
            preloadImage('gem_' + k, src);
        });
    }

    // Game State Variables
    let currentView = 'menu'; // 'menu', 'level-select', 'gameplay'
    let currentMode = 'classic'; // 'classic' or 'adventure'
    let currentLevelIndex = 0;
    let unlockedLevel = parseInt(localStorage.getItem('bb_unlocked_level') || '1', 10);
    let score = 0;
    let displayedScore = 0;
    let bestScore = parseInt(localStorage.getItem('bb_best_score') || '0', 10);
    let comboStreak = 0; // Consecutive turns that cleared lines
    let currentTrayPieces = [null, null, null];
    let grid = Array(64).fill(0); // 8x8 grid (0 = empty, 1-7 = color index, 100+ = gem)
    let adventureCollectedGems = 0;
    let isGameOver = false;

    // Session Statistics & Engagement State
    let sessionLinesCleared = 0;
    let sessionBestCombo = 0;
    let sessionBlocksPlaced = 0;
    let sessionStartTime = Date.now();
    let hasTriggeredNewBestInSession = false;
    let reachedMilestones = new Set();
    const SCORE_MILESTONES = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000];

    // Advanced Mechanics State: Revive, Power-ups
    let reviveUsed = false;

    // Idle Hint System State
    let idleHintTimer = null;
    const IDLE_HINT_DELAY = 5000; // 5 seconds of inactivity before showing placement hint
    let activeHintMove = null;

    // View Switching System
    function showView(viewName) {
        currentView = viewName;
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.className = `app-container view-${viewName}`;
        }

        const menuView = document.getElementById('menu-view');
        const levelSelectView = document.getElementById('level-select-view');
        const gameplayView = document.getElementById('gameplay-view');

        if (menuView) menuView.classList.add('hidden');
        if (levelSelectView) levelSelectView.classList.add('hidden');
        if (gameplayView) gameplayView.classList.add('hidden');

        if (viewName === 'menu') {
            clearIdleHint();
            if (menuView) menuView.classList.remove('hidden');
            const menuBestElem = document.getElementById('menu-best-score');
            if (menuBestElem) menuBestElem.textContent = bestScore;
        } else if (viewName === 'level-select') {
            clearIdleHint();
            if (levelSelectView) levelSelectView.classList.remove('hidden');
            renderLevelGrid();
        } else if (viewName === 'gameplay') {
            if (gameplayView) gameplayView.classList.remove('hidden');
            resizeFxCanvas();
            resetIdleHintTimer();
        }
    }

    // Level Grid Selector Renderer
    function renderLevelGrid() {
        const container = document.getElementById('level-grid-container');
        if (!container) return;
        container.innerHTML = '';

        ADVENTURE_LEVELS.forEach((level, idx) => {
            const levelNum = level.num || (idx + 1);
            const isUnlocked = levelNum <= unlockedLevel;
            const isCurrent = idx === currentLevelIndex;

            const card = document.createElement('div');
            card.className = `level-card ${isCurrent ? 'active-level' : ''} ${!isUnlocked ? 'locked' : ''}`;

            const numText = document.createElement('div');
            numText.className = 'level-num-text';
            numText.textContent = levelNum;
            card.appendChild(numText);

            const typeTag = document.createElement('div');
            typeTag.className = 'level-type-tag';
            const condName = (level.condition && level.condition.Name) || '';
            typeTag.textContent = condName === 'collect' ? 'Gems' : 'Score';
            card.appendChild(typeTag);

            if (isUnlocked) {
                card.onclick = () => {
                    playButtonClack();
                    currentLevelIndex = idx;
                    currentMode = 'adventure';
                    reviveUsed = false;
                    setupGameplayUiForMode();
                    showView('gameplay');
                    loadAdventureLevel(currentLevelIndex);
                };
            }

            container.appendChild(card);
        });
    }

    // Ambient Menu Animation Cleaned Up
    function initMenuBgCanvas() {}
    function renderMenuBg() {}

    // FX Canvas System
    const fxCanvas = document.getElementById('fx-canvas');
    const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;
    let particles = [];
    let lineFlashes = [];
    let shockwaves = [];
    let floatingTexts = [];

    function resizeFxCanvas() {
        const board = document.getElementById('board');
        if (!board || !fxCanvas) return;
        fxCanvas.width = board.clientWidth;
        fxCanvas.height = board.clientHeight;
    }

    // Encouragement & Combo Renderer
    const bannerPopup = document.getElementById('banner-popup');
    const bannerWordCanvas = document.getElementById('banner-word-canvas');
    const comboBadgeRow = document.getElementById('combo-badge-row');
    const comboNumCanvas = document.getElementById('combo-num-canvas');

    function renderEncourageWord(key) {
        if (!bannerWordCanvas) return;
        const ctx = bannerWordCanvas.getContext('2d');
        const img = imageCache['encourage_tex'];
        const meta = ENCOURAGE_MAP[key] || ENCOURAGE_MAP['good_blue'];

        if (!img || !meta) return;

        bannerWordCanvas.width = meta.w * 1.5;
        bannerWordCanvas.height = meta.h * 1.5;
        ctx.clearRect(0, 0, bannerWordCanvas.width, bannerWordCanvas.height);

        ctx.drawImage(
            img,
            meta.x, meta.y, meta.w, meta.h,
            0, 0, bannerWordCanvas.width, bannerWordCanvas.height
        );
    }

    function renderComboNumber(num) {
        if (!comboNumCanvas) return;
        const ctx = comboNumCanvas.getContext('2d');
        const img = imageCache['combo_num_white'];
        if (!img) return;

        const str = String(num);
        let totalWidth = 0;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const glyph = COMBO_GLYPHS[char];
            if (glyph) {
                totalWidth += (glyph.rect.width * 0.32) + 2;
            }
        }

        comboNumCanvas.width = Math.max(totalWidth, 10);
        comboNumCanvas.height = 44;
        ctx.clearRect(0, 0, comboNumCanvas.width, comboNumCanvas.height);

        let curX = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const glyph = COMBO_GLYPHS[char];
            if (glyph) {
                const w = glyph.rect.width * 0.32;
                const h = glyph.rect.height * 0.32;
                ctx.drawImage(
                    img,
                    glyph.rect.x, glyph.rect.y, glyph.rect.width, glyph.rect.height,
                    curX, (44 - h) / 2, w, h
                );
                curX += w + 2;
            }
        }
    }

    function showBanner(encourageKey, comboNum) {
        if (!bannerPopup) return;
        renderEncourageWord(encourageKey);

        if (comboNum && comboNum >= 2) {
            comboBadgeRow.style.display = 'flex';
            renderComboNumber(comboNum);
        } else {
            comboBadgeRow.style.display = 'none';
        }

        bannerPopup.classList.remove('animate-in');
        void bannerPopup.offsetWidth; // Force CSS reflow
        bannerPopup.classList.add('animate-in');
    }

    // Board Element & Construction
    const boardElement = document.getElementById('board');
    function initBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 64; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            boardElement.appendChild(cell);
        }
    }

    // Board View Updater with Danger Zones and Near-Complete Line Hints
    function updateBoardView() {
        const cells = boardElement.children;

        // 1. Calculate Occupancy for Danger Zone
        let occupiedCount = 0;
        const rowCounts = Array(8).fill(0);
        const colCounts = Array(8).fill(0);

        for (let i = 0; i < 64; i++) {
            const r = Math.floor(i / 8);
            const c = i % 8;
            if (grid[i] !== 0) {
                occupiedCount++;
                rowCounts[r]++;
                colCounts[c]++;
            }
        }

        // Apply Danger Zone to Board Wrapper
        const boardWrapper = document.getElementById('board-wrapper') || document.querySelector('.board-wrapper');
        if (boardWrapper) {
            boardWrapper.classList.remove('danger-low', 'danger-mid', 'danger-high');
            if (occupiedCount >= 48) { // 75%+ full: High Danger
                boardWrapper.classList.add('danger-high');
            } else if (occupiedCount >= 40) { // 62%+ full: Mid Danger
                boardWrapper.classList.add('danger-mid');
            } else if (occupiedCount >= 32) { // 50%+ full: Low Danger
                boardWrapper.classList.add('danger-low');
            }
        }

        // Check which rows or cols are near completion (6 or 7 out of 8 filled)
        const nearCompleteRows = new Set();
        const nearCompleteCols = new Set();
        for (let r = 0; r < 8; r++) {
            if (rowCounts[r] === 6 || rowCounts[r] === 7) nearCompleteRows.add(r);
        }
        for (let c = 0; c < 8; c++) {
            if (colCounts[c] === 6 || colCounts[c] === 7) nearCompleteCols.add(c);
        }

        for (let i = 0; i < 64; i++) {
            const cell = cells[i];
            const val = grid[i];
            const r = Math.floor(i / 8);
            const c = i % 8;

            cell.innerHTML = '';
            cell.className = 'cell';

            // Near-complete line hint glow on empty cells in that row/col
            if (val === 0 && (nearCompleteRows.has(r) || nearCompleteCols.has(c))) {
                cell.classList.add('near-complete-hint');
            }

            if (val > 0 && val < 8) {
                const unit = document.createElement('div');
                unit.className = `block-unit color-${val}`;
                cell.appendChild(unit);
            } else if (val === 20 || val === 21) {
                // Special Power-Up Blocks (20 = Bomb, 21 = Lightning)
                const unit = document.createElement('div');
                unit.className = `block-unit ${val === 20 ? 'color-4 powerup-bomb' : 'color-7 powerup-lightning'}`;
                cell.appendChild(unit);

                const badge = document.createElement('div');
                badge.className = 'special-block-badge';
                if (val === 20) {
                    badge.innerHTML = `<svg viewBox="0 0 24 24" fill="#ffffff"><path d="M11 2v3h2V2h-2zm6.36 2.05l-2.12 2.12 1.41 1.41 2.12-2.12-1.41-1.41zM19 11h3v2h-3v-2zm-6.9 3.1l2.5 2.5 1.4-1.4-2.5-2.5-1.4 1.4zM12 7c-3.87 0-7 3.13-7 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7z"/></svg>`;
                } else {
                    badge.innerHTML = `<svg viewBox="0 0 24 24" fill="#facc15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
                }
                cell.appendChild(badge);
            } else if (val >= 100) {
                const baseColor = ((val - 100) % 7) + 1;
                const unit = document.createElement('div');
                unit.className = `block-unit color-${baseColor}`;
                cell.appendChild(unit);

                const gemKey = String(val);
                const gemSrc = DATA.gem_manifest && DATA.gem_manifest[gemKey];
                if (gemSrc) {
                    const gemImg = document.createElement('img');
                    gemImg.className = 'gem-overlay';
                    gemImg.src = gemSrc;
                    cell.appendChild(gemImg);
                }
            }
        }
    }

    // Adventure Mode Level Loader
    function loadAdventureLevel(levelIndex) {
        const level = ADVENTURE_LEVELS[levelIndex];
        if (!level) return;

        grid = Array(64).fill(0);
        adventureCollectedGems = 0;
        score = 0;
        displayedScore = 0;
        comboStreak = 0;
        isGameOver = false;
        clearPendingAudioTimers();

        // Reset session statistics
        sessionLinesCleared = 0;
        sessionBestCombo = 0;
        sessionBlocksPlaced = 0;
        sessionStartTime = Date.now();
        hasTriggeredNewBestInSession = false;
        reachedMilestones = new Set();
        reviveUsed = false;

        if (level.map && Array.isArray(level.map)) {
            for (let i = 0; i < 64; i++) {
                grid[i] = level.map[i] || 0;
            }
        }

        updateBoardView();
        updateGoalProgress();
        spawnTrayPieces();
        updateScoreDisplay();
    }

    function setupGameplayUiForMode() {
        const modeLabel = document.getElementById('mode-label');
        const goalBar = document.getElementById('adventure-goal-bar');

        if (currentMode === 'adventure') {
            modeLabel.textContent = `STAGE ${currentLevelIndex + 1}`;
            goalBar.classList.add('active');
        } else {
            modeLabel.textContent = 'CLASSIC';
            goalBar.classList.remove('active');
        }
    }

    function updateGoalProgress() {
        if (currentMode !== 'adventure') return;
        const level = ADVENTURE_LEVELS[currentLevelIndex];
        if (!level) return;

        const goalTitle = document.getElementById('goal-title');
        const goalProgress = document.getElementById('goal-progress');

        const cond = level.condition || {};
        if (cond.Name === 'collect') {
            const req = (cond.RequiredCollections && cond.RequiredCollections[0] && cond.RequiredCollections[0].Value) || level.targetScore || 40;
            goalTitle.textContent = `STAGE ${level.num} TARGET: GEMS`;
            goalProgress.textContent = `${adventureCollectedGems} / ${req}`;

            if (adventureCollectedGems >= req) {
                triggerStageWin();
            }
        } else {
            const req = cond.RequiredScore || level.targetScore || 400;
            goalTitle.textContent = `STAGE ${level.num} TARGET: ${req} PTS`;
            goalProgress.textContent = `${score} / ${req}`;

            if (score >= req) {
                triggerStageWin();
            }
        }
    }

    function triggerStageWin() {
        if (isGameOver) return;
        isGameOver = true;
        clearIdleHint();
        clearPendingAudioTimers();
        playAudio('win');

        if (currentLevelIndex + 1 >= unlockedLevel) {
            unlockedLevel = currentLevelIndex + 2;
            localStorage.setItem('bb_unlocked_level', unlockedLevel);
        }

        document.getElementById('modal-win-score').textContent = score;
        document.getElementById('win-modal').classList.add('active');
    }

    // Piece Generator & Tray System with Smart Player-Assistance AI
    // Evaluates how well a shape can clear lines or fit smoothly onto current board state
    function evaluateShapeOpportunity(matrix) {
        let bestScore = -999;
        let canFitCount = 0;
        let lineClearingPlacements = 0;

        const rows = matrix.length;
        const cols = matrix[0].length;
        let blockCount = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (matrix[r][c] === 1) blockCount++;
            }
        }

        // Test every valid placement on the current 8x8 grid
        for (let targetR = 0; targetR <= 8 - rows; targetR++) {
            for (let targetC = 0; targetC <= 8 - cols; targetC++) {
                if (canPlaceShape(matrix, targetR, targetC)) {
                    canFitCount++;

                    // Simulate placement and count cleared lines
                    let rowCounts = Array(8).fill(0);
                    let colCounts = Array(8).fill(0);

                    for (let r = 0; r < 8; r++) {
                        for (let c = 0; c < 8; c++) {
                            if (grid[r * 8 + c] !== 0) {
                                rowCounts[r]++;
                                colCounts[c]++;
                            }
                        }
                    }

                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            if (matrix[r][c] === 1) {
                                rowCounts[targetR + r]++;
                                colCounts[targetC + c]++;
                            }
                        }
                    }

                    let linesCleared = 0;
                    for (let r = 0; r < 8; r++) {
                        if (rowCounts[r] === 8) linesCleared++;
                    }
                    for (let c = 0; c < 8; c++) {
                        if (colCounts[c] === 8) linesCleared++;
                    }

                    if (linesCleared > 0) {
                        lineClearingPlacements++;
                    }

                    // Score: clears lines (+100/line), fits comfortably, smaller pieces are more flexible
                    const placementScore = (linesCleared * 120) + (10 - blockCount);
                    if (placementScore > bestScore) {
                        bestScore = placementScore;
                    }
                }
            }
        }

        return {
            placeable: canFitCount > 0,
            canFitCount: canFitCount,
            clearsLine: lineClearingPlacements > 0,
            bestScore: bestScore,
            blockCount: blockCount
        };
    }

    // Smart Piece Selection biased towards easy, line-clearing, and manageable shapes
    function getSmartPiece(options = {}) {
        const { preferClearing = false, preferEasy = false } = options;

        // Categorize catalog shapes
        // Easy shapes: 1x1, 1x2, 2x1, 1x3, 3x1, 2x2, small L (3 blocks)
        const EASY_SHAPE_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 12]);

        // Evaluate candidate shapes from catalog
        const candidates = [];
        for (const shapeMeta of SHAPES_CATALOG) {
            const evalResult = evaluateShapeOpportunity(shapeMeta.matrix);
            if (evalResult.placeable) {
                let weight = 10;

                // 1. Boost smaller and easy shapes heavily
                if (EASY_SHAPE_IDS.has(shapeMeta.id) || evalResult.blockCount <= 4) {
                    weight += 25;
                }
                if (shapeMeta.id === 1) { // 1x1 dot is a savior
                    weight += 15;
                }

                // 2. High boost for pieces that guarantee or easily create line clears!
                if (evalResult.clearsLine) {
                    weight += preferClearing ? 80 : 45;
                }

                // 3. Penalty for giant 3x3 blocks or 5-long bars if board is getting tight
                if (shapeMeta.id === 40 || evalResult.blockCount >= 7) {
                    weight = Math.max(1, weight - 20);
                }

                if (preferEasy && evalResult.blockCount <= 3) {
                    weight += 40;
                }

                candidates.push({ shapeMeta, weight });
            }
        }

        // If no placeable candidates found in catalog (extreme emergency), fallback to 1x1 dot
        if (candidates.length === 0) {
            const dotShape = SHAPES_CATALOG.find(s => s.id === 1) || SHAPES_CATALOG[0];
            return {
                matrix: dotShape.matrix,
                color: Math.floor(Math.random() * 7) + 1
            };
        }

        // Weighted random selection
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let randVal = Math.random() * totalWeight;
        let chosenShape = candidates[0].shapeMeta;

        for (const cand of candidates) {
            randVal -= cand.weight;
            if (randVal <= 0) {
                chosenShape = cand.shapeMeta;
                break;
            }
        }

        let color = Math.floor(Math.random() * 7) + 1;
        // 10% chance to infuse single/small pieces with a special power-up!
        let powerUp = null;
        if (chosenShape.matrix.length <= 2 && chosenShape.matrix[0].length <= 2 && Math.random() < 0.12) {
            powerUp = Math.random() < 0.5 ? 'bomb' : 'lightning';
            color = powerUp === 'bomb' ? 20 : 21;
        }

        return {
            matrix: chosenShape.matrix,
            color: color,
            powerUp: powerUp
        };
    }

    function spawnTrayPieces() {
        // Calculate board fullness to scale assistance
        let occupied = 0;
        for (let i = 0; i < 64; i++) {
            if (grid[i] !== 0) occupied++;
        }
        const isCrowded = occupied >= 36; // 56%+ full

        // Strategy for the 3 pieces in tray:
        // Slot 0: Line-clearing enabler (helps player trigger combos)
        // Slot 1: Easy/small shape (easy to place, prevents game over)
        // Slot 2: Balanced/fun shape
        const p1 = getSmartPiece({ preferClearing: true, preferEasy: isCrowded });
        const p2 = getSmartPiece({ preferClearing: false, preferEasy: true });
        const p3 = getSmartPiece({ preferClearing: isCrowded, preferEasy: false });

        currentTrayPieces = [p1, p2, p3];

        // Safety guarantee: Ensure at least one piece can definitely be placed
        if (!currentTrayPieces.some(p => isShapePlaceableAnywhere(p.matrix))) {
            const dotShape = SHAPES_CATALOG.find(s => s.id === 1) || { matrix: [[1]], id: 1 };
            currentTrayPieces[0] = {
                matrix: dotShape.matrix,
                color: Math.floor(Math.random() * 7) + 1
            };
        }

        renderTray();
        if (!isGameOver && currentView === 'gameplay') {
            resetIdleHintTimer();
        }
    }

    // Crisp & Sharp Tray Renderer (No Decimal CSS Scale!)
    function renderTray() {
        const traySlots = document.querySelectorAll('.tray-slot');
        traySlots.forEach((slot, slotIdx) => {
            slot.innerHTML = '';
            slot.style.opacity = '1';
            slot.style.filter = 'none';

            const piece = currentTrayPieces[slotIdx];
            if (!piece) return;

            const preview = document.createElement('div');
            preview.className = 'piece-preview';
            const rows = piece.matrix.length;
            const cols = piece.matrix[0].length;
            const maxDim = Math.max(rows, cols);

            // Compute exact pixel size to fit 105x105 tray slot cleanly without CSS scale blurring
            let cellSize = 26;
            let gap = 3;
            if (maxDim === 1) {
                cellSize = 44;
                gap = 0;
            } else if (maxDim === 2) {
                cellSize = 36;
                gap = 3;
            } else if (maxDim === 3) {
                cellSize = 26;
                gap = 3;
            } else if (maxDim === 4) {
                cellSize = 20;
                gap = 2;
            } else {
                cellSize = 16;
                gap = 2;
            }

            preview.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
            preview.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
            preview.style.gap = `${gap}px`;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.style.width = `${cellSize}px`;
                    cell.style.height = `${cellSize}px`;
                    cell.style.backgroundColor = 'transparent';

                    if (piece.matrix[r][c] === 1) {
                        const unit = document.createElement('div');
                        if (piece.color === 20) {
                            unit.className = 'block-unit color-4 powerup-bomb';
                            const badge = document.createElement('div');
                            badge.className = 'special-block-badge';
                            badge.innerHTML = `<svg viewBox="0 0 24 24" fill="#ffffff"><path d="M11 2v3h2V2h-2zm6.36 2.05l-2.12 2.12 1.41 1.41 2.12-2.12-1.41-1.41zM19 11h3v2h-3v-2zm-6.9 3.1l2.5 2.5 1.4-1.4-2.5-2.5-1.4 1.4zM12 7c-3.87 0-7 3.13-7 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7z"/></svg>`;
                            unit.appendChild(badge);
                        } else if (piece.color === 21) {
                            unit.className = 'block-unit color-7 powerup-lightning';
                            const badge = document.createElement('div');
                            badge.className = 'special-block-badge';
                            badge.innerHTML = `<svg viewBox="0 0 24 24" fill="#facc15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
                            unit.appendChild(badge);
                        } else {
                            unit.className = `block-unit color-${piece.color}`;
                        }
                        cell.appendChild(unit);
                    }
                    preview.appendChild(cell);
                }
            }

            slot.appendChild(preview);
        });
    }

    // Drag and Drop System
    let draggedSlotIndex = null;
    let draggedPiece = null;
    let isMouseDrag = false;
    let dragCellSize = 42;
    const dragProxy = document.getElementById('drag-proxy');
    const dragGrid = document.getElementById('drag-grid');

    function initDragListeners() {
        const traySlots = document.querySelectorAll('.tray-slot');

        traySlots.forEach(slot => {
            slot.addEventListener('pointerdown', handleDragStart);
        });

        window.addEventListener('pointermove', handleDragMove);
        window.addEventListener('pointerup', handleDragEnd);
        window.addEventListener('pointercancel', handleDragEnd);

        // Reset idle timer on general user interaction while playing
        window.addEventListener('pointerdown', (e) => {
            if (!e.target.closest('.tray-slot') && currentView === 'gameplay' && !isGameOver) {
                clearIdleHint();
                resetIdleHintTimer();
            }
        }, { passive: true });
    }

    function handleDragStart(e) {
        if (isGameOver) return;
        clearIdleHint();
        const slotIdx = parseInt(e.currentTarget.dataset.slot, 10);
        const piece = currentTrayPieces[slotIdx];
        if (!piece) return;

        playAudio('touch');

        draggedSlotIndex = slotIdx;
        draggedPiece = piece;
        isMouseDrag = (e.pointerType === 'mouse');

        // Dynamically measure actual board cell width so dragged piece matches 1:1
        const boardRect = boardElement.getBoundingClientRect();
        dragCellSize = Math.max(28, Math.floor((boardRect.width - 21) / 8));

        dragGrid.innerHTML = '';
        const rows = piece.matrix.length;
        const cols = piece.matrix[0].length;
        dragGrid.style.gridTemplateColumns = `repeat(${cols}, ${dragCellSize}px)`;
        dragGrid.style.gridTemplateRows = `repeat(${rows}, ${dragCellSize}px)`;
        dragGrid.style.gap = '3px';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.width = `${dragCellSize}px`;
                cell.style.height = `${dragCellSize}px`;
                if (piece.matrix[r][c] === 1) {
                    const unit = document.createElement('div');
                    if (piece.color === 20) {
                        unit.className = 'block-unit color-4 powerup-bomb';
                        const badge = document.createElement('div');
                        badge.className = 'special-block-badge';
                        badge.innerHTML = `<svg viewBox="0 0 24 24" fill="#ffffff"><path d="M11 2v3h2V2h-2zm6.36 2.05l-2.12 2.12 1.41 1.41 2.12-2.12-1.41-1.41zM19 11h3v2h-3v-2zm-6.9 3.1l2.5 2.5 1.4-1.4-2.5-2.5-1.4 1.4zM12 7c-3.87 0-7 3.13-7 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7z"/></svg>`;
                        unit.appendChild(badge);
                    } else if (piece.color === 21) {
                        unit.className = 'block-unit color-7 powerup-lightning';
                        const badge = document.createElement('div');
                        badge.className = 'special-block-badge';
                        badge.innerHTML = `<svg viewBox="0 0 24 24" fill="#facc15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
                        unit.appendChild(badge);
                    } else {
                        unit.className = `block-unit color-${piece.color}`;
                    }
                    cell.appendChild(unit);
                }
                dragGrid.appendChild(cell);
            }
        }

        dragProxy.style.display = 'block';
        updateDragPosition(e.clientX, e.clientY);
        clearHighlights();
    }

    function handleDragMove(e) {
        if (!draggedPiece) return;
        updateDragPosition(e.clientX, e.clientY);
        updateBoardHighlights(e.clientX, e.clientY);
    }

    function updateDragPosition(x, y) {
        const rows = draggedPiece.matrix.length;
        const cols = draggedPiece.matrix[0].length;
        const totalW = cols * dragCellSize + (cols - 1) * 3;
        const totalH = rows * dragCellSize + (rows - 1) * 3;

        if (isMouseDrag) {
            // PC Mouse: Center piece directly on cursor for precise placement
            dragProxy.style.left = (x - totalW / 2) + 'px';
            dragProxy.style.top = (y - totalH / 2) + 'px';
        } else {
            // Mobile Touch: Float piece above touch contact so finger doesn't obscure it
            dragProxy.style.left = (x - totalW / 2) + 'px';
            dragProxy.style.top = (y - totalH - 24) + 'px';
        }
    }

    function getTargetCellFromPoint(x, y) {
        const boardRect = boardElement.getBoundingClientRect();
        const rows = draggedPiece.matrix.length;
        const cols = draggedPiece.matrix[0].length;
        const totalW = cols * dragCellSize + (cols - 1) * 3;
        const totalH = rows * dragCellSize + (rows - 1) * 3;

        let anchorX, anchorY;
        if (isMouseDrag) {
            anchorX = x - totalW / 2;
            anchorY = y - totalH / 2;
        } else {
            anchorX = x - totalW / 2;
            anchorY = y - totalH - 24;
        }

        const cellW = boardRect.width / 8;
        const cellH = boardRect.height / 8;

        const col = Math.round((anchorX - boardRect.left) / cellW);
        const row = Math.round((anchorY - boardRect.top) / cellH);

        return { row, col };
    }

    function updateBoardHighlights(x, y) {
        clearHighlights();
        const { row, col } = getTargetCellFromPoint(x, y);

        if (canPlaceShape(draggedPiece.matrix, row, col)) {
            const rows = draggedPiece.matrix.length;
            const cols = draggedPiece.matrix[0].length;
            const cells = boardElement.children;

            // 1. Ghost Block Blueprint on the board
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (draggedPiece.matrix[r][c] === 1) {
                        const idx = (row + r) * 8 + (col + c);
                        const cell = cells[idx];
                        if (cell) {
                            cell.classList.add('cell-ghost-active');
                            const ghost = document.createElement('div');
                            ghost.className = `ghost-block-unit color-${draggedPiece.color}`;
                            cell.appendChild(ghost);
                        }
                    }
                }
            }

            // 2. Line Completion Preview: highlight rows/cols that will clear!
            const tempGrid = [...grid];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (draggedPiece.matrix[r][c] === 1) {
                        tempGrid[(row + r) * 8 + (col + c)] = draggedPiece.color;
                    }
                }
            }

            // Highlight rows that will be eliminated
            for (let r = 0; r < 8; r++) {
                let full = true;
                for (let c = 0; c < 8; c++) {
                    if (tempGrid[r * 8 + c] === 0) { full = false; break; }
                }
                if (full) {
                    for (let c = 0; c < 8; c++) {
                        const cell = cells[r * 8 + c];
                        if (cell) cell.classList.add('preview-line-clear');
                    }
                }
            }

            // Highlight columns that will be eliminated
            for (let c = 0; c < 8; c++) {
                let full = true;
                for (let r = 0; r < 8; r++) {
                    if (tempGrid[r * 8 + c] === 0) { full = false; break; }
                }
                if (full) {
                    for (let r = 0; r < 8; r++) {
                        const cell = cells[r * 8 + c];
                        if (cell) cell.classList.add('preview-line-clear');
                    }
                }
            }
        }
    }

    function clearHighlights() {
        const ghosts = boardElement.querySelectorAll('.ghost-block-unit');
        ghosts.forEach(g => g.remove());
        const ghostCells = boardElement.querySelectorAll('.cell-ghost-active');
        ghostCells.forEach(c => c.classList.remove('cell-ghost-active'));
        const linePreviews = boardElement.querySelectorAll('.preview-line-clear');
        linePreviews.forEach(c => c.classList.remove('preview-line-clear'));
    }

    function handleDragEnd(e) {
        if (!draggedPiece) return;

        const { row, col } = getTargetCellFromPoint(e.clientX, e.clientY);

        if (canPlaceShape(draggedPiece.matrix, row, col)) {
            // Commit Piece to Board
            placePiece(draggedPiece, row, col);
            currentTrayPieces[draggedSlotIndex] = null;
            renderTray();

            // Line Elimination & Combos
            processBoardClears();

            // Spawn next set if tray empty
            if (currentTrayPieces.every(p => p === null)) {
                spawnTrayPieces();
            }
        } else {
            // Drop unsuccessful.
            // Check if ANY piece in tray can be placed anywhere on board.
            // Only trigger game over if NO moves remain across all pieces!
            const anyPlaceable = currentTrayPieces.some(p => p !== null && isShapePlaceableAnywhere(p.matrix));
            if (!anyPlaceable && currentTrayPieces.some(p => p !== null)) {
                setTimeout(() => triggerGameOver(), 450);
            }
        }

        clearHighlights();
        dragProxy.style.display = 'none';
        draggedPiece = null;
        draggedSlotIndex = null;

        if (!isGameOver && currentView === 'gameplay') {
            resetIdleHintTimer();
        }
    }

    // Idle Hint System: Suggest Best Placement when Player Takes Time to Think
    function findBestPlacement() {
        if (isGameOver || !currentTrayPieces || currentTrayPieces.every(p => p === null)) return null;

        let bestMove = null;
        let highestScore = -Infinity;

        currentTrayPieces.forEach((piece, slotIdx) => {
            if (!piece) return;
            const matrix = piece.matrix;
            const rows = matrix.length;
            const cols = matrix[0].length;
            const blockCount = matrix.flat().filter(x => x === 1).length;

            for (let targetR = 0; targetR <= 8 - rows; targetR++) {
                for (let targetC = 0; targetC <= 8 - cols; targetC++) {
                    if (!canPlaceShape(matrix, targetR, targetC)) continue;

                    // Simulate placement
                    const rowCounts = Array(8).fill(0);
                    const colCounts = Array(8).fill(0);
                    for (let r = 0; r < 8; r++) {
                        for (let c = 0; c < 8; c++) {
                            if (grid[r * 8 + c] !== 0) {
                                rowCounts[r]++;
                                colCounts[c]++;
                            }
                        }
                    }

                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            if (matrix[r][c] === 1) {
                                rowCounts[targetR + r]++;
                                colCounts[targetC + c]++;
                            }
                        }
                    }

                    let linesCleared = 0;
                    const clearedRows = [];
                    const clearedCols = [];
                    for (let r = 0; r < 8; r++) {
                        if (rowCounts[r] === 8) {
                            linesCleared++;
                            clearedRows.push(r);
                        }
                    }
                    for (let c = 0; c < 8; c++) {
                        if (colCounts[c] === 8) {
                            linesCleared++;
                            clearedCols.push(c);
                        }
                    }

                    // Power-up triggers
                    let powerupBonus = 0;
                    if (piece.color === 20 && linesCleared > 0) {
                        powerupBonus += 500;
                    } else if (piece.color === 21 && linesCleared > 0) {
                        powerupBonus += 600;
                    }

                    // Gem collections in Adventure Mode
                    let gemBonus = 0;
                    if (currentMode === 'adventure' && linesCleared > 0) {
                        clearedRows.forEach(r => {
                            for (let c = 0; c < 8; c++) {
                                if (grid[r * 8 + c] >= 100) gemBonus += 250;
                            }
                        });
                        clearedCols.forEach(c => {
                            for (let r = 0; r < 8; r++) {
                                if (grid[r * 8 + c] >= 100) gemBonus += 250;
                            }
                        });
                    }

                    // Compactness & Border Contact heuristic
                    let contactPoints = 0;
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            if (matrix[r][c] === 1) {
                                const curR = targetR + r;
                                const curC = targetC + c;
                                const neighbors = [
                                    [curR - 1, curC],
                                    [curR + 1, curC],
                                    [curR, curC - 1],
                                    [curR, curC + 1]
                                ];
                                for (const [nr, nc] of neighbors) {
                                    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                                        if (grid[nr * 8 + nc] !== 0) contactPoints += 2;
                                    } else {
                                        // Contact with outer border helps keep center clear
                                        contactPoints += 1;
                                    }
                                }
                            }
                        }
                    }

                    // Move evaluation:
                    // 1. Cleared lines (1000 pts per line)
                    // 2. Powerups and gems
                    // 3. Compact placement against walls/blocks
                    // 4. Getting rid of larger pieces first
                    let moveScore = (linesCleared * 1000) + powerupBonus + gemBonus + (contactPoints * 8);
                    if (linesCleared === 0) {
                        moveScore += blockCount * 12;
                    }

                    if (moveScore > highestScore) {
                        highestScore = moveScore;
                        bestMove = {
                            slotIndex: slotIdx,
                            piece: piece,
                            row: targetR,
                            col: targetC,
                            linesCleared: linesCleared,
                            clearedRows: clearedRows,
                            clearedCols: clearedCols
                        };
                    }
                }
            }
        });

        return bestMove;
    }

    function showIdleHint() {
        if (isGameOver || draggedPiece || currentView !== 'gameplay') return;
        const bestMove = findBestPlacement();
        if (!bestMove) return;

        activeHintMove = bestMove;

        // 1. Highlight piece in bottom tray
        const traySlots = document.querySelectorAll('.tray-slot');
        if (traySlots[bestMove.slotIndex]) {
            traySlots[bestMove.slotIndex].classList.add('hint-tray-highlight');
        }

        // 2. Render Ghost Blueprint on Board
        const cells = boardElement.children;
        const rows = bestMove.piece.matrix.length;
        const cols = bestMove.piece.matrix[0].length;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (bestMove.piece.matrix[r][c] === 1) {
                    const idx = (bestMove.row + r) * 8 + (bestMove.col + c);
                    const cell = cells[idx];
                    if (cell) {
                        cell.classList.add('cell-hint-active');
                        const hintUnit = document.createElement('div');
                        if (bestMove.piece.color === 20) {
                            hintUnit.className = 'hint-block-unit color-4 powerup-bomb';
                        } else if (bestMove.piece.color === 21) {
                            hintUnit.className = 'hint-block-unit color-7 powerup-lightning';
                        } else {
                            hintUnit.className = `hint-block-unit color-${bestMove.piece.color}`;
                        }
                        cell.appendChild(hintUnit);
                    }
                }
            }
        }

        // 3. Line clear preview if the suggested move eliminates lines
        if (bestMove.linesCleared > 0) {
            bestMove.clearedRows.forEach(r => {
                for (let c = 0; c < 8; c++) {
                    const cell = cells[r * 8 + c];
                    if (cell) cell.classList.add('preview-line-clear');
                }
            });
            bestMove.clearedCols.forEach(c => {
                for (let r = 0; r < 8; r++) {
                    const cell = cells[r * 8 + c];
                    if (cell) cell.classList.add('preview-line-clear');
                }
            });
        }
    }

    function clearIdleHint() {
        if (idleHintTimer) {
            clearTimeout(idleHintTimer);
            idleHintTimer = null;
        }
        activeHintMove = null;

        // Remove tray highlight
        const highlightedSlots = document.querySelectorAll('.tray-slot.hint-tray-highlight');
        highlightedSlots.forEach(s => s.classList.remove('hint-tray-highlight'));

        // Remove board ghost hint units
        const hintUnits = boardElement.querySelectorAll('.hint-block-unit');
        hintUnits.forEach(u => u.remove());

        const hintCells = boardElement.querySelectorAll('.cell-hint-active');
        hintCells.forEach(c => c.classList.remove('cell-hint-active'));

        // Clear line previews if no piece is actively dragged
        if (!draggedPiece) {
            const linePreviews = boardElement.querySelectorAll('.preview-line-clear');
            linePreviews.forEach(c => c.classList.remove('preview-line-clear'));
        }
    }

    function resetIdleHintTimer() {
        clearIdleHint();
        if (isGameOver || currentView !== 'gameplay') return;
        if (!currentTrayPieces || !currentTrayPieces.some(p => p !== null)) return;

        idleHintTimer = setTimeout(() => {
            showIdleHint();
        }, IDLE_HINT_DELAY);
    }

    function placePiece(piece, startRow, startCol) {
        const rows = piece.matrix.length;
        const cols = piece.matrix[0].length;
        let placedCount = 0;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (piece.matrix[r][c] === 1) {
                    const idx = (startRow + r) * 8 + (startCol + c);
                    grid[idx] = piece.color;
                    placedCount++;
                }
            }
        }

        sessionBlocksPlaced++;
        updateBoardView();
        addScore(placedCount * 10);
    }

    // Authentic Combo & Streak System (Block Blast Official Mechanics)
    function processBoardClears() {
        const rowsToClear = [];
        const colsToClear = [];

        // Identify complete rows
        for (let r = 0; r < 8; r++) {
            let full = true;
            for (let c = 0; c < 8; c++) {
                if (grid[r * 8 + c] === 0) { full = false; break; }
            }
            if (full) rowsToClear.push(r);
        }

        // Identify complete columns
        for (let c = 0; c < 8; c++) {
            let full = true;
            for (let r = 0; r < 8; r++) {
                if (grid[r * 8 + c] === 0) { full = false; break; }
            }
            if (full) colsToClear.push(c);
        }

        const linesCleared = rowsToClear.length + colsToClear.length;

        // Cancel previous pending timers so orphaned sounds never bleed into subsequent turns!
        clearPendingAudioTimers();

        if (linesCleared > 0) {
            // Player successfully cleared lines! Increment combo streak
            comboStreak++;
            sessionLinesCleared += linesCleared;
            if (comboStreak > sessionBestCombo) {
                sessionBestCombo = comboStreak;
            }

            const cellsToClear = new Set();
            rowsToClear.forEach(r => {
                for (let c = 0; c < 8; c++) cellsToClear.add(r * 8 + c);
            });
            colsToClear.forEach(c => {
                for (let r = 0; r < 8; r++) cellsToClear.add(r * 8 + c);
            });

            // Effective Combo Level: based on lines cleared at once or consecutive streak
            const effectiveComboLevel = Math.max(linesCleared, comboStreak);
            const isTrueCombo = (comboStreak >= 2) || (linesCleared >= 2);

            // 1. Authentic Block Blast Line Break Elimination Chime with Musical Pitch Progression
            // As combo streak increases, pitch rises through the musical scale (Do, Re, Mi, Fa, Sol, La, Si...)
            const comboAudioKey = `combo_${Math.min(effectiveComboLevel, 6)}`;
            const musicalPitch = Math.min(1.0 + (comboStreak - 1) * 0.08, 1.7);
            if (soundEnabled) {
                playAudio(comboAudioKey, musicalPitch);
            }

            // Stage 1: Line Flash Animation
            rowsToClear.forEach(r => lineFlashes.push({ type: 'row', index: r, alpha: 1.0 }));
            colsToClear.forEach(c => lineFlashes.push({ type: 'col', index: c, alpha: 1.0 }));

            // Stage 2: Staggered Cell Dissolve & Particles (100ms)
            setTimeout(() => {
                const boardRect = boardElement.getBoundingClientRect();
                const cellW = boardRect.width / 8;
                const cellH = boardRect.height / 8;

                // Check for power-up explosions in cleared cells
                const bombExplosions = [];
                let hasLightning = false;

                cellsToClear.forEach(idx => {
                    const val = grid[idx];
                    if (val === 20) {
                        bombExplosions.push(idx);
                    } else if (val === 21) {
                        hasLightning = true;
                    }
                });

                // Execute Bomb 3x3 Blast if bomb was cleared
                if (bombExplosions.length > 0) {
                    bombExplosions.forEach(bIdx => {
                        const br = Math.floor(bIdx / 8);
                        const bc = bIdx % 8;
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                const nr = br + dr;
                                const nc = bc + dc;
                                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                                    cellsToClear.add(nr * 8 + nc);
                                }
                            }
                        }
                    });
                    playAudio('streak_rock1');
                    shakeBoard(3);
                }

                // Execute Lightning Blast (destroys additional random blocks)
                if (hasLightning) {
                    let clearedExtra = 0;
                    for (let i = 0; i < 64; i++) {
                        if (grid[i] !== 0 && !cellsToClear.has(i) && Math.random() < 0.4) {
                            cellsToClear.add(i);
                            clearedExtra++;
                        }
                    }
                    playAudio('win');
                    shakeBoard(2);
                }

                cellsToClear.forEach(idx => {
                    const val = grid[idx];
                    if (val >= 100) {
                        adventureCollectedGems++;
                    }
                    triggerCellParticleBurst(idx, val > 0 && val < 8 ? val : 1);
                    grid[idx] = 0;
                });

                rowsToClear.forEach(r => {
                    shockwaves.push({
                        x: boardRect.width / 2,
                        y: r * cellH + cellH / 2,
                        radius: 5,
                        maxRadius: boardRect.width / 2,
                        alpha: 0.8
                    });
                });

                updateBoardView();
                updateGoalProgress();
                shakeBoard(linesCleared);
            }, 100);

            // Scoring Calculation
            // Line points: 1=100, 2=300, 3=600, 4=1000, 5=1500, 6=2100
            const linePoints = [0, 100, 300, 600, 1000, 1500, 2100][Math.min(linesCleared, 6)] || (linesCleared * 300);
            const comboBonus = isTrueCombo ? (effectiveComboLevel * 80) : 0;
            const totalEarned = linePoints + comboBonus;
            addScore(totalEarned);

            // Floating Score text
            setTimeout(() => {
                const boardRect = boardElement.getBoundingClientRect();
                floatingTexts.push({
                    text: isTrueCombo ? `+${totalEarned} COMBO!` : `+${totalEarned}`,
                    x: boardRect.width / 2,
                    y: boardRect.height / 2 - 20,
                    alpha: 1.0,
                    vy: -1.8,
                    size: 28 + Math.min(linesCleared * 4, 16),
                    color: isTrueCombo ? '#fcd44c' : '#ffffff'
                });
            }, 140);

            // Audio Cheer Voice & Banner ONLY for true combos!
            if (isTrueCombo) {
                let cheerVoice = 'good';
                let animWord = 'good_blue';

                if (effectiveComboLevel === 2) {
                    cheerVoice = 'good';
                    animWord = 'good_blue';
                } else if (effectiveComboLevel === 3) {
                    cheerVoice = 'great';
                    animWord = 'great_yellow';
                } else if (effectiveComboLevel === 4) {
                    cheerVoice = 'amazing';
                    animWord = 'amazing_red';
                } else if (effectiveComboLevel === 5) {
                    cheerVoice = 'excellent';
                    animWord = 'excellect_orange';
                } else {
                    cheerVoice = 'unbelievable';
                    animWord = 'unbelievable_purple';
                }

                scheduleAudio(cheerVoice, 380);

                setTimeout(() => {
                    showBanner(animWord, effectiveComboLevel);
                }, 180);

                if (comboStreak >= 2) {
                    const streakAudioKey = `streak_${Math.min(comboStreak, 10)}`;
                    scheduleAudio(streakAudioKey, 600);
                }
            }

            // All Clear bonus check
            const isAllClear = grid.every(cell => cell === 0);
            if (isAllClear) {
                addScore(1000);
                scheduleAudio('all_clean', 600);
                triggerConfettiExplosion();
                setTimeout(() => {
                    const boardRect = boardElement.getBoundingClientRect();
                    floatingTexts.push({
                        text: 'PERFECT CLEAR! +1000',
                        x: boardRect.width / 2,
                        y: boardRect.height / 2 - 50,
                        alpha: 1.0,
                        vy: -2.0,
                        size: 34,
                        color: '#fcd44c'
                    });
                }, 300);
            }
        } else {
            // Placement resulted in NO cleared lines:
            // 1. Immediately reset combo streak back to 0
            comboStreak = 0;
            // 2. Play standard piece drop sound ONLY (no combo sound, no cheer)
            playAudio('put');
        }
    }

    // Particle FX Burst
    function triggerCellParticleBurst(idx, colorIdx) {
        const boardRect = boardElement.getBoundingClientRect();
        const cellW = boardRect.width / 8;
        const cellH = boardRect.height / 8;
        const r = Math.floor(idx / 8);
        const c = idx % 8;
        const centerX = c * cellW + cellW / 2;
        const centerY = r * cellH + cellH / 2;

        const colorCfg = BLOCK_COLORS[colorIdx] || BLOCK_COLORS[1];

        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2.5;
            particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                size: Math.random() * 7 + 4,
                color: colorCfg.gradTop,
                shadowColor: colorCfg.shadow,
                alpha: 1.0,
                rot: Math.random() * Math.PI,
                vRot: (Math.random() - 0.5) * 0.3,
                life: 1.0
            });
        }
    }

    function shakeBoard(strength) {
        const wrapper = document.querySelector('.board-wrapper');
        if (!wrapper) return;
        wrapper.style.animation = 'none';
        void wrapper.offsetWidth;
        const dur = Math.min(0.25 + strength * 0.05, 0.45);
        wrapper.style.animation = `screenShake ${dur}s ease-in-out`;
    }

    // FX Canvas Animation Loop
    function renderFxCanvas() {
        if (!fxCtx || !fxCanvas) {
            requestAnimationFrame(renderFxCanvas);
            return;
        }

        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

        // 1. Line Sweep Lasers/Flashes
        lineFlashes = lineFlashes.filter(flash => {
            fxCtx.save();
            fxCtx.fillStyle = `rgba(255, 255, 255, ${flash.alpha * 0.9})`;
            fxCtx.shadowColor = '#ffffff';
            fxCtx.shadowBlur = 12;

            const cellW = fxCanvas.width / 8;
            const cellH = fxCanvas.height / 8;

            if (flash.type === 'row') {
                fxCtx.fillRect(0, flash.index * cellH, fxCanvas.width, cellH);
            } else {
                fxCtx.fillRect(flash.index * cellW, 0, cellW, fxCanvas.height);
            }
            fxCtx.restore();

            flash.alpha -= 0.08;
            return flash.alpha > 0;
        });

        // 2. Shockwave Rings
        shockwaves = shockwaves.filter(wave => {
            fxCtx.save();
            fxCtx.strokeStyle = `rgba(255, 255, 255, ${wave.alpha})`;
            fxCtx.lineWidth = 4;
            fxCtx.beginPath();
            fxCtx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            fxCtx.stroke();
            fxCtx.restore();

            wave.radius += 12;
            wave.alpha -= 0.05;
            return wave.alpha > 0 && wave.radius < wave.maxRadius;
        });

        // 3. Debris Cube Particles
        particles = particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.28; // Gravity
            p.vx *= 0.96; // Air resistance
            p.rot += p.vRot;
            p.alpha -= 0.024;

            fxCtx.save();
            fxCtx.translate(p.x, p.y);
            fxCtx.rotate(p.rot);
            fxCtx.globalAlpha = Math.max(0, p.alpha);

            // Draw miniature 3D cube
            fxCtx.fillStyle = p.shadowColor;
            fxCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            fxCtx.fillStyle = p.color;
            fxCtx.fillRect(-p.size / 2 + 1, -p.size / 2 + 1, p.size - 2, p.size - 2);

            fxCtx.restore();
            return p.alpha > 0;
        });

        // 4. Floating Score Labels
        floatingTexts = floatingTexts.filter(ft => {
            ft.y += ft.vy;
            ft.alpha -= 0.02;

            fxCtx.save();
            fxCtx.font = `900 ${ft.size}px 'Fredoka', 'Nunito', sans-serif`;
            fxCtx.textAlign = 'center';
            fxCtx.fillStyle = ft.color;
            fxCtx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            fxCtx.shadowBlur = 6;
            fxCtx.globalAlpha = Math.max(0, ft.alpha);
            fxCtx.fillText(ft.text, ft.x, ft.y);
            fxCtx.restore();

            return ft.alpha > 0;
        });

        requestAnimationFrame(renderFxCanvas);
    }

    // Confetti Explosion for Perfect Clear
    function triggerConfettiExplosion() {
        const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#fcd34d'];
        const app = document.querySelector('.app-container');
        if (!app) return;

        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = `${Math.random() * 8 + 6}px`;
            confetti.style.height = `${Math.random() * 8 + 6}px`;
            confetti.style.animationDuration = `${Math.random() * 1.5 + 1.2}s`;
            confetti.style.animationDelay = `${Math.random() * 0.3}s`;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            app.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }
    }

    // NEW BEST Celebration Trigger
    function triggerNewBestCelebration() {
        const banner = document.getElementById('new-best-banner');
        if (!banner) return;

        banner.classList.remove('animate-in');
        void banner.offsetWidth; // Force CSS reflow
        banner.classList.add('animate-in');

        playAudio('win');

        // Confetti burst for high score celebration
        triggerConfettiExplosion();
    }

    // Milestone Celebration Trigger
    function checkScoreMilestones(newScore) {
        for (const m of SCORE_MILESTONES) {
            if (newScore >= m && !reachedMilestones.has(m)) {
                reachedMilestones.add(m);
                showMilestoneBanner(m);
                break; // Trigger one per turn for maximum impact
            }
        }
    }

    function showMilestoneBanner(milestoneVal) {
        const banner = document.getElementById('milestone-banner');
        const textElem = document.getElementById('milestone-score-text');
        if (!banner || !textElem) return;

        textElem.textContent = milestoneVal.toLocaleString();
        banner.classList.remove('animate-in');
        void banner.offsetWidth;
        banner.classList.add('animate-in');

        scheduleAudio('new_record', 100);
    }

    // Game Over Trigger
    function triggerGameOver() {
        if (isGameOver) return;
        isGameOver = true;
        clearIdleHint();
        clearPendingAudioTimers();
        playAudio('fail');

        // Final score and Best Score
        document.getElementById('modal-final-score').textContent = score;
        const modalBest = document.getElementById('modal-best-score');
        if (modalBest) modalBest.textContent = bestScore;

        // Session Statistics Display
        const statLines = document.getElementById('stat-lines');
        if (statLines) statLines.textContent = sessionLinesCleared;

        const statCombo = document.getElementById('stat-best-combo');
        if (statCombo) statCombo.textContent = sessionBestCombo > 0 ? `${sessionBestCombo}x` : '0';

        const statBlocks = document.getElementById('stat-blocks');
        if (statBlocks) statBlocks.textContent = sessionBlocksPlaced;

        const statTime = document.getElementById('stat-time');
        if (statTime) {
            const elapsedSec = Math.floor((Date.now() - sessionStartTime) / 1000);
            const mins = Math.floor(elapsedSec / 60);
            const secs = elapsedSec % 60;
            statTime.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        // Second Chance / Revive Button State
        const reviveBtn = document.getElementById('btn-modal-revive');
        if (reviveBtn) {
            if (!reviveUsed) {
                reviveBtn.style.display = 'flex';
            } else {
                reviveBtn.style.display = 'none';
            }
        }

        document.getElementById('game-over-modal').classList.add('active');
    }

    // Revive / Second Chance Mechanic
    function triggerSecondChanceRevive() {
        if (reviveUsed) return;
        reviveUsed = true;
        isGameOver = false;

        const gameOverModal = document.getElementById('game-over-modal');
        if (gameOverModal) gameOverModal.classList.remove('active');

        // Clear middle 4x4 area of the board
        for (let r = 2; r <= 5; r++) {
            for (let c = 2; c <= 5; c++) {
                const idx = r * 8 + c;
                if (grid[idx] !== 0) {
                    triggerCellParticleBurst(idx, 2);
                    grid[idx] = 0;
                }
            }
        }

        // Play glorious revive audio and animation
        playAudio('win');
        shakeBoard(3);
        triggerConfettiExplosion();

        // Spawn guaranteed easy rescuer blocks in tray
        const dot = { matrix: [[1]], color: 1 };
        const duo = { matrix: [[1, 1]], color: 2 };
        const corner = { matrix: [[1, 0], [1, 1]], color: 6 };
        currentTrayPieces = [dot, duo, corner];
        renderTray();
        updateBoardView();

        const boardRect = boardElement.getBoundingClientRect();
        floatingTexts.push({
            text: 'REVIVED!',
            x: boardRect.width / 2,
            y: boardRect.height / 2,
            alpha: 1.0,
            vy: -2.2,
            size: 38,
            color: '#ec4899'
        });
    }

    // Score System
    function addScore(pts) {
        const oldScore = score;
        score += pts;

        // Check if player broke their historic best score in this session
        if (score > bestScore) {
            const hadOldRecord = bestScore > 0;
            bestScore = score;
            localStorage.setItem('bb_best_score', bestScore);
            document.getElementById('best-score-val').textContent = bestScore;

            if (hadOldRecord && !hasTriggeredNewBestInSession) {
                hasTriggeredNewBestInSession = true;
                setTimeout(() => triggerNewBestCelebration(), 250);
            }
        }

        // Check Milestone achievements
        checkScoreMilestones(score);

        animateScoreCount();
    }

    function animateScoreCount() {
        const scoreElem = document.getElementById('current-score');
        const diff = score - displayedScore;
        if (diff > 0) {
            const step = Math.max(1, Math.ceil(diff / 5));
            displayedScore += step;
            scoreElem.textContent = displayedScore;
            scoreElem.style.transform = 'scale(1.12)';
            setTimeout(() => {
                scoreElem.style.transform = 'scale(1)';
            }, 80);
            if (displayedScore < score) {
                requestAnimationFrame(animateScoreCount);
            }
        } else {
            scoreElem.textContent = score;
        }
    }

    function updateScoreDisplay() {
        document.getElementById('current-score').textContent = score;
        document.getElementById('best-score-val').textContent = bestScore;
        document.getElementById('menu-best-score').textContent = bestScore;
    }

    // Shape Validation Logic
    function canPlaceShape(matrix, targetRow, targetCol) {
        const rows = matrix.length;
        const cols = matrix[0].length;

        if (targetRow < 0 || targetRow + rows > 8) return false;
        if (targetCol < 0 || targetCol + cols > 8) return false;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (matrix[r][c] === 1) {
                    const idx = (targetRow + r) * 8 + (targetCol + c);
                    if (grid[idx] !== 0) return false;
                }
            }
        }
        return true;
    }

    function isShapePlaceableAnywhere(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;

        for (let r = 0; r <= 8 - rows; r++) {
            for (let c = 0; c <= 8 - cols; c++) {
                if (canPlaceShape(matrix, r, c)) return true;
            }
        }
        return false;
    }

    // Game Reset & Start
    function startClassicGame() {
        currentMode = 'classic';
        grid = Array(64).fill(0);
        score = 0;
        displayedScore = 0;
        comboStreak = 0;
        isGameOver = false;
        clearPendingAudioTimers();

        // Reset session statistics
        sessionLinesCleared = 0;
        sessionBestCombo = 0;
        sessionBlocksPlaced = 0;
        sessionStartTime = Date.now();
        hasTriggeredNewBestInSession = false;
        reachedMilestones = new Set();
        reviveUsed = false;

        setupGameplayUiForMode();
        initBoard();
        updateBoardView();
        updateScoreDisplay();
        spawnTrayPieces();
        showView('gameplay');
    }

    // Modal and Button Event Listeners
    function initButtons() {
        const bindClick = (id, handler) => {
            const el = document.getElementById(id);
            if (el) el.onclick = handler;
        };

        // Menu Navigation
        bindClick('btn-menu-classic', () => {
            playButtonClack();
            startClassicGame();
        });

        bindClick('btn-menu-adventure', () => {
            playButtonClack();
            showView('level-select');
        });

        bindClick('btn-menu-more-games', () => {
            playButtonClack();
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.add('active');
        });

        bindClick('btn-menu-settings', () => {
            playButtonClack();
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.add('active');
        });

        bindClick('btn-level-back', () => {
            playButtonClack();
            showView('menu');
        });

        // Gameplay Top Bar
        bindClick('btn-gameplay-settings', () => {
            playButtonClack();
            clearIdleHint();
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.add('active');
        });

        bindClick('btn-game-home', () => {
            playButtonClack();
            clearPendingAudioTimers();
            showView('menu');
        });

        bindClick('btn-restart', () => {
            playButtonClack();
            if (currentMode === 'classic') {
                startClassicGame();
            } else {
                loadAdventureLevel(currentLevelIndex);
            }
        });

        bindClick('btn-settings', () => {
            playButtonClack();
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.add('active');
        });

        bindClick('btn-mode-toggle', () => {
            playButtonClack();
            showView('level-select');
        });

        // Promo Mini-Game Clickers
        bindClick('promo-gogo', () => {
            playButtonClack();
            startClassicGame();
        });

        bindClick('promo-rings', () => {
            playButtonClack();
            startClassicGame();
        });

        // Modal Buttons
        bindClick('btn-modal-revive', () => {
            playButtonClack();
            triggerSecondChanceRevive();
        });

        bindClick('btn-modal-restart', () => {
            playButtonClack();
            const gameOverModal = document.getElementById('game-over-modal');
            if (gameOverModal) gameOverModal.classList.remove('active');
            if (currentMode === 'classic') {
                startClassicGame();
            } else {
                loadAdventureLevel(currentLevelIndex);
            }
        });

        bindClick('btn-modal-gameover-home', () => {
            playButtonClack();
            const gameOverModal = document.getElementById('game-over-modal');
            if (gameOverModal) gameOverModal.classList.remove('active');
            showView('menu');
        });

        bindClick('btn-gameover-x', () => {
            playButtonClack();
            const gameOverModal = document.getElementById('game-over-modal');
            if (gameOverModal) gameOverModal.classList.remove('active');
            showView('menu');
        });

        bindClick('btn-win-x', () => {
            playButtonClack();
            const winModal = document.getElementById('win-modal');
            if (winModal) winModal.classList.remove('active');
            showView('level-select');
        });

        bindClick('btn-modal-next', () => {
            playButtonClack();
            const winModal = document.getElementById('win-modal');
            if (winModal) winModal.classList.remove('active');
            if (currentLevelIndex + 1 < ADVENTURE_LEVELS.length) {
                currentLevelIndex++;
                loadAdventureLevel(currentLevelIndex);
                setupGameplayUiForMode();
            } else {
                showView('level-select');
            }
        });

        bindClick('btn-modal-stages-list', () => {
            playButtonClack();
            const winModal = document.getElementById('win-modal');
            if (winModal) winModal.classList.remove('active');
            showView('level-select');
        });

        function updateSoundToggleUI() {
            const btn = document.getElementById('btn-sound-toggle');
            if (!btn) return;
            if (soundEnabled) {
                btn.className = 'menu-btn settings-btn menu-btn-classic';
                btn.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    </svg>
                    <span class="btn-label">Sound: ON</span>
                `;
            } else {
                btn.className = 'menu-btn settings-btn menu-btn-muted';
                btn.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                    <span class="btn-label">Sound: OFF</span>
                `;
            }
        }

        bindClick('btn-sound-toggle', () => {
            playButtonClack();
            soundEnabled = !soundEnabled;
            updateSoundToggleUI();
        });

        bindClick('btn-settings-x', () => {
            playButtonClack();
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.remove('active');
            if (currentView === 'gameplay' && !isGameOver) {
                resetIdleHintTimer();
            }
        });

        bindClick('btn-settings-restart', () => {
            playButtonClack();
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.remove('active');
            if (currentMode === 'classic') {
                startClassicGame();
            } else {
                loadAdventureLevel(currentLevelIndex);
            }
        });

        bindClick('btn-settings-home', () => {
            playButtonClack();
            clearPendingAudioTimers();
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.remove('active');
            showView('menu');
        });

        bindClick('btn-settings-close', () => {
            playButtonClack();
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.remove('active');
        });
    }

    // Engine Initialization
    function init() {
        initBoard();
        initDragListeners();
        initButtons();
        initMenuBgCanvas();
        updateScoreDisplay();

        window.addEventListener('resize', () => {
            resizeFxCanvas();
            initMenuBgCanvas();
        });

        // Start animation loops
        renderMenuBg();
        renderFxCanvas();

        // Show default view
        showView('menu');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();