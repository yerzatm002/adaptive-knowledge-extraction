import { useEffect, useState } from "react";
import {
  Typography, Card, CardContent, Stack, FormControl, InputLabel,
  Select, MenuItem, TextField, Button, Alert, Table, TableHead,
  TableRow, TableCell, TableBody
} from "@mui/material";
import { fetchMetrics } from "../api/endpoints";

export default function MetricsPage() {
  const [dataset, setDataset] = useState("");
  const [limit, setLimit] = useState(20);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetchMetrics({ dataset: dataset || null, limit: Number(limit) });
      setItems(res.items || []);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Қате");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <Typography variant="h5" gutterBottom>Метрикалар</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Датасет</InputLabel>
              <Select value={dataset} label="Датасет" onChange={(e) => setDataset(e.target.value)}>
                <MenuItem value="">Барлығы</MenuItem>
                <MenuItem value="bank">bank</MenuItem>
                <MenuItem value="credit">credit</MenuItem>
                <MenuItem value="news">news</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Лимит"
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              inputProps={{ min: 1, max: 200 }}
              sx={{ width: 140 }}
            />

            <Button variant="contained" onClick={load} disabled={loading}>
              {loading ? "Жүктелуде..." : "Жаңарту"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Нәтиже: {items.length} жазба
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>dataset</TableCell>
                <TableCell>model</TableCell>
                <TableCell>accuracy</TableCell>
                <TableCell>precision</TableCell>
                <TableCell>recall</TableCell>
                <TableCell>f1</TableCell>
                <TableCell>roc_auc</TableCell>
                <TableCell>time_sec</TableCell>
                <TableCell>created_at</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.dataset ?? "-"}</TableCell>
                  <TableCell>{m.model ?? "-"}</TableCell>
                  <TableCell>{m.accuracy ?? "-"}</TableCell>
                  <TableCell>{m.precision ?? "-"}</TableCell>
                  <TableCell>{m.recall ?? "-"}</TableCell>
                  <TableCell>{m.f1 ?? "-"}</TableCell>
                  <TableCell>{m.roc_auc ?? "-"}</TableCell>
                  <TableCell>{m.time_sec ?? "-"}</TableCell>
                  <TableCell>{m.created_at ?? "-"}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">Метрика табылмады</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}