export type Role = "CTO" | "TM" | "RM" | "Employee";

export interface User {
  id: number;
  email: string;
  name: string;
  roles: Role[];
}

export interface UserContext {
  id: number;
  roles: Role[];
  departmentIds?: number[];
  managedDepartmentIds?: number[];
}

export interface Abilities {
  roles: Role[];
  userId: number;
  departmentIds?: number[];
  managedDepartmentIds: number[];
  canManageAll: boolean;
  permissions: {
    Employee: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
      canSeeSalary: boolean;
      canSeeRole: boolean;
      canEditRole: boolean;
    };
    Department: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
    };
    Team: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
    };
    Note: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
      canSeeAdminOnly: boolean;
    };
    ManagedDepartment: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
    };
  };
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
  roles?: Role[];
  departmentIds?: number[];
  reportingManagerId?: number;
  careerStartDate?: string;
}

export interface Employee {
  id: number;
  email: string;
  name?: string;
  careerStartDate?: string;
  salary?: number;
  roles?: string[];
  departmentIds?: number[];
  reportingManagerId?: number;
  departments?: Department[];
  reportingManager?: Employee;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface Team {
  id: number;
  name: string;
  departmentId?: number;
  department?: Department;
}

export interface Note {
  id: number;
  content: string;
  isAdminOnly: boolean;
  employeeId: number;
  employee?: Employee;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedDepartment {
  id: number;
  employeeId: number;
  departmentId: number;
  employee?: Employee;
  department?: Department;
}
