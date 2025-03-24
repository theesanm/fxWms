export type Permission = {
    permission_id: number;
    permission_name: string;
    description: string;
};

export type PermissionForm = Omit<Permission, 'permission_id'>;