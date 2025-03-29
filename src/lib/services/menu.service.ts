import { BaseService } from './base.service';

export interface MenuItem {
    menu_id: number;
    menu_name: string;
    menu_url: string;
    parent_menu_id: number | null;
    order_index: number;
}

export class MenuService extends BaseService {
    private static readonly endpoint = '/menus';

    static async getMenuTree() {
        const response = await this.get<MenuItem[]>('/rpc/menu_tree');
        return response.data;
    }

    static async updateMenuItem(menuId: number, data: Partial<MenuItem>) {
        const response = await this.patch<MenuItem>(
            `${this.endpoint}?menu_id=eq.${menuId}`,
            data
        );
        return response.data;
    }

    static async createMenuItem(data: Omit<MenuItem, 'menu_id'>) {
        const response = await this.post<MenuItem>(this.endpoint, data);
        return response.data;
    }

    static async deleteMenuItem(menuId: number) {
        return this.delete(`${this.endpoint}?menu_id=eq.${menuId}`);
    }
}