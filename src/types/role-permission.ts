export type RolePermission = {
    role_id: number;
    permission_id: number;
};

export type Role = {
    role_id: number;
    role_name: string;
    description: string;
};

export type Permission = {
    permission_id: number;
    permission_name: string;
    description: string;
};