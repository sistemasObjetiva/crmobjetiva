import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Grid,
  Divider,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Paper,
  TableContainer,
  Button,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SignedAvatar from "../general/SignedAvatar";
import SignedImage from "../general/SignedImage";
import { formatoMoneda } from "../../hooks/useUtilsFunctions";
import { Proyecto, Unidad } from "../../config/types";
import { supabase } from "../../config/supabase";

// 👇 Asegurate de que el nombre del archivo coincida en tu proyecto
import StackingViewerModal from "./StakingViewerModal";

interface ProyectoViewModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: Proyecto | null;
  onCotizarUnidad: (unidad: Unidad, proyecto: Proyecto) => void;
  asPage?: boolean;
}

// ================================================================
// Helpers de Estilo, Estatus y Formato
// ================================================================
function estatusChipProps(estatus?: string): {
  label: string;
  color: "success" | "info" | "warning" | "default";
} {
  const s = (estatus ?? "").trim().toLowerCase();
  if (s === "disponible") return { label: "Disponible", color: "success" };
  if (s === "apartado") return { label: "Apartado", color: "info" };
  if (s === "vendido") return { label: "Vendido", color: "warning" };
  return { label: estatus ?? "-", color: "default" };
}

function unidadChipProps(raw?: string): {
  label: "Disponible" | "Apartado" | "Vendido";
  color: "success" | "info" | "warning";
} {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "disponible") return { label: "Disponible", color: "success" };
  if (s === "apartado") return { label: "Apartado", color: "info" };
  return { label: "Vendido", color: "warning" };
}

const headerStyle = {
  fontWeight: 700,
  backgroundColor: "var(--primary-color)",
  color: "white",
  whiteSpace: "nowrap" as const,
};

// Helper para extraer numeros limpios (ej. "$ 1,500.00" -> 1500)
function limpiarPrecio(precioRaw: any): number {
  if (!precioRaw) return 0;
  if (typeof precioRaw === "number") return precioRaw;
  const cleaned = String(precioRaw).replace(/[^0-9.-]+/g, "");
  return Number(cleaned) || 0;
}

// Helper para forzar 2 decimales en areas y unidades privativas
function formatoDosDecimales(valor: any): string {
  if (valor === null || valor === undefined || valor === "" || valor === "-") return "-";
  const cleaned = String(valor).replace(/,/g, "");
  const num = Number(cleaned);

  if (isNaN(num)) return String(valor);

  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// ================================================================
// Sub-componente: Modal de Lista de Precios (Matriz de Planes)
// ================================================================
interface ListaPreciosModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: Proyecto | null;
}

const ListaPreciosModal: React.FC<ListaPreciosModalProps> = ({
  open,
  onClose,
  proyecto,
}) => {
  const [filasDb, setFilasDb] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !proyecto) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error: sbError } = await supabase
          .from("prueba1")
          .select("*")
          .eq("Proyecto", proyecto.nombre);

        if (sbError) throw sbError;
        setFilasDb(data || []);
      } catch (err: any) {
        console.error("Error al cargar prueba1, usando unidades por defecto:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open, proyecto]);

  if (!proyecto) return null;

  let planes: any[] = [];
  try {
    if (typeof proyecto.paymentPlans === "string") {
      planes = JSON.parse(proyecto.paymentPlans || "[]");
    } else if (Array.isArray(proyecto.paymentPlans)) {
      planes = proyecto.paymentPlans;
    }
  } catch (e) {
    console.error("Error parseando paymentPlans", e);
  }

  const dataFuente = filasDb.length > 0 ? filasDb : (proyecto.unidades || []);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "white",
          borderRadius: 3,
          boxShadow: 24,
          width: { xs: "95%", sm: "90%", md: "95%" },
          maxWidth: 1400,
          maxHeight: "90vh",
          outline: "none",
          p: 4,
          overflow: "auto",
        }}
      >
        <IconButton onClick={onClose} sx={{ position: "absolute", top: 12, right: 12 }}>
          <CloseIcon />
        </IconButton>

        <Typography variant="h5" sx={{ fontWeight: "bold", color: "var(--primary-color)", mb: 0.5 }}>
          Precios por Plan
        </Typography>
        <Typography variant="subtitle2" sx={{ color: "#888", mb: 3 }}>
          {proyecto.nombre}
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : dataFuente.length === 0 ? (
          <Typography sx={{ textAlign: "center", color: "#999", py: 4 }}>
            No hay unidades registradas para este proyecto.
          </Typography>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerStyle}>Unidad</TableCell>
                  <TableCell sx={headerStyle}>Nivel</TableCell>
                  <TableCell sx={headerStyle}>Unidad Priv.</TableCell>
                  <TableCell sx={headerStyle}>M2 Interiores</TableCell>
                  <TableCell sx={headerStyle}>Precio Lista Base</TableCell>

                  {planes.map((plan, idx) => (
                    <TableCell key={idx} sx={headerStyle} align="right">
                      {plan.name} <br />
                      <span style={{ fontSize: "0.75em", fontWeight: "normal", color: "#e0e0e0" }}>
                        ({plan.descuento || 0}% desc)
                      </span>
                    </TableCell>
                  ))}

                  <TableCell sx={headerStyle} align="center">Estatus</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataFuente.map((fila, idx) => {
                  const depto = fila.Depto || fila.numerounidad || "-";
                  const nivel = fila.Nivel || fila.extras?.Nivel || "-";

                  const m2InterioresRaw =
                    fila["M2 Interiores"] ??
                    fila["M2 Interior"] ??
                    fila.extras?.["M2 Interior"] ??
                    fila.extras?.["M2 Interiores"] ??
                    "-";
                  const m2Interiores = formatoDosDecimales(m2InterioresRaw);

                  const unidadPrivativaRaw =
                    fila["Unidad Privativa"] ??
                    fila.unidadprivativa ??
                    fila.extras?.["Unidad Privativa"] ??
                    "-";
                  const unidadPrivativa = formatoDosDecimales(unidadPrivativaRaw);

                  const estatusS = (fila.Estatus || fila.estatus || "").trim().toLowerCase();
                  const ocultarPrecios = estatusS === "vendido" || estatusS === "apartado";

                  const precioRaw = fila["Precio de lista"] ?? fila["Precio Lista"] ?? fila.preciolista;
                  const precioBase = limpiarPrecio(precioRaw);

                  const chip = estatusChipProps(fila.Estatus || fila.estatus);
                  const valorOculto = formatoMoneda(0);

                  return (
                    <TableRow key={idx} hover sx={{ "&:nth-of-type(odd)": { backgroundColor: "#f9f9f9" } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{depto}</TableCell>
                      <TableCell>{nivel}</TableCell>
                      <TableCell>{unidadPrivativa}</TableCell>
                      <TableCell>{m2Interiores}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {ocultarPrecios ? valorOculto : formatoMoneda(precioBase)}
                      </TableCell>

                      {planes.map((plan, pIdx) => {
                        const descuento = Number(plan.descuento || 0);
                        const factor = 1 - descuento / 100;
                        const precioFinal = precioBase * factor;

                        return (
                          <TableCell key={pIdx} align="right">
                            {ocultarPrecios ? valorOculto : formatoMoneda(precioFinal)}
                          </TableCell>
                        );
                      })}

                      <TableCell align="center">
                        <Chip size="small" label={chip.label} color={chip.color} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Modal>
  );
};

// ================================================================
// Componente Principal: ProyectoViewModal
// ================================================================
const ProyectoViewModal: React.FC<ProyectoViewModalProps> = ({
  open,
  onClose,
  proyecto,
  onCotizarUnidad,
  asPage = false,
}) => {
  const [openStacking, setOpenStacking] = useState(false);
  const [openListaPrecios, setOpenListaPrecios] = useState(false);

  if (!proyecto) return null;

  const camposBasicos = [
    { label: "Estatus", value: proyecto.estatus },
    {
      label: "Entrega",
      value: proyecto.fechaEntrega && new Date(proyecto.fechaEntrega).toLocaleDateString(),
    },
    { label: "Unidades", value: proyecto.unidades?.length ?? 0 },
  ];

  const nodesCount = ((proyecto as any).stacking?.nodes ?? []).length;

  const content = (
    <Box
      sx={{
        position: asPage ? "static" : "absolute",
        top: asPage ? undefined : "50%",
        left: asPage ? undefined : "50%",
        transform: asPage ? undefined : "translate(-50%, -50%)",
        bgcolor: "white",
        borderRadius: 3,
        boxShadow: asPage ? 2 : 24,
        width: asPage ? "100%" : { xs: "95%", sm: 900 },
        maxHeight: asPage ? "none" : "95vh",
        outline: "none",
        p: 4,
        overflow: "auto",
      }}
    >
      {!asPage && (
        <IconButton onClick={onClose} sx={{ position: "absolute", top: 12, right: 12 }}>
          <CloseIcon />
        </IconButton>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        {proyecto.logo && (
          <SignedAvatar value={proyecto.logo} alt="logo" sx={{ width: 80, height: 80, border: "2px solid #eee" }} />
        )}
        {proyecto.render && (
          <SignedImage
            path={proyecto.render.path!}
            bucket={proyecto.render.bucket!}
            alt="render"
            sx={{ width: 180, height: 110, borderRadius: 3, objectFit: "cover" }}
          />
        )}
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "var(--primary-color)" }}>
          {proyecto.nombre}
        </Typography>
        <Stack spacing={1} direction="row">
          <Button variant="contained" color="primary" onClick={() => setOpenListaPrecios(true)}>
            Ver Lista de Precios
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setOpenStacking(true)}
            disabled={!nodesCount}
          >
            Ver Stacking
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {camposBasicos.map(
          (c, i) =>
            c.value && (
              <Grid item xs={12} sm={4} key={i}>
                <Typography variant="subtitle2" sx={{ color: "var(--primary-color)", fontWeight: 600 }}>
                  {c.label}
                </Typography>
                <Typography color="#555">{c.value}</Typography>
              </Grid>
            )
        )}
      </Grid>

      {proyecto.descripcion && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--primary-color)" }}>
            Descripcion
          </Typography>
          <Typography sx={{ color: "#444", whiteSpace: "pre-line" }}>{proyecto.descripcion}</Typography>
        </Box>
      )}

      {proyecto.unidades && proyecto.unidades.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--primary-color)", mb: 2 }}>
            Unidades Disponibles
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Precio Lista</TableCell>
                  <TableCell>Estatus</TableCell>
                  <TableCell align="center">Cotizar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proyecto.unidades.slice(0, 10).map((u, i) => {
                  const chip = unidadChipProps(u.estatus);
                  const precioBase = limpiarPrecio(u.preciolista);
                  return (
                    <TableRow key={i}>
                      <TableCell>{u.numerounidad}</TableCell>
                      <TableCell>{chip.label === "Vendido" ? "-" : formatoMoneda(precioBase)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={chip.label} color={chip.color} />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="info"
                          disabled={chip.label === "Vendido"}
                          onClick={() => onCotizarUnidad(u, proyecto)}
                        >
                          {chip.label === "Vendido" ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {asPage ? (
        content
      ) : (
        <Modal open={open} onClose={onClose}>
          {content}
        </Modal>
      )}
      <StackingViewerModal open={openStacking} onClose={() => setOpenStacking(false)} proyecto={proyecto} />
      <ListaPreciosModal open={openListaPrecios} onClose={() => setOpenListaPrecios(false)} proyecto={proyecto} />
    </>
  );
};

export default ProyectoViewModal;
