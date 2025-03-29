import { Permission } from '@/types/role-permission';

export class PermissionService extends BaseService {
    private static readonly endpoint = '/permissions';

    static async getPermissions() {
        const response = await this.get<Permission[]>(this.endpoint);
        return response.data;
    }

    static async updatePermission(permissionId: number, data: Partial<Permission>) {
        const filter = this.buildFilter('permission_id', 'eq', permissionId);
        const response = await this.patch<Permission>(
            `${this.endpoint}?${filter}`,
            data
        );
        return response.data;
    }

    static async createPermission(data: Omit<Permission, 'permission_id'>) {
        const response = await this.post<Permission>(this.endpoint, data);
        return response.data;
    }

    static async deletePermission(permissionId: number) {
        const filter = this.buildFilter('permission_id', 'eq', permissionId);
        return this.delete(`${this.endpoint}?${filter}`);
    }

    static async getRolePermissions(roleId: number) {
        const filter = this.buildFilter('role_id', 'eq', roleId);
        const response = await this.get<Permission[]>(`/role_permissions?${filter}`);
        return response.data;
    }

    static async assignPermissionToRole(roleId: number, permissionId: number) {
        return this.post('/role_permissions', { role_id: roleId, permission_id: permissionId });
    }

    static async removePermissionFromRole(roleId: number, permissionId: number) {
        const filters = [
            this.buildFilter('role_id', 'eq', roleId),
            this.buildFilter('permission_id', 'eq', permissionId)
        ].join('&');
        return this.delete(`/role_permissions?${filters}`);
    }
}