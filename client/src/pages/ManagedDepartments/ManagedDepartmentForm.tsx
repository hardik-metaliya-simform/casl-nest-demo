import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { managedDepartmentsApi } from "../../api/managedDepartmentsApi";
import { employeesApi } from "../../api/employeesApi";
import { departmentsApi } from "../../api/departmentsApi";
import { notificationService } from "../../services/notificationService";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import type { Employee, Department } from "../../types";

export const ManagedDepartmentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState({
    employeeId: "",
    departmentId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [emps, depts] = await Promise.all([
          employeesApi.getAll(),
          departmentsApi.getAll(),
        ]);

        // Filter to show only TMs
        const teamManagers = emps.filter((emp) => emp.roles?.includes("TM"));
        setEmployees(teamManagers);
        setDepartments(depts);

        if (isEdit && id) {
          const managedDept = await managedDepartmentsApi.getById(parseInt(id));
          setFormData({
            employeeId: managedDept.employeeId.toString(),
            departmentId: managedDept.departmentId.toString(),
          });
        }
      } catch (error: any) {
        notificationService.error(
          error.response?.data?.message || "Failed to fetch data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        employeeId: parseInt(formData.employeeId),
        departmentId: parseInt(formData.departmentId),
      };

      if (isEdit && id) {
        await managedDepartmentsApi.update(parseInt(id), payload);
        notificationService.success("Assignment updated successfully");
      } else {
        await managedDepartmentsApi.create(payload);
        notificationService.success("Team manager assigned successfully");
      }
      navigate("/managed-departments");
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} assignment`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? "Edit Assignment" : "Assign Team Manager"}
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Team Manager</InputLabel>
            <Select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              label="Team Manager"
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id.toString()}>
                  {emp.name || emp.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Department</InputLabel>
            <Select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              label="Department"
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update" : "Assign"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/managed-departments")}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
