import { useState, useEffect, useMemo } from 'react';
import type { Proyecto,Document, User, Empresa, Propiedad, Unidad, Prospecto, Seguimiento, SeguimientoHistorial,  } from '../config/types';
import { supabase } from '../config/supabase';

/////////////////////////////////////////////////USUARIOS////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function useFetchUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      // Filtrar usuarios no eliminados (deleted_at es null)
      const { data, error: supaError } = await supabase
        .from('users')
        .select('*')
        .is('deleted_at', null); // Solo mostrar usuarios NO eliminados
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
  const { id, email, telefono, role, nombre, empresaid, estatus } = usuario;

  try {
    let userId = id;

    // Solo crear en Auth si es un usuario NUEVO (sin id)
    if (!userId) {
      // Usar Edge Function de Supabase en lugar del servidor externo
      const { data, error: functionError } = await supabase.functions.invoke('create-user', {
        body: { 
          email: email.toLowerCase().trim(), 
          password: "Temp123!", 
          nombre: nombre?.trim() ?? "" 
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Error al crear usuario en Auth');
      }

      if (!data?.userId) {
        throw new Error("No se recibió userId desde la Edge Function");
      }

      userId = data.userId;
    }

    const payload: User = {
      id: userId,
      email: email.toLowerCase().trim(),
      telefono,
      role,
      nombre: nombre?.trim() ?? "",
      empresaid,
      estatus,
    };

    const { error } = await supabase.from("users").upsert([payload], { onConflict: "id" });
    if (error) throw error;

  } catch (err: any) {
    throw err;
  }
};


export const eliminarUsuario = async (
  userId: string
): Promise<void> => {
  if (!userId) {
    throw new Error('userId es requerido');
  }

  try {
    // OPCIÓN 1: Borrado lógico (RECOMENDADO - mantiene historial)
    const { error } = await supabase
      .from('users')
      .update({ 
        estatus: 'inactivo',
        deleted_at: new Date().toISOString()
      })
      .eq('id', userId);

    // OPCIÓN 2: Borrado físico (descomenta para eliminar permanentemente)
    // ADVERTENCIA: Esto eliminará TODOS los datos relacionados si tienes CASCADE
    /*
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    */

    if (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }

    // IMPORTANTE: El usuario AÚN PUEDE HACER LOGIN porque su cuenta de Auth sigue activa
    // Para eliminarlo de Auth también, necesitas:
    // 1. Crear Edge Function con Service Role Key (admin)
    // 2. Llamar a auth.admin.deleteUser(userId)
    // Ver: https://supabase.com/docs/guides/auth/managing-user-data#deleting-users

  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    throw error;
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
  const storage = supabase.storage.from('proyectos');
  const uploaded: string[] = [];

  function normalizeFileName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_.-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }

  async function uploadDoc(
    doc?: Document,
    carpeta: string = ''
  ): Promise<Document | undefined> {
    if (!doc) return undefined;

    // Si el doc NO trae File, asumimos que ya está subido. Lo preservamos.
    if (!doc.file) {
      const { file, ...rest } = doc as any;
      return Object.keys(rest).length ? (rest as Document) : undefined;
    }

    // Validar que file.name existe
    if (!doc.file.name) {
      console.warn('uploadDoc: doc.file sin nombre, omitiendo', doc);
      return undefined;
    }

    // Optimizar imagen antes de subir si es imagen
    let fileToUpload = doc.file;
    if (doc.file.type.startsWith('image/')) {
      const { processFile } = await import('../utils/image.utils');
      fileToUpload = await processFile(doc.file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg'
      });
    }

    // Sube el archivo y devuelve un Document "persistible"
    const safeName = normalizeFileName(doc.file.name);
    const path = `${proyecto.id}/${carpeta}${carpeta ? '/' : ''}${safeName}`;

    // Intento de limpieza de versión previa (por si re-suben el mismo nombre)
    await storage.remove([path]).catch(() => {});
    const { error: upErr } = await storage.upload(path, fileToUpload, { upsert: true });
    if (upErr) throw upErr;

    uploaded.push(path);
    return {
      id: path,
      nombre: doc.file.name,
      url: path,
      path,
      bucket: 'proyectos',
    };
  }

  // 1) Procesa imágenes de proyecto (logo/render)
  const uploadedLogo = proyecto.logo ? await uploadDoc(proyecto.logo, 'logo') : undefined;
  const uploadedRender = proyecto.render ? await uploadDoc(proyecto.render, 'render') : undefined;

  // 2) Procesa cada Unidad (render / isometrico / plano / imagenes[])
  async function processUnidad(uni: Unidad): Promise<Unidad> {
    const render = uni.render
      ? await uploadDoc(uni.render, `unidades/${uni.id}/render`)
      : undefined;

    const isometrico = uni.isometrico
      ? await uploadDoc(uni.isometrico, `unidades/${uni.id}/isometrico`)
      : undefined;

    const plano = uni.plano
      ? await uploadDoc(uni.plano, `unidades/${uni.id}/plano`)
      : undefined;

    let imagenes: Document[] = [];
    if (Array.isArray(uni.imagenes)) {
      imagenes = await Promise.all(
        uni.imagenes.map(async (img) =>
          img ? await uploadDoc(img, `unidades/${uni.id}/imagenes`) : null
        )
      ).then((arr) => arr.filter((d): d is Document => !!d));
    }

    return {
      ...uni,
      render,
      isometrico,
      plano,
      imagenes,
    };
  }

  const unidadesProcesadas = await Promise.all(
    (proyecto.unidades || []).map(processUnidad)
  );

  // 3) Procesa imágenes de fondo del stacking si existen
  let stackingProcesado = proyecto.stacking;
  if (proyecto.stacking?.background && Array.isArray(proyecto.stacking.background)) {
    // Solo procesar si hay documentos con archivos nuevos (file present)
    const hasNewFiles = proyecto.stacking.background.some(doc => doc?.file);
    
    if (hasNewFiles) {
      const backgroundProcesado = await Promise.all(
        proyecto.stacking.background.map(async (doc) =>
          doc ? await uploadDoc(doc, 'stacking/background') : null
        )
      ).then((arr) => arr.filter((d): d is Document => !!d));
      
      stackingProcesado = {
        ...proyecto.stacking,
        background: backgroundProcesado.length > 0 ? backgroundProcesado : null,
      };
    }
  }

  // 4) Arma el payload final, preservando el stacking recibido
  const payload: Proyecto = {
    ...proyecto,
    logo: uploadedLogo,
    render: uploadedRender,
    unidades: unidadesProcesadas,
    // Muy importante: incluir stacking para guardar {zoom, nodes, background procesado}
    stacking: stackingProcesado ?? undefined,
  };

  // 5) UPSERT en Supabase
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single(); // devuelve un solo registro

    if (error) throw error;
    return data as Proyecto;
  } catch (err) {
    // En caso de error, revertimos lo que alcanzó a subirse al storage
    if (uploaded.length) {
      try {
        await storage.remove(uploaded);
      } catch {
        /* no-op */
      }
    }
    throw err;
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
    // Optimizar imagen antes de subir
    let fileToUpload = img.file!;
    if (img.file!.type.startsWith('image/')) {
      const { processFile } = await import('../utils/image.utils');
      fileToUpload = await processFile(img.file!, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg'
      });
    }

    const ext = img.file!.name.split('.').pop();
    const filename = `prop_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${img.nombre}_${filename}`;

    const { error } = await supabase.storage.from(bucket).upload(path, fileToUpload, {
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
    .upsert(
      [{
        ...prospecto,
        fechaActualizacion: new Date().toISOString()
      }],
      { onConflict: "id" }
    );

  if (error) throw error;
  return { data };

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

  // Saca historialSeguimiento y deja el resto (esto es el snapshot)
  const { historialSeguimiento, ...rest } = seguimiento

  // Agrega marca de tiempo si tu modelo lo necesita:
  // const fechaCreacion = new Date().toISOString()

  const nuevoHistorial: SeguimientoHistorial = {
    ...rest,
    // fechaCreacion, // ← Descomenta si quieres la marca
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`,
  }

  // Agrega el snapshot como el nuevo primer elemento
  historial.unshift(nuevoHistorial)

  // Crea el seguimiento a guardar, ya con historial actualizado
  const seguimientoToSave: Seguimiento = {
    ...seguimiento,
    fechaActualizacion: new Date().toISOString(),
    historialSeguimiento: historial
  }

  const { data, error } = await supabase
    .from("seguimientos")
    .upsert([seguimientoToSave], { onConflict: "id" })

  if (error) throw error
  return { data }
}

export function useFiltradoPorRol<T extends { [k: string]: any }>(
  data: T[],
  userid?: string,
  isUsuario?: boolean
) {
  return useMemo(
    () => (isUsuario ? data.filter((x) => belongsToUser(x as any, userid)) : data),
    [data, userid, isUsuario]
  )
}

export function indexById<T extends { [k: string]: any }>(items: T[], key: string = 'id') {
  return useMemo(() => {
    const m = new Map<any, T>()
    for (const it of items) m.set((it as any)[key], it)
    return m
  }, [items, key])
}

type WithOwner = { [K in 'userid' | 'vendedorid' | 'asignadoA']?: string | number }

export function belongsToUser<T extends WithOwner>(obj: T, userid?: string): obj is T {
  if (!userid || !obj) return false
  return ['userid','vendedorid','asignadoA'].some((k) => {
    const v = obj[k as keyof WithOwner]
    return (typeof v === 'string' && v === userid) || (typeof v === 'number' && String(v) === String(userid))
  })
}
4