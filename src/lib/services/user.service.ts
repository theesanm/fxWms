import { BaseService } from './base.service';
import { User } from '@/types';

export class UserService extends BaseService {
    private static readonly endpoint = '/users';

    static async getUsers() {
        const response = await this.get<User[]>(this.endpoint);
        return response.data;
    }

    static async updateUser(userId: number, data: Partial<User>) {
        const response = await this.patch<User>(
            `${this.endpoint}?user_id=eq.${userId}`,
            {
                ...data,
                updated_at: new Date().toISOString()
            }
        );
        return response.data;
    }

    static async createUser(data: Omit<User, 'user_id'>) {
        const response = await this.post<User>(this.endpoint, data);
        return response.data;
    }

    static async deleteUser(userId: number) {
        return this.delete(`${this.endpoint}?user_id=eq.${userId}`);
    }
}

