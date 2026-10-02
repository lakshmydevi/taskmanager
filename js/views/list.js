/**
 * TaskFlow Pro - List View Component
 */

class ListView {
    constructor() {
        this.tbody = document.getElementById('taskListBody');
        this.resultsCount = document.getElementById('listResultsCount');
        this.selectAllCheckbox = document.getElementById('selectAllCheckbox');
        this.sortBySelect = document.getElementById('sortBySelect');
        this.btnExportCSV = document.getElementById('btnExportCSV');

        this.selectedTaskIds = new Set();
        this.initEvents();
    }

    initEvents() {
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.addEventListener('change', (e) => {
                const checked = e.target.checked;
                document.querySelectorAll('.task-row-checkbox').forEach(cb => {
                    cb.checked = checked;
                    const id = cb.dataset.id;
                    if (checked) this.selectedTaskIds.add(id);
                    else this.selectedTaskIds.delete(id);
                });
                this.updateSelectionUI();
            });
        }

        if (this.sortBySelect) {
            this.sortBySelect.addEventListener('change', () => {
                window.app.renderActiveView();
            });
        }

        if (this.btnExportCSV) {
            this.btnExportCSV.addEventListener('click', () => this.exportCSV());
        }
    }

    render(tasks, filters = {}) {
        if (!this.tbody) return;

        let filteredTasks = window.kanbanView.filterTasks(tasks, filters);
        filteredTasks = this.sortTasks(filteredTasks, this.sortBySelect ? this.sortBySelect.value : 'dueDateAsc');

        if (this.resultsCount) {
            this.resultsCount.textContent = `Showing ${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'}`;
        }

        if (filteredTasks.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding: 3rem; color: var(--text-muted);">
                        <i class="fa-solid fa-list-check" style="font-size: 2rem; margin-bottom: 0.5rem; display:block; opacity: 0.5;"></i>
                        No matching tasks found.
                    </td>
                </tr>
            `;
            return;
        }

        this.tbody.innerHTML = filteredTasks.map(t => {
            const isChecked = this.selectedTaskIds.has(t.id);
            const subtasks = t.subtasks || [];
            const completedSub = subtasks.filter(s => s.completed).length;
            const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed';
            const formattedDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

            return `
                <tr id="row-${t.id}">
                    <td>
                        <input type="checkbox" class="task-row-checkbox" data-id="${t.id}" ${isChecked ? 'checked' : ''} onchange="window.listView.handleRowCheckboxChange(event, '${t.id}')">
                    </td>
                    <td>
                        <strong style="font-size:0.9rem; cursor:pointer;" onclick="window.taskModal.show('${t.id}')">${this.escapeHtml(t.title)}</strong>
                        ${t.tags && t.tags.length > 0 ? `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${t.tags.map(tag => `#${this.escapeHtml(tag)}`).join(' ')}</div>` : ''}
                    </td>
                    <td><span class="project-badge">${t.project || 'General'}</span></td>
                    <td>
                        <select class="select-input" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onchange="window.listView.handleStatusChange('${t.id}', this.value)">
                            <option value="backlog" ${t.status === 'backlog' ? 'selected' : ''}>Backlog</option>
                            <option value="todo" ${t.status === 'todo' ? 'selected' : ''}>To Do</option>
                            <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="in_review" ${t.status === 'in_review' ? 'selected' : ''}>In Review</option>
                            <option value="completed" ${t.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </td>
                    <td>
                        <span class="priority-badge priority-${t.priority}">
                            ${t.priority.toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <span style="font-size:0.8rem; font-weight:600;">${completedSub}/${subtasks.length}</span>
                    </td>
                    <td>
                        <div class="assignee-badge">
                            <img src="${t.assigneeAvatar}" alt="" class="assignee-avatar" style="width:20px; height:20px;">
                            <span style="font-size:0.8rem;">${this.escapeHtml(t.assigneeName)}</span>
                        </div>
                    </td>
                    <td>
                        <span style="font-size:0.8rem; ${isOverdue ? 'color:#ef4444; font-weight:700;' : 'color:var(--text-secondary);'}">
                            ${formattedDate}
                        </span>
                    </td>
                    <td class="text-right">
                        <button class="btn-icon-subtle" onclick="window.taskModal.show('${t.id}')" title="Edit Task">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon-subtle" onclick="window.listView.handleDelete('${t.id}')" title="Delete Task" style="color:#ef4444;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    sortTasks(tasks, sortBy) {
        return [...tasks].sort((a, b) => {
            if (sortBy === 'dueDateAsc') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (sortBy === 'dueDateDesc') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(b.dueDate) - new Date(a.dueDate);
            }
            if (sortBy === 'priorityDesc') {
                const pOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
            }
            if (sortBy === 'titleAsc') {
                return a.title.localeCompare(b.title);
            }
            if (sortBy === 'createdAtDesc') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return 0;
        });
    }

    handleRowCheckboxChange(event, taskId) {
        if (event.target.checked) this.selectedTaskIds.add(taskId);
        else this.selectedTaskIds.delete(taskId);
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        // update select all state if needed
    }

    handleStatusChange(taskId, newStatus) {
        const activeUser = window.authManager.getActiveUser();
        window.taskStore.updateTask(taskId, { status: newStatus }, activeUser);
        window.notifications.show(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`, 'info');
    }

    handleDelete(taskId) {
        const activeUser = window.authManager.getActiveUser();
        const task = window.taskStore.getTaskById(taskId);
        if (!task) return;

        if (!window.authManager.hasPermission('delete', task)) {
            window.notifications.show('Permission denied: You cannot delete tasks.', 'error');
            return;
        }

        if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
            window.taskStore.deleteTask(taskId, activeUser);
            window.notifications.show('Task deleted.', 'warning');
        }
    }

    exportCSV() {
        const tasks = window.taskStore.getTasks();
        if (tasks.length === 0) {
            window.notifications.show('No tasks to export.', 'warning');
            return;
        }

        const headers = ['ID', 'Title', 'Project', 'Status', 'Priority', 'Assignee', 'Due Date', 'Created At'];
        const rows = tasks.map(t => [
            t.id,
            `"${t.title.replace(/"/g, '""')}"`,
            `"${t.project}"`,
            t.status,
            t.priority,
            `"${t.assigneeName}"`,
            t.dueDate || '',
            t.createdAt
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `TaskFlow_Tasks_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.notifications.show('Exported tasks to CSV file!', 'success');
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

window.listView = new ListView();
