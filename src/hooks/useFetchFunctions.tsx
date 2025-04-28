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

export const deleteUsuario = async (userId: string): Promise<void> => {
  if (!userId) {
    console.error("❌ Error: userId es undefined");
    alert("Error: No se pudo eliminar el usuario.");
    return;
  }

  try {
    console.log(`🛠️ Eliminando usuario ${userId} del proyecto ${projectId}`);

    const response = await fetch(`https://wichoserver.vercel.app/delete-user/${projectId}/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("No se pudo eliminar el usuario.");
    }

    alert("✅ Usuario eliminado correctamente.");
  } catch (error: any) {
    console.error("❌ Error eliminando usuario:", error.message);
    alert("Hubo un error al eliminar el usuario.");
  }
};







export const actualizarUsuario = async (usuario: Usuario, role: string): Promise<void> => {
  if (!usuario || !usuario.correoElectronico || !usuario.nombreCompleto || !usuario.contrasena) {
    console.error("❌ Error: Datos incompletos del usuario.");
    alert("Error: Faltan datos del usuario.");
    return;
  }

  if (role !== "Gerente") {
    alert("❌ No tienes permisos para registrar o actualizar usuarios.");
    return;
  }

  try {
    console.log(`🛠️ Creando/actualizando usuario ${usuario.id} en el proyecto ${projectId}...`);

    const response = await fetch(`https://wichoserver.vercel.app/upsert-user/${projectId}`, {
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

    alert("✅ Usuario creado o actualizado correctamente.");
  } catch (error: any) {
    console.error("❌ Error actualizando usuario:", error.message);
    alert("Hubo un error al actualizar el usuario.");
  }
};








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
export const deleteCliente = async (clienteId: string): Promise<void> => {
  const { error } = await supabase.from('clients').delete().eq('id', clienteId);
  if (error) {
    console.error('Error eliminando cliente:', error.message);
  }
};

// ✅ Actualizar cliente
export const actualizarCliente = async (
  cliente: any, 
  email: string
): Promise<{ success?: string; error?: string }> => {
  try {
    // 1️⃣ Validar que el número de celular no esté vacío
    if (!cliente?.celular) {
      return { error: "El número de celular es obligatorio." };
    }

    // 2️⃣ Normalizar el número de celular
    const celularNormalizado = cliente.celular.replace(/\D/g, "");

    // 3️⃣ Si el `id` está vacío o `null`, lo eliminamos para que Supabase lo genere
    const clienteData = { ...cliente, celular: celularNormalizado, correoUsuario: email };
    if (!cliente.id) {
      delete clienteData.id;
    }

    // 4️⃣ Intentamos hacer `upsert` para insertar o actualizar en un solo paso
    const { data, error } = await supabase
      .from("clients")
      .upsert(clienteData, { onConflict: "celular" }) // Si ya existe un cliente con el mismo celular, lo actualiza
      .select()
      .single();

    // 5️⃣ Manejo de errores
    if (error) {
      console.error("❌ Error al actualizar/crear cliente en Supabase:", error);
      return { error: `Error en Supabase: ${error.message}` };
    }

    return { success: `Cliente ${data.nombreCompleto} ${cliente.id ? "actualizado" : "creado"} correctamente.` };
  } catch (error: any) {
    console.error("❌ Error en actualizarCliente:", error.message);
    return { error: `Error al procesar el cliente: ${error.message}` };
  }
};


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

export const deleteSeguimiento = async (seguimientoId: string): Promise<{ success?: string; error?: string }> => {
  if (!seguimientoId) {
    return { error: "ID del seguimiento inválido." };
  }

  try {
    const { error } = await supabase.from("seguimientos").delete().eq("id", seguimientoId);

    if (error) {
      console.error("❌ Error eliminando seguimiento:", error);
      return { error: `Error en Supabase: ${error.message}` };
    }

    return { success: "Seguimiento eliminado correctamente." };
  } catch (error: any) {
    console.error("❌ Error en deleteSeguimiento:", error.message);
    return { error: `Error al eliminar seguimiento: ${error.message}` };
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
  if (!proyecto || !proyecto.nombreProyecto) {
    console.error("❌ Error: Proyecto inválido.");
    return proyecto;
  }

  let updatedProyecto = { ...proyecto };

  const imageFields: (keyof Proyecto)[] = ["logo", "fachada"]; // ✅ Solo logo y fachada

  const uploadPromises = imageFields.map(async (field) => {
    const base64String = proyecto[field] as string;
    if (!base64String.startsWith("data:image")) return; // 🛑 Evita imágenes ya subidas

    try {
      const filePath = `proyectos/${proyecto.nombreProyecto}/${field}.jpg`;
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
      console.error(`❌ Error al subir la imagen ${field}:`, error);
    }
  });

  await Promise.all(uploadPromises);
  return updatedProyecto;
};
export const subirImagenesUnidades = async (unidades: any[], nombreProyecto: string) => {
  if (!Array.isArray(unidades)) return [];

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

export const actualizarProyecto = async (proyecto: Proyecto, usermail: string): Promise<void> => {
  if (!proyecto || !proyecto.nombreProyecto) {
    console.error("❌ Error: El proyecto no tiene nombre.");
    return;
  }

  try {
    console.log("📤 Subiendo imágenes del proyecto...");

    // Subir imágenes para logo y fachada
    let updatedProyecto = await subirImagenesProyecto(proyecto);

    // Opcional: verificación de duplicados según nombre (solo si 'nombreProyecto' debe ser único)
    const { data: existingProjects, error: fetchError } = await supabase
      .from('proyectos')
      .select('id')
      .eq('nombreProyecto', proyecto.nombreProyecto);
    
    if (fetchError) {
      console.error("Error al verificar proyecto existente:", fetchError.message);
    } else if (existingProjects && existingProjects.length > 0) {
      // Si encontramos un proyecto y la id es diferente de la actual, podemos asignarla para actualizar en lugar de duplicar
      updatedProyecto.id = existingProjects[0].id;
    }

    // Subir imágenes de las unidades (si las hay)
    if (updatedProyecto.unidades && updatedProyecto.unidades.length > 0) {
      updatedProyecto.unidades = await subirImagenesUnidades(updatedProyecto.unidades, updatedProyecto.nombreProyecto);
    }

    // Validar la id: si no es válida, se elimina para forzar inserción
    if (!updatedProyecto.id || (typeof updatedProyecto.id === "string" && updatedProyecto.id.trim() === "")) {
      delete updatedProyecto.id;
    }

    // Asignar el correo del usuario si no está definido
    if (!updatedProyecto.correoUsuario || typeof updatedProyecto.correoUsuario !== "string" || updatedProyecto.correoUsuario.trim() === "") {
      updatedProyecto.correoUsuario = usermail;
    }

    console.log("✅ Imágenes subidas con éxito. Guardando proyecto en Supabase...");

    // Upsert del proyecto. Si existe la id se actualizará, si no se insertará como nuevo.
    const { error } = await supabase.from('proyectos').upsert(updatedProyecto, { onConflict: 'id' });

    if (error) throw error;

    console.log("✅ Proyecto guardado correctamente.");
  } catch (error) {
    console.error("❌ Error al manejar el proyecto en Supabase:", error);
  }
};

export const eliminarProyecto = async (proyecto: Proyecto): Promise<void> => {
  // Verificar que el proyecto tenga un id válido para poder eliminarlo
  if (!proyecto || !proyecto.id) {
    console.error("❌ Error: El proyecto no tiene un id válido.");
    return;
  }

  try {
    console.log("📤 Eliminando el proyecto de Supabase...");

    // Realizar la eliminación utilizando el id del proyecto
    const { error } = await supabase
      .from('proyectos')
      .delete()
      .match({ id: proyecto.id });

    if (error) throw error;

    console.log("✅ Proyecto eliminado correctamente.");
  } catch (error) {
    console.error("❌ Error al eliminar el proyecto en Supabase:", error);
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
export const actualizarPropiedad = async (
  propiedad: Propiedad
): Promise<{ success?: string; error?: string }> => {
  try {
    if (!propiedad.tituloPropiedad) {
      return { error: "El título de la propiedad es obligatorio." };
    }

    const propiedadData = { ...propiedad };
    const userID = propiedadData.userID || "usuario_desconocido";
    
    // Eliminar userEmail de los datos a guardar en la base de datos
    delete propiedadData.userID;
    
    // Comprobar si es una actualización o creación nueva
    if (!propiedadData.id) {
      // Es una nueva propiedad (sin ID)
      delete propiedadData.id; // Asegurar que no hay un ID vacío
      propiedadData.creado_por = userID;
      propiedadData.fecha_creacion = new Date().toISOString();
    } else {
      // Verificar si la propiedad existe para confirmar que es una actualización
      const { data: existingProperty } = await supabase
        .from("propiedades")
        .select("id")
        .eq("id", propiedadData.id)
        .single();
        
      if (!existingProperty) {
        // Si no existe, es una nueva propiedad con ID predefinido
        propiedadData.creado_por = userID;
        propiedadData.fecha_creacion = new Date().toISOString();
      }
    }
    
    // Siempre actualizar el campo de actualización
    propiedadData.actualizado_por = userID;
    propiedadData.fecha_actualizacion = new Date().toISOString();

    // 🔄 Subir imágenes si son Base64 y reemplazar con URL pública
    if (Array.isArray(propiedad.imagenes)) {
      const imagenesSubidas = await Promise.all(
        propiedad.imagenes.map(async (img) => {
          if (typeof img === "string") {
            if (img.startsWith("data:image")) {
              // Es una imagen en Base64, se debe subir
              return await subirImagenPropiedad(img, propiedad.tituloPropiedad);
            } else if (img.includes("https://xyz.supabase.co/storage/v1/object/public/imagenes/")) {
              // Es una imagen ya almacenada en Supabase, mantenerla
              return img;
            }
          }
          return null; // Evitar valores nulos
        })
      );
    
      propiedadData.imagenes = imagenesSubidas.filter((url) => typeof url === "string");
    }

    const {  error } = await supabase
      .from("propiedades")
      .upsert(propiedadData, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("❌ Error al actualizar propiedad en Supabase:", error);
      return { error: `Error en Supabase: ${error.message}` };
    }

    return { success: `Propiedad ${propiedadData.id ? "actualizada" : "creada"} correctamente.` };
  } catch (error: any) {
    console.error("❌ Error en actualizarPropiedad:", error.message);
    return { error: `Error al procesar la propiedad: ${error.message}` };
  }
};


export const subirImagenPropiedad = async (base64Image: string, nombrePropiedad: string): Promise<string> => {
  try {
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

