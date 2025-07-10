// src/components/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Extraer el token del hash de la URL (opcional, ya que Supabase lo procesa internamente)
  useEffect(() => {
    // Podrías loguear el contenido del hash para verificar que existe
    if (location.hash) {
      console.log('Token recibido:', location.hash);
    }
  }, [location]);

  // Función para actualizar la contraseña del usuario
  const handlePasswordReset = async () => {
    if (!newPassword) {
      setMessage('Por favor, ingresa una nueva contraseña.');
      return;
    }

    // La sesión de recuperación debería haber sido creada al ingresar con el token.
    // Actualizamos la contraseña mediante updateUser.
    const {  error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Contraseña actualizada exitosamente. Redirigiendo...');
      // Puedes limpiar el hash en la URL o redirigir a la página de login
      setTimeout(() => {
        navigate('/login'); // O la ruta que consideres para continuar
      }, 2000);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <h2>Restablecer Contraseña</h2>
      <input
        type="password"
        placeholder="Nueva contraseña"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
      />
      <button
        onClick={handlePasswordReset}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      >
        Actualizar Contraseña
      </button>
      {message && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f8d7da', color: '#721c24' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ResetPasswordPage;
