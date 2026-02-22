import { useEffect, useMemo, useState } from "react";
import {
  Typography, Card, CardContent, Stack, FormControl, InputLabel,
  Select, MenuItem, TextField, Button, Alert, Table, TableHead,
  TableRow, TableCell, TableBody, Chip
} from "@mui/material";
import { fetchRules } from "../api/endpoints";

export default function RulesPage() {
  const [dataset, setDataset] = useState("");
  const [source, setSource] = useState("");
  const [limit, setLimit] = useState(50);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetchRules({ dataset, source, limit: Number(limit) });
      setItems(res.items || []);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Қате");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // initial load

  const labelFor = useMemo(() => {
    if (source === "DecisionTree") return "Decision Tree";
    if (source === "Apriori") return "Apriori";
    if (source === "NLP") return "NLP";
    return "Барлығы";
  }, [source]);

  return (
    <>
      <Typography variant="h5" gutterBottom>Ережелер</Typography>

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

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Дереккөзі</InputLabel>
              <Select value={source} label="Дереккөзі" onChange={(e) => setSource(e.target.value)}>
                <MenuItem value="">Барлығы</MenuItem>
                <MenuItem value="DecisionTree">DecisionTree</MenuItem>
                <MenuItem value="Apriori">Apriori</MenuItem>
                <MenuItem value="NLP">NLP</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Лимит"
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              inputProps={{ min: 1, max: 500 }}
              sx={{ width: 140 }}
            />

            <Button variant="contained" onClick={load} disabled={loading}>
              {loading ? "Жүктелуде..." : "Жаңарту"}
            </Button>

            <Chip label={labelFor} variant="outlined" />
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Нәтиже: {items.length} ереже
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={90}>dataset</TableCell>
                <TableCell width={130}>source</TableCell>
                <TableCell>IF</TableCell>
                <TableCell>THEN</TableCell>
                <TableCell width={170}>метрика</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.dataset}</TableCell>
                  <TableCell>{r.source}</TableCell>
                  <TableCell style={{ whiteSpace: "pre-wrap" }}>{r.rule_if}</TableCell>
                  <TableCell style={{ whiteSpace: "pre-wrap" }}>{r.rule_then}</TableCell>
                  <TableCell>
                    {r.source === "DecisionTree" && (
                      <span>p={r.probability ?? "-"}; cov={r.coverage ?? "-"}</span>
                    )}
                    {r.source === "Apriori" && (
                      <span>sup={r.support ?? "-"}; conf={r.confidence ?? "-"}; lift={r.lift ?? "-"}</span>
                    )}
                    {r.source === "NLP" && (
                      <span>freq={r.freq ?? "-"}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Ереже табылмады
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}