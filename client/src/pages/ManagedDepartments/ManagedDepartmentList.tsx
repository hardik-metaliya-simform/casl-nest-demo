import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useAbility } from "@casl/react";
import { AbilityContext } from "../../casl/ability";
import { managedDepartmentsApi } from "../../api/managedDepartmentsApi";
import { notificationService } from "../../services/notificationService";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import type { ManagedDepartment } from "../../types";

export const ManagedDepartmentList: React.FC = () => {
  const [managedDepartments, setManagedDepartments] = useState<
    ManagedDepartment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ManagedDepartment | null>(
    null,
  );
  const ability = useAbility(AbilityContext as any);
  const navigate = useNavigate();

  const fetchManagedDepartments = async () => {
    try {
      const data = await managedDepartmentsApi.getAll();
      setManagedDepartments(data);
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message || "Failed to fetch managed departments",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagedDepartments();
  }, []);

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await managedDepartmentsApi.delete(selectedItem.id);
      notificationService.success("Managed department deleted successfully");
      setDeleteDialogOpen(false);
      fetchManagedDepartments();
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message || "Failed to delete managed department",
      );
    }
  };

  const openDeleteDialog = (item: ManagedDepartment) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  if (loading) return <LoadingSpinner />;

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
        <Typography variant="h4">Managed Departments</Typography>
        {ability.can("manage", "Department") && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/managed-departments/new")}
          >
            Assign Team Manager
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Team Manager</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {managedDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No managed departments found
                </TableCell>
              </TableRow>
            ) : (
              managedDepartments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    {item.employee?.name || item.employeeId}
                  </TableCell>
                  <TableCell>
                    {item.department?.name || item.departmentId}
                  </TableCell>
                  <TableCell align="right">
                    {ability.can("manage", "Department") && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigate(`/managed-departments/${item.id}/edit`)
                        }
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {ability.can("manage", "Department") && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog(item)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove Assignment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this team manager assignment?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
