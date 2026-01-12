import React, { useCallback} from 'react';
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
  IconButton
} from '@mui/material';
import { ListasDesplegables } from '../../config/variables';

import { Propiedad ,Document} from '../../config/types';

import CloseIcon from '@mui/icons-material/Close';
import FileUploadCarouselPreview from '../general/FileUploadCarouselPreview';

interface PropiedadControlModalProps {
  open: boolean;
  onClose: () => void;
  propiedad: Propiedad;
  setPropiedad: React.Dispatch<React.SetStateAction<Propiedad>>;
  userID:string;
  onSave:(propiedad:Propiedad) => void;
}

const PropiedadControlModal: React.FC<PropiedadControlModalProps> = ({ open, onClose, propiedad, setPropiedad,userID ,onSave}) => {
  
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPropiedad(prev => ({ ...prev, [name]: value }));
    }, [setPropiedad]);
    
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
      
      
      // Añadir el email del usuario a la propiedad para la función actualizarPropiedad
      propiedadLimpia.userid = userID;
      
      onSave(propiedadLimpia)
    };
    
  
    const limpiarKeys = (obj: any): any => {
      return Object.keys(obj).reduce((acc, key) => {
        const nuevaKey = key.replace(/\s+/g, ""); // 🔹 Elimina espacios en las claves
        acc[nuevaKey] = obj[key];
        return acc;
      }, {} as any);
    };
    

    

  const propiedadesCampos =
  propiedad?.tipo && propiedad.tipo in ListasDesplegables.Propiedades
    ? ListasDesplegables.Propiedades[propiedad.tipo as keyof typeof ListasDesplegables.Propiedades]
    : [];
    
const handleImagenesCarouselChange = (archivos: File | File[]) => {
  const nuevosArchivos = Array.isArray(archivos) ? archivos : [archivos];
  const nuevosDocs: Document[] = nuevosArchivos.map((file, idx) => ({
    id: `new-${Date.now()}-${idx}`,
    nombre: file.name,
    file,
  }));

  setPropiedad((prev) => ({
    ...prev,
    imagenes: [...(prev.imagenes ?? []), ...nuevosDocs],
  }));
};

const handleImagenesCarouselDelete = (doc: Document) => {
  setPropiedad((prev) => ({
    ...prev,
    imagenes: (prev.imagenes ?? []).filter((img) => img.id !== doc.id),
  }));
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
        {/* Título */}
        <Grid container spacing={2}>
            <Grid item xs={12} sx={{ mb: "15px" }}>
                <Box sx={{ textAlign: 'center', marginTop: '20px', fontWeight: 'bold' }}>
                <Typography
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
        
        <Grid container spacing={2}>
          <Grid item xs={12} sx={{ mb: "15px" }}>
            <TextField
              fullWidth
              label="Título"
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
                label="Tipo de Propiedad"
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
                  label="Precio de Venta"
                  name="precioVenta"
                  type="number"
                  value={propiedad?.precioVenta || ''}
                  onChange={handleInputChange}
                  sx={{ color: "var(--primary-color)" }}
                />
                <TextField
                  fullWidth
                  label="Comisión de Venta (%)"
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
                  label="Precio de Renta"
                  name="precioRenta"
                  type="number"
                  value={propiedad?.precioRenta || ''}
                  onChange={handleInputChange}
                />
                <TextField
                  fullWidth
                  label="Comisión de Renta (%)"
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
              Características Propiedad
            </Typography>
            <Grid container spacing={2}>
              {propiedadesCampos.map((campo, index) => (
                <Grid item xs={12} sm={6} key={index} sx={{ mb: 3 }}> 
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {campo.icon && <campo.icon sx={{ color: "var(--primary-color)" }} />}
                    
                    <TextField
                      fullWidth
                      label={campo.label}
                      name={campo.labelSQL}
                      type="text"
                      value={propiedad?.variables?.[campo.labelSQL] ?? ''}
                      onChange={e => {
                        const value = e.target.value;
                        setPropiedad(prev => ({
                          ...prev,
                          variables: {
                            ...prev.variables,
                            [campo.labelSQL]: value
                          }
                        }));
                      }}
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
            <Grid item xs={12} sm={6}>
              <TextField
                  fullWidth
                  label="País"
                  name="pais"
                  type="text"
                  value={propiedad?.pais || ''}
                  onChange={handleInputChange}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
            <TextField
                  fullWidth
                  label="Estados"
                  name="estado"
                  type="text"
                  value={propiedad?.estado || ''}
                  onChange={handleInputChange}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12}>
              <TextField fullWidth label="Esquina con" name="esquina" value={propiedad?.esquina || ""} onChange={handleInputChange} />
            </Grid>

            {/* Código Postal */}
            <Grid item xs={12}>
              <TextField fullWidth label="Código Postal" name="codigoPostal" value={propiedad?.codigoPostal || ""} onChange={handleInputChange} />
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

              <Grid container spacing={2}>
                {opciones.map((amenidad, index) => (
                  <Grid item xs={12} sm={6} key={index}>
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
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: "bold", mb: 1,color: "var(--primary-color)" }}>Tengo exclusividad</Typography>
              <ToggleButtonGroup
                fullWidth
                value={propiedad?.exclusividad || "No indicado"}
                exclusive
                onChange={( _,newValue) => handleToggleChange("exclusividad", newValue)}
              >
                <ToggleButton value="No indicado">No indicado</ToggleButton>
                <ToggleButton value="Sí">Sí</ToggleButton>
                <ToggleButton value="No">No</ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {/* Comisión compartida */}
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: "bold", mb: 1,color: "var(--primary-color)" }}>Comisión compartida</Typography>
              <ToggleButtonGroup
                fullWidth
                value={propiedad?.comisionCompartida || "No indicado"}
                exclusive
                onChange={( _,newValue) => handleToggleChange("comisionCompartida", newValue)}
              >
                <ToggleButton value="Sí">Sí</ToggleButton>
                <ToggleButton value="No">No</ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {/* Comparto el 50% */}
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: "bold", mb: 1,color: "var(--primary-color)" }}>Comparto el 50%</Typography>
              <ToggleButtonGroup
                fullWidth
                value={propiedad?.comparte50 || "No indicado"}
                exclusive
                onChange={(_,newValue) => handleToggleChange("comparte50", newValue)}
              >
                <ToggleButton value="No indicado">No indicado</ToggleButton>
                <ToggleButton value="Sí">Sí</ToggleButton>
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
            Imágenes de la Propiedad
          </Typography>

          <Box sx={{ mt: 4, mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "var(--primary-color)", mb: 2 }}>
            Imágenes de la Propiedad
          </Typography>
          <FileUploadCarouselPreview
            value={propiedad.imagenes ?? []}
            onChange={handleImagenesCarouselChange}
            onDelete={handleImagenesCarouselDelete}
            multiple
            accept="image/*"
            height="auto"
            maxHeight={600}
            fit="contain"
          />
        </Box>
</Box>





        
        {/* Botones */}
        <Box sx={{ textAlign: 'right' }}>
          <Button onClick={onClose} sx={{ mr: 2 }}>
            Cancelar
          </Button>
          <Button
            sx={{backgroundColor:"var(-principal--color)"}}
            variant="contained"
            onClick={handleGuardar}
          >
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default PropiedadControlModal;
