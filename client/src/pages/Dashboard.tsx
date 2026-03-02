import React from "react";
import { Typography, Paper, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export const Dashboard: React.FC = () => {
  const user = authService.getUser();
  const abilities = authService.getAbilities();
  const navigate = useNavigate();

  const quickLinks = [
    {
      label: "Employees",
      path: "/employees",
      visible: abilities?.permissions.Employee.read || false,
    },
    {
      label: "Departments",
      path: "/departments",
      visible: abilities?.permissions.Department.read || false,
    },
    {
      label: "Teams",
      path: "/teams",
      visible: abilities?.permissions.Team.read || false,
    },
    {
      label: "Notes",
      path: "/notes",
      visible: abilities?.permissions.Note.read || false,
    },
    {
      label: "My Profile",
      path: "/profile",
      visible: true,
    },
  ].filter((link) => link.visible);

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to RBAC Demo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Roles: <strong>{user?.roles?.join(", ")}</strong>
        </Typography>
        {abilities?.managedDepartmentIds &&
          abilities.managedDepartmentIds.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Managed Departments: {abilities.managedDepartmentIds.join(", ")}
            </Typography>
          )}
      </Paper>
    </Box>
  );
};
