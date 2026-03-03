import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/authApi";
import {
  AbilityContext,
  createEmptyAbility,
  createAppAbility,
  type AppAbility,
} from "../casl/ability";
import type { UserContext, LoginDto, RegisterDto, User } from "../types";

interface AuthContextType {
  user: UserContext | null;
  ability: AppAbility | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<User>;
  register: (dto: RegisterDto) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserContext | null>(null);
  const [ability, setAbility] = useState<AppAbility | null>(
    createEmptyAbility(),
  );
  const [loading, setLoading] = useState(true);

  const fetchUserAndAbility = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const [userData, packedRules] = await Promise.all([
        authApi.getMe(),
        authApi.getPackedRules(),
      ]);

      setUser(userData);
      setAbility(createAppAbility(packedRules));
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      localStorage.removeItem("accessToken");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndAbility();
  }, []);

  const login = async (dto: LoginDto): Promise<User> => {
    const response = await authApi.login(dto);
    localStorage.setItem("accessToken", response.accessToken);
    const [userData, packedRules] = await Promise.all([
      authApi.getMe(),
      authApi.getPackedRules(),
    ]);
    setUser(userData);
    setAbility(createAppAbility(packedRules));
    return response.user;
  };

  const register = async (dto: RegisterDto): Promise<User> =>
    authApi.register(dto);

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setAbility(createEmptyAbility());
    window.location.href = "/login";
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        ability,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      <AbilityContext.Provider value={ability ?? createEmptyAbility()}>
        {children}
      </AbilityContext.Provider>
    </AuthContext.Provider>
  );
};
