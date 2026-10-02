/**
 * TaskFlow Pro - Store & Real-Time Sync Engine
 */

class TaskStore {
    constructor() {
        this.STORAGE_KEY = 'taskflow_pro_tasks_v2';
        this.ACTIVITIES_KEY = 'taskflow_pro_activities_v2';
        this.USER_KEY = 'taskflow_pro_active_user_v2';

        this.listeners = {};
        this.broadcastChannel = null;
        this.mockWsTimer = null;
        this.isRealtimeEnabled = true;

        // Initialize channel if supported
        if ('BroadcastChannel' in window) {
            this.broadcastChannel = new BroadcastChannel('taskflow_realtime_sync');
            this.broadcastChannel.onmessage = (event) => {
                const { type, payload, sender } = event.data;
                console.log('[Realtime Received]', type, payload);
                if (type === 'STATE_UPDATED') {
                    this.loadFromStorage();
                    this.emit('stateChanged', { external: true, action: payload.action });
                }
            };
        }

        // Initialize state
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            this.seedInitialData();
        } else {
            this.loadFromStorage();
        }

        if (!localStorage.getItem(this.ACTIVITIES_KEY)) {
            this.activities = [
                { id: 'act-1', user: 'Alex Morgan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', text: 'created task "Implement OAuth2 flow"', timestamp: new Date(Date.now() - 3600000).toISOString() },
                { id: 'act-2', user: 'Sarah Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', text: 'moved "Dashboard Analytics Widgets" to In Review', timestamp: new Date(Date.now() - 1800000).toISOString() },
                { id: 'act-3', user: 'Marcus Vance', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', text: 'completed subtask in "Design System Token Palette"', timestamp: new Date(Date.now() - 900000).toISOString() }
            ];
            this.saveActivities();
        } else {
            this.activities = JSON.parse(localStorage.getItem(this.ACTIVITIES_KEY)) || [];
        }
    }

    seedInitialData() {
        const defaultTasks = [
            {
                id: 'task-101',
                title: 'Design System & Component Token Palette',
                description: 'Refactor all CSS custom properties for vibrant dark mode, glassmorphic modals, and consistent border radiuses.',
                project: 'UI/UX Design',
                priority: 'urgent',
                status: 'in_progress',
                assigneeId: 'user-3',
                assigneeName: 'Marcus Vance',
                assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
                dueDate: '2026-10-05T18:00',
                tags: ['design', 'css', 'tokens'],
                subtasks: [
                    { id: 'sub-1', title: 'Define HSL color tokens', completed: true },
                    { id: 'sub-2', title: 'Create interactive component documentation', completed: true },
                    { id: 'sub-3', title: 'Audit typography hierarchy', completed: false }
                ],
                createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'task-102',
                title: 'Implement OAuth2 & JWT Auth Microservice',
                description: 'Setup token generation, refresh token cookies, and RBAC middleware routes with rate limiting.',
                project: 'Backend API',
                priority: 'high',
                status: 'todo',
                assigneeId: 'user-1',
                assigneeName: 'Alex Morgan',
                assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
                dueDate: '2026-10-10T12:00',
                tags: ['security', 'auth', 'jwt'],
                subtasks: [
                    { id: 'sub-4', title: 'Setup JWT payload schemas', completed: true },
                    { id: 'sub-5', title: 'Implement refresh token rotation', completed: false },
                    { id: 'sub-6', title: 'Write unit tests for auth middleware', completed: false }
                ],
                createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'task-103',
                title: 'Real-time WebSocket & BroadcastChannel Engine',
                description: 'Ensure cross-tab active state sync and live push notification stream across connected sessions.',
                project: 'Frontend Core',
                priority: 'urgent',
                status: 'in_review',
                assigneeId: 'user-2',
                assigneeName: 'Sarah Chen',
                assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                dueDate: '2026-10-03T17:00',
                tags: ['websocket', 'realtime', 'sync'],
                subtasks: [
                    { id: 'sub-7', title: 'BroadcastChannel event handler', completed: true },
                    { id: 'sub-8', title: 'Simulated WebSocket events generator', completed: true }
                ],
                createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'task-104',
                title: 'CI/CD Pipeline Optimization with Docker',
                description: 'Reduce build times by caching node_modules layer and multi-stage container compilation.',
                project: 'DevOps & Cloud',
                priority: 'medium',
                status: 'completed',
                assigneeId: 'user-4',
                assigneeName: 'Elena Rostova',
                assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
                dueDate: '2026-10-01T15:00',
                tags: ['docker', 'ci-cd', 'devops'],
                subtasks: [
                    { id: 'sub-9', title: 'Configure GitHub Actions cache step', completed: true },
                    { id: 'sub-10', title: 'Verify automated staging deployments', completed: true }
                ],
                createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'task-105',
                title: 'Automated E2E Playwright Test Suite',
                description: 'Write comprehensive integration tests covering task creation, drag-and-drop column transitions, and user switching.',
                project: 'QA & Testing',
                priority: 'low',
                status: 'backlog',
                assigneeId: 'user-2',
                assigneeName: 'Sarah Chen',
                assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                dueDate: '2026-10-15T18:00',
                tags: ['e2e', 'testing', 'playwright'],
                subtasks: [
                    { id: 'sub-11', title: 'Setup spec files & baseline assertions', completed: false }
                ],
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        this.tasks = defaultTasks;
        this.saveToStorage();
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            this.tasks = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to parse tasks from localStorage', e);
            this.tasks = [];
        }
    }

    saveToStorage() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
    }

    saveActivities() {
        localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(this.activities.slice(0, 50)));
    }

    getTasks() {
        return [...this.tasks];
    }

    getTaskById(id) {
        return this.tasks.find(t => t.id === id);
    }

    addTask(taskData, activeUser) {
        const newTask = {
            id: 'task-' + Date.now(),
            title: taskData.title,
            description: taskData.description || '',
            project: taskData.project || 'Frontend Core',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'todo',
            assigneeId: taskData.assigneeId || activeUser.id,
            assigneeName: taskData.assigneeName || activeUser.name,
            assigneeAvatar: taskData.assigneeAvatar || activeUser.avatar,
            dueDate: taskData.dueDate || '',
            tags: taskData.tags || [],
            subtasks: taskData.subtasks || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.unshift(newTask);
        this.saveToStorage();

        this.logActivity(activeUser.name, activeUser.avatar, `created task "${newTask.title}"`);
        this.notifyRealtime('TASK_CREATED', { task: newTask });
        return newTask;
    }

    updateTask(id, updates, activeUser) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index === -1) return null;

        const oldTask = this.tasks[index];
        const updatedTask = {
            ...oldTask,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.tasks[index] = updatedTask;
        this.saveToStorage();

        let activityText = `updated task "${updatedTask.title}"`;
        if (oldTask.status !== updatedTask.status) {
            activityText = `moved "${updatedTask.title}" to ${updatedTask.status.replace('_', ' ').toUpperCase()}`;
        }

        this.logActivity(activeUser ? activeUser.name : 'System', activeUser ? activeUser.avatar : '', activityText);
        this.notifyRealtime('TASK_UPDATED', { id, updates });
        return updatedTask;
    }

    deleteTask(id, activeUser) {
        const task = this.getTaskById(id);
        if (!task) return false;

        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToStorage();

        this.logActivity(activeUser ? activeUser.name : 'System', activeUser ? activeUser.avatar : '', `deleted task "${task.title}"`);
        this.notifyRealtime('TASK_DELETED', { id });
        return true;
    }

    logActivity(user, avatar, text) {
        const activity = {
            id: 'act-' + Date.now(),
            user,
            avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`,
            text,
            timestamp: new Date().toISOString()
        };
        this.activities.unshift(activity);
        this.saveActivities();
        this.emit('activityAdded', activity);
    }

    getActivities() {
        return [...this.activities];
    }

    resetToDefaults() {
        this.seedInitialData();
        this.activities = [];
        this.logActivity('System', 'https://api.dicebear.com/7.x/avataaars/svg?seed=System', 'reset store to default initial tasks');
        this.notifyRealtime('RESET_DEFAULTS', {});
    }

    notifyRealtime(action, payload) {
        this.emit('stateChanged', { external: false, action, payload });
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                type: 'STATE_UPDATED',
                payload: { action, payload },
                sender: 'tab-' + window.name
            });
        }
    }

    toggleMockWebSockets(enable, onWsEvent) {
        this.isRealtimeEnabled = enable;
        if (!enable) {
            if (this.mockWsTimer) clearInterval(this.mockWsTimer);
            return;
        }

        const events = [
            { user: 'Sarah Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', msg: 'completed subtask in "Real-time WebSocket Engine"' },
            { user: 'Elena Rostova', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', msg: 'started code review on "CI/CD Pipeline Optimization"' },
            { user: 'Marcus Vance', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', msg: 'added new tag #sprint-2 to task #101' },
            { user: 'Alex Morgan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', msg: 'escalated task "OAuth2 Auth" priority to High' }
        ];

        let index = 0;
        this.mockWsTimer = setInterval(() => {
            if (!this.isRealtimeEnabled) return;
            const evt = events[index % events.length];
            index++;
            this.logActivity(evt.user, evt.avatar, evt.msg);
            if (onWsEvent) onWsEvent(evt);
        }, 22000);
    }

    // Simple Event Emitter
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}

window.taskStore = new TaskStore();
