document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const TILE = 32;
    const COLS = 20;
    const ROWS = 9;
    canvas.width = COLS * TILE;
    canvas.height = ROWS * TILE;

    // --- Player Config from character creation ---
    const playerConfig = JSON.parse(localStorage.getItem('atomic_player')) || {
        name: 'Detetive',
        pronoun: 'ele',
        skin: 'morena',
        hair: 'curto',
        hairColor: '#1a1a1a',
        coatColor: '#ffffff'
    };

    const skinColorMap = {
        clara: '#fbdac8',
        morena_clara: '#e2a07c',
        morena: '#92583d',
        parda: '#6b4226',
        preta: '#3b1e08'
    };

    document.getElementById('display-name').textContent = playerConfig.name;
    const pronounLabels = { ele: 'Ele/Dele', ela: 'Ela/Dela', elu: 'Elu/Delu' };
    document.getElementById('display-pronoun').textContent = pronounLabels[playerConfig.pronoun] || playerConfig.pronoun;

    // --- Game State ---
    const player = {
        x: 10, y: 5,
        score: 0,
        clues: []
    };

    // --- Suspects ---
    const suspects = [
        { name: 'Carlos', role: 'Professor de Quimica', description: 'Usa jaleco branco e oculos.', clues: [] },
        { name: 'Mariana', role: 'Bibliotecaria', description: 'Usa oculos e ama xadrez.', clues: [] },
        { name: 'Luiz', role: 'Cozinheiro', description: 'Sempre com cheiro de cafe.', clues: [] }
    ];

    const clueAssignments = {
        'A pessoa usa oculos e gosta de xadrez.': 'Mariana',
        'O suspeito trabalhou no turno da manha.': 'Carlos',
        'Deixou uma luva no local.': 'Luiz',
        'Usa perfume cheiroso no casaco.': 'Mariana'
    };

    // --- HAIR DEFINITIONS (rectangles x,y,w,h) matching main.js ---
    const hairRects = {
        curto: [
            [8,3,16,5],[8,3,3,10],[21,3,3,10]
        ],
        medio: [
            [6,2,20,5],[6,2,3,14],[23,2,3,14]
        ],
        longo: [
            [5,1,22,5],[5,1,3,20],[24,1,3,20]
        ],
        crespo: [
            [2,-2,28,20]
        ],
        raspado: [
            [9,3,14,3]
        ],
        moicano: [
            [13,-1,6,13],[14,0,4,4]
        ]
    };

    function shadeHex(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);
        R = Math.min(255, Math.max(0, R + percent));
        G = Math.min(255, Math.max(0, G + percent));
        B = Math.min(255, Math.max(0, B + percent));
        return `rgb(${R},${G},${B})`;
    }

    // ==========================================
    // ROOM DEFINITIONS
    // ==========================================
    // 0=floor, 1=wall, 2=math_puzzle, 3=chem_puzzle, 5=decoration
    const rooms = {
        sala: {
            name: 'Sala de Aula',
            spawn: { x: 10, y: 4 },
            map: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,5,5,5,5,0,0,0,1,1,0,0,0,5,5,5,5,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,5,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,5,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,5,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,5,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ],
            puzzles: [
                { x: 9, y: 4, type: 'mat', prompt: 'Se uma turma tem 35 alunos e 40% faltaram, quantos estao presentes? Multiplique por 3.', answer: '63', hint: '60% de 35 * 3', clue: 'A pessoa usa oculos e gosta de xadrez.' },
                { x: 9, y: 6, type: 'chem', prompt: '5g soluto em 100mL. Concentracao em g/L? Multiplique por 2.', answer: '100', hint: '5g/0.1L = 50g/L. * 2', clue: 'Deixou uma luva no local.' }
            ]
        },
        laboratorio: {
            name: 'Laboratorio',
            spawn: { x: 10, y: 4 },
            map: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,5,5,0,5,5,0,0,0,0,0,0,5,5,0,5,5,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,5,0,0,0,0,0,0,0,3,0,0,0,3,0,0,0,0,5,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,5,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,5,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ],
            puzzles: [
                { x: 9, y: 4, type: 'chem', prompt: '2L a 1mol/L + 1L a 2mol/L. Molaridade final?', answer: '4/3', hint: '(M1*V1+M2*V2)/(V1+V2)', clue: 'O suspeito trabalhou no turno da manha.' },
                { x: 13, y: 4, type: 'chem', prompt: 'Litros de agua para diluir 0.5mol de 2mol/L para 0.5mol/L?', answer: '1', hint: 'C1*V1 = C2*V2', clue: 'Usa perfume cheiroso no casaco.' },
                { x: 9, y: 7, type: 'chem', prompt: 'pH de solucao com [H+] = 10^-3 mol/L?', answer: '3', hint: 'pH = -log[H+]', clue: 'O suspeito manuseou acidos.' }
            ]
        },
        biblioteca: {
            name: 'Biblioteca',
            spawn: { x: 10, y: 4 },
            map: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,5,5,5,5,5,0,0,0,0,0,0,5,5,5,5,5,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,5,5,5,0,0,0,0,5,5,5,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ],
            puzzles: [
                { x: 9, y: 5, type: 'mat', prompt: '3 caixas tem 12 macas no total. Quantas em cada? Multiplique por 2.', answer: '8', hint: '12/3 * 2', clue: 'Deixou uma luva no local.' }
            ]
        },
        patio: {
            name: 'Patio',
            spawn: { x: 10, y: 4 },
            map: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,5,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,5,0,0,0,0,2,0,3,0,0,5,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,5,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ],
            puzzles: [
                { x: 9, y: 4, type: 'mat', prompt: 'Campinho com 15 arvores, 6 sao mangueiras. Qual a porcentagem?', answer: '40', hint: '6/15 * 100', clue: 'O suspeito foi visto no patio as 10h.' },
                { x: 11, y: 4, type: 'chem', prompt: '5g de soluto em 100mL. Concentracao em g/L?', answer: '50', hint: '5g / 0.1L', clue: 'Usa perfume cheiroso no casaco.' }
            ]
        }
    };

    const roomOrder = ['sala', 'laboratorio', 'biblioteca', 'patio'];
    let currentRoomId = 'sala';
    let currentRoom = rooms.sala;
    let solvedPuzzles = new Set();
    let currentPuzzle = null;

    function loadRoom(id) {
        currentRoomId = id;
        currentRoom = rooms[id];
        player.x = currentRoom.spawn.x;
        player.y = currentRoom.spawn.y;
        document.getElementById('location-label').textContent = currentRoom.name;
        buildRoomNav();
    }

    function buildRoomNav() {
        const nav = document.getElementById('room-nav');
        nav.innerHTML = '';
        roomOrder.forEach(id => {
            const btn = document.createElement('button');
            btn.textContent = rooms[id].name;
            btn.className = 'room-btn' + (id === currentRoomId ? ' active' : '');
            btn.addEventListener('click', () => loadRoom(id));
            nav.appendChild(btn);
        });
    }

    // ==========================================
    // TILE COLORING
    // ==========================================
    function getTileColor(tile, roomId) {
        if (tile === 1) {
            switch (roomId) {
                case 'sala': return '#7B5B3A';
                case 'laboratorio': return '#5A6E7A';
                case 'biblioteca': return '#8B5E3C';
                case 'patio': return '#3D7A3D';
                default: return '#34495e';
            }
        }
        if (tile === 0) {
            switch (roomId) {
                case 'sala': return '#C9B896';
                case 'laboratorio': return '#D0D0D0';
                case 'biblioteca': return '#E8D5B0';
                case 'patio': return '#6AAF5E';
                default: return '#999';
            }
        }
        if (tile === 2) return '#F5B041';
        if (tile === 3) return '#8E44AD';
        if (tile === 5) return 'transparent';
        return '#999';
    }

    // ==========================================
    // ROOM DECORATIONS
    // ==========================================
    function drawTileDecorations(tile, x, y, room) {
        ctx.save();
        if (tile === 1) drawWallDetail(x, y, room);
        if (tile === 5) {
            switch (room) {
                case 'sala': drawClassroomItem(x, y); break;
                case 'laboratorio': drawLabItem(x, y); break;
                case 'biblioteca': drawLibraryItem(x, y); break;
                case 'patio': drawYardItem(x, y); break;
            }
        }
        if (tile === 2 || tile === 3) drawPuzzleIndicator(x, y, tile);
        ctx.restore();
    }

    function drawWallDetail(tx, ty, room) {
        const px = tx * TILE, py = ty * TILE;
        switch (room) {
            case 'sala':
                ctx.strokeStyle = '#6B4B2A';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
                ctx.fillStyle = '#6B5040';
                ctx.fillRect(px + 2, py + 15, TILE - 4, 1);
                break;
            case 'laboratorio':
                ctx.fillStyle = '#B8C0C8';
                ctx.strokeStyle = '#A0A8B0';
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        ctx.fillRect(px + 1 + i * 8, py + 1 + j * 8, 7, 7);
                        ctx.strokeRect(px + 1 + i * 8, py + 1 + j * 8, 8, 8);
                    }
                }
                break;
            case 'biblioteca':
                ctx.fillStyle = '#6B3E25';
                ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
                ctx.strokeStyle = '#8B5E3C';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
                break;
            case 'patio':
                ctx.fillStyle = '#4A8A4A';
                ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
                ctx.fillStyle = '#3D7A3D';
                ctx.beginPath(); ctx.arc(px + 8, py + 8, 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(px + 24, py + 12, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#5A9A5A';
                ctx.beginPath(); ctx.arc(px + 16, py + 20, 5, 0, Math.PI * 2); ctx.fill();
                break;
        }
    }

    function drawClassroomItem(tx, ty) {
        const px = tx * TILE, py = ty * TILE;
        // Desk
        ctx.fillStyle = '#A0784A';
        ctx.fillRect(px + 2, py + 10, 28, 4);
        ctx.fillStyle = '#8B6535';
        ctx.fillRect(px + 4, py + 14, 3, 14);
        ctx.fillRect(px + 25, py + 14, 3, 14);
        // Chair
        ctx.fillStyle = '#6B4B2A';
        ctx.fillRect(px + 8, py + 16, 16, 3);
        ctx.fillRect(px + 8, py + 8, 3, 11);
        ctx.fillRect(px + 21, py + 8, 3, 3);
        // Notebook
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(px + 6, py + 8, 12, 6);
        ctx.fillStyle = '#3355aa';
        ctx.fillRect(px + 8, py + 9, 8, 1);
        ctx.fillRect(px + 8, py + 11, 6, 1);
        // Pencil
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(px + 20, py + 9, 8, 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(px + 27, py + 9, 2, 2);
    }

    function drawLabItem(tx, ty) {
        const px = tx * TILE, py = ty * TILE;
        // Bench surface
        ctx.fillStyle = '#5A6A7A';
        ctx.fillRect(px + 1, py + 16, 30, 3);
        ctx.fillStyle = '#4A5A6A';
        ctx.fillRect(px + 3, py + 19, 3, 11);
        ctx.fillRect(px + 26, py + 19, 3, 11);
        // Microscope
        ctx.fillStyle = '#eee';
        ctx.fillRect(px + 3, py + 4, 10, 12);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(px + 1, py + 2, 14, 4);
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 4, py + 1, 8, 3);
        ctx.fillStyle = '#888';
        ctx.fillRect(px + 3, py + 13, 10, 2);
        // Test tubes
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(px + 18, py + 2, 3, 10);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(px + 18, py + 7, 3, 5);
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(px + 22, py + 4, 3, 8);
        ctx.fillStyle = '#1e8c4a';
        ctx.fillRect(px + 22, py + 8, 3, 4);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(px + 26, py + 3, 3, 9);
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(px + 26, py + 7, 3, 5);
        // Tube rack
        ctx.fillStyle = '#C0A060';
        ctx.fillRect(px + 17, py + 12, 13, 3);
        // Beaker with liquid
        ctx.fillStyle = 'rgba(200,200,255,0.5)';
        ctx.fillRect(px + 14, py + 13, 6, 4);
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(px + 14, y_tile(13) + 14, 6, 2);
        // Danger sign
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(px + 28, py + 20, 3, 3);
    }

    function y_tile(n) { return n; } // identity helper (beaker liquid fix)

    function drawLibraryItem(tx, ty) {
        const px = tx * TILE, py = ty * TILE;
        // Bookshelf body
        ctx.fillStyle = '#7B4A2B';
        ctx.fillRect(px + 2, py + 1, 28, 30);
        ctx.fillStyle = '#5C3518';
        ctx.fillRect(px + 4, py + 3, 24, 26);
        // Shelves
        ctx.fillStyle = '#8B5A3A';
        ctx.fillRect(px + 3, py + 11, 26, 2);
        ctx.fillRect(px + 3, py + 21, 26, 2);
        // Row 1 books
        const bc1 = ['#E74C3C','#2E86C1','#27AE60','#F39C12','#8E44AD','#1ABC9C','#E67E22'];
        bc1.forEach((c, i) => {
            const bw = 2 + (i % 3);
            const bh = 7 + (i % 3);
            ctx.fillStyle = c;
            ctx.fillRect(px + 5 + i * 3, py + 12 - bh, bw, bh);
            ctx.fillStyle = shadeHex(c, -40);
            ctx.fillRect(px + 5 + i * 3, py + 12 - bh, 1, bh);
        });
        // Row 2 books
        const bc2 = ['#1ABC9C','#E74C3C','#9B59B6','#3498DB','#F1C40F','#E67E22','#2ECC71','#C0392B'];
        bc2.forEach((c, i) => {
            const bw = 2 + (i % 3);
            const bh = 7 + (i % 3);
            ctx.fillStyle = c;
            ctx.fillRect(px + 5 + i * 3, py + 21 - bh + 1, bw, bh - 1);
            ctx.fillStyle = shadeHex(c, -40);
            ctx.fillRect(px + 5 + i * 3, py + 21 - bh + 1, 1, bh - 1);
        });
        // Open book
        ctx.fillStyle = '#f5f0e8';
        ctx.fillRect(px + 8, py + 25, 14, 4);
        ctx.fillStyle = '#555';
        ctx.fillRect(px + 10, py + 26, 10, 0.5);
        ctx.fillRect(px + 10, py + 27, 7, 0.5);
        // Lantern light glow
        ctx.fillStyle = 'rgba(241,196,15,0.15)';
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
    }

    function drawYardItem(tx, ty) {
        const px = tx * TILE, py = ty * TILE;
        // Ground dirt patch
        ctx.fillStyle = '#5A8040';
        ctx.fillRect(px + 2, py + 26, TILE - 4, 4);
        // Trunk
        ctx.fillStyle = '#5A3A1A';
        ctx.fillRect(px + 14, py + 18, 5, 12);
        ctx.fillStyle = '#4A2A0A';
        ctx.fillRect(px + 15, py + 18, 2, 12);
        // Branch
        ctx.fillStyle = '#5A3A1A';
        ctx.fillRect(px + 8, py + 20, 6, 2);
        ctx.fillRect(px + 19, py + 16, 5, 2);
        // Canopy layers
        ctx.fillStyle = '#3DA060';
        ctx.beginPath(); ctx.arc(px + 16, py + 12, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4AB870';
        ctx.beginPath(); ctx.arc(px + 11, py + 8, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 21, py + 10, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2D8A4E';
        ctx.beginPath(); ctx.arc(px + 16, py + 10, 4, 0, Math.PI * 2); ctx.fill();
        // Highlight
        ctx.fillStyle = '#6AD080';
        ctx.beginPath(); ctx.arc(px + 14, py + 7, 3, 0, Math.PI * 2); ctx.fill();
        // Fruits (mangas)
        ctx.fillStyle = '#F4B041';
        ctx.beginPath(); ctx.arc(px + 10, py + 14, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 22, py + 13, 2, 0, Math.PI * 2); ctx.fill();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath(); ctx.ellipse(px + 16, py + 28, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
    }

    // ==========================================
    // PUZZLE INDICATOR
    // ==========================================
    function drawPuzzleIndicator(tx, ty, tile) {
        const px = tx * TILE, py = ty * TILE;
        const key = `${currentRoomId}_${tx}_${ty}`;
        if (solvedPuzzles.has(key)) {
            ctx.fillStyle = 'rgba(39,174,96,0.25)';
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = '#27ae60';
            ctx.font = 'bold 14px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', px + 16, py + 16);
            return;
        }
        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        const color = tile === 2 ? `rgba(243,156,18,${pulse})` : `rgba(142,68,173,${pulse})`;
        ctx.fillStyle = color;
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        // Question mark
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', px + 16, py + 16);
        // Border glow
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
    }

    // ==========================================
    // PLAYER SPRITE (detailed, matches creation)
    // ==========================================
    function drawPlayerSprite() {
        const px = player.x * TILE, py = player.y * TILE;
        const hCol = playerConfig.hairColor;
        const cCol = playerConfig.coatColor;
        const sCol = skinColorMap[playerConfig.skin] || '#92583d';

        ctx.save();
        ctx.translate(px, py);

        // Layer 1: back hair (long styles)
        ctx.fillStyle = hCol;
        if (playerConfig.hair === 'medio' || playerConfig.hair === 'longo' || playerConfig.hair === 'crespo') {
            hairRects[playerConfig.hair].forEach(([x, y, w, h]) => {
                if (y >= 12 && y < 32) ctx.fillRect(x, y, w, h);
            });
        }

        // Layer 2: legs + shoes
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(10, 26, 4, 6);
        ctx.fillRect(18, 26, 4, 6);
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(10, 30, 5, 2);
        ctx.fillRect(17, 30, 5, 2);

        // Layer 3: body / coat with details
        ctx.fillStyle = cCol;
        ctx.fillRect(8, 16, 16, 11);
        // Collar
        ctx.fillStyle = shadeHex(cCol, 15);
        ctx.fillRect(10, 16, 4, 2);
        ctx.fillRect(18, 16, 4, 2);
        // Center line
        ctx.fillStyle = shadeHex(cCol, -25);
        ctx.fillRect(15, 18, 2, 9);
        // Pockets
        ctx.fillStyle = shadeHex(cCol, -10);
        ctx.fillRect(10, 22, 4, 3);
        ctx.fillRect(18, 22, 4, 3);

        // Layer 4: arms + hands
        ctx.fillStyle = cCol;
        ctx.fillRect(5, 16, 3, 10);
        ctx.fillRect(24, 16, 3, 10);
        ctx.fillStyle = sCol;
        ctx.fillRect(5, 25, 3, 2);
        ctx.fillRect(24, 25, 3, 2);

        // Layer 5: head with shading
        ctx.fillStyle = sCol;
        ctx.fillRect(9, 5, 14, 12);
        ctx.fillStyle = shadeHex(sCol, -12);
        ctx.fillRect(9, 15, 14, 2);
        ctx.fillRect(21, 5, 2, 12);

        // Layer 6: ears
        ctx.fillStyle = sCol;
        ctx.fillRect(7, 8, 2, 4);
        ctx.fillRect(23, 8, 2, 4);
        ctx.fillStyle = shadeHex(sCol, -20);
        ctx.fillRect(7, 9, 1, 2);
        ctx.fillRect(23, 9, 1, 2);

        // Layer 7: eyes with whites, pupils, shine
        ctx.fillStyle = '#fff';
        ctx.fillRect(11, 9, 4, 4);
        ctx.fillRect(18, 9, 4, 4);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(12, 10, 2, 2);
        ctx.fillRect(19, 10, 2, 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(13, 11, 1, 1);
        ctx.fillRect(20, 11, 1, 1);
        ctx.fillStyle = '#fff';
        ctx.fillRect(13, 9, 1, 1);
        ctx.fillRect(20, 9, 1, 1);

        // Layer 8: nose + mouth
        ctx.fillStyle = shadeHex(sCol, -25);
        ctx.fillRect(15, 12, 2, 1);
        ctx.fillStyle = shadeHex(sCol, -35);
        ctx.fillRect(13, 14, 6, 1);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(14, 14, 4, 1);

        // Layer 9: hair front
        ctx.fillStyle = hCol;
        hairRects[playerConfig.hair].forEach(([x, y, w, h]) => {
            if (y < 12 && y >= -2) ctx.fillRect(x, y, w, h);
        });
        // Hair shine
        ctx.fillStyle = shadeHex(hCol, 30);
        if (playerConfig.hair !== 'crespo' && playerConfig.hair !== 'raspado') {
            ctx.fillRect(11, 4, 3, 1);
        } else if (playerConfig.hair === 'crespo') {
            ctx.fillRect(8, 0, 4, 1);
            ctx.fillRect(16, 1, 4, 1);
        } else if (playerConfig.hair === 'raspado') {
            ctx.fillRect(11, 4, 2, 1);
        }

        ctx.restore();
    }

    // ==========================================
    // MAIN RENDER LOOP
    // ==========================================
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const map = currentRoom.map;

        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                const tile = map[y][x];
                // Fill base color only if not transparent
                if (tile !== 5) {
                    ctx.fillStyle = getTileColor(tile, currentRoomId);
                    ctx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
                } else {
                    // Floor color underneath decoration
                    ctx.fillStyle = getTileColor(0, currentRoomId);
                    ctx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
                }
                drawTileDecorations(tile, x, y, currentRoomId);
            }
        }

        drawPlayerSprite();
        requestAnimationFrame(draw);
    }

    // ==========================================
    // INPUT
    // ==========================================
    window.addEventListener('keydown', e => {
        if (document.getElementById('interaction-overlay').classList.contains('hidden') === false) return;
        if (document.getElementById('suspect-overlay').classList.contains('hidden') === false) return;

        let nx = player.x, ny = player.y;

        if (e.key === 'ArrowUp') ny--;
        else if (e.key === 'ArrowDown') ny++;
        else if (e.key === 'ArrowLeft') nx--;
        else if (e.key === 'ArrowRight') nx++;
        else if (e.key === ' ') { checkInteraction(); e.preventDefault(); return; }
        else if (e.key.toLowerCase() === 'q') { toggleSuspectBoard(); return; }
        else return;

        const map = currentRoom.map;
        if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length && map[ny][nx] !== 1) {
            player.x = nx;
            player.y = ny;
        }
        e.preventDefault();
    });

    // ==========================================
    // INTERACTION
    // ==========================================
    function checkInteraction() {
        const px = player.x, py = player.y;
        const puzzle = currentRoom.puzzles.find(p => p.x === px && p.y === py);
        const key = `${currentRoomId}_${px}_${py}`;

        if (puzzle && !solvedPuzzles.has(key)) {
            openPuzzle(puzzle);
        } else if (puzzle && solvedPuzzles.has(key)) {
            showNotification('Voce ja resolveu este desafio aqui.');
        }
    }

    // ==========================================
    // PUZZLE SYSTEM
    // ==========================================
    function openPuzzle(puzzle) {
        currentPuzzle = puzzle;
        document.getElementById('interaction-overlay').classList.remove('hidden');
        document.getElementById('puzzle-title').textContent = puzzle.type === 'mat' ?
            'DESAFIO DE MATEMATICA' : 'DESAFIO DE QUIMICA';
        document.getElementById('puzzle-prompt').textContent = puzzle.prompt;
        document.getElementById('puzzle-answer').value = '';
        document.getElementById('puzzle-feedback').textContent = '';
        document.getElementById('puzzle-answer').focus();
    }

    document.getElementById('btn-submit-answer').addEventListener('click', submitAnswer);
    document.getElementById('puzzle-answer').addEventListener('keydown', e => {
        if (e.key === 'Enter') submitAnswer();
    });

    function submitAnswer() {
        const answer = document.getElementById('puzzle-answer').value.trim();
        const feedback = document.getElementById('puzzle-feedback');
        if (!currentPuzzle) return;

        const expected = currentPuzzle.answer.toLowerCase().replace(',', '.');
        const given = answer.toLowerCase().replace(',', '.');

        if (given === expected || given === expected.replace('.', ',')) {
            feedback.style.color = '#27ae60';
            feedback.textContent = 'Correto! Pista: ' + currentPuzzle.clue;

            const key = `${currentRoomId}_${currentPuzzle.x}_${currentPuzzle.y}`;
            solvedPuzzles.add(key);
            player.clues.push({ text: currentPuzzle.clue, id: currentRoomId + '_' + currentPuzzle.x });
            player.score += 100;
            updateHUD();
            assignClueToSuspect(currentPuzzle.clue);
            currentPuzzle = null;

            setTimeout(() => {
                document.getElementById('interaction-overlay').classList.add('hidden');
            }, 2500);
        } else {
            feedback.style.color = '#c0392b';
            feedback.textContent = 'Incorreto. Dica: ' + currentPuzzle.hint;
        }
    }

    function assignClueToSuspect(clueText) {
        const suspectName = clueAssignments[clueText];
        if (suspectName) {
            const suspect = suspects.find(s => s.name === suspectName);
            if (suspect) suspect.clues.push(clueText);
        }
    }

    // ==========================================
    // SUSPECT BOARD
    // ==========================================
    function toggleSuspectBoard() {
        const overlay = document.getElementById('suspect-overlay');
        if (overlay.classList.contains('hidden')) {
            renderSuspectBoard();
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    function renderSuspectBoard() {
        const list = document.getElementById('suspect-list');
        list.innerHTML = '';
        const feedback = document.getElementById('suspect-feedback');
        feedback.textContent = '';
        feedback.className = '';

        suspects.forEach(s => {
            const card = document.createElement('div');
            card.className = 'suspect-card';
            card.innerHTML = `
                <strong>${s.name}</strong>
                <em>${s.role}</em>
                <p>${s.description}</p>
                <div class="suspect-clues">
                    ${s.clues.length > 0
                        ? s.clues.map(c => '<span class="clue-tag">' + c + '</span>').join('')
                        : '<span class="no-clue">Nenhuma pista</span>'}
                </div>
                <button class="pixel-button gba-btn accuse-btn" data-name="${s.name}">ACUSAR</button>
            `;
            list.appendChild(card);
        });

        list.querySelectorAll('.accuse-btn').forEach(btn => {
            btn.addEventListener('click', () => accuse(btn.dataset.name));
        });
    }

    function accuse(name) {
        const feedback = document.getElementById('suspect-feedback');
        if (name === 'Carlos') {
            feedback.textContent = 'PARABENS! Voce descobriu! Carlos e o culpado!';
            feedback.className = 'success';
        } else {
            const clues = suspects.find(s => s.name === name)?.clues || [];
            feedback.textContent = clues.length > 0
                ? name + ' tem pistas, mas nao e o culpado.'
                : 'Nao ha evidencias contra ' + name + '.';
            feedback.className = 'error';
        }
    }

    // ==========================================
    // MODALS
    // ==========================================
    window.closeModals = function () {
        document.getElementById('interaction-overlay').classList.add('hidden');
        document.getElementById('suspect-overlay').classList.add('hidden');
        currentPuzzle = null;
    };

    document.getElementById('btn-close-dialog').addEventListener('click', closeModals);

    function showNotification(msg) {
        const el = document.getElementById('notification');
        el.textContent = msg;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 2500);
    }

    // ==========================================
    // HUD
    // ==========================================
    function updateHUD() {
        document.getElementById('clues-found').textContent = player.clues.length;
        document.getElementById('score').textContent = player.score;
        const list = document.getElementById('clues-items');
        list.innerHTML = '';
        player.clues.forEach(c => {
            const li = document.createElement('li');
            li.textContent = '> ' + c.text;
            list.appendChild(li);
        });
    }

    // ==========================================
    // INIT
    // ==========================================
    loadRoom('sala');
    updateHUD();
    draw();
});
