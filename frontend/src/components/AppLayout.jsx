import { Outlet, NavLink } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Box, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Divider
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RuleIcon from "@mui/icons-material/Rule";
import PsychologyIcon from "@mui/icons-material/Psychology";
import BarChartIcon from "@mui/icons-material/BarChart";

const drawerWidth = 260;

const navItems = [
  { to: "/", label: "Басты бет", icon: <DashboardIcon /> },
  { to: "/upload", label: "Дерек жүктеу", icon: <CloudUploadIcon /> },
  { to: "/rules", label: "Ережелер", icon: <RuleIcon /> },
  { to: "/predict", label: "Болжау", icon: <PsychologyIcon /> },
  { to: "/metrics", label: "Метрикалар", icon: <BarChartIcon /> },
];

export default function AppLayout() {
  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Әлсіз формалданған жүйелерде білімді алу — MVP
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Навигация
          </Typography>
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              style={({ isActive }) => ({
                background: isActive ? "rgba(0,0,0,0.06)" : "transparent",
              })}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}