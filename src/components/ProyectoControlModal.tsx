import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton,
  TextField,
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableHead,
  Paper,
  TableBody,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/UploadFile';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SaveIcon from '@mui/icons-material/Save';
import CustomButton from '../components/CustomButton';
import { Proyecto, Unidad, PaymentPlan } from '../types/types';
import { formatoMoneda } from '../hooks/useUtilsFunctions';
import { fechaActual } from "../hooks/useDateUtils";
import { actualizarProyecto, eliminarProyecto } from '../hooks/useFetchFunctions';

interface ProyectoModalProps {
  proyecto: Proyecto | null;
  open: boolean;
  onClose: () => void;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  user: { id: string; email: string };
}

const ProyectoModal: React.FC<ProyectoModalProps> = ({ proyecto, open, onClose, setProyecto, user }) => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [unidad, setUnidad] = useState<Unidad>({
    numerounidad: '',
    unidadprivativa: '',
    preciolista: '',
    extras: {},
    imagenes: [],
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, field: keyof Proyecto) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProyecto((prevProyecto) =>
          prevProyecto ? { ...prevProyecto, [field]: reader.result as string } : null
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const [extrasKeys, setExtrasKeys] = useState<string[]>([]);
  

  const handleAddUnidad = () => {
    if (!proyecto) return;
    setProyecto((prevProyecto) => {
      const unidadesActualizadas = prevProyecto!.unidades ? [...prevProyecto!.unidades] : [];
      const index = unidadesActualizadas.findIndex(u => u.numerounidad === unidad.numerounidad);
      if (index !== -1) {
        unidadesActualizadas[index] = { ...unidad };
      } else {
        unidadesActualizadas.push({ ...unidad });
      }
      return { ...prevProyecto!, unidades: unidadesActualizadas };
    });
    setUnidad({ numerounidad: '', unidadprivativa: '', preciolista: '', extras: {}, imagenes: [] });
  };

  const handleDeleteUnidad = (index: number) => {
    if (!proyecto) return;
    setProyecto((prevProyecto) => ({
      ...prevProyecto!,
      unidades: prevProyecto!.unidades.filter((_, i) => i !== index),
    }));
  };

  const handleEditUnidad = (index: number) => {
    if (!proyecto || !proyecto.unidades) {
      console.error("El proyecto no está definido o no tiene unidades.");
      return;
    }
    setUnidad({ ...proyecto.unidades[index] });
  };

  useEffect(() => {
    if (proyecto && proyecto.unidades?.length > 0) {
      const allExtraKeys = new Set<string>();
      proyecto.unidades.forEach((unidad) => {
        if (unidad.extras) {
          Object.keys(unidad.extras).forEach((key) => allExtraKeys.add(key));
        }
      });
      setExtrasKeys(Array.from(allExtraKeys));
    }
  }, [proyecto]);

  const handleAddExtraKey = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    setExtrasKeys([...extrasKeys, `extra_${extrasKeys.length}`]);
  };

  const handleChangeExtraKey = (index: number, newKey: string) => {
    setExtrasKeys((prevKeys) => {
      const updatedKeys = [...prevKeys];
      const oldKey = updatedKeys[index];
      updatedKeys[index] = newKey;
      setUnidad((prevUnidad) => {
        if (!prevUnidad) return prevUnidad;
        const updatedExtras = { ...prevUnidad.extras };
        if (oldKey in updatedExtras) {
          updatedExtras[newKey] = updatedExtras[oldKey];
          delete updatedExtras[oldKey];
        }
        return { ...prevUnidad, extras: updatedExtras };
      });
      return updatedKeys;
    });
  };

  const handleChangeExtraValue = (key: string, value: string) => {
    setUnidad((prevUnidad) => ({
      ...prevUnidad,
      extras: { ...prevUnidad.extras, [key]: value },
    }));
  };

  const handleRemoveExtraKey = (index: number) => {
    setExtrasKeys((prevKeys) => prevKeys.filter((_, i) => i !== index));
    setUnidad((prevUnidad) => {
      const updatedExtras = { ...prevUnidad.extras };
      delete updatedExtras[extrasKeys[index]];
      return { ...prevUnidad, extras: updatedExtras };
    });
  };

  const handleUnidadImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      console.error("No se pudieron leer los archivos. Revisa el evento.");
      return;
    }
    const files = Array.from(event.target.files);
    const compressImage = (base64Image: string, quality: number = 0.7): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Image;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            console.error("No se pudo obtener el contexto del canvas.");
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
      });
    };

    const imagePromises = files.map((file) => {
      return new Promise<{ name: string; data: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = async () => {
          if (typeof reader.result === "string") {
            const compressedImage = await compressImage(reader.result, 0.7);
            resolve({ name: file.name, data: compressedImage });
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((images) => {
      setUnidad((prevUnidad) => ({
        ...prevUnidad,
        imagenes: [...(prevUnidad.imagenes || []), ...images],
      }));
    });

    event.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setUnidad((prevUnidad) => {
      if (!prevUnidad || !prevUnidad.imagenes) return prevUnidad;
      return {
        ...prevUnidad,
        imagenes: prevUnidad.imagenes.filter((_, imgIndex) => imgIndex !== index),
      };
    });
  };

  // ===============================
  // Sección de Planes de Pago (adaptada para PaymentPlan con parcialidades: number[])
  // ===============================

  const handleAddPaymentPlanRow = () => {
    setProyecto((prevProyecto) => {
      if (!prevProyecto) return prevProyecto;
      const monthsCount = prevProyecto.fechaEntrega
        ? calculateMonthsDifference(fechaActual, prevProyecto.fechaEntrega)
        : 1;
      return {
        ...prevProyecto,
        paymentPlans: [
          ...(prevProyecto.paymentPlans || []),
          {
            name: "",
            months: monthsCount,
            // <<--- AÑADIR:
            mensualidades: monthsCount,
            descuento: 0,
            pInicial: 0,
            contraentrega: 0,
            parcialidades: Array.from({ length: monthsCount }, (_, index) => ({
              month: index + 1,
              value: 0,
            })),
          },
        ],
      };
    });
  };
  

  // Actualiza campos fijos del plan (name, descuento, pInicial, etc.)
  const handlePaymentPlanChange = (index: number, field: keyof PaymentPlan, value: any) => {
    setProyecto((prevProyecto) => {
      if (!prevProyecto) return prevProyecto;
      const updatedPlans = [...(prevProyecto.paymentPlans || [])];
      updatedPlans[index] = { ...updatedPlans[index], [field]: value };
      return {
        ...prevProyecto,
        paymentPlans: updatedPlans,
      };
    });
  };

  const handleParcialidadChange = (planIndex: number, monthIndex: number, newValue: number) => {
    setProyecto((prevProyecto) => {
      if (!prevProyecto) return prevProyecto;
      const updatedPlans = [...(prevProyecto.paymentPlans || [])];
      const plan = updatedPlans[planIndex];
      if (!plan) return prevProyecto;
      const newParcialidades = [...plan.parcialidades];
      newParcialidades[monthIndex] = {
        ...newParcialidades[monthIndex],
        value: newValue,
      };
      updatedPlans[planIndex] = { ...plan, parcialidades: newParcialidades };
      return {
        ...prevProyecto,
        paymentPlans: updatedPlans,
      };
    });
  };
  
  

  const handleDeletePaymentPlanRow = (index: number) => {
    setProyecto((prevProyecto) => {
      if (!prevProyecto || !prevProyecto.paymentPlans) return prevProyecto;
      return {
        ...prevProyecto,
        paymentPlans: prevProyecto.paymentPlans.filter((_, i) => i !== index),
      };
    });
  };

  const handleDeliveryDateChange = (newDate: string) => {
    if (!newDate) return;
    setProyecto((prevProyecto) => {
      if (!prevProyecto) return prevProyecto;
      const today = fechaActual;
      const monthsRemaining = calculateMonthsDifference(today, newDate);
      const updatedPlans = (prevProyecto.paymentPlans || []).map((plan) => {
        return {
          ...plan,
          months: monthsRemaining,
          // <<--- AÑADIR:
          mensualidades: monthsRemaining,
          parcialidades: Array.from({ length: monthsRemaining }, (_, index) => ({
            month: index + 1,
            value: 0,
          })),
        };
      });
      return {
        ...prevProyecto,
        fechaEntrega: newDate,
        paymentPlans: updatedPlans,
      };
    });
  };
  
  
  // Calcula la diferencia en meses entre dos fechas
  const calculateMonthsDifference = (startDate: string | Date, endDate: string | Date): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("Fechas inválidas:", { startDate, endDate });
      return 1;
    }
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(1, months);
  };

  // ===============================
  // Fin Sección de Planes de Pago
  // ===============================

  const handleActualizarProyecto = async (proyecto: Proyecto | null): Promise<void> => {
    if (!proyecto || !proyecto.nombreProyecto || !user) {
      console.error("❌ Error: El proyecto no tiene nombre o no es válido.");
      return;
    }
    try {
      console.log("📤 Actualizando proyecto en Supabase...");
      console.log(proyecto);
      await actualizarProyecto(proyecto, user.email);
      console.log("✅ Proyecto actualizado correctamente.");
      alert("Proyecto actualizado con éxito.");
    } catch (error) {
      console.error("❌ Error al actualizar el proyecto:", error);
      alert("Hubo un error al actualizar el proyecto.");
    }
  };

  const handleEliminarProyecto = async (proyecto: Proyecto | null): Promise<void> => {
    if (!proyecto || !proyecto.nombreProyecto || !user) {
      console.error("❌ Error: El proyecto no tiene nombre o no es válido.");
      return;
    }
    try {
      console.log("📤 Eliminando proyecto en Supabase...");
      console.log(proyecto);
      await eliminarProyecto(proyecto);
      console.log("✅ Proyecto eliminado correctamente.");
      alert("Proyecto eliminado con éxito.");
    } catch (error) {
      console.error("❌ Error al eliminar el proyecto:", error);
      alert("Hubo un error al eliminar el proyecto.");
    }
    onClose();
  };

  const handleSingleUnidadImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "render" | "isometrico"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUnidad((prevUnidad) => ({
          ...prevUnidad,
          [field]: {
            name: file.name,
            data: reader.result,
          },
        }));
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <Modal
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEnforceFocus
      aria-labelledby="modal-proyecto"
      aria-describedby="modal-proyecto-tabs"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          bgcolor: "white",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          outline: "none",
          maxHeight: "80%",
          overflowY: "auto",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography
          id="modal-proyecto"
          variant="h2"
          component="h2"
          sx={{
            mb: 2,
            textAlign: "center",
            color: "var(--primary-color)",
            fontWeight: "bold",
          }}
        >
          {proyecto?.nombreProyecto || "Proyecto"}
        </Typography>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Scrollable tabs for navigation"
        >
          <Tab label="Información General" />
          <Tab label="Unidades" />
          <Tab label="Planes de Pago" />
          <Tab label="P Sheets" />
        </Tabs>

        <Box sx={{ mt: 3 }}>
          {selectedTab === 0 && (
            <>
              <Typography variant="body1" sx={{ mb: 2, color: "var(--primary-color)" }}>
                Nombre del proyecto:
              </Typography>
              <input
                type="text"
                value={proyecto?.nombreProyecto || ""}
                onChange={(e) =>
                  setProyecto((prevProyecto) =>
                    prevProyecto ? { ...prevProyecto, nombreProyecto: e.target.value } : prevProyecto
                  )
                }
                placeholder="Nombre del proyecto"
                style={{ width: "100%", padding: "8px", marginBottom: "16px" }}
              />

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
                {/* Logo del Proyecto */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ color: "var(--primary-color)", mb: 1 }}>
                    Logo del proyecto:
                  </Typography>
                  {proyecto?.logo ? (
                    <Box sx={{ position: "relative", width: "fit-content" }}>
                      <img
                        src={proyecto.logo}
                        alt="Logo del Proyecto"
                        style={{ maxWidth: "200px", borderRadius: "8px" }}
                      />
                      <IconButton
                        onClick={() =>
                          setProyecto((prevProyecto) =>
                            prevProyecto ? { ...prevProyecto, logo: "" } : prevProyecto
                          )
                        }
                        sx={{ position: "absolute", top: 0, right: 0, background: "white" }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <CustomButton
                      text="Subir Logo"
                      icon={<UploadIcon />}
                      inputType="file"
                      accept="image/*"
                      onInputChange={(e) => handleImageUpload(e, "logo")}
                    />
                  )}
                </Box>

                {/* Fachada del Proyecto */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ color: "var(--primary-color)", mb: 1 }}>
                    Fachada del proyecto:
                  </Typography>
                  {proyecto?.fachada ? (
                    <Box sx={{ position: "relative", width: "fit-content" }}>
                      <img
                        src={proyecto.fachada}
                        alt="Fachada del Proyecto"
                        style={{ maxWidth: "200px", borderRadius: "8px" }}
                      />
                      <IconButton
                        onClick={() =>
                          setProyecto((prevProyecto) =>
                            prevProyecto ? { ...prevProyecto, fachada: "" } : prevProyecto
                          )
                        }
                        sx={{ position: "absolute", top: 0, right: 0, background: "white" }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <CustomButton
                      text="Subir Fachada"
                      icon={<UploadIcon />}
                      inputType="file"
                      accept="image/*"
                      onInputChange={(e) => handleImageUpload(e, "fachada")}
                    />
                  )}
                </Box>
              </Box>

              <Typography variant="body1" sx={{ mb: 2, color: "var(--primary-color)" }}>
                Amenidades:
              </Typography>
              {proyecto?.amenidades && proyecto.amenidades.length > 0 ? (
                proyecto.amenidades.map((amenidad, index) => (
                  <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <TextField
                      fullWidth
                      value={amenidad}
                      onChange={(e) => {
                        setProyecto((prevProyecto) => {
                          if (!prevProyecto) return prevProyecto;
                          const updatedAmenidades = [...prevProyecto.amenidades];
                          updatedAmenidades[index] = e.target.value;
                          return { ...prevProyecto, amenidades: updatedAmenidades };
                        });
                      }}
                      placeholder="Nueva amenidad"
                    />
                    <IconButton
                      onClick={() => {
                        setProyecto((prevProyecto) => {
                          if (!prevProyecto) return prevProyecto;
                          return {
                            ...prevProyecto,
                            amenidades: prevProyecto.amenidades.filter((_, i) => i !== index),
                          };
                        });
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: "gray", mb: 2 }}>
                  No hay amenidades agregadas.
                </Typography>
              )}

              <CustomButton
                text="Agregar Amenidad"
                icon={<AddCircleIcon />}
                sx={{ mt: 1 }}
                onClick={() => {
                  setProyecto((prevProyecto) => {
                    if (!prevProyecto) return prevProyecto;
                    return {
                      ...prevProyecto,
                      amenidades: [...(prevProyecto.amenidades || []), ""],
                    };
                  });
                }}
              />
            </>
          )}

          {selectedTab === 1 && (
            <>
              <Typography variant="body1" sx={{ mb: 2, color: "var(--primary-color)" }}>
                Agregar Unidades
              </Typography>
              <TextField
                fullWidth
                label="Número de Unidad"
                value={unidad.numerounidad}
                onChange={(e) => setUnidad({ ...unidad, numerounidad: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Unidad Privativa"
                value={unidad.unidadprivativa}
                onChange={(e) => setUnidad({ ...unidad, unidadprivativa: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Precio Lista"
                value={unidad.preciolista || ""}
                onChange={(e) =>
                  setUnidad({ ...unidad, preciolista: e.target.value.replace(/[^0-9.]/g, "") })
                }
                onBlur={(e) => setUnidad({ ...unidad, preciolista: formatoMoneda(e.target.value) })}
                sx={{ mb: 2 }}
              />

              <CustomButton
                text="Agregar Variable"
                icon={<AddCircleIcon />}
                sx={{ mt: 1, mb: 2 }}
                onClick={handleAddExtraKey}
              />
              {extrasKeys.map((key, index) => (
                <Box key={index} sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Nombre de la Variable"
                    value={key}
                    onChange={(e) => handleChangeExtraKey(index, e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Valor"
                    value={unidad.extras[key] || ""}
                    onChange={(e) => handleChangeExtraValue(key, e.target.value)}
                  />
                  <IconButton onClick={() => handleRemoveExtraKey(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
                Render de la unidad:
              </Typography>
              {unidad.render ? (
                <Box sx={{ position: "relative", width: "fit-content", mb: 2 }}>
                  <img
                    src={unidad.render.data}
                    alt="Render"
                    style={{ maxWidth: "150px", borderRadius: "8px" }}
                  />
                  <IconButton
                    onClick={() => setUnidad((prev) => ({ ...prev, render: undefined }))}
                    sx={{ position: "absolute", top: 0, right: 0, background: "white" }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              ) : (
                <CustomButton
                  text="Subir Render"
                  icon={<UploadIcon />}
                  inputType="file"
                  accept="image/*"
                  onInputChange={(e) => handleSingleUnidadImageUpload(e, "render")}
                />
              )}

              <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
                Isométrico de la unidad:
              </Typography>
              {unidad.isometrico ? (
                <Box sx={{ position: "relative", width: "fit-content", mb: 2 }}>
                  <img
                    src={unidad.isometrico.data}
                    alt="Isométrico"
                    style={{ maxWidth: "150px", borderRadius: "8px" }}
                  />
                  <IconButton
                    onClick={() => setUnidad((prev) => ({ ...prev, isometrico: undefined }))}
                    sx={{ position: "absolute", top: 0, right: 0, background: "white" }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              ) : (
                <CustomButton
                  text="Subir Isométrico"
                  icon={<UploadIcon />}
                  inputType="file"
                  accept="image/*"
                  onInputChange={(e) => handleSingleUnidadImageUpload(e, "isometrico")}
                />
              )}

              <Typography variant="body1" sx={{ mb: 2 }}>
                Subir imágenes de la unidad:
              </Typography>

              <CustomButton
                text="Seleccionar Imágenes"
                icon={<UploadIcon />}
                inputType="file"
                multiple
                accept="image/*"
                onInputChange={(e) => handleUnidadImageUpload(e)}
              />

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                {unidad.imagenes?.map((img, index) => (
                  <Box key={index} sx={{ textAlign: "center", position: "relative" }}>
                    <img
                      src={img.data}
                      alt={img.name}
                      style={{ maxWidth: "100px", borderRadius: "8px" }}
                    />
                    <Typography variant="caption">{img.name}</Typography>
                    <IconButton
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "rgba(255, 255, 255, 0.7)",
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              <CustomButton text="Agregar Unidad" onClick={() => handleAddUnidad()} />
              <Typography variant="h6" sx={{ mt: 4 }}>
                Unidades Agregadas
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Número Unidad</TableCell>
                      <TableCell>Unidad Privativa</TableCell>
                      <TableCell>Precio Lista</TableCell>
                      {extrasKeys.map((key) => (
                        <TableCell key={key}>{key}</TableCell>
                      ))}
                      <TableCell>Render</TableCell>
                      <TableCell>Isométrico</TableCell>
                      <TableCell>Imágenes</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proyecto &&
                      proyecto.unidades?.map((unidad, index) => (
                        <TableRow key={`unidad_${index}`}>
                          <TableCell>{unidad.numerounidad}</TableCell>
                          <TableCell>{unidad.unidadprivativa}</TableCell>
                          <TableCell>{formatoMoneda(unidad.preciolista)}</TableCell>
                          {extrasKeys.map((key, subIndex) => (
                            <TableCell key={`cell_${index}_${subIndex}`}>
                              {unidad.extras?.[key] || ""}
                            </TableCell>
                          ))}
                          <TableCell>
                            {unidad.render && (
                              <img
                                src={unidad.render.data}
                                alt={unidad.render.name}
                                style={{ maxWidth: "50px", borderRadius: "4px" }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {unidad.isometrico && (
                              <img
                                src={unidad.isometrico.data}
                                alt={unidad.isometrico.name}
                                style={{ maxWidth: "50px", borderRadius: "4px" }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {unidad.imagenes.map((img, imgIndex) => (
                                <img
                                  key={`unidad_${index}_img_${imgIndex}`}
                                  src={typeof img === "string" ? img : img.data}
                                  alt={`Unidad ${index} Img ${imgIndex}`}
                                  style={{ maxWidth: "50px", borderRadius: "4px" }}
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <IconButton onClick={() => handleEditUnidad(index)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteUnidad(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
{selectedTab === 2 && (
  <>
    <Typography variant="h6" gutterBottom>
      Fecha de Entrega
    </Typography>
    <TextField
      type="date"
      value={proyecto?.fechaEntrega ?? ""}
      onChange={(e) => handleDeliveryDateChange(e.target.value)}
      fullWidth
      sx={{ mb: 2 }}
    />

    <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
      <CustomButton
        onClick={handleAddPaymentPlanRow}
        text="Agregar Plan de Pago"
        icon={<span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>+</span>}
      />
    </Box>

    {proyecto &&
      proyecto.paymentPlans &&
      proyecto.paymentPlans.length > 0 && (
        (() => {
          const maxInstallments = Math.max(
            ...proyecto.paymentPlans.map(
              (plan) =>
                (plan.mensualidades && plan.mensualidades > 0
                  ? plan.mensualidades
                  : plan.parcialidades.length)
            )
          );

          return (
            <Box sx={{ overflowX: "auto" }}>
              <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      {/* Columnas fijas */}
                      <TableCell rowSpan={2}>Nombre del Plan</TableCell>
                      <TableCell rowSpan={2}>% Descuento</TableCell>
                      <TableCell rowSpan={2}>Enganche</TableCell>
                      {/* Generamos dinámicamente los encabezados para cada pago mensual */}
                      {Array.from({ length: maxInstallments }).map((_, index) => (
                        <TableCell key={`month-header-${index}`} align="center">
                          Mes {index + 2}
                        </TableCell>
                      ))}
                      <TableCell rowSpan={2}>Liquidación / Contraentrega</TableCell>
                      {/* Agregamos una nueva columna de Acciones */}
                      <TableCell rowSpan={2}>Acciones</TableCell>
                    </TableRow>
                    <TableRow>
                      {Array.from({ length: maxInstallments }).map((_, index) => (
                        <TableCell key={`sub-header-${index}`} align="center">
                          % P
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proyecto.paymentPlans.map((plan, planIndex) => {
                      const installmentsCount =
                        plan.mensualidades && plan.mensualidades > 0
                          ? plan.mensualidades
                          : plan.parcialidades.length;
                      return (
                        <TableRow key={planIndex}>
                          {/* Columnas fijas */}
                          <TableCell>
                            <TextField
                              value={plan.name}
                              onChange={(e) =>
                                handlePaymentPlanChange(planIndex, "name", e.target.value)
                              }
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={plan.descuento}
                              onChange={(e) =>
                                handlePaymentPlanChange(
                                  planIndex,
                                  "descuento",
                                  parseFloat(e.target.value)
                                )
                              }
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={plan.pInicial}
                              onChange={(e) =>
                                handlePaymentPlanChange(
                                  planIndex,
                                  "pInicial",
                                  parseFloat(e.target.value)
                                )
                              }
                              fullWidth
                            />
                          </TableCell>
                          {/* Columnas dinámicas para cada pago mensual */}
                          {Array.from({ length: maxInstallments }).map((_, monthIndex) => {
                            if (monthIndex < installmentsCount) {
                              const parcialidad =
                                plan.parcialidades[monthIndex] || { month: monthIndex + 1, value: 0 };
                              return (
                                <TableCell key={`plan_${planIndex}_month_${monthIndex}`}>
                                  <TextField
                                    type="number"
                                    value={parcialidad.value}
                                    onChange={(e) =>
                                      handleParcialidadChange(
                                        planIndex,
                                        monthIndex,
                                        parseFloat(e.target.value)
                                      )
                                    }
                                    fullWidth
                                  />
                                </TableCell>
                              );
                            } else {
                              return <TableCell key={`plan_${planIndex}_empty_${monthIndex}`} />;
                            }
                          })}
                          <TableCell>
                            <TextField
                              type="number"
                              value={plan.contraentrega}
                              onChange={(e) =>
                                handlePaymentPlanChange(
                                  planIndex,
                                  "contraentrega",
                                  parseFloat(e.target.value)
                                )
                              }
                              fullWidth
                            />
                          </TableCell>
                          {/* Columna de Acciones: Botón para borrar el plan */}
                          <TableCell>
                            <IconButton onClick={() => handleDeletePaymentPlanRow(planIndex)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })()
      )}
  </>
)}

        </Box>
        <Box
          sx={{
            overflowX: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 2,
          }}
        >
          <CustomButton
            text="Actualizar Proyecto"
            icon={<SaveIcon />}
            sx={{ mt: 1 }}
            onClick={() => handleActualizarProyecto(proyecto)}
          />
        </Box>
        <Box
          sx={{
            overflowX: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 2,
          }}
        >
          <CustomButton
            text="Eliminar Proyecto"
            icon={<DeleteIcon />}
            sx={{ mt: 1 }}
            onClick={() => handleEliminarProyecto(proyecto)}
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default ProyectoModal;
