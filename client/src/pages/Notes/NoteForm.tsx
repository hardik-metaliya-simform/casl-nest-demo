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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { notesApi } from "../../api/notesApi";
import { employeesApi } from "../../api/employeesApi";
import { authService } from "../../services/authService";
import { notificationService } from "../../services/notificationService";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import type { Employee } from "../../types";

export const NoteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const abilities = authService.getAbilities();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [formData, setFormData] = useState({
    content: "",
    employeeId: "",
    isAdminOnly: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const emps = await employeesApi.getAll();
        setEmployees(emps);

        if (isEdit && id) {
          const note = await notesApi.getById(parseInt(id));
          setFormData({
            content: note.content,
            employeeId: note.employeeId.toString(),
            isAdminOnly: note.isAdminOnly,
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, isAdminOnly: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        content: formData.content,
        employeeId: parseInt(formData.employeeId),
        isAdminOnly: formData.isAdminOnly,
      };

      if (isEdit && id) {
        await notesApi.update(parseInt(id), payload);
        notificationService.success("Note updated successfully");
      } else {
        await notesApi.create(payload);
        notificationService.success("Note created successfully");
      }
      navigate("/notes");
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} note`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? "Edit Note" : "Create Note"}
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            label="Content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Employee</InputLabel>
            <Select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              label="Employee"
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id.toString()}>
                  {emp.name || emp.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {abilities?.permissions.Note.canSeeAdminOnly && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isAdminOnly}
                  onChange={handleCheckboxChange}
                  name="isAdminOnly"
                />
              }
              label="Admin Only (only TM and CTO can see)"
            />
          )}

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
            <Button variant="outlined" onClick={() => navigate("/notes")}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
