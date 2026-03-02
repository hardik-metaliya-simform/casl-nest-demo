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
  Chip,
  OutlinedInput,
  FormHelperText,
  Checkbox,
  ListItemText,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
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

  // ✅ Use numbers everywhere
  const [formData, setFormData] = useState<{
    employeeId: number | "";
    departmentIds: number[];
  }>({
    employeeId: "",
    departmentIds: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [emps, depts] = await Promise.all([
          employeesApi.getAll(),
          departmentsApi.getAll(),
        ]);

        const teamManagers = emps.filter((emp) => emp.roles?.includes("TM"));

        setEmployees(teamManagers);
        setDepartments(depts);

        if (isEdit && id) {
          const managedDept = await managedDepartmentsApi.getById(parseInt(id));

          setFormData({
            employeeId: managedDept.employeeId,
            departmentIds: [managedDept.departmentId],
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

  const handleEmployeeChange = (e: SelectChangeEvent<number | "">) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      employeeId: value === "" ? "" : Number(value),
    }));
  };

  // ✅ Edit mode (single select)
  const handleDepartmentChange = (e: SelectChangeEvent<number>) => {
    setFormData((prev) => ({
      ...prev,
      departmentIds: [Number(e.target.value)],
    }));
  };

  // ✅ Create mode (multi select)
  const handleDepartmentsChange = (
    e: SelectChangeEvent<typeof formData.departmentIds>,
  ) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      departmentIds:
        typeof value === "string"
          ? value.split(",").map(Number)
          : value.map(Number),
    }));
  };

  const getDeptName = (deptId: number) =>
    departments.find((d) => d.id === deptId)?.name ?? deptId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || formData.departmentIds.length === 0) {
      notificationService.error(
        "Please select a team manager and at least one department",
      );
      return;
    }

    setSubmitting(true);

    try {
      if (isEdit && id) {
        await managedDepartmentsApi.update(parseInt(id), {
          employeeId: formData.employeeId,
          departmentId: formData.departmentIds[0],
        });

        notificationService.success("Assignment updated successfully");
      } else {
        await managedDepartmentsApi.create({
          employeeId: formData.employeeId,
          departmentIds: formData.departmentIds,
        });

        const count = formData.departmentIds.length;

        notificationService.success(
          `Team manager assigned to ${count} department${
            count > 1 ? "s" : ""
          } successfully`,
        );
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
          {/* Team Manager */}
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Team Manager</InputLabel>
            <Select
              value={formData.employeeId}
              onChange={handleEmployeeChange}
              label="Team Manager"
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name || emp.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {isEdit ? (
            // ✅ Edit Mode - Single Select
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="dept-label">Department</InputLabel>
              <Select
                labelId="dept-label"
                value={formData.departmentIds[0] ?? ""}
                onChange={handleDepartmentChange}
                label="Department"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            // ✅ Create Mode - Multi Select
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="depts-label">Departments</InputLabel>
              <Select
                labelId="depts-label"
                multiple
                value={formData.departmentIds}
                onChange={handleDepartmentsChange}
                input={<OutlinedInput id="depts-input" label="Departments" />}
                renderValue={(selected) => (
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                    }}
                  >
                    {selected.map((val) => (
                      <Chip key={val} label={getDeptName(val)} size="small" />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: { style: { maxHeight: 300 } },
                }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    <Checkbox
                      checked={formData.departmentIds.includes(dept.id)}
                    />
                    <ListItemText primary={dept.name} />
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Select one or more departments</FormHelperText>
            </FormControl>
          )}

          {/* Buttons */}
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
