import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ImageIcon from '@mui/icons-material/Image';

import { Proyecto } from '../../config/types';
import ProyectoGeneralTab from './ProyectoGeneralTab';
import ProyectoPlanesPagoTab from './ProyectoPlanesPAgoTabs';
import ProyectoUnidadesTab from './ProyectoUnidadesTab';
import ProyectoStackingTab from './ProyectoStackingTab';

interface ProyectoWizardProps {
  proyecto: Proyecto;
  open: boolean;
  onClose: () => void;
  onSave: (proyecto: Proyecto) => void;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  userid: string;
  // Props adicionales para unidades
  unidad: any;
  extrasKeys: string[];
  handleChangeUnidad: any;
  handleAddExtraKey: any;
  handleChangeExtraKey: any;
  handleChangeExtraValue: any;
  handleRemoveExtraKey: any;
  handleReorderExtraKeys: any;
  handleFileChange: any;
  handleFileRemove: any;
  handleAddUnidad: any;
  handleEditUnidad: any;
  handleDeleteUnidad: any;
}

const steps = [
  { label: 'Información General', icon: <InfoIcon /> },
  { label: 'Planes de Pago', icon: <AttachMoneyIcon /> },
  { label: 'Unidades', icon: <HomeWorkIcon /> },
  { label: 'Visualización', icon: <ImageIcon /> },
];

const ProyectoWizard: React.FC<ProyectoWizardProps> = ({
  proyecto,
  open,
  onClose,
  onSave,
  setProyecto,
  userid,
  unidad,
  extrasKeys,
  handleChangeUnidad,
  handleAddExtraKey,
  handleChangeExtraKey,
  handleChangeExtraValue,
  handleRemoveExtraKey,
  handleReorderExtraKeys,
  handleFileChange,
  handleFileRemove,
  handleAddUnidad,
  handleEditUnidad,
  handleDeleteUnidad,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      // Último paso: guardar
      handleSave();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSave = () => {
    onSave(proyecto);
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: // General
        return proyecto.nombre.trim() !== '';
      case 1: // Planes
        return proyecto.paymentPlans && proyecto.paymentPlans.length > 0;
      case 2: // Unidades
        return true; // Opcional
      case 3: // Stacking
        return true; // Opcional
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <ProyectoGeneralTab proyecto={proyecto} setProyecto={setProyecto} />;
      case 1:
        return (
          <ProyectoPlanesPagoTab
            proyecto={proyecto}
            setProyecto={setProyecto}
          />
        );
      case 2:
        return (
          <ProyectoUnidadesTab
            proyecto={proyecto}
            unidad={unidad}
            extrasKeys={extrasKeys}
            handleChangeUnidad={handleChangeUnidad}
            handleAddExtraKey={handleAddExtraKey}
            handleChangeExtraKey={handleChangeExtraKey}
            handleChangeExtraValue={handleChangeExtraValue}
            handleRemoveExtraKey={handleRemoveExtraKey}
            handleReorderExtraKeys={handleReorderExtraKeys}
            handleFileChange={handleFileChange}
            handleFileRemove={handleFileRemove}
            handleAddUnidad={handleAddUnidad}
            handleEditUnidad={handleEditUnidad}
            handleDeleteUnidad={handleDeleteUnidad}
            userid={userid}
            setProyecto={setProyecto}
          />
        );
      case 3:
        return (
          <ProyectoStackingTab
            proyecto={proyecto}
            setProyecto={setProyecto}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'var(--primary-color)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {proyecto.id && proyecto.nombre ? `Editando: ${proyecto.nombre}` : 'Nuevo Proyecto'}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Stepper */}
      <Box sx={{ p: 3, bgcolor: '#f5f5f5' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor:
                        activeStep === index
                          ? 'var(--secondary-color)'
                          : activeStep > index
                          ? 'var(--primary-color)'
                          : '#ccc',
                      color: 'white',
                      transition: 'all 0.3s',
                    }}
                  >
                    {step.icon}
                  </Box>
                )}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <DialogContent
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          bgcolor: '#fafafa',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            minHeight: 400,
          }}
        >
          {renderStepContent()}
        </Paper>
      </DialogContent>

      {/* Footer con navegación */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<ArrowBackIcon />}
        >
          Anterior
        </Button>

        <Typography variant="body2" color="text.secondary">
          Paso {activeStep + 1} de {steps.length}
        </Typography>

        <Stack direction="row" spacing={1}>
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed()}
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: 'var(--secondary-color)',
                '&:hover': { bgcolor: 'var(--primary-color)' },
              }}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!canProceed()}
              startIcon={<SaveIcon />}
              sx={{
                bgcolor: 'var(--secondary-color)',
                '&:hover': { bgcolor: 'var(--primary-color)' },
              }}
            >
              Guardar Proyecto
            </Button>
          )}
        </Stack>
      </Box>
    </Dialog>
  );
};

export default ProyectoWizard;
