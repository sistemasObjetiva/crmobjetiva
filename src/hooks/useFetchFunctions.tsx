import { useState, useEffect } from 'react';
import type { Proyecto,Document, User, Empresa, Propiedad, Unidad, Prospecto, Seguimiento, SeguimientoHistorial,  } from '../config/types';
import { supabase } from '../config/supabase';

const API_BASE = 'https://serverobjetiva.vercel.app';
const projectId = import.meta.env.VITE_SUPABASE_PROJ_ID;
/////////////////////////////////////////////////USUARIOS////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function useFetchUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supaError } = await supabase
        .from('users')
        .select('*');
      if (supaError) {
      } else {
        setUsuarios(data ?? []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => fetchUsuarios()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { usuarios, loading, error, fetchUsuarios };
}


export const actualizarUsuario = async (usuario: User): Promise<void> => {
  const { id, email,  telefono, role,  nombre,empresaid,estatus} = usuario;
  

  try {
    let userId = id;
    if (!userId) {
      const res = await fetch(
        `${API_BASE}/nupsert-user/${projectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const data: { userId: string; created: boolean } = await res.json();
      console.log("Server respondió:", data);
      userId = data.userId;
    }
    const payload: User = {
      id:          userId,
      email,
      telefono,
      role,
      nombre,
      empresaid,
      estatus,
    };

    const { error } = await supabase
      .from("users")
      .upsert([payload], { onConflict: "id" });

    if (error) throw error;

  } catch (err: any) {
    console.error("❌ Error en actualizarUsuario:", err.message);
  }
};
export const eliminarUsuario = async (
  userId: string
): Promise<void> => {
  if (!projectId || !userId) {
    console.error("❌ Error: faltan projectId o userId");
    return;
  }

  try {
    console.log(`🛠️ Eliminando usuario ${userId} del proyecto ${projectId}`);
    const response = await fetch(
      `${API_BASE}/delete-nuser/${projectId}/${userId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      // Si el servidor responde con código distinto a 2xx, mostramos error
      const errJson = await response.json().catch(() => ({}));
      throw new Error(
        errJson.error || "No se pudo eliminar el usuario en el servidor."
      );
    }

  } catch (error: any) {
    console.error("❌ Error eliminando usuario:", error.message);
  }
};


/////////////////////////////////////////////////Proyectos////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const useFetchProyects = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProyectos = async () => {
    try {
      const { data, error } = await supabase.from("proyectos").select("*");
      if (error) throw error;
      setProyectos(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('proyectos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proyectos' },
        () => fetchProyectos()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { proyectos, loading, error, fetchProyectos };
};


export async function actualizarProyecto(
  proyecto: Proyecto
): Promise<Proyecto> {
  const storage = supabase.storage.from('proyectos')
  const uploaded: string[] = []

  function normalizeFileName(name: string): string {
    // Personaliza si quieres, pero así es seguro para storage
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_.-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
  }

  async function uploadDoc(doc?: Document, carpeta: string = ''): Promise<Document | undefined> {
    if (!doc) return undefined
    if (!doc.file) {
      const { file, ...rest } = doc
      return Object.keys(rest).length ? (rest as Document) : undefined
    }
    const safeName = normalizeFileName(doc.file.name)
    const path = `${proyecto.id}/${carpeta}${carpeta ? '/' : ''}${safeName}`

    // Elimina versión anterior y sube la nueva
    await storage.remove([path]).catch(() => {})
    const { error: upErr } = await storage.upload(path, doc.file, { upsert: true })
    if (upErr) throw upErr
    uploaded.push(path)
    return { id: path, nombre: doc.file.name, url: path, path, bucket: 'proyectos' }
  }

  // 1. Procesa imágenes de proyecto
  const uploadedLogo = proyecto.logo ? await uploadDoc(proyecto.logo, 'logo') : null;
  const uploadedRender = proyecto.render ? await uploadDoc(proyecto.render, 'render') : null;

  // 2. Procesa las unidades
  async function processUnidad(uni: Unidad): Promise<Unidad> {
    // Render, isometrico, plano
    const render = uni.render ? await uploadDoc(uni.render, `unidades/${uni.id}/render`) : undefined
    const isometrico = uni.isometrico ? await uploadDoc(uni.isometrico, `unidades/${uni.id}/isometrico`) : undefined
    const plano = uni.plano ? await uploadDoc(uni.plano, `unidades/${uni.id}/plano`) : undefined

    // Imagenes (galería)
    let imagenes: Document[] = []
    if (Array.isArray(uni.imagenes)) {
      imagenes = await Promise.all(
        uni.imagenes.map(async (img, _) => 
          img ? await uploadDoc(img, `unidades/${uni.id}/imagenes`) : null
        )
      ).then(arr => arr.filter((d): d is Document => !!d))
    }

    return {
      ...uni,
      render,
      isometrico,
      plano,
      imagenes
    }
  }

  const unidadesProcesadas = await Promise.all(
    (proyecto.unidades || []).map(processUnidad)
  )

  // 3. Prepara el nuevo payload del proyecto
  const payload: Proyecto = {
    ...proyecto,
    logo: uploadedLogo as Document | undefined,
    render: uploadedRender as Document | undefined,
    unidades: unidadesProcesadas
  }

  // 4. Sube el proyecto
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .upsert(payload, { onConflict: 'id' })
      .select()
    if (error) throw error
    return data![0]
  } catch (err) {
    // En caso de fallo, limpia todo lo subido
    if (uploaded.length) await storage.remove(uploaded).catch(() => {})
    throw err
  }
}

export async function eliminarProyecto(proyecto: Proyecto): Promise<void> {
  const storage = supabase.storage.from('proyectos')
  const filesToRemove: string[] = []

  if (proyecto.logo?.path) {
    filesToRemove.push(proyecto.logo.path)
  }

  if (proyecto.render?.path) {
    filesToRemove.push(proyecto.render.path)
  }

  try {
    if (filesToRemove.length > 0) {
      const { error: removeErr } = await storage.remove(filesToRemove)
      if (removeErr) {
        throw removeErr
      }
    }

    const { error: deleteErr } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', proyecto.id)

    if (deleteErr) {
      throw deleteErr
    }
  } catch (err) {
    throw err
  }
}
/////////////////////////////////////////////////Empresas////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const useFetchEmpresas = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase.from("empresas").select("*");
      if (error) throw error;
      setEmpresas(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('empresas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'empresas' },
        () => fetchEmpresas()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { empresas, loading, error, fetchEmpresas };
};


export async function actualizarEmpresa(
  empresa: Empresa
): Promise<Empresa> {
  const { data, error } = await supabase
    .from('empresas')
    .upsert(empresa, { onConflict: 'id' })
    .select()

  if (error) {
    throw error
  }

  // Devuelve el registro recién insertado/actualizado
  return data![0]
}

export async function eliminarEmpresa(empresaId: string): Promise<void> {
  const storage = supabase.storage.from('empresas');

  const { data: archivos, error: listError } = await storage.list(empresaId);
  if (listError) throw listError;

  if (archivos && archivos.length > 0) {
    const paths = archivos.map((f) => `${empresaId}/${f.name}`);
    const { error: removeError } = await storage.remove(paths);
    if (removeError) throw removeError;
  }

  const { error: dbError } = await supabase
    .from('empresas')
    .delete()
    .eq('id', empresaId);
  if (dbError) throw dbError;
}

/////////////////////////////////////////////////Proyectos////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const useFetchPropiedades = () => {
  const [propiedades, setObjetc] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const { data, error } = await supabase.from("propiedades").select("*");
      if (error) throw error;
      setObjetc(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('propiedades')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'propiedades' },
        () => fetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { propiedades, loading, error, fetch };
};

async function uploadNewImages(imagenes: Document[], bucket: string): Promise<Document[]> {
  // Filtra solo las que tienen .file (son nuevas)
  const nuevas = imagenes.filter((img) => img.file instanceof File);
  const existentes = imagenes.filter((img) => !img.file);

  // Subir nuevas imágenes al storage y obtener URLs
  const uploads = await Promise.all(nuevas.map(async (img) => {
    const ext = img.file!.name.split('.').pop();
    const filename = `prop_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${img.nombre}_${filename}`;

    const { error } = await supabase.storage.from(bucket).upload(path, img.file!, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) throw new Error("Error al subir imagen: " + error.message);

    // Devuelve Document listo para guardar
    return {
      id: img.id,
      nombre: img.nombre,
      path,
      bucket,
    };
  }));

  // Retorna todas (existentes y nuevas)
  return [
    ...existentes.map(({ id, nombre, path, bucket }) => ({ id, nombre, path, bucket })), // limpiar .file
    ...uploads,
  ];
}

export async function upsertPropiedad(propiedad: Propiedad, bucket: string = "propiedades") {
  try {
    // 1. Subir nuevas imágenes y obtener la lista final
    const imagenesFinal = await uploadNewImages(propiedad.imagenes ?? [], bucket);

    // 2. Preparar objeto para la tabla
    const propiedadParaTabla = {
      ...propiedad,
      imagenes: imagenesFinal,
      fechaActualizacion: new Date().toISOString(),
    };

    // 3. Guardar/actualizar en tabla
    const { data, error } = await supabase
      .from("propiedades")
      .upsert(propiedadParaTabla, { onConflict: "id"});

    if (error) throw error;

    return data?.[0];
  } catch (e) {
    console.error("Error en upsertPropiedad", e);
    throw e;
  }
}
/////////////////////////////////////////////////Prospectos////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const useFetchProspectos = () => {
  const [prospectos, setObjetc] = useState<Prospecto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const { data, error } = await supabase.from("prospectos").select("*");
      if (error) throw error;
      setObjetc(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('prospectos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prospectos' },
        () => fetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { prospectos, loading, error, fetch };
};
export const useFetchProspectosUser = (userid: string) => {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = async () => {
    if (!userid) {
      setProspectos([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('prospectos')
        .select('*')
        .eq('userid', userid)
      if (error) throw error
      setProspectos(data || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
    // eslint-disable-next-line
  }, [userid])

  useEffect(() => {
    if (!userid) return
    const channel = supabase
      .channel('prospectos_by_user_' + userid)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prospectos' },
        fetch
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line
  }, [userid])

  return { prospectos, loading, error, fetch }
}
export async function updateProspecto(prospecto: Prospecto) {
  if (!prospecto.id) throw new Error("Falta el id del prospecto")

  const { data, error } = await supabase
    .from("prospectos")
    .upsert([prospecto], { onConflict: "id" }); // <-- usa array

  if (error) throw error;
  return { data }
}
/////////////////////////////////////////////////Seguimientos////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const useFetchSeguimientos = () => {
  const [seguimientos, setObjetc] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const { data, error } = await supabase.from("seguimientos").select("*");
      if (error) throw error;
      setObjetc(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('seguimientos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seguimientos' },
        () => fetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { seguimientos, loading, error, fetch };
};
export const useFetchSeguimientosUser = (userid: string) => {
  const [seguimientos, setProspectos] = useState<Seguimiento[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = async () => {
    if (!userid) {
      setProspectos([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('seguimientos')
        .select('*')
        .eq('userid', userid)
      if (error) throw error
      setProspectos(data || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
    // eslint-disable-next-line
  }, [userid])

  useEffect(() => {
    if (!userid) return
    const channel = supabase
      .channel('seguimientos_by_user_' + userid)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seguimientos' },
        fetch
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line
  }, [userid])

  return { seguimientos, loading, error, fetch }
}
export async function updateSeguimiento(seguimiento: Seguimiento) {
  if (!seguimiento.id) throw new Error("Falta el id del seguimiento")

  // Copia el historial actual (si existe), o crea uno nuevo vacío
  const historial: SeguimientoHistorial[] = Array.isArray(seguimiento.historialSeguimiento)
    ? [...seguimiento.historialSeguimiento]
    : []

  // Crea un nuevo registro para el historial, omitiendo el propio historial para evitar loops
  const { historialSeguimiento, ...rest } = seguimiento
  const nuevoHistorial: SeguimientoHistorial = {
    ...rest,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`,
  }

  // Agrega al inicio del array (último primero)
  historial.unshift(nuevoHistorial)

  // Crea el seguimiento a guardar con historial actualizado
  const seguimientoToSave = {
    ...seguimiento,
    historialSeguimiento: historial
  }

  const { data, error } = await supabase
    .from("seguimientos")
    .upsert([seguimientoToSave], { onConflict: "id" })

  if (error) throw error
  return { data }
}
