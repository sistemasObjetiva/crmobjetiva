import { supabase } from "./supabase";
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";




export const signInWithEmail = async (
  email: string,
  password: string,
  navigate: (path: string) => void
) => {
  try {
    console.log("🔍 Intentando iniciar sesión...");

    // 🔹 Intentamos loguear al usuario en Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("❌ Error al iniciar sesión:", error.message);
      alert("Correo o contraseña incorrectos.");
      return;
    }

    console.log("✅ Usuario autenticado correctamente:", data);
    navigate("/inicio"); // Redirige a la página de inicio

  } catch (err) {
    console.error("❌ Error en el proceso de autenticación:", err);
    alert("Hubo un error al iniciar sesión.");
  }
};





export const signOut = async () => {
  await supabase.auth.signOut();
};

export const getUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error al obtener usuario:", error.message);
    return null;
  }
  return data.user;
};

export const useAuthRole = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
          console.warn("❌ Usuario no autenticado. Redirigiendo a /");
          navigate("/");
          return;
        }

        setUser(data.user);

        // 🔍 Buscar en la tabla "users" si el usuario existe
        const { data: userData, error: userDbError } = await supabase
          .from("users")
          .select("rol")
          .eq("id", data.user.id)
          .single();

        if (userDbError || !userData) {
          console.warn("❌ Usuario no encontrado en la tabla 'users'. Redirigiendo a /");
          navigate("/");
          return;
        }

        setRole(userData.rol || "Usuario");
      } catch (err) {
        console.error("❌ Error al verificar el usuario:", err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  return { user, role, loading };
};
