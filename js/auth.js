/**
 * TaskFlow Pro - Authentication & RBAC System
 */

class AuthManager {
    constructor() {
        this.USERS = [
            {
                id: 'user-1',
                name: 'Alex Morgan',
                role: 'Administrator',
                roleBadge: 'Admin',
                roleIcon: 'fa-shield-halved',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
                permissions: ['create', 'edit', 'delete', 'manage_users', 'export', 'change_status']
            },
            {
                id: 'user-2',
                name: 'Sarah Chen',
                role: 'Engineering Lead',
                roleBadge: 'Manager',
                roleIcon: 'fa-user-tie',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                permissions: ['create', 'edit', 'change_status', 'export']
            },
            {
                id: 'user-3',
                name: 'Marcus Vance',
                role: 'UI/UX Designer',
                roleBadge: 'Team Member',
                roleIcon: 'fa-paint-brush',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
                permissions: ['create', 'edit_own', 'change_status']
            },
            {
                id: 'user-4',
                name: 'Elena Rostova',
                role: 'DevOps Specialist',
                roleBadge: 'Team Member',
                roleIcon: 'fa-server',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
                permissions: ['create', 'edit_own', 'change_status']
            }
        ];

        this.STORAGE_KEY = 'taskflow_pro_active_user';
        this.activeUser = null;
        this.init();
    }

    init() {
        const savedId = localStorage.getItem(this.STORAGE_KEY);
        if (savedId) {
            this.activeUser = this.USERS.find(u => u.id === savedId) || this.USERS[0];
        } else {
            this.activeUser = this.USERS[0];
        }
    }

    getActiveUser() {
        return this.activeUser;
    }

    getUsers() {
        return [...this.USERS];
    }

    switchUser(userId) {
        const targetUser = this.USERS.find(u => u.id === userId);
        if (targetUser) {
            this.activeUser = targetUser;
            localStorage.setItem(this.STORAGE_KEY, targetUser.id);
            window.taskStore.logActivity(targetUser.name, targetUser.avatar, `switched active session to ${targetUser.name} (${targetUser.role})`);
            return targetUser;
        }
        return null;
    }

    hasPermission(permission, targetTask = null) {
        if (!this.activeUser) return false;
        
        // Admin has all permissions
        if (this.activeUser.roleBadge === 'Admin') return true;

        if (permission === 'delete') {
            return this.activeUser.permissions.includes('delete');
        }

        if (permission === 'edit' && targetTask) {
            if (this.activeUser.permissions.includes('edit')) return true;
            if (this.activeUser.permissions.includes('edit_own')) {
                return targetTask.assigneeId === this.activeUser.id;
            }
        }

        return this.activeUser.permissions.includes(permission);
    }
}

window.authManager = new AuthManager();
