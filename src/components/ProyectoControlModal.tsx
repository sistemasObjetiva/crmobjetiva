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
  InputAdornment,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  onProyectoGuardado: (message: string, severity: "success" | "error" | "warning" | "info") => void;
  
}

const ProyectoModal: React.FC<ProyectoModalProps> = ({ proyecto, open, onClose, setProyecto, user,onProyectoGuardado }) => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [unidad, setUnidad] = useState<Unidad>({
    numerounidad: '',
    unidadprivativa: '',
    preciolista: '',
    extras: {},
    imagenes: [],
  });
  //----------**ALERTAS**-------------------------------------------------------------
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState<boolean>(false);
  const [proyectoToDelete, setProyectoToDelete] = useState<Proyecto | null>(null);
  useEffect(() => {
    if (open) {
      setWarningMessage(null); // limpia el mensaje al abrir el modal
      setErrorMessage(null);
    }
  }, [open]);
  //----------------**TERMINAN ALERTAS**------------------------------------------------
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
    setExtrasKeys([...extrasKeys, `columna_${extrasKeys.length}`]);
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

  const [nuevoPlanNombre, setNuevoPlanNombre] = useState(''); // Estado para almacenar el valor del TextField

const handleNuevoPlanNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setNuevoPlanNombre(e.target.value);
};

const handleAddPaymentPlanRow = (planNombre: string) => {
  console.log("entre a handleAddPaymentPlanRow con nombre:", planNombre);
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
          name: planNombre, // Usamos el valor pasado a la función
          months: monthsCount,
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
  setNuevoPlanNombre(''); // Limpia el TextField después de agregar el plan
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
    console.log("new date",newDate)
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
    console.log(Math.max(1,months));
    return Math.max(1, months);
  };

  // ===============================
  // Fin Sección de Planes de Pago
  // ===============================

  const handleActualizarProyecto = async (proyecto: Proyecto | null,  onClose: () => void, 
  onProyectoGuardado: (message: string, severity: "success" | "error" | "warning" | "info") => void 
): Promise<void> => {
    if (!proyecto || !proyecto.nombreProyecto || !proyecto.fechaEntrega || !user) {
      setWarningMessage("Por favor, completa el nombre del proyecto y la fecha de entrega.");
      return;
    }
    setWarningMessage(null); 
    setErrorMessage(null);   
    try {
      const result = await actualizarProyecto(proyecto, user.email);
      if (result?.success) {
        onClose();
        onProyectoGuardado(result.message, "success"); // Llamamos con el mensaje y la severidad
        setErrorMessage(null);
      } else if (result?.message) {
        setErrorMessage(result.message);
        onProyectoGuardado(result.message, "error"); // También podrías mostrar un error aquí si lo deseas
      } else {
        setErrorMessage("Error: Respuesta inesperada del servidor.");
        onProyectoGuardado("Error: Respuesta inesperada del servidor.", "error");
      }
    } catch (error: any) {
      console.error("❌ Error al actualizar el proyecto:", error);
      setErrorMessage(`Error inesperado al actualizar el proyecto: ${error.message}`);
      onProyectoGuardado(`Error inesperado al actualizar el proyecto: ${error.message}`, "error");
    }
  };

  const handleEliminarProyecto = async (
    proyecto: Proyecto | null,
    onClose: () => void,
    onProyectoGuardado: (message: string, severity: "success" | "error" | "warning" | "info") => void
  ): Promise<void> => {
    if (!proyecto || !proyecto.nombreProyecto || !user) {
      setWarningMessage("Por favor completa el nombre de proyecto");
      return;
    }
    setWarningMessage(null);
    setErrorMessage(null);
    try {
      const result = await eliminarProyecto(proyecto);
      if (result?.success) {
        onClose();
        onProyectoGuardado(result.message, "success");
      } else if (result?.message) {
        setErrorMessage(result.message);
        onProyectoGuardado(result.message, "error");
      } else {
        setErrorMessage("Error al eliminar el proyecto.");
        onProyectoGuardado("Error al eliminar el proyecto.", "error");
      }
    } catch (error: any) {
      console.error("❌ Error al eliminar el proyecto:", error);
      setErrorMessage(`Error al eliminar el proyecto: ${error.message}`);
      onProyectoGuardado(`Error al eliminar el proyecto: ${error.message}`, "error");
    } finally {
      onClose(); // Asegúrate de cerrar el modal incluso si hay un error
    }
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
          variant="h4"
          component="h4"
          sx={{
            mb: 2,
            textAlign: "center",
            color: "var(--primary-color)",
            fontWeight: "bold",
          }}
        >
          {proyecto?.nombreProyecto || "Proyecto"}
        </Typography>
        {/* Alerta si hay error */}
        {warningMessage && (
          <Alert severity="warning" onClose={() => setWarningMessage(null)} sx={{ mb: 2 }}>
            {warningMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}   
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Scrollable tabs for navigation"
        >
          <Tab label="Información general" sx={{ textTransform: 'none','&:focus': { outline: 'none' } }}/>
          <Tab label="Unidades" sx={{ textTransform: 'none','&:focus': { outline: 'none' } }}/>
          <Tab label="Planes de pago" sx={{ textTransform: 'none' ,'&:focus': { outline: 'none' }}}/>
          <Tab label="P Sheets" sx={{ textTransform: 'none','&:focus': { outline: 'none' } }}/>
        </Tabs>

        <Box sx={{ mt: 3 }}>
          {selectedTab === 0 && (
            <>
              <Typography variant="body1">
                Nombre del proyecto:
              </Typography>
              <TextField
                type="text"
                value={proyecto?.nombreProyecto || ""}
                required
                onChange={(e) =>
                  setProyecto((prevProyecto) =>
                    prevProyecto ? { ...prevProyecto, nombreProyecto: e.target.value } : prevProyecto
                  )
                }
                placeholder="Nombre del proyecto"
                style={{ width: "100%", padding: "2px", marginBottom: "16px" }}
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
                      text="Subir logo"
                      icon={<UploadIcon />}
                      inputType="file"
                      accept="image/*"
                      onInputChange={(e) => handleImageUpload(e, "logo")}
                      sx={{ minWidth: '150px',padding: '5px 16px',textTransform: 'none',
                        '&:focus': { // Estilos para cuando el botón tiene el foco
                          outline: 'none', // Opcional: quitar el outline predeterminado
                        } }} />
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
                      text="Subir fachada"
                      icon={<UploadIcon />}
                      inputType="file"
                      accept="image/*"
                      onInputChange={(e) => handleImageUpload(e, "fachada")}
                      sx={{ minWidth: '150px',
                        padding: '5px 16px',textTransform: 'none','&:focus': { // Estilos para cuando el botón tiene el foco
                          outline: 'none', 
                        } }} 
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
                    color="error"
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
                text="Amenidades"
                icon={<AddCircleIcon />}
                sx={{ mt: 1, minWidth: '150px',
                  padding: '5px 16px',textTransform: 'none','&:focus': { // Estilos para cuando el botón tiene el foco
                          outline: 'none', 
                        } }}
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
              <Typography variant="body1" sx={{ mb: 1, color: "var(--primary-color)" }}>
                Agregar unidades
              </Typography>
              <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2, // Añade un espacio de 2 unidades del tema entre los elementos
                    }}
                >
              <TextField
                label="Número de unidad"
                value={unidad.numerounidad}
                onChange={(e) => setUnidad({ ...unidad, numerounidad: e.target.value })}
                sx={{width: '250px'}}
              />
              
              <TextField
                label="Unidad privativa"
                value={unidad.unidadprivativa}
                onChange={(e) => setUnidad({ ...unidad, unidadprivativa: e.target.value })}
                sx={{width: '250px'}}
              />
              
              <TextField
                label="Precio lista"
                value={unidad.preciolista || ""}
                onChange={(e) =>
                  setUnidad({ ...unidad, preciolista: e.target.value.replace(/[^0-9.]/g, "") })
                }
                onBlur={(e) => setUnidad({ ...unidad, preciolista: formatoMoneda(e.target.value) })}
                sx={{width: '250px'}}
              />
              <CustomButton text="Agrega unidad" 
                onClick={() => handleAddUnidad()} 
                icon={<AddCircleIcon />}
                sx={{ minWidth: '100px', maxHeight: '30px',
                  textTransform: 'none' ,
                   '&:focus': { // Estilos para cuando el botón tiene el foco
                          outline: 'none', // Opcional: quitar el outline predeterminado
                        }}} />
              </Box>
              <CustomButton
                text="Variables"
                icon={<AddCircleIcon />}
                sx={{minWidth: '150px',
                  padding: '5px 16px', textTransform: 'none','&:focus': { // Estilos para cuando el botón tiene el foco
                          outline: 'none', // Opcional: quitar el outline predeterminado
                        } }}
                onClick={handleAddExtraKey} 
              />
              {extrasKeys.map((key, index) => (
                <Box key={index} sx={{ display: "flex", gap: 2, mt: 2, mb: 1 }}>
                  <TextField
                    label="Nombre de la Variable"
                    value={key}
                    onChange={(e) => handleChangeExtraKey(index, e.target.value)}
                    sx={{ mb: 2,width: '250px'}}
                  />
                  <TextField
                    label="Valor"
                    value={unidad.extras[key] || ""}
                    onChange={(e) => handleChangeExtraValue(key, e.target.value)}
                    sx={{ mb: 2,width: '250px'}}
                  />
                  <IconButton color="error" onClick={() => handleRemoveExtraKey(index)} >
                    <CloseIcon />
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
                  text="Renders"
                  icon={<UploadIcon />}
                  inputType="file"
                  accept="image/*"
                  onInputChange={(e) => handleSingleUnidadImageUpload(e, "render")}
                  sx={{ minWidth: '150px',
                    padding: '5px 16px',textTransform: 'none' , '&:focus': { // Estilos para cuando el botón tiene el foco
                          outline: 'none', // Opcional: quitar el outline predeterminado
                        }}} />
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
                  text="Isométricos"
                  icon={<UploadIcon />}
                  inputType="file"
                  accept="image/*"
                  onInputChange={(e) => handleSingleUnidadImageUpload(e, "isometrico")}
                  sx={{ minWidth: '150px',
                    padding: '5px 16px',textTransform: 'none', '&:focus': { // Estilos para cuando el botón tiene el foco
                          outline: 'none', // Opcional: quitar el outline predeterminado
                        }}} />
              )}

              <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
                Subir imágenes de la unidad:
              </Typography>

              <CustomButton
                text="Imágenes"
                icon={<UploadIcon />}
                inputType="file"
                multiple
                accept="image/*"
                onInputChange={(e) => handleUnidadImageUpload(e)}
                sx={{minWidth: '150px',
                  padding: '5px 16px', textTransform: 'none','&:focus': { // Estilos para cuando el botón tiene el foco
                          outline: 'none', // Opcional: quitar el outline predeterminado
                        } }} />

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

              
              <Typography variant="h6" sx={{ mt: 2 }}>
                Unidades agregadas
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', fontSize: '14px', color: 'white', backgroundColor: '#002855' } }}>
                      <TableCell>Número unidad</TableCell>
                      <TableCell>Unidad privativa</TableCell>
                      <TableCell>Precio lista</TableCell>
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
                            <IconButton  color="inherit"  onClick={() => handleEditUnidad(index)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDeleteUnidad(index)}>
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
  <Typography variant="body1" gutterBottom>
      Fecha de entrega:
    </Typography>
  <Box sx={{mb: 2,display: 'flex',alignItems: 'center', gap: 2,}}>
    <TextField
      type="date"
      required
      value={proyecto?.fechaEntrega ?? ""}
      onChange={(e) => handleDeliveryDateChange(e.target.value)}
      sx={{minWidth: '150px'}}
    />
    <TextField
      label="Nombre de plan de pago (opcional)"
      value={nuevoPlanNombre}
      onChange={handleNuevoPlanNombreChange}
      sx={{width: '250px'}}
    />
    <CustomButton
      onClick={() => handleAddPaymentPlanRow(nuevoPlanNombre)}
      text="Nuevo plan de pago"
      icon={<AddCircleIcon />}
      sx={{minWidth: '150px',
        padding: '5px 16px', textTransform: 'none',
        '&:focus': { // Estilos para cuando el botón tiene el foco
            outline: 'none', // Opcional: quitar el outline predeterminado
          } }} />
    </Box>
    
    {proyecto &&
    proyecto.paymentPlans &&
    proyecto.paymentPlans.length > 0 &&
    proyecto.fechaEntrega && ( // Solo renderiza si proyecto.fechaEntrega tiene un valor
      (() => {
        const maxInstallments = Math.max(
          ...(proyecto.paymentPlans || []).map(
            (plan) =>
              (plan.mensualidades && plan.mensualidades > 0
                ? plan.mensualidades
                : plan.parcialidades.length)
          )
        );
          return (
            <Box sx={{ overflowX: "auto" }}>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', fontSize: '14px', color: 'white', backgroundColor: '#002855' } }}>
                      <TableCell>Plan de pago</TableCell>
                      {proyecto.paymentPlans.map((plan) => (
                        <TableCell key={plan.name} align="center">{plan.name}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Acciones</TableCell>
                      {proyecto.paymentPlans.map((plan, planIndex) => (
                        <TableCell key={`plan-acciones-${planIndex}`} align="center">
                          <IconButton color="error" onClick={() => handleDeletePaymentPlanRow(planIndex)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>% Descuento</TableCell>
                      {proyecto.paymentPlans.map((plan, planIndex) => (
                        <TableCell key={`plan-descuento-${planIndex}`} align="center">
                          <TextField
                            type="number"
                            value={plan.descuento}
                            onChange={(e) => handlePaymentPlanChange(planIndex, "descuento", parseFloat(e.target.value))}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Enganche</TableCell>
                      {proyecto.paymentPlans.map((plan, planIndex) => (
                        <TableCell key={`plan-enganche-${planIndex}`} align="center">
                          <TextField
                            type="number"
                            value={plan.pInicial}
                            onChange={(e) => handlePaymentPlanChange(planIndex, "pInicial", parseFloat(e.target.value))}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                    {/* Filas para las mensualidades */}
                    {Array.from({ length: maxInstallments }).map((_, monthIndex) => (
                      <TableRow key={`month-${monthIndex + 2}`}>
                        <TableCell>Mes {monthIndex + 2} (% P)</TableCell>
                        {proyecto.paymentPlans.map((plan, planIndex) => (
                          <TableCell key={`plan-${planIndex}-month-${monthIndex}`} align="center">
                            <TextField
                              type="number"
                              value={plan.parcialidades[monthIndex]?.value || 0}
                              onChange={(e) => handleParcialidadChange(planIndex, monthIndex, parseFloat(e.target.value))}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>Liquidación / Contraentrega</TableCell>
                      {proyecto.paymentPlans.map((plan, planIndex) => (
                        <TableCell key={`plan-contraentrega-${planIndex}`} align="center">
                          <TextField
                            type="number"
                            value={plan.contraentrega}
                            onChange={(e) => handlePaymentPlanChange(planIndex, "contraentrega", parseFloat(e.target.value))}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                    
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
            display: "flex", // Habilita el diseño en fila para los hijos
            justifyContent: "center", // Centra los botones horizontalmente
            alignItems: "center", // Centra los botones verticalmente (si es necesario)
            mt: 2,
            gap: 2, // Opcional: añade un espacio entre los botones
            overflowX: "auto", // Por si los botones son demasiado anchos
          }}
        >
          <CustomButton
            text="Guardar proyecto"
            icon={<SaveIcon />}
            sx={{ minWidth: '150px', padding: '8px 10px', textTransform: 'none',
              backgroundColor: '#2ca58d', '&:hover': {
                backgroundColor: '#c0c0c0', // Un tono más oscuro al pasar el ratón
              },
             }}
             onClick={() => handleActualizarProyecto(proyecto, onClose, onProyectoGuardado)}
          />
          <CustomButton
            text="Eliminar proyecto"
            icon={<DeleteIcon />}
            sx={{
              minWidth: '150px',
              padding: '8px 10px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'error.light', // Color de fondo al pasar el ratón
                color: 'white',
              },
            }}
            onClick={() => {
              setProyectoToDelete(proyecto);
              setOpenConfirmDelete(true);
            }}
            />
        </Box>
        {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"¿Estás seguro de eliminar este proyecto?"}
        </DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            Esta acción eliminará permanentemente el proyecto "{proyectoToDelete?.nombreProyecto}". ¿Deseas continuar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDelete(false)}>Cancelar</Button>
          <Button onClick={() => {
            if (proyectoToDelete) {
              handleEliminarProyecto(proyectoToDelete, onClose, onProyectoGuardado);
            }
            setOpenConfirmDelete(false);
          }} autoFocus color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Modal>
  );
};

export default ProyectoModal;
