import React, { useState,useEffect } from 'react';
import { Modal, Box, Tabs, Tab, Typography, IconButton,TextField,TableContainer,Table,TableRow,TableCell,TableHead,Paper,TableBody } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/UploadFile';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SaveIcon from "@mui/icons-material/Save";
import CustomButton from '../components/CustomButton';
import { Proyecto, Unidad,PaymentPlan } from '../types/types';
import { formatoMoneda } from '../hooks/useUtilsFunctions';
import {  fechaActual } from "../hooks/useDateUtils";
import { actualizarProyecto } from '../hooks/useFetchFunctions';

interface ProyectoModalProps {
  proyecto: Proyecto | null;
  open: boolean;
  onClose: () => void;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  user: { id: string; email: string };

}

const ProyectoModal: React.FC<ProyectoModalProps> = ({ proyecto, open, onClose, setProyecto,user }) => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [unidad, setUnidad] = useState<Unidad>({ numerounidad: '', unidadprivativa: '', preciolista: '', extras: {}, imagenes: [] });
  

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, field: keyof Proyecto) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProyecto((prevProyecto) => prevProyecto ? { ...prevProyecto, [field]: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

 
  const [extrasKeys, setExtrasKeys] = useState<string[]>([]);

  const [calculatedMonths] = useState(1);
  const handleAddUnidad = () => {
    if (!proyecto) return;
    setProyecto(prevProyecto => {
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
    setProyecto(prevProyecto => ({
      ...prevProyecto!,
      unidades: prevProyecto!.unidades.filter((_, i) => i !== index)
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
      // Obtener todas las claves de extras de todas las unidades
      const allExtraKeys = new Set<string>();
      proyecto.unidades.forEach((unidad) => {
        if (unidad.extras) {
          Object.keys(unidad.extras).forEach((key) => allExtraKeys.add(key));
        }
      });
  
      setExtrasKeys(Array.from(allExtraKeys)); // Guardamos las claves únicas en el estado
    }
  }, [proyecto]);
  const handleAddExtraKey = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault(); // Previene comportamiento por defecto si recibe un evento
    setExtrasKeys([...extrasKeys, `extra_${extrasKeys.length}`]);
  };
  
  const handleChangeExtraKey = (index: number, newKey: string) => {
    setExtrasKeys((prevKeys) => {
      const updatedKeys = [...prevKeys];
      const oldKey = updatedKeys[index]; // Obtiene la clave antigua
      updatedKeys[index] = newKey; // Cambia el nombre de la clave
  
      // Actualiza los extras en unidad
      setUnidad((prevUnidad) => {
        if (!prevUnidad) return prevUnidad;
        const updatedExtras = { ...prevUnidad.extras };
        
        // Si hay un valor asociado al antiguo key, lo movemos a la nueva key
        if (oldKey in updatedExtras) {
          updatedExtras[newKey] = updatedExtras[oldKey];
          delete updatedExtras[oldKey]; // Elimina la clave antigua
        }
        
        return { ...prevUnidad, extras: updatedExtras };
      });
  
      return updatedKeys;
    });
  };
  

  const handleChangeExtraValue = (key: string, value: string) => {
    setUnidad(prevUnidad => ({
      ...prevUnidad,
      extras: { ...prevUnidad.extras, [key]: value },
    }));
  };

  const handleRemoveExtraKey = (index: number) => {
    setExtrasKeys(prevKeys => prevKeys.filter((_, i) => i !== index));
    setUnidad(prevUnidad => {
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

    const files = Array.from(event.target.files); // Convierte FileList en un array

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
            const compressedImage = await compressImage(reader.result, 0.7); // Calidad 70%
            resolve({ name: file.name, data: compressedImage });
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((images) => {
      setUnidad((prevUnidad) => ({
        ...prevUnidad,
        imagenes: [...(prevUnidad.imagenes || []), ...images], // Agregar imágenes nuevas al estado
      }));
    });

    // Limpia el valor del input de archivo
    event.target.value = "";
  };

  
  

  const handleRemoveImage = (index: number) => {
    setUnidad((prevUnidad) => {
      if (!prevUnidad || !prevUnidad.imagenes) return prevUnidad; // Manejo de null o undefined
  
      return {
        ...prevUnidad,
        imagenes: prevUnidad.imagenes.filter((_, imgIndex) => imgIndex !== index),
      };
    });
  };
  

  
  const handleAddPaymentPlanRow = () => {
    setProyecto((prevProyecto) => {
      if (!prevProyecto) {
        return null; // O podrías retornar un objeto inicial válido si es necesario
      }
  
      return {
        ...prevProyecto,
        paymentPlans: [
          ...(prevProyecto.paymentPlans || []), // Asegura que no sea undefined
          {
            name: "",
            months: calculatedMonths,
            descuento: 0,
            pInicial: 0,
            mensualidades: 0,
            contraentrega: 0,
            parcialidades: 0,
          },
        ],
      };
    });
  };
  
  const handlePaymentPlanChange = (index: number, field: keyof PaymentPlan, value: any) => {
    setProyecto((prevProyecto) => {
      if (!prevProyecto) return prevProyecto; // Si es null, simplemente devuelve el estado actual
  
      const updatedPlans = [...(prevProyecto.paymentPlans || [])]; // Asegurar que `paymentPlans` no sea undefined
      updatedPlans[index] = { ...updatedPlans[index], [field]: value };
  
      return {
        ...prevProyecto,
        paymentPlans: updatedPlans,
      };
    });
  };
  
  const handleDeletePaymentPlanRow = (index: number) => {
    setProyecto((prevProyecto) => {
      if (!prevProyecto || !prevProyecto.paymentPlans) return prevProyecto; // Si es null, devuelve el estado actual
  
      return {
        ...prevProyecto,
        paymentPlans: prevProyecto.paymentPlans.filter((_, i) => i !== index),
      };
    });
  };
  
  
  
  const calculateMonthsDifference = (startDate: string | Date, endDate: string | Date): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
  
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("Fechas inválidas:", { startDate, endDate });
      return 1; // Devuelve 1 por defecto si las fechas no son válidas
    }
  
    // Calculamos la diferencia en meses
    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth();
  
    // Si los meses son negativos o 0, establecemos 1 como mínimo
    return Math.max(1, months);
  };
  

  const handleDeliveryDateChange = (newDate: string) => {
    if (!newDate) return; // Evita procesar si la fecha es inválida
  
    setProyecto((prevProyecto) => {
        if (!prevProyecto) return prevProyecto; // Manejo de `null`
  
        const today = fechaActual; // Usamos la fecha actual de Temporal
        const monthsRemaining = calculateMonthsDifference(today, newDate); // 🔹 Usamos la función correcta

        // Actualiza los planes existentes con los nuevos meses,
        // excepto si el nombre es "Contado" o "ContadoComercial"
        const updatedPlans = (prevProyecto.paymentPlans || []).map((plan) => {
            if (["Contado", "ContadoComercial"].includes(plan.name)) {
                return plan; // No modificar si es "Contado" o "ContadoComercial"
            }

            return {
                ...plan,
                months: monthsRemaining, // ✅ Ahora sí actualiza los meses
                mensualidades: monthsRemaining, // ✅ También ajusta mensualidades
            };
        });

        return {
            ...prevProyecto,
            fechaEntrega: newDate, // ✅ Guarda la nueva fecha en el formato correcto
            paymentPlans: updatedPlans, // ✅ Actualiza la lista de planes de pago
        };
    });
};

  
const handleActualizarProyecto = async (proyecto: Proyecto | null): Promise<void> => {
  if (!proyecto || !proyecto.nombreProyecto||!user) {
    console.error("❌ Error: El proyecto no tiene nombre o no es válido.");
    return;
  }

  try {
    console.log("📤 Actualizando proyecto en Supabase...");
  console.log(proyecto)   
  await actualizarProyecto(proyecto, user.email);

    console.log("✅ Proyecto actualizado correctamente.");
    alert("Proyecto actualizado con éxito.");
  } catch (error) {
    console.error("❌ Error al actualizar el proyecto:", error);
    alert("Hubo un error al actualizar el proyecto.");
  }
};

  

  return (
    <Modal
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return; // Evitar cierre por clic en el fondo
        onClose();
      }}
      disableEnforceFocus // Prevenir conflicto con accesibilidad
      aria-labelledby="modal-proyecto"
      aria-describedby="modal-proyecto-tabs"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          bgcolor: 'white',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          outline: 'none',
          maxHeight: '80%',
          overflowY: 'auto',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography id="modal-proyecto" variant="h2" component="h2" sx={{ mb: 2, textAlign: 'center', color: 'var(--primary-color)' ,fontWeight: 'bold'  }}>
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
              <Typography variant="body1" sx={{ mb: 2 ,color: 'var(--primary-color)'}}>
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
                style={{ width: '100%', padding: '8px', marginBottom: '16px' }}
              />
             
             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
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
                    onInputChange={(e) => handleImageUpload(e, "logo")} // ✅ Corrección
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
                    onInputChange={(e) => handleImageUpload(e, "fachada")} // ✅ Corrección
                  />
                )}
              </Box>
            </Box>


            

            <Typography variant="body1" sx={{ mb: 2, color: 'var(--primary-color)' }}>
              Amenidades:
            </Typography>

            {proyecto?.amenidades && proyecto.amenidades.length > 0 ? (
              proyecto.amenidades.map((amenidad, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
              <Typography variant="body1" sx={{ mb: 2, color: 'var(--primary-color)' }}>
                Agregar Unidades
              </Typography>
              <TextField fullWidth label="Número de Unidad" value={unidad.numerounidad} onChange={(e) => setUnidad({ ...unidad, numerounidad: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Unidad Privativa" value={unidad.unidadprivativa} onChange={(e) => setUnidad({ ...unidad, unidadprivativa: e.target.value })} sx={{ mb: 2 }} />
              <TextField
                  fullWidth
                  label="Precio Lista"
                  value={unidad.preciolista || ""} // 🔹 Muestra el valor de `unidad`
                  onChange={(e) =>
                    setUnidad({ ...unidad, preciolista: e.target.value.replace(/[^0-9.]/g, "") }) // 🔹 Permite escribir solo números
                  }
                  onBlur={(e) =>
                    setUnidad({ ...unidad, preciolista: formatoMoneda(e.target.value) }) // 🔹 Aplica formato al perder foco
                  }
                  sx={{ mb: 2 }}
                />
              
              <CustomButton
                  text="Agregar Variable"
                  icon={<AddCircleIcon />}
                  sx={{ mt: 1, mb: 2 }}
                  onClick={handleAddExtraKey}
                />
              {extrasKeys.map((key, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Nombre de la Variable"
                    value={key}
                    onChange={(e) => handleChangeExtraKey(index, e.target.value)} // ✅ Ahora sí existe
                  />
                  <TextField
                    fullWidth
                    label="Valor"
                    value={unidad.extras[key] || ''}
                    onChange={(e) => handleChangeExtraValue(key, e.target.value)}
                  />
                  <IconButton onClick={() => handleRemoveExtraKey(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              <Typography variant="body1" sx={{ mb: 2 }}>Subir imágenes de la unidad:</Typography>
              
              <CustomButton
                text="Seleccionar Imágenes"
                icon={<UploadIcon />}
                inputType="file"
                multiple
                accept="image/*"
                onInputChange={(e) => handleUnidadImageUpload(e)} // Maneja los archivos seleccionados
              />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                {unidad.imagenes?.map((img, index) => (
                  <Box key={index} sx={{ textAlign: "center", position: "relative" }}>
                    <img
                      src={img.data} // Aseguramos que usamos el `data` base64
                      alt={img.name}
                      style={{ maxWidth: "100px", borderRadius: "8px" }}
                    />
                    <Typography variant="caption">{img.name}</Typography>
                    <IconButton
                      onClick={() => handleRemoveImage(index)} // Función para eliminar imágenes
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

              <CustomButton
                text="Agregar Unidad"
                onClick={() => handleAddUnidad()} // Maneja los archivos seleccionados
              />
              <Typography variant="h6" sx={{ mt: 4 }}>Unidades Agregadas</Typography>
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
                      <TableCell>Imágenes</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                  {proyecto && proyecto.unidades?.map((unidad, index) => (
                      <TableRow key={`unidad_${index}`}>
                        <TableCell>{unidad.numerounidad}</TableCell>
                        <TableCell>{unidad.unidadprivativa}</TableCell>
                        <TableCell>{formatoMoneda(unidad.preciolista)}</TableCell>
                        {extrasKeys.map((key, subIndex) => (
                          <TableCell key={`cell_${index}_${subIndex}`}>{unidad.extras?.[key] || ''}</TableCell>
                        ))}
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {unidad.imagenes.map((img, imgIndex) => (
                              <img
                                key={`unidad_${index}_img_${imgIndex}`}
                                src={typeof img === 'string' ? img : img.data} // Aseguramos que usa base64
                                alt={`Unidad ${index} Img ${imgIndex}`}
                                style={{ maxWidth: '50px', borderRadius: '4px' }}
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
          {selectedTab === 2 && 
          <>
            <Typography variant="h6" gutterBottom> Fecha de Entrega</Typography>
            <TextField
              type="date"
              value={proyecto?.fechaEntrega ?? ""} // ✅ Siempre aseguramos un string válido
              onChange={(e) => handleDeliveryDateChange(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <CustomButton
                  onClick={() => handleAddPaymentPlanRow()}
                  text="Agregar Plan de Pago"
                  icon={<span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>+</span>}
                />
            </Box>
            <Box sx={{ overflowX: "auto" }}>
              <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table sx={{ minWidth: 800 }}> {/* Ajusta el minWidth según sea necesario */}
                  <TableHead>
                      <TableCell>Nombre del Plan</TableCell>
                      <TableCell>Meses del Plan</TableCell>
                      <TableCell>Descuento</TableCell>
                      <TableCell>% Pago Inicial</TableCell>
                      <TableCell>% Mensualidades</TableCell>
                      <TableCell>% Contraentrega</TableCell>
                      <TableCell>Acciones</TableCell>
                  </TableHead>
                  <TableBody>
                  {(proyecto && proyecto.paymentPlans && proyecto.paymentPlans.length > 0) ? (
                      proyecto.paymentPlans.map((plan, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              value={plan.name}
                              onChange={(e) => handlePaymentPlanChange(index, "name", e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={plan.months}
                              onChange={(e) => handlePaymentPlanChange(index, "months", e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={plan.descuento}
                              onChange={(e) => handlePaymentPlanChange(index, "descuento", e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={plan.pInicial}
                              onChange={(e) => handlePaymentPlanChange(index, "pInicial", e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={plan.mensualidades}
                              onChange={(e) => handlePaymentPlanChange(index, "mensualidades", e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={plan.contraentrega}
                              onChange={(e) => handlePaymentPlanChange(index, "contraentrega", e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton onClick={() => handleDeletePaymentPlanRow(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No hay planes de pago agregados
                        </TableCell>
                      </TableRow>
                    )}


                  </TableBody>
                </Table>
              </TableContainer>
            </Box>


          </>
          }
          

        </Box>
        <Box sx={{ overflowX: "auto", display: "flex", justifyContent: "center", alignItems: "center", mt: 2, }} >
          <CustomButton
            text="Actualizar Proyecto"
            icon={<SaveIcon />}
            sx={{ mt: 1 }}
            onClick={() => handleActualizarProyecto(proyecto)} // ✅ Ya no recibe `e`
            
          />

        </Box>
        
      </Box>
    </Modal>
  );
};

export default ProyectoModal;
