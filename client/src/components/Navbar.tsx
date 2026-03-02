import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Button,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { authService } from "../services/authService";

export const Navbar: React.FC = () => {
  const abilities = authService.getAbilities();
  const user = authService.getUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    authService.logout();
    navigate("/login");
  };

  const handleMyProfile = () => {
    handleCloseUserMenu();
    navigate("/profile");
  };

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const navItems = [
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
      label: "Managed Departments",
      path: "/managed-departments",
      visible: abilities?.permissions.ManagedDepartment.read || false,
    },
  ].filter((item) => item.visible);

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const drawer = (
    <Box onClick={toggleDrawer(false)} sx={{ width: 250 }}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar disableGutters sx={{ px: 2 }}>
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: isMobile ? 1 : 0, mr: 4, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            RBAC Demo
          </Typography>

          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: "flex" }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    my: 2,
                    color: "white",
                    display: "block",
                    borderBottom: location.pathname.startsWith(item.path)
                      ? "2px solid white"
                      : "none",
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: isMobile ? 0 : 1 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {user?.roles?.join(", ")}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenUserMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={handleMyProfile}>
                <Typography textAlign="center">My Profile</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Typography textAlign="center">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawer}
      </Drawer>
    </>
  );
};
