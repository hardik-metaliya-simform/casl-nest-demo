import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import { employeesApi } from "../api/employeesApi";
import { authService } from "../services/authService";
import { notificationService } from "../services/notificationService";
import { LoadingSpinner } from "../components/LoadingSpinner";
import type { Employee } from "../types";

export const MyProfile: React.FC = () => {
  const user = authService.getUser();
  const abilities = authService.getAbilities();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    careerStartDate: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const data = await employeesApi.getById(user.id);
        setEmployee(data);
        setFormData({
          name: data.name || "",
          careerStartDate: data.careerStartDate
            ? data.careerStartDate.split("T")[0]
            : "",
        });
      } catch (error: any) {
        notificationService.error(
          error.response?.data?.message || "Failed to fetch profile",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSubmitting(true);

    try {
      await employeesApi.update(user.id, {
        name: formData.name || undefined,
        careerStartDate: formData.careerStartDate || undefined,
      });
      notificationService.success("Profile updated successfully");

      // Refresh employee data
      const data = await employeesApi.getById(user.id);
      setEmployee(data);
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message || "Failed to update profile",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!employee) return <Typography>Profile not found</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Paper sx={{ p: 3, mt: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profile Information
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ flex: "1 1 45%", minWidth: "200px" }}>
              <Typography variant="subtitle2" color="text.secondary">
                ID
              </Typography>
              <Typography variant="body1">{employee.id}</Typography>
            </Box>

            <Box sx={{ flex: "1 1 45%", minWidth: "200px" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{employee.email}</Typography>
            </Box>
          </Box>

          {abilities?.permissions.Employee.canSeeRole && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ flex: "1 1 45%", minWidth: "200px" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Roles
                </Typography>
                <Typography variant="body1">
                  {employee.roles?.join(", ") || "N/A"}
                </Typography>
              </Box>
            </Box>
          )}

          {abilities?.permissions.Employee.canSeeSalary && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ flex: "1 1 45%", minWidth: "200px" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Salary
                </Typography>
                <Typography variant="body1">
                  {employee.salary ? `$${employee.salary}` : "N/A"}
                </Typography>
              </Box>
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ flex: "1 1 45%", minWidth: "200px" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Department
              </Typography>
              <Typography variant="body1">
                {employee.department?.name || employee.departmentId || "N/A"}
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 45%", minWidth: "200px" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Reporting Manager
              </Typography>
              <Typography variant="body1">
                {employee.reportingManager?.name ||
                  employee.reportingManagerId ||
                  "N/A"}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Edit Profile
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You can edit your name and career start date.
        </Typography>

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
            label="Career Start Date"
            name="careerStartDate"
            type="date"
            value={formData.careerStartDate}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : "Update Profile"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
