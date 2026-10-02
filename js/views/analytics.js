/**
 * TaskFlow Pro - Custom Canvas Analytics & Charts Component
 */

class AnalyticsView {
    constructor() {
        this.statusCanvas = document.getElementById('chartStatusCanvas');
        this.priorityCanvas = document.getElementById('chartPriorityCanvas');
        this.velocityCanvas = document.getElementById('chartVelocityCanvas');
    }

    render(tasks) {
        this.renderStatusDonutChart(tasks);
        this.renderPriorityBarChart(tasks);
        this.renderVelocityLineChart(tasks);
    }

    renderStatusDonutChart(tasks) {
        if (!this.statusCanvas) return;
        const ctx = this.setupCanvas(this.statusCanvas);
        const { width, height } = this.statusCanvas;

        const counts = {
            backlog: tasks.filter(t => t.status === 'backlog').length,
            todo: tasks.filter(t => t.status === 'todo').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            in_review: tasks.filter(t => t.status === 'in_review').length,
            completed: tasks.filter(t => t.status === 'completed').length
        };

        const total = tasks.length || 1;
        const data = [
            { label: 'Backlog', val: counts.backlog, color: '#8b5cf6' },
            { label: 'To Do', val: counts.todo, color: '#3b82f6' },
            { label: 'In Progress', val: counts.in_progress, color: '#f59e0b' },
            { label: 'In Review', val: counts.in_review, color: '#ec4899' },
            { label: 'Completed', val: counts.completed, color: '#10b981' }
        ];

        const centerX = width / 3;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        const innerRadius = radius * 0.65;

        let startAngle = -Math.PI / 2;

        data.forEach(item => {
            const sliceAngle = (item.val / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();
            startAngle += sliceAngle;
        });

        // Center Total Text
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary') || '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tasks.length.toString(), centerX, centerY - 8);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('TOTAL TASKS', centerX, centerY + 14);

        // Legend
        const legendX = width * 0.6;
        let legendY = height / 2 - (data.length * 24) / 2;

        data.forEach(item => {
            ctx.beginPath();
            ctx.arc(legendX, legendY + 6, 6, 0, Math.PI * 2);
            ctx.fillStyle = item.color;
            ctx.fill();

            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary') || '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${item.label}: ${item.val} (${Math.round((item.val / total) * 100)}%)`, legendX + 16, legendY + 6);

            legendY += 24;
        });
    }

    renderPriorityBarChart(tasks) {
        if (!this.priorityCanvas) return;
        const ctx = this.setupCanvas(this.priorityCanvas);
        const { width, height } = this.priorityCanvas;

        const data = [
            { label: 'Urgent', val: tasks.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
            { label: 'High', val: tasks.filter(t => t.priority === 'high').length, color: '#f97316' },
            { label: 'Medium', val: tasks.filter(t => t.priority === 'medium').length, color: '#eab308' },
            { label: 'Low', val: tasks.filter(t => t.priority === 'low').length, color: '#10b981' }
        ];

        const maxVal = Math.max(...data.map(d => d.val), 5);
        const barWidth = 40;
        const gap = 30;
        const startX = (width - (data.length * (barWidth + gap) - gap)) / 2;
        const bottomY = height - 40;
        const chartHeight = height - 80;

        data.forEach((item, idx) => {
            const x = startX + idx * (barWidth + gap);
            const barH = (item.val / maxVal) * chartHeight;
            const y = bottomY - barH;

            // Bar background slot
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(x, bottomY - chartHeight, barWidth, chartHeight);

            // Bar
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
            ctx.fill();

            // Value label
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary') || '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.val.toString(), x + barWidth / 2, y - 8);

            // Category label
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(item.label, x + barWidth / 2, bottomY + 20);
        });
    }

    renderVelocityLineChart(tasks) {
        if (!this.velocityCanvas) return;
        const ctx = this.setupCanvas(this.velocityCanvas);
        const { width, height } = this.velocityCanvas;

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const createdVals = [3, 5, 2, 7, 4, 1, 3];
        const completedVals = [2, 4, 3, 5, 6, 2, 4];

        const maxVal = 10;
        const paddingLeft = 50;
        const paddingBottom = 40;
        const paddingTop = 30;
        const paddingRight = 30;

        const chartW = width - paddingLeft - paddingRight;
        const chartH = height - paddingTop - paddingBottom;
        const stepX = chartW / (days.length - 1);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = paddingTop + (chartH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(width - paddingRight, y);
            ctx.stroke();

            ctx.fillStyle = '#6b7280';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(maxVal - (maxVal / 5) * i).toString(), paddingLeft - 10, y + 4);
        }

        // Draw X-axis labels
        days.forEach((day, i) => {
            const x = paddingLeft + i * stepX;
            ctx.fillStyle = '#9ca3af';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(day, x, height - 15);
        });

        // Helper to draw line dataset
        const drawLine = (vals, color, label) => {
            ctx.beginPath();
            vals.forEach((v, i) => {
                const x = paddingLeft + i * stepX;
                const y = paddingTop + chartH - (v / maxVal) * chartH;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw points
            vals.forEach((v, i) => {
                const x = paddingLeft + i * stepX;
                const y = paddingTop + chartH - (v / maxVal) * chartH;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = '#0b0f19';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        };

        drawLine(createdVals, '#6366f1', 'Tasks Created');
        drawLine(completedVals, '#10b981', 'Tasks Completed');
    }

    setupCanvas(canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = (rect.width || 400) * dpr;
        canvas.height = (rect.height || 250) * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width || 400}px`;
        canvas.style.height = `${rect.height || 250}px`;
        return ctx;
    }
}

window.analyticsView = new AnalyticsView();
