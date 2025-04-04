import { Role } from '@/types/role-permission';
import { BaseService } from './base.service';

export class RoleService extends BaseService {
    private static readonly endpoint = '/roles';

    static async getRoles() {
        const response = await this.get<Role[]>(this.endpoint);
        return response.data;
    }

    static async updateRole(roleId: number, data: Partial<Role>) {
        const filter = this.buildFilter('role_id', 'eq', roleId);
        const response = await this.patch<Role>(
            `${this.endpoint}?${filter}`,
            data
        );
        return response.data;
    }

    static async createRole(data: Omit<Role, 'role_id'>) {
        const response = await this.post<Role>(this.endpoint, data);
        return response.data;
    }

    static async deleteRole(roleId: number) {
        const filter = this.buildFilter('role_id', 'eq', roleId);
        return this.delete(`${this.endpoint}?${filter}`);
    }
}
