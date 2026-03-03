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
import { teamsApi } from "../../api/teamsApi";
import { notificationService } from "../../services/notificationService";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import type { Team } from "../../types";

export const TeamList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const ability = useAbility(AbilityContext as any);
  const navigate = useNavigate();

  const fetchTeams = async () => {
    try {
      const data = await teamsApi.getAll();
      setTeams(data);
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message || "Failed to fetch teams",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleDelete = async () => {
    if (!selectedTeam) return;

    try {
      await teamsApi.delete(selectedTeam.id);
      notificationService.success("Team deleted successfully");
      setDeleteDialogOpen(false);
      fetchTeams();
    } catch (error: any) {
      notificationService.error(
        error.response?.data?.message || "Failed to delete team",
      );
    }
  };

  const openDeleteDialog = (team: Team) => {
    setSelectedTeam(team);
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
        <Typography variant="h4">Teams</Typography>
        {ability.can("create", "Team") && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/teams/new")}
          >
            Create Team
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No teams found
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.id}</TableCell>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>
                    {team.department?.name || team.departmentId || "N/A"}
                  </TableCell>
                  <TableCell align="right">
                    {ability.can("update", "Team") && (
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/teams/${team.id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {ability.can("delete", "Team") && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog(team)}
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
        <DialogTitle>Delete Team</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedTeam?.name}?
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
