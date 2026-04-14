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
  sede?: { id: number; name: string };
  unidadNegocio?: { id: number; name: string };
  cargo?: { id: number; name: string };
}

export interface UserCreate {
  email: string;
  password: string;
  name?: string;
  roleId?: number;
  sedeId?: number | null;
  unidadId?: number | null;
  cargoId?: number | null;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  name?: string;
  roleId?: number;
  sedeId?: number | null;
  unidadId?: number | null;
  cargoId?: number | null;
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

export interface Program {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
    questions: number;
  };
}

export interface UserProgram {
  id: number;
  userId: number;
  programId: number;
  assignedAt: string;
  user: User;
  program: Program;
}

export interface QuestionProgram {
  id: number;
  questionId: number;
  programId: number;
  assignedAt: string;
  question: {
    id: number;
    text: string;
    order: number;
  };
  program: Program;
}