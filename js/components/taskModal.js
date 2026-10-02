/**
 * TaskFlow Pro - Task Create/Edit Modal Component
 */

class TaskModalComponent {
    constructor() {
        this.overlay = document.getElementById('taskModalOverlay');
        this.form = document.getElementById('taskForm');
        this.titleHeader = document.getElementById('taskModalTitle');
        this.idInput = document.getElementById('taskFormId');
        
        this.titleInput = document.getElementById('taskTitleInput');
        this.projectSelect = document.getElementById('taskProjectSelect');
        this.prioritySelect = document.getElementById('taskPrioritySelect');
        this.statusSelect = document.getElementById('taskStatusSelect');
        this.assigneeSelect = document.getElementById('taskAssigneeSelect');
        this.dueDateInput = document.getElementById('taskDueDateInput');
        this.descInput = document.getElementById('taskDescInput');
        this.tagsInput = document.getElementById('taskTagsInput');
        
        this.newSubtaskInput = document.getElementById('newSubtaskInput');
        this.btnAddSubtask = document.getElementById('btnAddSubtask');
        this.subtaskEditorList = document.getElementById('subtaskEditorList');

        this.currentSubtasks = [];

        this.initEvents();
    }

    initEvents() {
        // Close modal buttons
        document.getElementById('closeTaskModalBtn').addEventListener('click', () => this.hide());
        document.getElementById('cancelTaskModalBtn').addEventListener('click', () => this.hide());

        // Overlay click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide();
        });

        // Subtask Add Button
        this.btnAddSubtask.addEventListener('click', () => this.addSubtaskFromInput());
        this.newSubtaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addSubtaskFromInput();
            }
        });

        // Form Submit
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });
    }

    populateAssignees() {
        const users = window.authManager.getUsers();
        this.assigneeSelect.innerHTML = users.map(u => 
            `<option value="${u.id}">${u.name} (${u.roleBadge})</option>`
        ).join('');
    }

    show(taskId = null, defaultStatus = 'todo') {
        this.populateAssignees();
        this.form.reset();
        this.currentSubtasks = [];

        if (taskId) {
            const task = window.taskStore.getTaskById(taskId);
            if (!task) return;

            this.titleHeader.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Task`;
            this.idInput.value = task.id;
            this.titleInput.value = task.title;
            this.projectSelect.value = task.project || 'Frontend Core';
            this.prioritySelect.value = task.priority;
            this.statusSelect.value = task.status;
            this.assigneeSelect.value = task.assigneeId;
            this.dueDateInput.value = task.dueDate || '';
            this.descInput.value = task.description || '';
            this.tagsInput.value = (task.tags || []).join(', ');
            this.currentSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
        } else {
            this.titleHeader.innerHTML = `<i class="fa-solid fa-plus-circle"></i> Create New Task`;
            this.idInput.value = '';
            this.statusSelect.value = defaultStatus;
            this.assigneeSelect.value = window.authManager.getActiveUser().id;
            // Default due date: tomorrow
            const tomorrow = new Date(Date.now() + 86400000);
            this.dueDateInput.value = tomorrow.toISOString().slice(0, 16);
        }

        this.renderSubtaskEditor();
        this.overlay.classList.add('active');
        this.titleInput.focus();
    }

    hide() {
        this.overlay.classList.remove('active');
    }

    addSubtaskFromInput() {
        const title = this.newSubtaskInput.value.trim();
        if (!title) return;

        this.currentSubtasks.push({
            id: 'sub-' + Date.now(),
            title,
            completed: false
        });

        this.newSubtaskInput.value = '';
        this.renderSubtaskEditor();
    }

    removeSubtask(subId) {
        this.currentSubtasks = this.currentSubtasks.filter(s => s.id !== subId);
        this.renderSubtaskEditor();
    }

    toggleSubtaskStatus(subId) {
        const sub = this.currentSubtasks.find(s => s.id === subId);
        if (sub) {
            sub.completed = !sub.completed;
            this.renderSubtaskEditor();
        }
    }

    renderSubtaskEditor() {
        if (this.currentSubtasks.length === 0) {
            this.subtaskEditorList.innerHTML = `<li class="text-muted" style="font-size: 0.8rem; list-style:none;">No subtasks added yet.</li>`;
            return;
        }

        this.subtaskEditorList.innerHTML = this.currentSubtasks.map(s => `
            <li class="subtask-item-edit">
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                    <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="window.taskModal.toggleSubtaskStatus('${s.id}')">
                    <span style="${s.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${s.title}</span>
                </label>
                <button type="button" class="btn-icon-subtle" onclick="window.taskModal.removeSubtask('${s.id}')" title="Delete subtask">
                    <i class="fa-solid fa-trash-can" style="color:#ef4444; font-size:0.8rem;"></i>
                </button>
            </li>
        `).join('');
    }

    handleSave() {
        const taskId = this.idInput.value;
        const activeUser = window.authManager.getActiveUser();
        const selectedAssigneeId = this.assigneeSelect.value;
        const assigneeUser = window.authManager.getUsers().find(u => u.id === selectedAssigneeId);

        const tags = this.tagsInput.value
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 0);

        const formData = {
            title: this.titleInput.value.trim(),
            project: this.projectSelect.value,
            priority: this.prioritySelect.value,
            status: this.statusSelect.value,
            assigneeId: selectedAssigneeId,
            assigneeName: assigneeUser ? assigneeUser.name : activeUser.name,
            assigneeAvatar: assigneeUser ? assigneeUser.avatar : activeUser.avatar,
            dueDate: this.dueDateInput.value,
            description: this.descInput.value.trim(),
            tags: tags,
            subtasks: this.currentSubtasks
        };

        if (taskId) {
            // Check permission
            const existing = window.taskStore.getTaskById(taskId);
            if (!window.authManager.hasPermission('edit', existing)) {
                window.notifications.show('Permission denied: You cannot edit this task.', 'error');
                return;
            }

            window.taskStore.updateTask(taskId, formData, activeUser);
            window.notifications.show('Task updated successfully!', 'success');
        } else {
            if (!window.authManager.hasPermission('create')) {
                window.notifications.show('Permission denied: You cannot create tasks.', 'error');
                return;
            }

            window.taskStore.addTask(formData, activeUser);
            window.notifications.show('New task created!', 'success');
        }

        this.hide();
    }
}

window.taskModal = new TaskModalComponent();
