import React from "react";
import { Typography, Paper, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Can, AbilityContext } from "../casl/ability";
import { useAbility } from "@casl/react";

export const Dashboard: React.FC = () => {
  const { user, ability } = useAuth();
  const abilityCtx = useAbility(AbilityContext as any);
  const effectiveAbility = ability ?? abilityCtx;
  const navigate = useNavigate();

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to RBAC Demo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Roles: <strong>{user?.roles?.join(", ")}</strong>
        </Typography>
        {user?.managedDepartmentIds && user.managedDepartmentIds.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Managed Departments: {user.managedDepartmentIds.join(", ")}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Links
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
          <Button variant="outlined" onClick={() => navigate("/profile")}>
            My Profile
          </Button>
          <Can I="read" a="Employee">
            <Button variant="outlined" onClick={() => navigate("/employees")}>
              Employees
            </Button>
          </Can>
          <Can I="read" a="Department">
            <Button variant="outlined" onClick={() => navigate("/departments")}>
              Departments
            </Button>
          </Can>
          <Can I="read" a="Team">
            <Button variant="outlined" onClick={() => navigate("/teams")}>
              Teams
            </Button>
          </Can>
          <Can I="read" a="Note">
            <Button variant="outlined" onClick={() => navigate("/notes")}>
              Notes
            </Button>
          </Can>
          {effectiveAbility.can("read", "ManagedDepartment") && (
            <Button
              variant="outlined"
              onClick={() => navigate("/managed-departments")}
            >
              Managed Departments
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
