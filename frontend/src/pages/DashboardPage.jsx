import { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, Alert, CircularProgress } from "@mui/material";
import { fetchHealth, fetchRules } from "../api/endpoints";

export default function DashboardPage() {
  const [health, setHealth] = useState(null);
  const [rulesCount, setRulesCount] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const h = await fetchHealth();
        setHealth(h);

        // MVP: жалпы ережелер санын жуықтау:
        // /rules endpoint count returns returned rows only, not total in DB.
        // Сондықтан қазір тек "соңғы N ереже" санын көрсетеміз.
        const r = await fetchRules({ limit: 200 });
        setRulesCount(r.count);
      } catch (e) {
        setError(e?.message || "Қате");
      }
    })();
  }, []);

  return (
    <>
      <Typography variant="h5" gutterBottom>Басты бет</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Backend күйі</Typography>
              {!health ? <CircularProgress size={20} /> : (
                <Typography variant="h6">{health.status === "ok" ? "Жұмыс істеп тұр" : "Белгісіз"}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Ережелер (соңғы 200)</Typography>
              {rulesCount === null ? <CircularProgress size={20} /> : (
                <Typography variant="h6">{rulesCount}</Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                MVP режимі: толық сан емес, соңғы N жазба саны көрсетіледі.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Жүйе мақсаты</Typography>
              <Typography variant="body1">
                Әлсіз формалданған деректерден білім (ережелер) алу және интерпретациялау.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}