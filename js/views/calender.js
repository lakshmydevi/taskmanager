/**
 * TaskFlow Pro - Calendar View Component
 */

class CalendarView {
    constructor() {
        this.grid = document.getElementById('calendarGrid');
        this.title = document.getElementById('calMonthYearTitle');
        this.prevBtn = document.getElementById('calPrevMonth');
        this.nextBtn = document.getElementById('calNextMonth');
        this.todayBtn = document.getElementById('calTodayBtn');

        this.currentDate = new Date();
        this.initEvents();
    }

    initEvents() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                window.app.renderActiveView();
            });
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                window.app.renderActiveView();
            });
        }

        if (this.todayBtn) {
            this.todayBtn.addEventListener('click', () => {
                this.currentDate = new Date();
                window.app.renderActiveView();
            });
        }
    }

    render(tasks, filters = {}) {
        if (!this.grid || !this.title) return;

        const filteredTasks = window.kanbanView.filterTasks(tasks, filters);
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
        this.title.textContent = `${monthName} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const todayStr = new Date().toISOString().slice(0, 10);
        let cellsHTML = '';

        // Previous month trailing days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            cellsHTML += `<div class="cal-day-cell other-month"><span class="cal-day-number">${dayNum}</span></div>`;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dayDateStr === todayStr;

            // Find tasks due on this date
            const dayTasks = filteredTasks.filter(t => {
                if (!t.dueDate) return false;
                return t.dueDate.slice(0, 10) === dayDateStr;
            });

            cellsHTML += `
                <div class="cal-day-cell ${isToday ? 'today' : ''}">
                    <span class="cal-day-number" style="${isToday ? 'color:var(--primary-color);' : ''}">${day}</span>
                    <div class="cal-day-tasks">
                        ${dayTasks.map(t => `
                            <div class="cal-task-item priority-${t.priority}" onclick="window.taskModal.show('${t.id}')" title="${this.escapeHtml(t.title)} (${t.priority})">
                                ${t.status === 'completed' ? '✓ ' : ''}${this.escapeHtml(t.title)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Next month leading days to fill grid (6 rows = 42 cells total)
        const totalCellsSoFar = firstDayOfMonth + daysInMonth;
        const remainingCells = 42 - totalCellsSoFar;
        for (let i = 1; i <= remainingCells; i++) {
            cellsHTML += `<div class="cal-day-cell other-month"><span class="cal-day-number">${i}</span></div>`;
        }

        this.grid.innerHTML = cellsHTML;
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

window.calendarView = new CalendarView();
