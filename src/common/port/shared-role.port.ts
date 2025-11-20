export interface ISharedRoleRepository {
  getClientRoleId(): Promise<number>;
  getAdminRoleId(): Promise<number>;
}
