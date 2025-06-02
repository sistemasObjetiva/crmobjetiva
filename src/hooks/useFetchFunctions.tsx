import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Usuario,Seguimiento,Proyecto,Propiedad } from '../types/types';

export const useFetchUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const fetchUsuarios = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error obteniendo usuarios:', error.message);
    } else {
      setUsuarios(data || []);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return { usuarios, fetchUsuarios };
};

const projectId = import.meta.env.VITE_SUPABASE_PROJ_ID;

export const deleteUsuario = async (userId: string): Promise<{ success: boolean; message?: string }> => {
  if (!userId) {
    console.error("❌ Error: userId es undefined");
    return { success: false, message: "Error: No se pudo eliminar el usuario." };
  }
  try {
    console.log(`🛠️ Eliminando usuario ${userId} del proyecto ${projectId}`);
    const response = await fetch(`https://serverobjetiva.vercel.app/delete-user-alt/${projectId}/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || "No se pudo eliminar el usuario." };
    }

    return { success: true, message: "✅ Usuario eliminado correctamente." };
  } catch (error: any) {
    console.error("❌ Error eliminando usuario:", error.message);
    return { success: false, message: `Hubo un error al eliminar el usuario: ${error.message}` };
  }
};

export const actualizarUsuario = async (usuario: Usuario, role: string,isNewUser: boolean): Promise<{ success: boolean; message: string } | null> => {
  if (!usuario || !usuario.correoElectronico || !usuario.nombreCompleto || (isNewUser && !usuario.contrasena)) {
    console.error("❌ Error: Datos incompletos del usuario.");
   //alert("Error: Faltan datos del usuario.");
   return { success: false, message: "Error: Faltan datos del usuario." };
  }if (role !== "Gerente") {
    //alert("❌ No tienes permisos para registrar o actualizar usuarios.");
    return { success: false, message: "❌ No tienes permisos para registrar o actualizar usuarios." };
  }
  try {
    console.log(`🛠️ Creando/actualizando usuario ${usuario.id} en el proyecto ${projectId}...`);
    const response = await fetch(`https://serverobjetiva.vercel.app/upsert-user-alt/${projectId}`, {
      method: "PUT", // ✅ Usamos PUT para crear o actualizar
      headers: {
        "Content-Type": "application/json",
      },
      
      body: JSON.stringify(usuario),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "No se pudo actualizar el usuario.");
    }

    //alert("✅ Usuario creado o actualizado correctamente.");
    return { success: true, message: `✅ Usuario ${isNewUser ? 'creado' : 'actualizado'} correctamente.` };
  } catch (error: any) {
    console.error("❌ Error actualizando usuario:", error.message);
    //alert("Hubo un error al actualizar el usuario.");
    return { success: false, message: `Hubo un error al ${isNewUser ? 'crear' : 'actualizar'} el usuario: ${error.message}` };
  }
};





//**************************************************************************************************************************** */
//***********************************************CLENTES********************************************************************** */

export const useFetchClientes = () => {
  const [clientes, setClientes] = useState<any[]>([]);

  const fetchClientes = async () => {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
      console.error('Error obteniendo clientes:', error.message);
    } else {
      setClientes(data || []);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return { clientes, fetchClientes };
};

// ✅ Eliminar cliente
export const deleteCliente = async (clienteId: string): Promise<{ success: boolean; message: string }> => {
  const { error } = await supabase.from('clients').delete().eq('id', clienteId);
  if (error) {
    console.error('Error eliminando cliente:', error.message);
    return { success: false, message: `Error al eliminar el cliente: ${error.message}` };
  }
  return { success: true, message: 'Cliente eliminado correctamente.' };
};

// ✅ Actualizar cliente
export const actualizarCliente = async (
  cliente: any,
  email: string
): Promise<{ success?: boolean; message?: string } | null> => {
  try {
    // 1️⃣ Validar que el número de celular no esté vacío
    if (!cliente?.celular) {
      console.error("❌ Error: El número de celular es obligatorio.");
      return { success: false, message: "El número de celular es obligatorio." };
    }

    // 2️⃣ Normalizar el número de celular
    const celularNormalizado = cliente.celular.replace(/\D/g, "");

    // 3️⃣ Si el `id` está vacío o `null`, lo eliminamos para que Supabase lo genere
    const clienteData = { ...cliente, celular: celularNormalizado, correoUsuario: email };
    if (!cliente.id) {
      delete clienteData.id;
    }
    console.log("🧪 proyectosInteres:", cliente.proyectosInteres, typeof cliente.proyectosInteres);

    // 4️⃣ Intentamos hacer `upsert` para insertar o actualizar en un solo paso
    const { data, error } = await supabase
      .from("clients")
      .upsert(clienteData, { onConflict: "id" }) // Si ya existe un cliente con el mismo celular, lo actualiza
      .select()
      .single();

    // 5️⃣ Manejo de errores de Supabase
    if (error) {
      console.error("❌ Error al actualizar/crear cliente en Supabase:", error);
      return { success: false, message: `Error en Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: `Cliente ${data?.nombreCompleto} ${cliente.id ? "actualizado" : "creado"} correctamente.`,
    };
  } catch (error: any) {
    console.error("❌ Error en actualizarCliente:", error.message);
    return { success: false, message: `Error al procesar el cliente: ${error.message}` };
  }
};

//************************************************************************************************************************
// ********************************************SEGUIMIENTOS*************************************************************** */
export const useFetchSeguimientos = () => {
  const [seguimientos, setSeguimientos] = useState<any[]>([]);

  const fetchSeguimientos = async () => {
    const { data, error } = await supabase.from('seguimientos').select('*');
    if (error) {
      console.error('Error obteniendo seguimientos:', error.message);
    } else {
      setSeguimientos(data || []);
    }
  };

  useEffect(() => {
    fetchSeguimientos();
  }, []);

  return { seguimientos, fetchSeguimientos };
};

export const actualizarSeguimiento = async (
  seguimiento: Seguimiento
): Promise<{ success?: string; error?: string }> => {
  try {
    // 1️⃣ Verifica que el seguimiento tiene un idCliente válido
    if (!seguimiento.idCliente) {
      return { error: "El seguimiento debe estar asociado a un cliente." };
    }

    // 2️⃣ Si el ID está vacío o es null, lo eliminamos para que Supabase genere uno nuevo
    const seguimientoData = { ...seguimiento };
    if (!seguimiento.id) {
      delete seguimientoData.id;
    }

    // 3️⃣ Agregar nueva actualización al historial
    const nuevaActualizacion = {
      fechaActualizacion: new Date().toISOString(),
      comentarios: seguimiento.comentarios || "Sin comentarios",
      temperaturaInteres: seguimiento.temperaturaInteres || "No especificada",
    };

    // 4️⃣ Verificar que `actualizaciones` sea un array antes de actualizar
    if (!Array.isArray(seguimiento.actualizaciones)) {
      seguimientoData.actualizaciones = [nuevaActualizacion]; // Si no existe, inicializamos con la nueva actualización
    } else {
      seguimientoData.actualizaciones = [...seguimiento.actualizaciones, nuevaActualizacion];
    }

    // 5️⃣ Asegurar que el idCliente es válido
    seguimientoData.idCliente = seguimiento.idCliente;

    // 6️⃣ Hacer `upsert` en Supabase
    const { data, error } = await supabase
      .from("seguimientos")
      .upsert(seguimientoData, { onConflict: "id" }) // Actualiza si el ID ya existe
      .select()
      .single();

    // 7️⃣ Manejo de errores
    if (error) {
      console.error("❌ Error al actualizar seguimiento en Supabase:", error);
      return { error: `Error en Supabase: ${error.message}` };
    }

    return { success: `Seguimiento ${data.id ? "actualizado" : "creado"} correctamente.` };
  } catch (error: any) {
    console.error("❌ Error en actualizarSeguimiento:", error.message);
    return { error: `Error al procesar el seguimiento: ${error.message}` };
  }
};

export const deleteSeguimiento = async (seguimientoId: string): Promise<{ success?: boolean; message?: string }> => {
  if (!seguimientoId) {
    return { success: false, message: "ID del seguimiento inválido." };
  }
  try {
    const { error } = await supabase.from("seguimientos").delete().eq("id", seguimientoId);

    if (error) {
      console.error("❌ Error eliminando seguimiento:", error);
      return { success: false, message: `Error en Supabase: ${error.message}` };
    }

    return { success: true, message: "Seguimiento eliminado correctamente." };
  } catch (error: any) {
    console.error("❌ Error en deleteSeguimiento:", error.message);
    return { success: false, message: `Error al eliminar seguimiento: ${error.message}` };
  }
};



export const useFetchProyectos = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);

  const fetchProyectos = async () => {
    const { data, error } = await supabase.from('proyectos').select('*');
    if (error) {
      console.error('Error obteniendo proyectos:', error.message);
    } else {
      setProyectos(data || []);
    }
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  return { proyectos, fetchProyectos };
};
export const subirImagenesProyecto = async (proyecto: Proyecto): Promise<Proyecto> => {
  console.error("entre a subirImagenesProyecto");
  if (!proyecto || !proyecto.nombreProyecto) {
    console.error("❌ Error: Proyecto inválido. subirImagenesProyecto");
    return proyecto;
  }

  let updatedProyecto = { ...proyecto };

  const imageFields: (keyof Proyecto)[] = ["logo", "fachada"]; // ✅ Solo logo y fachada

  const uploadPromises = imageFields.map(async (field) => {
    const base64String = proyecto[field] as string;
    if (!base64String.startsWith("data:image")) return; // 🛑 Evita imágenes ya subidas

    try {
      const filePath = `${proyecto.nombreProyecto}/${field}.jpg`;
      console.log("filepath",filePath);
      const imageBlob = base64ToBlob(base64String, "image/jpeg");

      // ✅ Subimos la imagen al bucket "proyectos"
      const { error } = await supabase.storage
        .from("proyectos")
        .upload(filePath, imageBlob, { contentType: "image/jpeg" });

      if (error) throw error;

      // ✅ Obtenemos la URL pública después de subirla
      const { data } = supabase.storage.from("proyectos").getPublicUrl(filePath);
      updatedProyecto = { ...updatedProyecto, [field]: data.publicUrl };
    } catch (error) {
      console.error(`❌ subirImagenesProyecto Error al subir la imagen ${field}:`, error);
    }
  });

  await Promise.all(uploadPromises);
  return updatedProyecto;
};
export const subirImagenesUnidades = async (unidades: any[], nombreProyecto: string) => {
  if (!Array.isArray(unidades)) return [];
  console.log("entre a subirImagenesUnidades");
  const unidadesActualizadas = await Promise.all(
    unidades.map(async (unidad) => {
      if (!unidad || typeof unidad !== "object") return unidad;

      let unidadActualizada = { ...unidad };

      if (unidad.imagenes && Array.isArray(unidad.imagenes)) {
        unidadActualizada.imagenes = await Promise.all(
          unidad.imagenes.map(async (img: string, imgIndex: number) => {
            if (typeof img === "string" && img.startsWith("data:image")) {
              try {
                const fileName = `unidad_${unidad.numerounidad}_${imgIndex}.jpg`;
                const storagePath = `proyectos/${nombreProyecto}/unidades/${fileName}`;

                const imageBlob = base64ToBlob(img, "image/jpeg");

                // ✅ Subimos la imagen al bucket "proyectos"
                const { error } = await supabase.storage
                  .from("proyectos")
                  .upload(storagePath, imageBlob, { contentType: "image/jpeg" });

                if (error) throw error;

                // ✅ Obtenemos la URL pública
                const { data } = supabase.storage.from("proyectos").getPublicUrl(storagePath);
                console.log("imagen unidad correcta");
                return { name: fileName, data: data.publicUrl };
              } catch (error) {
                console.error(`❌ Error al subir la imagen de la unidad ${unidad.numerounidad}:`, error);
                return { name: `unidad_${unidad.numerounidad}_${imgIndex}.jpg`, data: img };
              }
            }
            return img;
          })
        );
      }

      return unidadActualizada;
    })
  );

  return unidadesActualizadas;
};


const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64.split(",")[1]);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }

  const byteArray = new Uint8Array(byteArrays);
  return new Blob([byteArray], { type: mimeType });
};

export const actualizarProyecto = async (proyecto: Proyecto, usermail: string): Promise<{ success: boolean; message: string } | null> => {
  if (!proyecto || !proyecto.nombreProyecto) {
    return { success: false, message: "Error: El proyecto no tiene nombre." };
  }

  try {
    // Subir imágenes para logo y fachada
    let updatedProyecto = await subirImagenesProyecto(proyecto);

    // Opcional: verificación de duplicados según nombre
    const { data: existingProjects, error: fetchError } = await supabase
      .from('proyectos')
      .select('id')
      .eq('nombreProyecto', proyecto.nombreProyecto);

    if (fetchError) {
      console.error("Error al verificar proyecto existente:", fetchError.message);
      return { success: false, message: `Error al verificar proyecto existente: ${fetchError.message}` };
    } else if (existingProjects && existingProjects.length > 0 && (!proyecto.id || existingProjects[0].id !== proyecto.id)) {
      console.warn("⚠️ Ya existe un proyecto con este nombre.");
      updatedProyecto.id = existingProjects[0].id; // Decide cómo manejar duplicados
      // Podemos no retornar un error aquí y permitir la actualización del existente
    }

    // Subir imágenes de las unidades (si las hay)
    if (updatedProyecto.unidades && updatedProyecto.unidades.length > 0) {
      updatedProyecto.unidades = await subirImagenesUnidades(updatedProyecto.unidades, updatedProyecto.nombreProyecto);
    }

    // Validar la id
    if (!updatedProyecto.id || (typeof updatedProyecto.id === "string" && updatedProyecto.id.trim() === "")) {
      delete updatedProyecto.id;
    }

    // Asignar el correo del usuario
    if (!updatedProyecto.correoUsuario || typeof updatedProyecto.correoUsuario !== "string" || updatedProyecto.correoUsuario.trim() === "") {
      updatedProyecto.correoUsuario = usermail;
    }

    // Upsert del proyecto
    const { error } = await supabase.from('proyectos').upsert(updatedProyecto, { onConflict: 'id' });

    if (error) {
      return { success: false, message: `Error al guardar el proyecto: ${error.message}` };
    }

    return { success: true, message: "Proyecto guardado correctamente." };

  } catch (error: any) {
    console.error("❌ Error al manejar el proyecto en Supabase:", error);
    return { success: false, message: `Error al manejar el proyecto: ${error?.message || 'Error desconocido'}` };
  }
};

export const eliminarProyecto = async (proyecto: Proyecto): Promise<{ success: boolean; message: string } | null> => {
  if (!proyecto || !proyecto.id) {
    return { success: false, message: "Error: El proyecto no tiene un id válido." };
  }
  try {
    // Realizar la eliminación utilizando el id del proyecto
    const { error } = await supabase
      .from('proyectos')
      .delete()
      .match({ id: proyecto.id });

    if (error) {
      console.error("❌ Error al eliminar el proyecto en Supabase:", error.message);
      return { success: false, message: `Error al eliminar el proyecto: ${error.message}` };
    }

    return { success: true, message: "Proyecto eliminado correctamente" };
  } catch (error: any) {
    console.error("❌ Error al eliminar el proyecto en Supabase:", error);
    return { success: false, message: `Error al eliminar el proyecto: ${error?.message || 'Error desconocido'}` };
  }
};


export const useFetchPropiedades = () => {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPropiedades = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.from("propiedades").select("*");
    //console.log("estoy en useFetchPropiedades: ",data);
    if (error) {
      console.error("❌ Error obteniendo propiedades:", error.message);
      setError("Error al obtener propiedades.");
    } else {
      setPropiedades(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPropiedades();
  }, []);

  return { propiedades, fetchPropiedades, loading, error };
};

export const eliminarPropiedades = async (propiedad: Propiedad): Promise<{ success?: string; error?: string }> => {
  try {
    if (!propiedad.tituloPropiedad) {
      return { error: "El título de la propiedad es obligatorio." };
    }
    // Realizar la eliminación utilizando el id del proyecto
    const { error } = await supabase
      .from('propiedades')
      .delete()
      .match({ id: propiedad.id });

    if (error) {
      console.error("❌ Error al eliminar la propiedad:", error.message);
      return { error: `Error al eliminar la propiedad: ${error.message || 'Error desconocido'}` };
    }

    return { success: `Propiedad eliminada correctamente.` };
  } catch (error: any) {
    console.error("❌ Error al eliminar la propiedad en Supabase:", error);
    return { error: `Error al eliminar la propiedad: ${error.message || 'Error desconocido'}` };
  }
};

export const actualizarPropiedad = async (
  propiedad: Propiedad
): Promise<{ success?: string; error?: string }> => {
  try {
    if (!propiedad.tituloPropiedad) {
      return { error: "El título de la propiedad es obligatorio." };
    }

    const propiedadData = { ...propiedad };
    const userID = propiedadData.userID || "usuario_desconocido";

    delete propiedadData.userID;

    const isUpdate = !!propiedadData.id;
    let supabaseError;
    const action = isUpdate ? "actualizada" : "creada";

    if (!isUpdate) {
      delete propiedadData.id;
      propiedadData.creado_por = userID;
      propiedadData.fecha_creacion = new Date().toISOString();
    } else {
      const { data: existingProperty } = await supabase
        .from("propiedades")
        .select("id")
        .eq("id", propiedadData.id)
        .single();

      if (!existingProperty) {
        return { error: `No se encontró la propiedad con ID: ${propiedadData.id}. Imposible actualizar.` };
      }
    }

    propiedadData.actualizado_por = userID;
    propiedadData.fecha_actualizacion = new Date().toISOString();

    if (Array.isArray(propiedad.imagenes)) {
      const imagenesSubidas = await Promise.all(
        propiedad.imagenes.map(async (img) => {
          if (typeof img === "string") {
            if (img.startsWith("data:image")) {
              return await subirImagenPropiedad(img, propiedad.tituloPropiedad);
            } else if (img.includes("supabase.co/storage/v1/object/public/propiedades/")) {
              return img;
            }
          }
          return null;
        })
      );

      propiedadData.imagenes = imagenesSubidas.filter((url) => typeof url === "string");
    }

    const { error } = await supabase
      .from("propiedades")
      .upsert(propiedadData, { onConflict: "id" })
      .select()
      .single();

    supabaseError = error;

    if (supabaseError) {
      console.error(`❌ Error al ${action} propiedad en Supabase:`, supabaseError);
      return { error: `Error en Supabase al ${action} la propiedad: ${supabaseError.message}` };
    }

    return { success: `Propiedad ${action} correctamente.` };
  } catch (error: any) {
    console.error("❌ Error en actualizarPropiedad:", error.message);
    return { error: `Error al procesar la propiedad: ${error.message}` };
  }
};

export const subirImagenPropiedad = async (base64Image: string, nombrePropiedad: string): Promise<string> => {
  try {
    console.log("entre a subirImagenPropiedad");
    // 1️⃣ Validar que la imagen sea en formato base64
    if (!base64Image.startsWith("data:image")) {
      console.error("❌ El archivo no es una imagen válida.");
      return "";
    }

    // 2️⃣ Convertir Base64 a Blob
    const imageBlob = base64ToBlob(base64Image, "image/jpeg");

    // 3️⃣ Generar el nombre del archivo
    const timestamp = new Date().getTime(); // Para evitar nombres repetidos
    const filePath = `propiedades/${nombrePropiedad}/imagen_${timestamp}.jpg`;

    // 4️⃣ Subir la imagen a Supabase Storage
    const { error } = await supabase.storage
      .from("propiedades") // 📂 Asegúrate de que "propiedades" sea tu bucket en Supabase
      .upload(filePath, imageBlob, { contentType: "image/jpeg" });

    if (error) throw error;

    // 5️⃣ Obtener la URL pública de la imagen subida
    const { data } = supabase.storage.from("propiedades").getPublicUrl(filePath);
    
    console.log("✅ Imagen subida con éxito:", data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error("❌ Error al subir imagen de propiedad:", error);
    return "";
  }
};

