import React, { useRef } from "react";
import { Button, SxProps } from "@mui/material";

interface CustomButtonProps {
  onClick?: () => void;
  text: string;
  icon?: React.ReactNode;
  sx?: SxProps;
  inputType?: string;
  accept?: string;
  multiple?: boolean;
  onInputChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  onClick,
  text,
  icon,
  sx = {},
  inputType,
  accept,
  multiple,
  onInputChange,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click(); // Simula un clic en el input oculto
    }
    if (onClick) onClick();
  };

  return (
    <>
      <Button
        variant="contained"
        sx={{
          backgroundColor: "var(--primary-color)",
          color: "white",
          "&:hover": {
            backgroundColor: "var(--secondary-color)",
          },
          ...sx, // Permitir estilos personalizados adicionales
        }}
        startIcon={icon}
        onClick={handleButtonClick} // Abre el input al hacer clic en el botón
      >
        {text}
      </Button>

      {/* Input oculto */}
      {inputType && (
        <input
          type={inputType}
          ref={inputRef}
          style={{ display: "none" }}
          accept={accept}
          multiple={multiple} // Asegura que permita seleccionar varios archivos
          onChange={onInputChange}
        />
      )}
    </>
  );
};

export default CustomButton;
