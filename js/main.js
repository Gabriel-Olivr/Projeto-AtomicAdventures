document.addEventListener('DOMContentLoaded', () => {

    const titleScreen = document.getElementById('title-screen');
    const customScreen = document.getElementById('custom-screen');
    const previewCanvas = document.getElementById('preview-canvas');
    const ctx = previewCanvas.getContext('2d');

    document.getElementById('btn-play').addEventListener('click', () => {
        titleScreen.classList.add('hidden');
        customScreen.classList.remove('hidden');
    });

    // --- Step Wizard ---
    let currentStep = 1;
    const totalSteps = 5;
    const player = {
        name: '',
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

    // --- HAIR DEFINITIONS using rectangles (x, y, w, h) ---
    const hairRects = {
        curto: [
            [8,3,16,5],  // topo da cabeça (bangs)
            [8,3,3,10],  // lateral esquerda
            [21,3,3,10]  // lateral direita
        ],
        medio: [
            [6,2,20,5],  // topo mais largo
            [6,2,3,14],  // lateral esquerda longa
            [23,2,3,14]  // lateral direita longa
        ],
        longo: [
            [5,1,22,5],  // topo bem largo
            [5,1,3,20],  // lateral esquerda bem longa
            [24,1,3,20]  // lateral direita bem longa
        ],
        crespo: [
            [2,-2,28,20]  // grande e redondo ao redor da cabeça
        ],
        raspado: [
            [9,3,14,3]   // só um topinho
        ],
        moicano: [
            [13,-1,6,13],  // faixa central vertical
            [14,0,4,4]     // topo mais largo
        ]
    };

    function drawPreview() {
        ctx.clearRect(0, 0, 32, 32);

        const skinCol = skinColorMap[player.skin] || '#fbdac8';
        const hCol = player.hairColor;
        const cCol = player.coatColor;

        // 1) BACK HAIR (draw behind body)
        if (player.hair === 'medio' || player.hair === 'longo') {
            ctx.fillStyle = hCol;
            hairRects[player.hair].forEach(([x, y, w, h]) => {
                if (y >= 12) ctx.fillRect(x, y, w, h);
            });
        }

        // 2) LEGS
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(10, 26, 4, 6);
        ctx.fillRect(18, 26, 4, 6);
        // Shoes
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(10, 30, 5, 2);
        ctx.fillRect(17, 30, 5, 2);

        // 3) BODY / COAT
        ctx.fillStyle = cCol;
        ctx.fillRect(8, 16, 16, 11);
        // Coat collar
        ctx.fillStyle = shadeColor(cCol, 15);
        ctx.fillRect(10, 16, 4, 2);
        ctx.fillRect(18, 16, 4, 2);
        // Center line
        ctx.fillStyle = shadeColor(cCol, -25);
        ctx.fillRect(15, 18, 2, 9);
        // Pocket
        ctx.fillStyle = shadeColor(cCol, -10);
        ctx.fillRect(10, 22, 4, 3);
        ctx.fillRect(18, 22, 4, 3);

        // 4) ARMS
        ctx.fillStyle = cCol;
        ctx.fillRect(5, 16, 3, 10);
        ctx.fillRect(24, 16, 3, 10);
        // Hands
        ctx.fillStyle = skinCol;
        ctx.fillRect(5, 25, 3, 2);
        ctx.fillRect(24, 25, 3, 2);

        // 5) HEAD
        ctx.fillStyle = skinCol;
        ctx.fillRect(9, 5, 14, 12);
        // Head shading (bottom-right shadow)
        ctx.fillStyle = shadeColor(skinCol, -12);
        ctx.fillRect(9, 15, 14, 2);
        ctx.fillRect(21, 5, 2, 12);

        // 6) EYES
        ctx.fillStyle = '#fff';
        ctx.fillRect(11, 9, 4, 4);
        ctx.fillRect(18, 9, 4, 4);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(12, 10, 2, 2);
        ctx.fillRect(19, 10, 2, 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(13, 11, 1, 1);
        ctx.fillRect(20, 11, 1, 1);
        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.fillRect(13, 9, 1, 1);
        ctx.fillRect(20, 9, 1, 1);

        // 7) MOUTH / NOSE
        ctx.fillStyle = shadeColor(skinCol, -25);
        ctx.fillRect(15, 12, 2, 1);  // nose
        ctx.fillStyle = shadeColor(skinCol, -35);
        ctx.fillRect(13, 14, 6, 1);  // mouth line
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(14, 14, 4, 1);  // lips

        // 8) EARS
        ctx.fillStyle = skinCol;
        ctx.fillRect(7, 8, 2, 4);
        ctx.fillRect(23, 8, 2, 4);
        ctx.fillStyle = shadeColor(skinCol, -20);
        ctx.fillRect(7, 9, 1, 2);
        ctx.fillRect(23, 9, 1, 2);

        // 9) HAIR FRONT (draw on top of head)
        ctx.fillStyle = hCol;
        hairRects[player.hair].forEach(([x, y, w, h]) => {
            if (y < 12) ctx.fillRect(x, y, w, h);
        });

        // Hair shine
        ctx.fillStyle = shadeColor(hCol, 30);
        if (player.hair !== 'crespo' && player.hair !== 'raspado') {
            ctx.fillRect(11, 4, 3, 1);
        } else if (player.hair === 'crespo') {
            ctx.fillRect(8, 0, 4, 1);
            ctx.fillRect(16, 1, 4, 1);
        }
    }

    function shadeColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);
        R = Math.min(255, Math.max(0, R + percent));
        G = Math.min(255, Math.max(0, G + percent));
        B = Math.min(255, Math.max(0, B + percent));
        return `rgb(${R},${G},${B})`;
    }

    // --- Step visibility ---
    function updateStepsVisibility() {
        const stepIds = ['step-pronoun', 'step-skin', 'step-hair-style', 'step-hair-color', 'step-coat-color'];
        stepIds.forEach((id, i) => {
            const el = document.getElementById(id);
            el.classList.toggle('hidden', i !== currentStep - 1);
        });
        document.getElementById('btn-next').classList.toggle('hidden', currentStep === totalSteps);
        document.getElementById('btn-back').classList.toggle('hidden', currentStep === 1);
        document.getElementById('btn-start-game').classList.toggle('hidden', currentStep !== totalSteps);
    }

    document.getElementById('btn-next').addEventListener('click', () => {
        if (currentStep < totalSteps) { currentStep++; updateStepsVisibility(); }
    });

    document.getElementById('btn-back').addEventListener('click', () => {
        if (currentStep > 1) { currentStep--; updateStepsVisibility(); }
    });

    // --- Input events ---
    function setupInputEvents() {
        document.querySelectorAll('.pron-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.pron-btn.active').classList.remove('active');
                e.target.classList.add('active');
                player.pronoun = e.target.dataset.pronoun;
            });
        });

        document.querySelectorAll('.skin-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.skin-btn.active').classList.remove('active');
                e.target.classList.add('active');
                player.skin = e.target.dataset.skin;
                drawPreview();
            });
        });

        document.querySelectorAll('.hair-style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.hair-style-btn');
                document.querySelector('.hair-style-btn.active').classList.remove('active');
                target.classList.add('active');
                player.hair = target.dataset.hair;
                drawPreview();
            });
        });

        document.querySelectorAll('.hair-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.hair-color-btn.active').classList.remove('active');
                e.target.classList.add('active');
                player.hairColor = e.target.dataset.haircol;
                drawPreview();
            });
        });

        document.querySelectorAll('.coat-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.coat-color-btn.active').classList.remove('active');
                e.target.classList.add('active');
                player.coatColor = e.target.dataset.coatcol;
                drawPreview();
            });
        });
    }

    // Scale preview
    previewCanvas.style.width = '128px';
    previewCanvas.style.height = '128px';
    previewCanvas.style.imageRendering = 'pixelated';

    setupInputEvents();
    drawPreview();
    updateStepsVisibility();

    document.getElementById('btn-start-game').addEventListener('click', () => {
        player.name = document.getElementById('char-name').value || 'Detetive';
        localStorage.setItem('atomic_player', JSON.stringify(player));
        window.location.href = 'game.html';
    });
});
