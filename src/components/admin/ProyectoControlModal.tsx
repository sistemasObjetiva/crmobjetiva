import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Tab,
  Typography,
  IconButton,
  DialogTitle,
  Dialog,
  DialogContent,
  Button,
  DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

import { Proyecto, Unidad, PlanPago ,Document} from '../../config/types';
import { fechaActual } from "../../hooks/useDateUtils";
import ProyectoGeneralTab from './ProyectoGeneralTab';
import ProyectoUnidadesTab from './ProyectoUnidadesTab';
import ProyectoPlanesPagoTab from './ProyectoPlanesPAgoTabs';
import { eliminarProyecto } from '../../hooks/useFetchFunctions';
import { useStatusChip } from '../../config/context/useStatusChip';
import ProyectoStackingTab from './ProyectoStackingTab';

interface ProyectoModalProps {
  proyecto: Proyecto | null;
  open: boolean;
  onClose: () => void;  
  onSave: (proyecto:Proyecto) => void;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  userid: string;
}
export const makeInitialUnidad = (userId: string,proyectoid: string): Unidad => ({
  id: crypto.randomUUID(),                   // se creará en el servidor o con uuid
  userid: userId,
  proyectoid,
  numerounidad: '',
  unidadprivativa: '',
  preciolista: '',
  extras: {},
  imagenes: [],
  estatus:'disponible'
})
const ProyectoControlModal: React.FC<ProyectoModalProps> = ({ proyecto, open, onClose, setProyecto, userid ,onSave}) => {
  const { showStatus } = useStatusChip()
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [unidad, setUnidad] = useState<Unidad|null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };


  const [extrasKeys, setExtrasKeys] = useState<string[]>([]);
  

  const handleAddUnidad = () => {
    if (!proyecto || !unidad) return
    setProyecto(prev => {
      if (!prev) return prev
      const unidadesActualizadas = [...prev.unidades]
      const index = unidadesActualizadas.findIndex(u => u.id === unidad.id)

      if (index !== -1) {
        unidadesActualizadas[index] = unidad
      } else {
        unidadesActualizadas.push(unidad)
      }
      const nuevoProyecto: Proyecto = {
        ...prev,
        unidades: unidadesActualizadas
      }
      return nuevoProyecto
    })
    setUnidad(makeInitialUnidad(userid, proyecto.id))
  }



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
 const handleChangeUnidad = <K extends keyof Unidad>(field: K, value: Unidad[K]) => {
  setUnidad(prevUnidad => {
    if (!prevUnidad) return prevUnidad
    return {
      ...prevUnidad,
      [field]: value
    }
  })
}

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
  setUnidad(prevUnidad => {
    if (!prevUnidad) {
      return prevUnidad
    }
    return {
      ...prevUnidad,
      extras: {
        ...prevUnidad.extras,
        [key]: value
      }
    }
  })
}


  const handleRemoveExtraKey = (index: number) => {
  setUnidad(prevUnidad => {
    if (!prevUnidad) return prevUnidad
    const keys = Object.keys(prevUnidad.extras)
    const keyToRemove = keys[index]
    if (!keyToRemove) return prevUnidad
    const updatedExtras = { ...prevUnidad.extras }
    delete updatedExtras[keyToRemove]

    return {
      ...prevUnidad,
      extras: updatedExtras
    }
  })
  setExtrasKeys(prevKeys => prevKeys.filter((_, i) => i !== index))
}




  
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
  

  
  const handlePaymentPlanChange = (index: number, field: keyof PlanPago, value: any) => {
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
  // Dentro de tu componente ProyectoModal:

const handleUnidadFileChange = (
  unidadId: string,
  field: keyof Pick<Unidad, 'render' | 'isometrico' | 'plano' | 'imagenes'>,
  files: File | File[]
) => {
  const fileArray = Array.isArray(files) ? files : [files];
  const newDocs: Document[] = fileArray.map(file => ({
    id: crypto.randomUUID(),
    nombre: file.name,
    file,
    url: URL.createObjectURL(file),
  }));

  setProyecto(prev => {
    if (!prev) return prev;
    const unidadesActualizadas = prev.unidades.map(u => {
      if (u.id !== unidadId) return u;
      if (field === 'imagenes') {
        // Galería (array)
        return { ...u, imagenes: [...(u.imagenes || []), ...newDocs] };
      } else {
        // Render, Isometrico, Plano (solo uno, tomamos el primero)
        return { ...u, [field]: newDocs[0] };
      }
    });
    return { ...prev, unidades: unidadesActualizadas };
  });

  setUnidad(prev => {
    if (!prev || prev.id !== unidadId) return prev;
    if (field === 'imagenes') {
      return { ...prev, imagenes: [...(prev.imagenes || []), ...newDocs] } as Unidad;
    } else {
      return { ...prev, [field]: newDocs[0] } as Unidad;
    }
  });
};


console.log(unidad)
/**
 * Súper‐handler para eliminar un documento de cualquiera
 * de los campos de imagen de Unidad.
 */
const handleUnidadFileRemove = (
  unidadId: string,
  field: keyof Pick<Unidad, 'render' | 'isometrico' | 'plano' | 'imagenes'>,
  docId: string
) => {
  setProyecto(prev => {
    if (!prev) return prev;
    const unidadesActualizadas = prev.unidades.map(u => {
      if (u.id !== unidadId) return u;
      // Para campos array
      if (field === 'imagenes') {
        return {
          ...u,
          imagenes: (u.imagenes || []).filter((d: Document) => d.id !== docId)
        };
      }
      // Para campos de archivo único
      if (field === 'render' || field === 'isometrico' || field === 'plano') {
        // Si coincide el id, lo elimina (lo pone undefined o null)
        if ((u[field] as Document)?.id === docId) {
          return {
            ...u,
            [field]: undefined
          };
        }
      }
      return u;
    });
    return { ...prev, unidades: unidadesActualizadas };
  });

  setUnidad(prev => {
    if (!prev || prev.id !== unidadId) return prev;
    if (field === 'imagenes') {
      return {
        ...prev,
        imagenes: (prev.imagenes || []).filter((d: Document) => d.id !== docId)
      };
    }
    if (field === 'render' || field === 'isometrico' || field === 'plano') {
      if ((prev[field] as Document)?.id === docId) {
        return {
          ...prev,
          [field]: undefined
        };
      }
    }
    return prev;
  });
};



const [confirmEliminarProyectoOpen, setConfirmEliminarProyectoOpen] = useState(false);

  const handleActualizarProyecto = async (proyecto: Proyecto | null): Promise<void> => {
    onSave(proyecto!)
  };
  const  handleEliminarProyecto = async (): Promise<void> => {
  async (proyecto: Proyecto) => {
    try {
      await eliminarProyecto(proyecto);
      showStatus('Proyecto eliminada exitosamente', 'success');
      setConfirmEliminarProyectoOpen(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      showStatus(
        err?.message
          ? `Error al eliminar el Proyecto: ${err.message}`
          : 'Error al eliminar el Proyecto',
        'error'
      );
    }
  };
}

useEffect(() => {
  if (selectedTab === 1 && unidad === null && proyecto) {
    setUnidad(makeInitialUnidad(userid, proyecto.id));
  }
}, [selectedTab, unidad, proyecto, userid]);
  return (
    <Dialog open={open} onClose={()=>{}} fullScreen={false}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '90vw',
          height: '90vh',
          maxWidth: '90vw',
          maxHeight: '90vh',
          m: 0,
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
          color: 'white',
          backgroundColor: 'var(--secondary-color)',
        }}
      >
          <Typography>{proyecto!.nombre || "Proyecto"}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

      <DialogContent dividers>
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
          <Tab label="Stacking Plan" />
        </Tabs>

          {selectedTab === 0 && (
            <>
             <ProyectoGeneralTab
                proyecto={proyecto!}
                setProyecto={setProyecto}
              />
            </>
          )}

          {selectedTab === 1 && (
            <>
            <ProyectoUnidadesTab
              proyecto={proyecto!}
              unidad={unidad!}
              extrasKeys={extrasKeys}
              handleChangeUnidad={handleChangeUnidad}
              handleAddExtraKey={handleAddExtraKey}
              handleChangeExtraKey={handleChangeExtraKey}
              handleChangeExtraValue={handleChangeExtraValue}
              handleRemoveExtraKey={handleRemoveExtraKey}
              handleFileChange={handleUnidadFileChange}
              handleFileRemove={handleUnidadFileRemove}
              handleAddUnidad={handleAddUnidad}
              handleEditUnidad={handleEditUnidad}
              handleDeleteUnidad={handleDeleteUnidad}
              userid={userid}
              setProyecto={setProyecto}
            />
            </>
          )}
          {selectedTab === 2 && proyecto && (
            <ProyectoPlanesPagoTab
              proyecto={proyecto}
              handleDeliveryDateChange={handleDeliveryDateChange}
              handleAddPaymentPlanRow={handleAddPaymentPlanRow}
              handlePaymentPlanChange={handlePaymentPlanChange}
              handleParcialidadChange={handleParcialidadChange}
              handleDeletePaymentPlanRow={handleDeletePaymentPlanRow}
            />
          )}
          {selectedTab === 3 && proyecto && (
            <ProyectoStackingTab
              proyecto={proyecto}
              setProyecto={setProyecto}
              readOnly={false} // en true lo muestra sin drag (modo cliente)
            />
          )}

          

       
      </DialogContent>
      <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: 'var(--error-color, #f44336)',
                color: '#fff',
                '&:hover': { backgroundColor: '#b71c1c' },
              }}
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmEliminarProyectoOpen(true)}
            >
              Eliminar
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: 'var(--secondary-color)',
                color: '#fff',
                '&:hover': { backgroundColor: 'var(--primary-color)' },
              }}
              startIcon={<SaveIcon />}
              onClick={()=>handleActualizarProyecto(proyecto)}
            >
              Guardar
            </Button>
          </DialogActions>
          <Dialog open={confirmEliminarProyectoOpen} onClose={() => setConfirmEliminarProyectoOpen(false)} maxWidth="xs">
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogContent dividers>
              <Typography>
                ¿Estás seguro de que deseas eliminar el proyecto <b>{proyecto?.nombre}</b>?
                Esta acción no se puede deshacer.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmEliminarProyectoOpen(false)}>Cancelar</Button>
              <Button
                color="error"
                variant="contained"
                onClick={async () => {
                  await handleEliminarProyecto();
                  setConfirmEliminarProyectoOpen(false);
                }}
              >
                Sí, eliminar
              </Button>
            </DialogActions>
          </Dialog>
    </Dialog>
  );
};

export default ProyectoControlModal;
