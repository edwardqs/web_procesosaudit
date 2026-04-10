import { create } from "zustand";

interface User {
  id: number;
  email: string;
  roleId: number;
  roleName?: string;
  name?: string;
  createdAt?: string;
  sede?: { id: number; name: string };
  unidadNegocio?: { id: number; name: string };
  cargo?: { id: number; name: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,

  login: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isAdmin: user.roleId === 1 });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
  },

  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, isAdmin: user.roleId === 1 });
  },
}));

const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("token");

if (storedUser && storedToken) {
  const user = JSON.parse(storedUser);
  useAuthStore.setState({
    user,
    token: storedToken,
    isAuthenticated: true,
    isAdmin: user.roleId === 1,
  });
}