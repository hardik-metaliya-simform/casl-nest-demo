import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Paper, Button, Box, Stack, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { employeesApi } from "../../api/employeesApi";
import { authService } from "../../services/authService";
import { notificationService } from "../../services/notificationService";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import type { Employee } from "../../types";

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const abilities = authService.getAbilities();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;

      try {
        const data = await employeesApi.getById(parseInt(id));
        setEmployee(data);
      } catch (error: any) {
        notificationService.error(
          error.response?.data?.message || "Failed to fetch employee",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!employee) return <Typography>Employee not found</Typography>;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Employee Details</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          {abilities?.permissions.Employee.update && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/employees/${id}/edit`)}
            >
              Edit
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/employees")}
          >
            Back
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
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
                Name
              </Typography>
              <Typography variant="body1">{employee.name || "N/A"}</Typography>
            </Box>
          </Box>

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
                Email
              </Typography>
              <Typography variant="body1">{employee.email}</Typography>
            </Box>

            {abilities?.permissions.Employee.canSeeRole && (
              <Box sx={{ flex: "1 1 45%", minWidth: "200px" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Roles
                </Typography>
                <Typography variant="body1">
                  {employee.roles?.join(", ") || "N/A"}
                </Typography>
              </Box>
            )}
          </Box>

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
                Career Start Date
              </Typography>
              <Typography variant="body1">
                {employee.careerStartDate
                  ? new Date(employee.careerStartDate).toLocaleDateString()
                  : "N/A"}
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 45%", minWidth: "200px" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Departments
              </Typography>
              {employee.departments?.length ? (
                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}
                >
                  {employee.departments.map((d) => (
                    <Chip key={d.id} label={d.name} size="small" />
                  ))}
                </Box>
              ) : (
                <Typography variant="body1">N/A</Typography>
              )}
            </Box>
          </Box>

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
    </Box>
  );
};
