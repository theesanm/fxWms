export type Role = {
    role_id: number;
    role_name: string;
    description: string;
};

export type RoleForm = Omit<Role, 'role_id'>;