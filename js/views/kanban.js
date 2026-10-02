/**
 * TaskFlow Pro - Kanban Board View Component
 */

class KanbanView {
    constructor() {
        this.boardContainer = document.getElementById('kanbanBoard');
        this.columns = [
            { id: 'backlog', title: 'Backlog', dotClass: 'dot-backlog' },
            { id: 'todo', title: 'To Do', dotClass: 'dot-todo' },
            { id: 'in_progress', title: 'In Progress', dotClass: 'dot-progress' },
            { id: 'in_review', title: 'In Review', dotClass: 'dot-review' },
            { id: 'completed', title: 'Completed', dotClass: 'dot-completed' }
        ];

        this.draggedTaskId = null;
    }

    render(tasks, filters = {}) {
        if (!this.boardContainer) return;

        // Apply filters
        const filteredTasks = this.filterTasks(tasks, filters);

        this.boardContainer.innerHTML = this.columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);

            return `
                <div class="kanban-column" data-status="${col.id}">
                    <div class="column-header">
                        <div class="column-title-group">
                            <span class="column-dot ${col.dotClass}"></span>
                            <span class="column-title">${col.title}</span>
                            <span class="task-count">${colTasks.length}</span>
                        </div>
                        <button class="btn-icon-subtle" onclick="window.taskModal.show(null, '${col.id}')" title="Add task to ${col.title}">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>

                    <div class="kanban-tasks-list" data-status="${col.id}" ondragover="window.kanbanView.handleDragOver(event)" ondragenter="window.kanbanView.handleDragEnter(event)" ondragleave="window.kanbanView.handleDragLeave(event)" ondrop="window.kanbanView.handleDrop(event, '${col.id}')">
                        ${colTasks.length === 0 ? `
                            <div class="empty-column-placeholder" style="text-align:center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.8rem;">
                                <i class="fa-regular fa-square" style="font-size: 1.5rem; margin-bottom: 0.5rem; display:block; opacity: 0.5;"></i>
                                No tasks in ${col.title}
                            </div>
                        ` : colTasks.map(task => this.renderTaskCard(task)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderTaskCard(task) {
        const subtasks = task.subtasks || [];
        const completedSub = subtasks.filter(s => s.completed).length;
        const totalSub = subtasks.length;
        const progressPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
        const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

        return `
            <div class="task-card" 
                 id="card-${task.id}" 
                 draggable="true" 
                 ondragstart="window.kanbanView.handleDragStart(event, '${task.id}')" 
                 ondragend="window.kanbanView.handleDragEnd(event)"
                 onclick="window.kanbanView.handleCardClick(event, '${task.id}')">
                
                <div class="card-top">
                    <span class="project-badge">${task.project || 'General'}</span>
                    <span class="priority-badge priority-${task.priority}">
                        <i class="fa-solid fa-circle" style="font-size:0.4rem;"></i>
                        ${task.priority.toUpperCase()}
                    </span>
                </div>

                <div class="task-card-title">${this.escapeHtml(task.title)}</div>
                
                ${task.description ? `<div class="task-card-desc">${this.escapeHtml(task.description)}</div>` : ''}

                ${totalSub > 0 ? `
                    <div class="subtask-progress-wrapper">
                        <div class="subtask-label">
                            <span><i class="fa-solid fa-list-check"></i> Subtasks</span>
                            <span>${completedSub}/${totalSub} (${progressPct}%)</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${progressPct}%;"></div>
                        </div>
                    </div>
                ` : ''}

                ${task.tags && task.tags.length > 0 ? `
                    <div class="task-tags" style="display:flex; gap:0.25rem; flex-wrap:wrap; margin-bottom:0.6rem;">
                        ${task.tags.map(t => `<span style="font-size:0.68rem; background:var(--bg-surface-3); padding:0.1rem 0.4rem; border-radius:4px; color:var(--text-secondary);">#${this.escapeHtml(t)}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="card-footer">
                    <div class="assignee-badge" title="Assigned to ${this.escapeHtml(task.assigneeName)}">
                        <img src="${task.assigneeAvatar}" alt="${this.escapeHtml(task.assigneeName)}" class="assignee-avatar">
                        <span style="font-size:0.75rem; font-weight:600; color:var(--text-secondary);">${this.escapeHtml(task.assigneeName.split(' ')[0])}</span>
                    </div>

                    ${formattedDate ? `
                        <div class="due-date-tag ${isOverdue ? 'overdue' : ''}">
                            <i class="fa-regular fa-clock"></i>
                            ${formattedDate}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    filterTasks(tasks, filters) {
        return tasks.filter(t => {
            if (filters.search) {
                const query = filters.search.toLowerCase();
                const titleMatch = t.title.toLowerCase().includes(query);
                const descMatch = t.description && t.description.toLowerCase().includes(query);
                const tagMatch = t.tags && t.tags.some(tag => tag.toLowerCase().includes(query));
                const assigneeMatch = t.assigneeName && t.assigneeName.toLowerCase().includes(query);
                if (!titleMatch && !descMatch && !tagMatch && !assigneeMatch) return false;
            }

            if (filters.project && filters.project !== 'all') {
                if (t.project !== filters.project) return false;
            }

            if (filters.priority && filters.priority !== 'all') {
                if (t.priority !== filters.priority) return false;
            }

            return true;
        });
    }

    handleCardClick(event, taskId) {
        // Prevent click if user clicked on button inside card
        if (event.target.closest('button')) return;
        window.taskModal.show(taskId);
    }

    /* Drag & Drop Handlers */
    handleDragStart(event, taskId) {
        this.draggedTaskId = taskId;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', taskId);
        
        const cardElem = document.getElementById(`card-${taskId}`);
        if (cardElem) {
            setTimeout(() => cardElem.classList.add('dragging'), 10);
        }
    }

    handleDragEnd(event) {
        const cardElem = document.getElementById(`card-${this.draggedTaskId}`);
        if (cardElem) {
            cardElem.classList.remove('dragging');
        }
        document.querySelectorAll('.kanban-tasks-list').forEach(el => el.classList.remove('drag-over'));
        this.draggedTaskId = null;
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(event) {
        event.preventDefault();
        const listElem = event.target.closest('.kanban-tasks-list');
        if (listElem) listElem.classList.add('drag-over');
    }

    handleDragLeave(event) {
        const listElem = event.target.closest('.kanban-tasks-list');
        if (listElem && !listElem.contains(event.relatedTarget)) {
            listElem.classList.remove('drag-over');
        }
    }

    handleDrop(event, targetStatus) {
        event.preventDefault();
        const listElem = event.target.closest('.kanban-tasks-list');
        if (listElem) listElem.classList.remove('drag-over');

        const taskId = this.draggedTaskId || event.dataTransfer.getData('text/plain');
        if (!taskId) return;

        const task = window.taskStore.getTaskById(taskId);
        if (task && task.status !== targetStatus) {
            const activeUser = window.authManager.getActiveUser();
            window.taskStore.updateTask(taskId, { status: targetStatus }, activeUser);
            window.notifications.show(`Task moved to ${targetStatus.replace('_', ' ').toUpperCase()}`, 'info');
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
    }
}

window.kanbanView = new KanbanView();
