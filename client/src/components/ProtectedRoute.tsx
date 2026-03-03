import React from "react";
import { Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useAbility } from "@casl/react";
import {
  AbilityContext,
  type AppActions,
  type AppSubjects,
} from "../casl/ability";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** CASL subject (module) to check permissions against */
  module?: AppSubjects;
  /** All listed actions must be allowed on `module`; defaults to ["read"] when module is set */
  permissions?: AppActions[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  module,
  permissions = ["read"],
}) => {
  const { loading, isAuthenticated } = useAuth();
  const ability = useAbility(AbilityContext as any);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (module) {
    const allAllowed = permissions.every((action) =>
      ability.can(action, module),
    );
    if (!allAllowed) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
