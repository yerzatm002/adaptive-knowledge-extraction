import { useState } from "react";
import { Card, CardContent, Typography, Stack, FormControl, InputLabel, Select, MenuItem, TextField, Button, Alert } from "@mui/material";
import { predict } from "../api/endpoints";

const defaultBank = {
  age: 35, job: "admin.", marital: "married", education: "secondary",
  default: "no", balance: 1200, housing: "yes", loan: "no",
  contact: "cellular", day: 5, month: "may", duration: 180,
  campaign: 2, pdays: -1, previous: 0, poutcome: "unknown"
};

const defaultCredit = {
  // мұнда сіздің credit датасетіңізге сәйкес өрістерді қойыңыз
  // MVP: тек үлгі
  person_age: 30,
  person_income: 60000,
  person_home_ownership: "RENT",
  loan_intent: "EDUCATION",
  loan_grade: "B",
  loan_amnt: 12000,
  loan_int_rate: 10.5,
  loan_percent_income: 0.2,
  cb_person_default_on_file: "N",
  cb_person_cred_hist_length: 5
};

export default function PredictPage() {
  const [dataset, setDataset] = useState("bank");
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultBank, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onDatasetChange = (v) => {
    setDataset(v);
    setResult(null);
    setError("");
    setJsonText(JSON.stringify(v === "bank" ? defaultBank : defaultCredit, null, 2));
  };

  const onPredict = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const features = JSON.parse(jsonText);
      const res = await predict({ dataset, features });
      setResult(res);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Қате");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>Болжау</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <FormControl sx={{ maxWidth: 260 }}>
              <InputLabel>Датасет</InputLabel>
              <Select value={dataset} label="Датасет" onChange={(e) => onDatasetChange(e.target.value)}>
                <MenuItem value="bank">bank</MenuItem>
                <MenuItem value="credit">credit</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary">
              Features JSON енгізіңіз (модельдегі бағандармен сәйкес болуы керек).
            </Typography>

            <TextField
              label="features (JSON)"
              multiline
              minRows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              fullWidth
            />

            <Button variant="contained" onClick={onPredict} disabled={loading}>
              {loading ? "Есептелуде..." : "Болжау жасау"}
            </Button>

            {error && <Alert severity="error">{error}</Alert>}
            {result && (
              <Alert severity="success">
                Нәтиже: prediction=<b>{String(result.prediction)}</b>,
                probability=<b>{result.probability ?? "—"}</b>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}