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
import { departmentsApi } from "../../api/departmentsApi";
import { notificationService } from "../../services/notificationService";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import type { Department } from "../../types";

export const DepartmentList: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const ability = useAbility(AbilityContext as any);
  const navigate = useNavigate();

  const fetchDepartments = async () => {
    try {
      const data = await departmentsApi.getAll();
      setDepartments(data);
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message || "Failed to fetch departments",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDelete = async () => {
    if (!selectedDepartment) return;

    try {
      await departmentsApi.delete(selectedDepartment.id);
      notificationService.success("Department deleted successfully");
      setDeleteDialogOpen(false);
      fetchDepartments();
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message || "Failed to delete department",
      );
    }
  };

  const openDeleteDialog = (department: Department) => {
    setSelectedDepartment(department);
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
        <Typography variant="h4">Departments</Typography>
        {ability.can("create", "Department") && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/departments/new")}
          >
            Create Department
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>{department.id}</TableCell>
                  <TableCell>{department.name}</TableCell>
                  <TableCell>{department.description || "N/A"}</TableCell>
                  <TableCell align="right">
                    {ability.can("update", "Department") && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigate(`/departments/${department.id}/edit`)
                        }
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {ability.can("delete", "Department") && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog(department)}
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
        <DialogTitle>Delete Department</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedDepartment?.name}?
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
