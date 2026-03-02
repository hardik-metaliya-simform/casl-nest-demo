import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
} from "@mui/material";
import { employeesApi } from "../../api/employeesApi";
import { departmentsApi } from "../../api/departmentsApi";
import { authService } from "../../services/authService";
import { notificationService } from "../../services/notificationService";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import type { Employee, Department } from "../../types";

const ALL_ROLES = ["Employee", "RM", "TM", "CTO"];

export const EmployeeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const abilities = authService.getAbilities();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    careerStartDate: "",
    salary: "",
    roles: ["Employee"] as string[],
    departmentIds: [] as number[],
    reportingManagerId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depts, emps] = await Promise.all([
          departmentsApi.getAll(),
          employeesApi.getAll(),
        ]);
        setDepartments(depts);
        setManagers(emps);

        if (isEdit && id) {
          const employee = await employeesApi.getById(parseInt(id));
          setFormData({
            name: employee.name || "",
            email: employee.email,
            password: "",
            careerStartDate: employee.careerStartDate
              ? employee.careerStartDate.split("T")[0]
              : "",
            salary: employee.salary?.toString() || "",
            roles: employee.roles?.length ? employee.roles : ["Employee"],
            departmentIds:
              employee.departmentIds ??
              employee.departments?.map((d) => d.id) ??
              [],
            reportingManagerId: employee.reportingManagerId?.toString() || "",
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRolesChange = (e: any) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      roles: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handleDepartmentsChange = (e: any) => {
    const value = e.target.value as number[];
    setFormData((prev) => ({ ...prev, departmentIds: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEdit && id) {
        const payload: Partial<Employee> & { roles?: string[] } = {
          name: formData.name || undefined,
          email: formData.email,
          careerStartDate: formData.careerStartDate || undefined,
          salary:
            formData.salary !== "" ? parseFloat(formData.salary) : undefined,
          roles: abilities?.permissions.Employee.canEditRole
            ? formData.roles
            : undefined,
          departmentIds: formData.departmentIds.length
            ? formData.departmentIds
            : undefined,
          reportingManagerId: formData.reportingManagerId
            ? parseInt(formData.reportingManagerId)
            : undefined,
        };
        await employeesApi.update(parseInt(id), payload);
        notificationService.success("Employee updated successfully");
      } else {
        const payload: Partial<Employee> & {
          password: string;
          roles?: string[];
        } = {
          name: formData.name || undefined,
          email: formData.email,
          password: formData.password,
          careerStartDate: formData.careerStartDate || undefined,
          salary:
            formData.salary !== "" ? parseFloat(formData.salary) : undefined,
          roles: formData.roles,
          departmentIds: formData.departmentIds.length
            ? formData.departmentIds
            : undefined,
          reportingManagerId: formData.reportingManagerId
            ? parseInt(formData.reportingManagerId)
            : undefined,
        };
        await employeesApi.create(payload);
        notificationService.success("Employee created successfully");
      }
      navigate("/employees");
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} employee`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? "Edit Employee" : "Create Employee"}
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
          />

          {!isEdit && (
            <TextField
              fullWidth
              required
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
            />
          )}

          <TextField
            fullWidth
            label="Career Start Date"
            name="careerStartDate"
            type="date"
            value={formData.careerStartDate}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          {abilities?.permissions.Employee.canSeeSalary && (
            <TextField
              fullWidth
              label="Salary"
              name="salary"
              type="number"
              value={formData.salary}
              onChange={handleChange}
              margin="normal"
            />
          )}

          {abilities?.permissions.Employee.canEditRole && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Roles</InputLabel>
              <Select
                multiple
                value={formData.roles}
                onChange={handleRolesChange}
                input={<OutlinedInput label="Roles" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {ALL_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>Departments</InputLabel>
            <Select
              multiple
              value={formData.departmentIds}
              onChange={handleDepartmentsChange}
              input={<OutlinedInput label="Departments" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {(selected as number[]).map((id) => {
                    const dept = departments.find((d) => d.id === id);
                    return (
                      <Chip key={id} label={dept?.name ?? id} size="small" />
                    );
                  })}
                </Box>
              )}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Reporting Manager</InputLabel>
            <Select
              name="reportingManagerId"
              value={formData.reportingManagerId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  reportingManagerId: e.target.value as string,
                }))
              }
              label="Reporting Manager"
            >
              <MenuItem value="">None</MenuItem>
              {managers.map((manager) => (
                <MenuItem key={manager.id} value={manager.id.toString()}>
                  {manager.name || manager.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
            <Button variant="outlined" onClick={() => navigate("/employees")}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
