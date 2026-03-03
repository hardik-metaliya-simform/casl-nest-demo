import React from "react";
import { Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useAbility } from "@casl/react";
import { AbilityContext } from "../casl/ability";

interface ProtectedRouteProps {
  children: React.ReactNode;
  require?: { action: string; subject: string };
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  require,
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

  if (require && !ability.can(require.action as any, require.subject as any)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
