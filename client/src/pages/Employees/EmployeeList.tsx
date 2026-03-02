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
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import { employeesApi } from "../../api/employeesApi";
import { authService } from "../../services/authService";
import { notificationService } from "../../services/notificationService";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import type { Employee } from "../../types";

export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const abilities = authService.getAbilities();
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      const data = await employeesApi.getAll();
      setEmployees(data);
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message || "Failed to fetch employees",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async () => {
    if (!selectedEmployee) return;

    try {
      await employeesApi.delete(selectedEmployee.id);
      notificationService.success("Employee deleted successfully");
      setDeleteDialogOpen(false);
      fetchEmployees();
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message || "Failed to delete employee",
      );
    }
  };

  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
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
        <Typography variant="h4">Employees</Typography>
        {abilities?.permissions.Employee.create && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/employees/new")}
          >
            Create Employee
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              {abilities?.permissions.Employee.canSeeRole && (
                <TableCell>Roles</TableCell>
              )}
              {abilities?.permissions.Employee.canSeeSalary && (
                <TableCell>Salary</TableCell>
              )}
              <TableCell>Department</TableCell>
              <TableCell>Career Start</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.id}</TableCell>
                  <TableCell>{employee.name || "N/A"}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  {abilities?.permissions.Employee.canSeeRole && (
                    <TableCell>{employee.roles?.join(", ") || "N/A"}</TableCell>
                  )}
                  {abilities?.permissions.Employee.canSeeSalary && (
                    <TableCell>
                      {employee.salary ? `$${employee.salary}` : "N/A"}
                    </TableCell>
                  )}
                  <TableCell>
                    {employee.departments?.length
                      ? employee.departments.map((d) => d.name).join(", ")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {employee.careerStartDate
                      ? new Date(employee.careerStartDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/employees/${employee.id}`)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {abilities?.permissions.Employee.update && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigate(`/employees/${employee.id}/edit`)
                        }
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {abilities?.permissions.Employee.delete && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog(employee)}
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
        <DialogTitle>Delete Employee</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            {selectedEmployee?.name || "this employee"}?
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
