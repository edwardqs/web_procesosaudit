export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  roleId: number;
  roleName?: string;
  name?: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  roleId?: number;
}