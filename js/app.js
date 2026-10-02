/**
 * TaskFlow Pro - Main App Orchestrator
 */

class App {
    constructor() {
        this.currentView = 'kanban';
        this.filters = {
            search: '',
            project: 'all',
            priority: 'all'
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.setupUserUI();
        this.setupProjectNav();
        this.setupTheme();
        this.setupRealtimeSync();

        // Listen for store updates
        window.taskStore.on('stateChanged', () => {
            this.updateStats();
            this.renderActiveView();
        });

        window.taskStore.on('activityAdded', (activity) => {
            this.renderActivityList();
            this.updateActivityBadge();
        });

        // Initial Render
        this.updateStats();
        this.renderActiveView();
        this.renderActivityList();
    }

    bindEvents() {
        // Navigation View Switcher
        document.querySelectorAll('.sidebar-nav .nav-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Global Search
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.trim();
                this.renderActiveView();
            });
        }

        // Header Filters
        const projectFilter = document.getElementById('headerProjectFilter');
        if (projectFilter) {
            projectFilter.addEventListener('change', (e) => {
                this.filters.project = e.target.value;
                this.renderActiveView();
            });
        }

        const priorityFilter = document.getElementById('headerPriorityFilter');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.filters.priority = e.target.value;
                this.renderActiveView();
            });
        }

        // Create Task Button
        document.getElementById('btnCreateTask').addEventListener('click', () => {
            window.taskModal.show();
        });

        // Mobile Sidebar Toggle
        const openSidebarBtn = document.getElementById('openSidebarBtn');
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');
        const sidebar = document.getElementById('sidebar');

        if (openSidebarBtn) openSidebarBtn.addEventListener('click', () => sidebar.classList.add('open'));
        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

        // Activity Drawer Toggle
        const activityFeedBtn = document.getElementById('activityFeedBtn');
        const closeActivityDrawer = document.getElementById('closeActivityDrawer');
        const activityDrawer = document.getElementById('activityDrawer');

        if (activityFeedBtn) {
            activityFeedBtn.addEventListener('click', () => {
                activityDrawer.classList.toggle('open');
                document.getElementById('activityBadge').style.display = 'none';
            });
        }
        if (closeActivityDrawer) {
            closeActivityDrawer.addEventListener('click', () => activityDrawer.classList.remove('open'));
        }

        // Theme Toggle
        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', nextTheme);
            localStorage.setItem('taskflow_theme', nextTheme);
            
            const icon = document.getElementById('themeIcon');
            if (icon) {
                icon.className = nextTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
            }

            if (this.currentView === 'analytics') {
                window.analyticsView.render(window.taskStore.getTasks());
            }
        });

        // Reset Demo Data Button
        document.getElementById('btnResetDemoData').addEventListener('click', () => {
            if (confirm('Reset all tasks and activity logs to default demo state?')) {
                window.taskStore.resetToDefaults();
                window.notifications.show('Store reset to initial demo state.', 'info');
            }
        });

        // User Switcher Modal Trigger
        document.getElementById('userCard').addEventListener('click', () => {
            this.showAuthModal();
        });
        document.getElementById('closeAuthModalBtn').addEventListener('click', () => {
            document.getElementById('authModalOverlay').classList.remove('active');
        });

        // Global Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            // Ignore if in inputs or textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            if (e.key === '/') {
                e.preventDefault();
                document.getElementById('globalSearchInput').focus();
            } else if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                window.taskModal.show();
            }
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('taskflow_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = savedTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        }
    }

    setupUserUI() {
        const user = window.authManager.getActiveUser();
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userRole').innerHTML = `<i class="fa-solid ${user.roleIcon}"></i> ${user.role} (${user.roleBadge})`;
        document.getElementById('userAvatar').src = user.avatar;
    }

    setupProjectNav() {
        const projects = [
            { name: 'Frontend Core', color: '#6366f1' },
            { name: 'Backend API', color: '#3b82f6' },
            { name: 'UI/UX Design', color: '#ec4899' },
            { name: 'DevOps & Cloud', color: '#f59e0b' },
            { name: 'QA & Testing', color: '#10b981' }
        ];

        const selectElem = document.getElementById('headerProjectFilter');
        if (selectElem) {
            selectElem.innerHTML = `<option value="all">All Projects</option>` + projects.map(p => 
                `<option value="${p.name}">${p.name}</option>`
            ).join('');
        }

        const navContainer = document.getElementById('projectListNav');
        if (navContainer) {
            navContainer.innerHTML = projects.map(p => `
                <div class="project-nav-item" onclick="window.app.filterByProject('${p.name}')">
                    <span><span class="project-tag-dot" style="background-color: ${p.color};"></span> ${p.name}</span>
                </div>
            `).join('');
        }
    }

    filterByProject(projectName) {
        this.filters.project = projectName;
        const projectFilter = document.getElementById('headerProjectFilter');
        if (projectFilter) projectFilter.value = projectName;
        this.renderActiveView();
    }

    showAuthModal() {
        const grid = document.getElementById('userProfilesGrid');
        const users = window.authManager.getUsers();
        const activeUser = window.authManager.getActiveUser();

        grid.innerHTML = users.map(u => `
            <div class="profile-select-card ${u.id === activeUser.id ? 'active' : ''}" onclick="window.app.selectUser('${u.id}')">
                <img src="${u.avatar}" class="user-avatar" style="width:40px; height:40px;">
                <div>
                    <h4 style="font-size:0.9rem; font-weight:700;">${u.name}</h4>
                    <span style="font-size:0.75rem; color:var(--text-secondary);"><i class="fa-solid ${u.roleIcon}"></i> ${u.role}</span>
                </div>
            </div>
        `).join('');

        document.getElementById('authModalOverlay').classList.add('active');
    }

    selectUser(userId) {
        const user = window.authManager.switchUser(userId);
        if (user) {
            this.setupUserUI();
            document.getElementById('authModalOverlay').classList.remove('active');
            window.notifications.show(`Switched session to ${user.name} (${user.roleBadge})`, 'success');
        }
    }

    switchView(viewName) {
        this.currentView = viewName;

        // Update nav item active states
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            if (item.dataset.view === viewName) item.classList.add('active');
            else item.classList.remove('active');
        });

        // Update view panel active states
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        const targetPanel = document.getElementById(`${viewName}View`);
        if (targetPanel) targetPanel.classList.add('active');

        // Close mobile sidebar if open
        document.getElementById('sidebar').classList.remove('open');

        this.renderActiveView();
    }

    renderActiveView() {
        const tasks = window.taskStore.getTasks();

        if (this.currentView === 'kanban') {
            window.kanbanView.render(tasks, this.filters);
        } else if (this.currentView === 'list') {
            window.listView.render(tasks, this.filters);
        } else if (this.currentView === 'calendar') {
            window.calendarView.render(tasks, this.filters);
        } else if (this.currentView === 'analytics') {
            window.analyticsView.render(tasks);
        }
    }

    updateStats() {
        const tasks = window.taskStore.getTasks();
        const total = tasks.length;
        const inProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'in_review').length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;

        document.getElementById('statTotalTasks').textContent = total;
        document.getElementById('statInProgress').textContent = inProgress;
        document.getElementById('statCompleted').textContent = completed;
        document.getElementById('statOverdue').textContent = overdue;
    }

    setupRealtimeSync() {
        const toggle = document.getElementById('realtimeToggle');
        const pulseDot = document.getElementById('wsPulseDot');
        const wsStatusText = document.getElementById('wsStatusText');

        const updateWsUI = (enabled) => {
            if (enabled) {
                pulseDot.classList.add('active');
                wsStatusText.textContent = 'Live WebSocket Sync';
            } else {
                pulseDot.classList.remove('active');
                wsStatusText.textContent = 'Sync Paused';
            }
        };

        window.taskStore.toggleMockWebSockets(toggle.checked, (eventData) => {
            window.notifications.show(`Live Update: ${eventData.user} ${eventData.msg}`, 'realtime');
        });

        toggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            updateWsUI(enabled);
            window.taskStore.toggleMockWebSockets(enabled, (eventData) => {
                window.notifications.show(`Live Update: ${eventData.user} ${eventData.msg}`, 'realtime');
            });
            window.notifications.show(`Real-time sync ${enabled ? 'enabled' : 'disabled'}`, 'info');
        });
    }

    renderActivityList() {
        const activities = window.taskStore.getActivities();
        const container = document.getElementById('activityList');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = `<div class="text-muted" style="font-size:0.85rem; text-align:center;">No recent activity.</div>`;
            return;
        }

        container.innerHTML = activities.map(act => {
            const timeAgo = this.formatTimeAgo(act.timestamp);
            return `
                <div class="activity-item">
                    <img src="${act.avatar}" class="activity-avatar" alt="">
                    <div class="activity-content">
                        <span class="activity-user">${this.escapeHtml(act.user)}</span>
                        <span class="activity-desc"> ${this.escapeHtml(act.text)}</span>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateActivityBadge() {
        const badge = document.getElementById('activityBadge');
        if (badge) {
            badge.style.display = 'block';
            const count = parseInt(badge.textContent || '0') + 1;
            badge.textContent = count > 99 ? '99+' : count;
        }
    }

    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Just now';
        const date = new Date(timestamp);
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
