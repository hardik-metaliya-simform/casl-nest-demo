import axiosInstance from "./axiosInstance";
import type { ManagedDepartment } from "../types";

export interface CreateManagedDepartmentPayload {
  employeeId: number;
  departmentIds: number[];
}

export const managedDepartmentsApi = {
  async getAll(): Promise<ManagedDepartment[]> {
    const response = await axiosInstance.get("/managed-departments");
    return response.data;
  },

  async getById(id: number): Promise<ManagedDepartment> {
    const response = await axiosInstance.get(`/managed-departments/${id}`);
    return response.data;
  },

  async create(
    data: CreateManagedDepartmentPayload,
  ): Promise<ManagedDepartment[]> {
    const response = await axiosInstance.post("/managed-departments", data);
    return response.data;
  },

  async update(
    id: number,
    data: Partial<ManagedDepartment>,
  ): Promise<ManagedDepartment> {
    const response = await axiosInstance.patch(
      `/managed-departments/${id}`,
      data,
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/managed-departments/${id}`);
  },
};
