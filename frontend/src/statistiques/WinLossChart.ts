// src/statistiques/WinLossChart.ts
export class WinLossChart {
    private canvas: HTMLCanvasElement | null;
    private ctx: CanvasRenderingContext2D | null;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    }

    public render(wins: number, losses: number): void {
        if (!this.canvas || !this.ctx) return;

        this.setupCanvasResolution();
        this.drawChart(wins, losses);
    }

    private setupCanvasResolution() {
        if (!this.canvas || !this.ctx) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * 2;
        this.canvas.height = rect.height * 2;
        this.ctx.scale(2, 2);
    }

    private drawChart(wins: number, losses: number) {
        if (!this.canvas || !this.ctx) return;

        const ctx = this.ctx;
        const width = this.canvas.width / 2;
        const height = this.canvas.height / 2;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 25; // Padding

        ctx.clearRect(0, 0, width, height);

        const total = wins + losses;
        
        // Ajuster le centre Y
        const chartCenterY = centerY;

        if (total === 0) {
            // Cercle gris vide
            ctx.beginPath();
            ctx.arc(centerX, chartCenterY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            // Rendre le trait plus fin
            ctx.lineWidth = 10; 
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center'; // S'assurer que c'est centré
            ctx.fillText("No matches", centerX, chartCenterY + 5);
            return;
        }

        // Angles
        const startAngle = -Math.PI / 2; // Commencer en haut
        const winAngle = (wins / total) * (Math.PI * 2);
        
        // --- Wins (Vert) ---
        ctx.beginPath();
        ctx.moveTo(centerX, chartCenterY);
        ctx.arc(centerX, chartCenterY, radius, startAngle, startAngle + winAngle);
        ctx.closePath();
        ctx.fillStyle = '#34d399'; // Emerald 400
        ctx.fill();

        // --- Losses (Rouge) ---
        ctx.beginPath();
        ctx.moveTo(centerX, chartCenterY);
        ctx.arc(centerX, chartCenterY, radius, startAngle + winAngle, startAngle + Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = '#f87171'; // Red 400
        ctx.fill();

        // --- Pourcentages à côté (Outside) ---
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelRadius = radius + 25; // Distance du centre pour le texte

        // Affiche Wins si > 0
        if (wins > 0) {
            const angle = startAngle + winAngle / 2;
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = chartCenterY + Math.sin(angle) * labelRadius;
            
            ctx.fillStyle = '#34d399'; // Vert clair (match le segment)
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`${Math.round((wins/total)*100)}%`, x, y);
        }

        // Affiche Losses si > 0
        if (losses > 0) {
            const angle = startAngle + winAngle + (Math.PI * 2 - winAngle) / 2;
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = chartCenterY + Math.sin(angle) * labelRadius;
            
            ctx.fillStyle = '#f87171'; // Rouge clair (match le segment)
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`${Math.round((losses/total)*100)}%`, x, y);
        }
    }
}
