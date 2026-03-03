import {
  createAppAbility,
  createEmptyAbility,
  type AppAbility,
} from "../casl/ability";
import axiosInstance from "../api/axiosInstance";
import type { LoginDto, RegisterDto, User, UserContext } from "../types";
import type { PackRule } from "@casl/ability/extra";

class AuthService {
  private static instance: AuthService;
  private currentUser: UserContext | null = null;
  private currentAbility: AppAbility = createEmptyAbility();

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(dto: LoginDto): Promise<User> {
    const response = await axiosInstance.post("/auth/login", dto);
    localStorage.setItem("accessToken", response.data.accessToken);
    await this.loadUserData();
    return response.data.user;
  }

  async register(dto: RegisterDto): Promise<User> {
    const response = await axiosInstance.post("/auth/register", dto);
    return response.data;
  }

  async loadUserData(): Promise<void> {
    try {
      const [userResponse, rulesResponse] = await Promise.all([
        axiosInstance.get("/auth/me"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        axiosInstance.get("/auth/packed-rules") as Promise<{
          data: PackRule<any>[];
        }>,
      ]);

      this.currentUser = userResponse.data;
      this.currentAbility = createAppAbility(rulesResponse.data);
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem("accessToken");
    this.currentUser = null;
    this.currentAbility = createEmptyAbility();
    window.location.href = "/login";
  }

  getUser(): UserContext | null {
    return this.currentUser;
  }

  getAbility(): AppAbility {
    return this.currentAbility;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("accessToken") && !!this.currentUser;
  }

  async initialize(): Promise<void> {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        await this.loadUserData();
      } catch (error) {
        console.error("Failed to load user data:", error);
        this.logout();
      }
    }
  }
}

export const authService = AuthService.getInstance();
