import React, { useCallback ,useState,useEffect} from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
  SelectChangeEvent,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import SaveIcon from '@mui/icons-material/Save';
import CustomButton from '../components/CustomButton';
import UploadIcon from '@mui/icons-material/UploadFile';
import { ListasDesplegables } from '../config/variables';

import { Propiedad } from '../types/types';
import { actualizarPropiedad, eliminarPropiedades } from "../hooks/useFetchFunctions";

import CloseIcon from '@mui/icons-material/Close';

interface PropiedadControlModalProps {
  open: boolean;
  onClose: () => void;
  propiedad: Propiedad;
  setPropiedad: React.Dispatch<React.SetStateAction<Propiedad>>;
  userID:string;
  onPropiedadGuardada?: (message: string, severity: "success" | "error" | "warning" | "info") => void;
}

const PropiedadControlModal: React.FC<PropiedadControlModalProps> = ({ open, onClose, propiedad, setPropiedad,userID ,onPropiedadGuardada}) => {
  
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPropiedad(prev => ({ ...prev, [name]: value }));
    }, [setPropiedad]);
    const [warningMessage, setWarningMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [openConfirmDelete, setOpenConfirmDelete] = useState<boolean>(false);
    const [propiedadToDelete, setPropiedadToDelete] = useState<Propiedad | null>(null);
    const [modalAlert, setModalAlert] = useState<{ message: string; severity: "success" | "error" | "warning" | "info" } | null>(null);
    useEffect(() => {
        if (open) {
          setWarningMessage(null); // limpia el mensaje al abrir el modal
          setErrorMessage(null);
        }
      }, [open]);
    const handleSelectChange = useCallback((e: SelectChangeEvent) => {
        setPropiedad(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [setPropiedad]);
    

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPropiedad((prev) => ({ ...prev, [name]: checked }));
    };

    const handleToggleChange = (name: string, newValue: string | null) => {
    if (newValue !== null) {
        setPropiedad((prev) => ({ ...prev, [name]: newValue }));
    }
    };

    const handleGuardar = async () => {
      // Preparar los datos de la propiedad limpiando las keys
      const propiedadLimpia = limpiarKeys(propiedad);
  
      if (!propiedadLimpia.tituloPropiedad || !propiedadLimpia.tipo || !userID) {
        setWarningMessage("Por favor, completa el nombre del proyecto y la fecha de entrega.");
        setTimeout(() => {
          setWarningMessage(null); // Limpiar la alerta después de un tiempo (ej. 3 segundos)
        }, 3000);
        return;
      }
  
      // Añadir el ID del usuario a la propiedad para la función actualizarPropiedad
      propiedadLimpia.userID = userID;
      console.log("Guardando propiedad:", propiedadLimpia);
  
      try {
        const result = await actualizarPropiedad(propiedadLimpia);
  
        if (result?.success) {
          console.log("✅ Propiedad guardada exitosamente:", result.success);
          setModalAlert({ message: result.success, severity: "success" });
          if (onPropiedadGuardada) {
            onPropiedadGuardada(result.success, "success");
          }
          setTimeout(() => {
            onClose();
          }, 1500);
        } else if (result?.error) {
          console.error("❌ Error al guardar propiedad:", result.error);
          setModalAlert({ message: result.error, severity: "error" });
          if (onPropiedadGuardada) {
            onPropiedadGuardada(result.error, "error");
          }
          // No cerrar la modal en caso de error
        }
      } catch (error: any) {
        console.error("🔥 Error inesperado al guardar propiedad:", error);
        setModalAlert({ message: `Error inesperado: ${error.message}`, severity: "error" });
        if (onPropiedadGuardada) {
          onPropiedadGuardada(`Error inesperado: ${error.message}`, "error");
        }
      }
    };

    const handleEliminarProyecto = async (
      propiedad: Propiedad | null,
      onClose: () => void,
      onProyectoGuardado: ((message: string, severity: "success" | "error" | "warning" | "info") => void) | undefined
    ): Promise<void> => {
      if (!propiedad || !propiedad.tituloPropiedad || !userID) {
        setWarningMessage("Por favor completa el nombre de proyecto");
        return;
      }
      setWarningMessage(null);
      setErrorMessage(null);
      try {
        const result = await eliminarPropiedades(propiedad);
        if (result?.success) {
          onClose();
          if (onProyectoGuardado) { // Verifica si onProyectoGuardado está definido
            onProyectoGuardado(result.success, "success");
          }
        } else if (result?.error) {
          setErrorMessage(result.error);
          if (onProyectoGuardado) { // Verifica si onProyectoGuardado está definido
            onProyectoGuardado(result.error, "error");
          }
        } else {
          setErrorMessage("Error al eliminar el proyecto.");
          if (onProyectoGuardado) { // Verifica si onProyectoGuardado está definido
            onProyectoGuardado("Error al eliminar el proyecto.", "error");
          }
        }
      } catch (error: any) {
        console.error("❌ Error al eliminar el proyecto:", error);
        setErrorMessage(`Error al eliminar el proyecto: ${error.message}`);
        if (onProyectoGuardado) { // Verifica si onProyectoGuardado está definido
          onProyectoGuardado(`Error al eliminar el proyecto: ${error.message}`, "error");
        }
      } finally {
        onClose(); // Asegúrate de cerrar el modal incluso si hay un error
      }
    };

    const limpiarKeys = (obj: any): any => {
      return Object.keys(obj).reduce((acc, key) => {
        const nuevaKey = key.replace(/\s+/g, ""); // 🔹 Elimina espacios en las claves
        acc[nuevaKey] = obj[key];
        return acc;
      }, {} as any);
    };
    
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    const [imagenesNuevas, setImagenesNuevas] = useState<{ file: File; preview: string }[]>([]);
    
    const handleImagenesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const archivos = Array.from(e.target.files);
    
        const nuevasImagenesPreview = archivos.map((file) => ({
          file,
          preview: URL.createObjectURL(file)
        }));
    
        setImagenesNuevas((prev) => [...prev, ...nuevasImagenesPreview]);
    
        // Convertir a base64 y guardar en propiedad.imagenes
        const base64Array = await Promise.all(
          archivos.map(file => fileToBase64(file))
        );

        setPropiedad(prev => {
          const imagenesResultantes = [...(prev.imagenes || []), ...base64Array];
          console.log("Actualizando propiedad.imagenes:", imagenesResultantes);
          return {
            ...prev,
            imagenes: imagenesResultantes
          };
        });
      }
    };

  const handleEliminarImagenGuardada = (index: number) => {
    setPropiedad((prev) => ({
      ...prev,
      imagenes: prev.imagenes?.filter((_, i) => i !== index) ?? [],
    }));
  };
  
  const handleEliminarImagenNueva = (index: number) => {
    setImagenesNuevas((prev) => prev.filter((_, i) => i !== index));
  };
  
  const propiedadesCampos =
  propiedad?.tipo && propiedad.tipo in ListasDesplegables.Propiedades
    ? ListasDesplegables.Propiedades[propiedad.tipo as keyof typeof ListasDesplegables.Propiedades]
    : [];
    

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
        {/* Título */}
        <Grid container spacing={2}>
            <Grid item xs={12} sx={{ mb: "15px" }}>
                <Box sx={{ textAlign: 'center', marginTop: '20px', fontWeight: 'bold' }}>
                <Typography
                    variant="h5"
                    sx={{
                    mb: 2,
                    textAlign: 'center',
                    color: 'var(--primary-color)',
                    fontWeight: 'bold',
                    }}
                >
                    {propiedad?.tituloPropiedad || 'Nueva Propiedad'}
                </Typography>
                </Box>
            </Grid>
        </Grid>

        {/* Campo de Título */}
        <Box sx={{ display: 'flex', gap: 2 }}> 
        <Grid container spacing={2}>
          <Grid item xs={12} sx={{ mb: "15px" }}>
            <TextField
              fullWidth
              label="Título"
              required
              name="tituloPropiedad"
              value={propiedad?.tituloPropiedad || ''}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo de Propiedad</InputLabel>
              <Select
                name="tipo"
                value={propiedad?.tipo || ''}
                onChange={handleSelectChange} // ✅ Se usa handleSelectChange en vez de handleInputChange
                label="Tipo de propiedad"
              >
                {Object.entries(ListasDesplegables.TipoPropiedad).flatMap(([categoria, tipos]) => [
                  <MenuItem key={categoria} disabled>
                    <strong>{categoria}</strong>
                  </MenuItem>,
                  ...tipos.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  )),
                ])}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} sx={{ mb: "15px" }}>
            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              value={propiedad?.descripcion || ""}
              multiline
              rows={4}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>
        </Box>
        <Grid container spacing={2} sx={{ mb: "15px" }}>
          {/* Columna de Venta */}
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={<Checkbox sx={{ color: "var(--primary-color)" }} checked={Boolean(propiedad?.venta) || false} onChange={handleCheckboxChange} name="venta" />}
              label={<Typography sx={{ color: "var(--primary-color)", fontWeight: "bold" }}>Venta</Typography>}
            />

            {/* Inputs de Venta debajo del checkbox */}
            {propiedad?.venta && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  fullWidth
                  label="Precio de venta"
                  name="precioVenta"
                  type="number"
                  value={propiedad?.precioVenta || ''}
                  onChange={handleInputChange}
                  sx={{ color: "var(--primary-color)" }}
                />
                <TextField
                  fullWidth
                  label="Comisión de venta (%)"
                  name="comisionVenta"
                  type="number"
                  value={propiedad?.comisionVenta || ''}
                  onChange={handleInputChange}
                />
              </Box>
            )}
          </Grid>

          {/* Columna de Renta */}
          <Grid item xs={12} sm={6}>
           <FormControlLabel
              control={<Checkbox sx={{ color: "var(--primary-color)" }} checked={Boolean(propiedad?.renta) || false} onChange={handleCheckboxChange} name="renta" />}
              label={<Typography sx={{ color: "var(--primary-color)", fontWeight: "bold" }}>Renta</Typography>}
            />
            {/* Inputs de Renta debajo del checkbox */}
            {propiedad?.renta && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  fullWidth
                  label="Precio de renta"
                  name="precioRenta"
                  type="number"
                  value={propiedad?.precioRenta || ''}
                  onChange={handleInputChange}
                />
                <TextField
                  fullWidth
                  label="Comisión de renta (%)"
                  name="comisionRenta"
                  type="number"
                  value={propiedad?.comisionRenta || ''}
                  onChange={handleInputChange}
                />
              </Box>
            )}
          </Grid>
        </Grid>
        {propiedadesCampos.length > 0 && (
          <Box sx={{ mt: 3 }}>
            {/* Título arriba de los inputs */}
            <Typography variant="h6" sx={{ color: "var(--primary-color)", mb: 2 }}>
              Características propiedad
            </Typography>
            <Grid container spacing={2}>
              {propiedadesCampos.map((campo, index) => (
                <Grid item xs={12} sm={4} key={index} sx={{ mb: 3 }}> 
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {campo.icon && <campo.icon sx={{ color: "var(--primary-color)" }} />}
                    
                    <TextField
                      label={campo.label}
                      name={campo.labelSQL}
                      type="text"
                      value={propiedad?.[campo.labelSQL] || ''}
                      onChange={handleInputChange}
                      sx={{ flex: 1 }}
                      className={campo.unit ? 'input-mini' : ''}
                    />
                    {campo.unit && (
                      <Typography sx={{ color: 'gray', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {campo.unit}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
         <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "var(--primary-color)", mb: 1 }}>
            Ubicación
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* País */}
            <Grid item xs={12} sm={4}>
              <TextField
                  fullWidth
                  label="País"
                  name="pais"
                  type="text"
                  value={propiedad?.pais || ''}
                  onChange={handleInputChange}
                />
            </Grid>
            <Grid item xs={12} sm={4}>
            <TextField
                  fullWidth
                  label="Estado"
                  name="estado"
                  type="text"
                  value={propiedad?.estado || ''}
                  onChange={handleInputChange}
                />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                  fullWidth
                  label="Ciudad"
                  name="ciudad"
                  type="text"
                  value={propiedad?.ciudad || ''}
                  onChange={handleInputChange}
                />
            </Grid>

            {/* Colonia */}
            <Grid item xs={12} sm={4}>
              <TextField
                  fullWidth
                  label="Colonia"
                  name="colonia"
                  type="text"
                  value={propiedad?.colonia || ''}
                  onChange={handleInputChange}
                />
            </Grid>

            {/* Calle, Número e Interior */}
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Calle" name="calle" value={propiedad?.calle || ""} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Número" name="numero" value={propiedad?.numero || ""} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Interior" name="interior" value={propiedad?.interior || ""} onChange={handleInputChange} />
            </Grid>

            {/* Esquina con */}
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Esquina con" name="esquina" value={propiedad?.esquina || ""} onChange={handleInputChange} />
            </Grid>

            {/* Código Postal */}
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Código postal" name="codigoPostal" value={propiedad?.codigoPostal || ""} onChange={handleInputChange} />
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "var(--primary-color)", mb: 2 }}>
            Amenidades
          </Typography>

          {Object.entries(ListasDesplegables.amenidades).map(([categoria, opciones]) => (
            <Box key={categoria} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: "var(--primary-color)", mb: 1 }}>
                {categoria}
              </Typography>

              <Grid container spacing={2} >
                {opciones.map((amenidad, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        sx={{ color: "var(--primary-color)" }}
                        checked={Boolean(propiedad?.amenidades?.includes(amenidad.label)) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPropiedad((prev) => ({
                            ...prev,
                            amenidades: checked
                              ? [...(prev.amenidades ?? []), amenidad.label] // ✅ Asegura que siempre haya un array
                              : (prev.amenidades ?? []).filter((a) => a !== amenidad.label), // ✅ Evita `undefined.filter()`
                          }));
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {amenidad.icon && <amenidad.icon sx={{ color: "var(--primary-color)" }} />}
                        <Typography sx={{ color: "var(--primary-color)" }}>{amenidad.label}</Typography>
                      </Box>
                    }
                  />
                </Grid>                
                ))}
              </Grid>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 4 ,mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "var(--primary-color)", mb: 2 }}>
            Colaboración y exclusividad
          </Typography>
          <Grid container spacing={2}>
              {/* Tengo exclusividad */}
              <Grid item xs={12} md={4} >
                <Typography sx={{ fontWeight: "bold", mb: 1,color: "var(--primary-color)" }}>Tengo exclusividad</Typography>
                <ToggleButtonGroup
                fullWidth
                  value={propiedad?.exclusividad || "No indicado"}
                  exclusive
                  onChange={( _,newValue) => handleToggleChange("exclusividad", newValue)}>
                  <ToggleButton sx={{textTransform: 'none'}} value="No indicado">No indicado</ToggleButton>
                  <ToggleButton sx={{textTransform: 'none'}} value="Sí">Sí</ToggleButton>
                  <ToggleButton sx={{textTransform: 'none'}} value="No">No</ToggleButton>
                </ToggleButtonGroup>
              </Grid>

              {/* Comisión compartida */}
              <Grid item xs={12} md={4} >
                <Typography sx={{ fontWeight: "bold", mb: 1,color: "var(--primary-color)" }}>Comisión compartida</Typography>
                <ToggleButtonGroup
                  fullWidth
                  value={propiedad?.comisionCompartida || "No indicado"}
                  exclusive
                  onChange={( _,newValue) => handleToggleChange("comisionCompartida", newValue)}
                >
                  <ToggleButton sx={{textTransform: 'none'}} value="Sí">Sí</ToggleButton>
                  <ToggleButton sx={{textTransform: 'none'}} value="No">No</ToggleButton>
                </ToggleButtonGroup>
              </Grid>

              {/* Comparto el 50% */}
              <Grid item xs={12} md={4}>
                <Typography sx={{ fontWeight: "bold", mb: 1,color: "var(--primary-color)" }}>Comparto el 50%</Typography>
                <ToggleButtonGroup
                  fullWidth
                  value={propiedad?.comparte50 || "No indicado"}
                  exclusive
                  onChange={(_,newValue) => handleToggleChange("comparte50", newValue)}
                >
                  <ToggleButton sx={{textTransform: 'none'}} value="No indicado">No indicado</ToggleButton>
                  <ToggleButton sx={{textTransform: 'none'}} value="Sí">Sí</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            {/* Condiciones para compartir */}
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: "bold", mb: 1,color: "var(--primary-color)" }}>Condiciones para compartir</Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="condicionesCompartir"
                value={propiedad?.condicionesCompartir || ""}
                onChange={handleInputChange}
                placeholder="Especifica las condiciones de colaboración..."
              />
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ mt: 4 }}>
  <Typography variant="h5" sx={{ fontWeight: "bold", color: "var(--primary-color)", mb: 2 }}>
    Imágenes de la propiedad
  </Typography>

  <CustomButton
    text="Seleccionar imágenes"
    icon={<UploadIcon />}
    inputType="file"
    multiple
    accept="image/*"
    onInputChange={handleImagenesChange}
    sx={{textTransform: 'none',
      }}
  />

  {/* Vista previa de imágenes (nuevas + guardadas) */}
  <Grid container spacing={2} sx={{ mt: 2 }}>
  {propiedad.imagenes?.map((url, index) => (
    <Grid item xs={4} sm={3} key={`guardada-${index}`}>
      <Box sx={{ position: 'relative', textAlign: 'center' }}>
        <img
          src={url}
          alt={`Imagen guardada ${index}`}
          style={{ width: "100%", height: "auto", borderRadius: "8px" }}
        />
        <IconButton
          onClick={() => handleEliminarImagenGuardada(index)}
          sx={{ position: "absolute", top: 0, right: 0, background: "white" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </Grid>
  ))}

  {imagenesNuevas.map((img, index) => (
    <Grid item xs={4} sm={3} key={`nueva-${index}`}>
      <Box sx={{ position: 'relative', textAlign: 'center' }}>
        <img
          src={img.preview}
          alt={`Imagen nueva ${index}`}
          style={{ width: "100%", height: "auto", borderRadius: "8px" }}
        />
        <IconButton
          onClick={() => handleEliminarImagenNueva(index)}
          sx={{ position: "absolute", top: 0, right: 0, background: "white" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </Grid>
  ))}
  </Grid>
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
</Box>
<Box sx={{
    display: "flex", // Habilita el diseño en fila para los hijos
    justifyContent: "center", // Centra los botones horizontalmente
    alignItems: "center", // Centra los botones verticalmente (si es necesario)
    mt: 2,
    gap: 2, // Opcional: añade un espacio entre los botones
    overflowX: "auto", // Por si los botones son demasiado anchos
  }}
>
  <CustomButton
    text="Guardar propiedad"
    icon={<SaveIcon />}
    sx={{ minWidth: '150px', padding: '8px 10px', textTransform: 'none',
      backgroundColor: '#2ca58d', '&:hover': {
        backgroundColor: '#c0c0c0', // Un tono más oscuro al pasar el ratón
      },
      }}
    onClick={handleGuardar}
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
      setPropiedadToDelete(propiedad);
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
      Esta acción eliminará permanentemente el proyecto "{propiedad?.tituloPropiedad}". ¿Deseas continuar?
    </Typography>
  </DialogContent>
  <DialogActions>
  <Button onClick={() => setOpenConfirmDelete(false)}>Cancelar</Button>
  <Button onClick={() => {
    if (propiedadToDelete) {
      handleEliminarProyecto(propiedadToDelete, onClose, onPropiedadGuardada);
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

export default PropiedadControlModal;
