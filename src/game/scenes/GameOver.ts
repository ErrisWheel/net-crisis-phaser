import { Scene } from 'phaser';

export interface PlayerScore {
    name: string;
    points: number;
}

// Selection sort
function selectionSort(arr: PlayerScore[]): PlayerScore[] {
    for (let i = 0; i < arr.length - 1; i++) {
        let maxIdx = i;
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[j].points > arr[maxIdx].points) {
                maxIdx = j;
            }
        }
        if (maxIdx !== i) {
            const temp = arr[i];
            arr[i] = arr[maxIdx];
            arr[maxIdx] = temp;
        }
    }
    return arr;
}

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create(data: { result?: 'win' | 'lose'; scores?: PlayerScore[] }) {
        const { width, height } = this.scale;
        const result = data?.result ?? 'lose';
        const scores = selectionSort([...(data?.scores ?? [])]);
        const isWin = result === 'win';

        this.cameras.main.setBackgroundColor(isWin ? 0x0d2b0d : 0x2b0d0d);

        // Background image (dimmed)
        if (this.textures.exists('background')) {
            this.add.image(width / 2, height / 2, 'background').setAlpha(0.15);
        }

        // Title
        this.add.text(width / 2, 70, isWin ? 'VICTORY!' : 'GAME OVER', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: isWin ? '#7cfc00' : '#ff4444',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, 148, 'LEADERBOARD', {
            fontFamily: 'Arial',
            fontSize: '26px',
            color: '#cccccc',
            stroke: '#000000',
            strokeThickness: 4,
            letterSpacing: 6,
        }).setOrigin(0.5);

        // Scoring legend
        this.add.text(width / 2, 185, 'Treat: +50 pts   |   Research: +100 pts', {
            fontFamily: 'monospace',
            fontSize: '15px',
            color: '#888888',
        }).setOrigin(0.5);

        // Panel
        const panelW = 520;
        const rowH = 58;
        const headerH = 40;
        const panelH = headerH + Math.max(1, scores.length) * rowH + 20;
        const panelCx = width / 2;
        const panelTop = 210;

        this.add.rectangle(panelCx, panelTop + panelH / 2, panelW, panelH, 0x000000, 0.55)
            .setStrokeStyle(2, 0x555555, 1);

        // Column headers
        const lx = panelCx - panelW / 2 + 20;
        const rx = panelCx + panelW / 2 - 20;
        const hdrY = panelTop + 14;

        this.add.text(lx + 40,  hdrY, '#',      { fontFamily: 'monospace', fontSize: '16px', color: '#888888' });
        this.add.text(lx + 80,  hdrY, 'PLAYER', { fontFamily: 'monospace', fontSize: '16px', color: '#888888' });
        this.add.text(rx, hdrY, 'POINTS',        { fontFamily: 'monospace', fontSize: '16px', color: '#888888' }).setOrigin(1, 0);

        // Divider
        this.add.rectangle(panelCx, panelTop + headerH, panelW, 1, 0x555555, 0.8);

        if (scores.length === 0) {
            this.add.text(panelCx, panelTop + headerH + rowH / 2 + 10, 'No score data available', {
                fontFamily: 'Arial', fontSize: '18px', color: '#666666',
            }).setOrigin(0.5);
        } else {
            const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

            for (let i = 0; i < scores.length; i++) {
                const rowY = panelTop + headerH + 10 + i * rowH + rowH / 2;
                const color = i < 3 ? medalColors[i] : '#ffffff';

                // Highlight top row
                if (i === 0) {
                    this.add.rectangle(panelCx, rowY, panelW - 4, rowH - 6, 0xffd700, 0.07);
                }

                this.add.text(lx + 40, rowY, `${i + 1}`, {
                    fontFamily: 'monospace', fontSize: '22px', color, fontStyle: 'bold',
                }).setOrigin(0, 0.5);

                this.add.text(lx + 80, rowY, scores[i].name, {
                    fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
                }).setOrigin(0, 0.5);

                this.add.text(rx, rowY, `${scores[i].points} pts`, {
                    fontFamily: 'monospace', fontSize: '22px', color, fontStyle: 'bold',
                }).setOrigin(1, 0.5);
            }
        }

        // Main Menu button
        const btnY = panelTop + panelH + 55;
        const btnBg = this.add.rectangle(width / 2, btnY, 220, 52, 0x222222)
            .setStrokeStyle(2, 0xffffff, 0.8)
            .setInteractive({ useHandCursor: true });

        this.add.text(width / 2, btnY, 'Main Menu', {
            fontFamily: 'Arial', fontSize: '22px', color: '#ffffff',
        }).setOrigin(0.5);

        btnBg.on('pointerover', () => btnBg.setFillStyle(0x444444));
        btnBg.on('pointerout',  () => btnBg.setFillStyle(0x222222));
        btnBg.on('pointerup',   () => this.scene.start('MainMenu'));
    }
}
