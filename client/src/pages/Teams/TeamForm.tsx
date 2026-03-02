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
} from "@mui/material";
import { teamsApi } from "../../api/teamsApi";
import { departmentsApi } from "../../api/departmentsApi";
import { notificationService } from "../../services/notificationService";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import type { Department } from "../../types";

export const TeamForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    departmentId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const depts = await departmentsApi.getAll();
        setDepartments(depts);

        if (isEdit && id) {
          const team = await teamsApi.getById(parseInt(id));
          setFormData({
            name: team.name,
            departmentId: team.departmentId?.toString() || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        departmentId: formData.departmentId
          ? parseInt(formData.departmentId)
          : undefined,
      };

      if (isEdit && id) {
        await teamsApi.update(parseInt(id), payload);
        notificationService.success("Team updated successfully");
      } else {
        await teamsApi.create(payload);
        notificationService.success("Team created successfully");
      }
      navigate("/teams");
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} team`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? "Edit Team" : "Create Team"}
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Department</InputLabel>
            <Select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              label="Department"
            >
              <MenuItem value="">None</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
            <Button variant="outlined" onClick={() => navigate("/teams")}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
