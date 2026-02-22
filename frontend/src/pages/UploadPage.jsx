// frontend/src/pages/UploadPage.jsx
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stack,
  Box,
  Chip,
  LinearProgress,
  Divider,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { uploadDataset } from "../api/endpoints";

function formatNumber(x, digits = 3) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return "—";
  return Number(x).toFixed(digits);
}

function getULevel(U) {
  if (U === null || U === undefined || Number.isNaN(Number(U))) {
    return { label: "Белгісіз", severity: "default" };
  }
  if (U < 0.33) return { label: "Төмен белгісіздік", severity: "success" };
  if (U < 0.66) return { label: "Орта белгісіздік", severity: "warning" };
  return { label: "Жоғары белгісіздік", severity: "error" };
}

function getConfidenceLabel(prob) {
  if (prob === null || prob === undefined || Number.isNaN(Number(prob))) {
    return { label: "Ықтималдық жоқ", severity: "default" };
  }
  const p = Number(prob);
  if (p >= 0.8) return { label: "Сенімді", severity: "success" };
  if (p >= 0.6) return { label: "Орташа сенім", severity: "warning" };
  if (p >= 0.5) return { label: "Шекаралық", severity: "warning" };
  return { label: "Қарама-қарсы класс ықтимал", severity: "error" };
}

function methodLabel(method) {
  if (method === "DecisionTree") return "Decision Tree (Шешім ағашы)";
  if (method === "Apriori") return "Apriori (Ассоциативті ережелер)";
  if (method === "NLP") return "NLP (Мәтіннен білім алу)";
  return method || "—";
}

function predictionMeaning(datasetType, pred) {
  // Мына түсіндірме — MVP және ең жиі қолданылатын семантика.
  // Егер сіздің target семантикасы басқаша болса, осыны бір жерден config етіп өзгертуге болады.
  if (pred === null || pred === undefined) return "—";
  const p = String(pred);

  if (datasetType === "bank") {
    if (p === "1") return "1 → депозитке келісуі ықтимал (yes)";
    if (p === "0") return "0 → депозитке келіспеуі ықтимал (no)";
    return `Нәтиже: ${p} (bank)`;
  }

  if (datasetType === "credit") {
    if (p === "1") return "1 → тәуекел жоғары (дефолт ықтимал)";
    if (p === "0") return "0 → тәуекел төмен (қайтару ықтимал)";
    return `Нәтиже: ${p} (credit)`;
  }

  return `Нәтиже: ${p}`;
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const U = result?.U;
  const uLevel = useMemo(() => getULevel(Number(U)), [U]);

  const prob = result?.prediction?.probability;
  const conf = useMemo(() => getConfidenceLabel(Number(prob)), [prob]);

  const onUpload = async () => {
    setError("");
    setResult(null);

    if (!file) {
      setError("Файл таңдаңыз (CSV).");
      return;
    }

    setLoading(true);
    try {
      const res = await uploadDataset(file);
      setResult(res);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Қате");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Дерек жүктеу
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <Button variant="outlined" component="label">
              CSV файл таңдау
              <input
                type="file"
                hidden
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Button>

            <Typography variant="body2" color="text.secondary">
              Таңдалған файл: {file ? file.name : "таңдалмады"}
            </Typography>

            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={onUpload}
              disabled={loading}
            >
              {loading ? "Жүктелуде..." : "Жүктеу және талдау"}
            </Button>

            <Typography variant="caption" color="text.secondary">
              Бұл әрекет: файлды Supabase Storage-қа сақтайды, Neon DB-ге метадерек жазады, U индексін есептейді,
              әдісті автоматты таңдайды және (bank/credit болса) бірінші жолға болжам жасайды.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {result && (
        <Stack spacing={2}>
          <Alert severity="success">
            <div>
              Жүктеу сәтті аяқталды. dataset_id: <b>{result.dataset_id}</b>
            </div>
            <div>
              dataset түрі: <b>{result.dataset_type || "—"}</b>
            </div>
            <div>
              Таңдалған әдіс: <b>{methodLabel(result.method)}</b>
            </div>
          </Alert>

          {/* U index explanation */}
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">U индексі (анық еместік)</Typography>
                  <InfoOutlinedIcon fontSize="small" color="action" />
                  <Chip
                    label={uLevel.label}
                    color={
                      uLevel.severity === "success"
                        ? "success"
                        : uLevel.severity === "warning"
                        ? "warning"
                        : uLevel.severity === "error"
                        ? "error"
                        : "default"
                    }
                    variant="outlined"
                    size="small"
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  U = αH + β(1 − C). Мұнда H — деректегі әртектілік/энтропияға жақын көрсеткіш, C — толықтық (missing аз болса C жоғары).
                  U төмен болған сайын дерек құрылымы айқын; U жоғары болса белгісіздік көп және әлсіз формалданған деп саналады.
                </Typography>

                <Box>
                  <Typography variant="body2">
                    U мәні: <b>{formatNumber(U, 3)}</b>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(0, Math.min(100, Number(U || 0) * 100))}
                    sx={{ height: 10, borderRadius: 8, mt: 1 }}
                  />
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      0.00 (төмен)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      0.33
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      0.66
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      1.00 (жоғары)
                    </Typography>
                  </Stack>
                </Box>

                <Divider />

                <Typography variant="body2">
                  Әдіс таңдауы логикасы (MVP):{" "}
                  <b>
                    news → NLP; U &lt; 0.33 → DecisionTree; 0.33–1.00 → Apriori
                  </b>
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* Prediction explanation */}
          {(result.dataset_type === "bank" || result.dataset_type === "credit") && (
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6">Бірінші жол бойынша болжам</Typography>
                    <Chip
                      label={conf.label}
                      color={
                        conf.severity === "success"
                          ? "success"
                          : conf.severity === "warning"
                          ? "warning"
                          : conf.severity === "error"
                          ? "error"
                          : "default"
                      }
                      variant="outlined"
                      size="small"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    prediction — модельдің шешімі (класс). probability — “1” класына қатысты сенімділік деңгейі.
                    probability ≈ 0.5 болса — нәтиже шекаралық және қосымша тексеріс қажет болуы мүмкін.
                  </Typography>

                  <Box>
                    <Typography variant="body1">
                      prediction: <b>{String(result.prediction?.prediction ?? "—")}</b>
                    </Typography>
                    <Typography variant="body1">
                      probability:{" "}
                      <b>
                        {result.prediction?.probability === null || result.prediction?.probability === undefined
                          ? "—"
                          : `${Math.round(Number(result.prediction.probability) * 100)}%`}
                      </b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {predictionMeaning(result.dataset_type, result.prediction?.prediction)}
                    </Typography>
                  </Box>

                  <Divider />

                  <Typography variant="subtitle2">Бірінші жолдың preview-ы</Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "rgba(0,0,0,0.03)",
                      borderRadius: 2,
                      overflowX: "auto",
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: 12 }}>
                      {JSON.stringify(result.preview || {}, null, 2)}
                    </pre>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* News NLP results */}
          {result.dataset_type === "news" && (
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h6">NLP нәтижесі (алғашқы триплеттер)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Бұл MVP baseline: мәтіннен entity–verb–entity тәрізді байланыстарды қарапайым үлгі бойынша шығарамыз.
                    Кейін spaCy/Stanza арқылы сапасын арттыруға болады.
                  </Typography>

                  <Typography variant="body2">
                    Табылған триплеттер саны: <b>{result.nlp_triples?.length ?? 0}</b>
                  </Typography>

                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "rgba(0,0,0,0.03)",
                      borderRadius: 2,
                      overflowX: "auto",
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: 12 }}>
                      {JSON.stringify(result.nlp_triples || [], null, 2)}
                    </pre>
                  </Box>

                  <Divider />
                  <Typography variant="subtitle2">Бірінші жолдың preview-ы</Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "rgba(0,0,0,0.03)",
                      borderRadius: 2,
                      overflowX: "auto",
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: 12 }}>
                      {JSON.stringify(result.preview || {}, null, 2)}
                    </pre>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}
    </>
  );
}