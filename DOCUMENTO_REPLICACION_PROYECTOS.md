# 📋 DOCUMENTO COMPLETO: Sistema de Alta de Proyectos Inmobiliarios

## 🎯 OBJETIVO
Este documento proporciona toda la información necesaria para replicar exactamente el sistema de alta, gestión y visualización de proyectos inmobiliarios tal como funciona en el CRM Objetiva.

---

## 📦 1. DEPENDENCIAS Y TECNOLOGÍAS

### Stack Principal
- **Frontend**: React 18.3.1 + TypeScript 5.5.3
- **Build Tool**: Vite 5.2.10
- **UI Framework**: Material-UI (@mui/material) 5.15.15
- **Backend**: Supabase (base de datos + storage)
- **Generación PDF**: @react-pdf/renderer 4.3.0

### Dependencias Clave para Proyectos
```json
{
  "@mui/icons-material": "^5.15.15",
  "@mui/material": "^5.15.15",
  "@mui/x-data-grid": "^8.11.1",
  "@react-pdf/renderer": "^4.3.0",
  "@supabase/supabase-js": "^2.50.3",
  "react-dnd": "^16.0.1",
  "react-dnd-html5-backend": "^16.0.1",
  "react-rnd": "^10.5.2",
  "xlsx": "^0.18.5",
  "date-fns": "^4.1.0",
  "papaparse": "^5.5.3"
}
```

### Configuración de Supabase
```typescript
// src/config/supabase.tsx
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
```

---

## 🗃️ 2. ESTRUCTURA DE DATOS

### 2.1 Interface Principal: Proyecto
```typescript
export interface Proyecto {
  id: string;                          // UUID único del proyecto
  userid: string;                      // ID del usuario creador
  nombre: string;                      // Nombre del proyecto (requerido)
  descripcion?: string;                // Descripción opcional
  logo?: Document;                     // Logo del proyecto
  render?: Document;                   // Render/fachada del proyecto
  imagenesProyecto: Document[];        // Galería de imágenes
  amenidades: string[];                // Lista de amenidades
  unidades: Unidad[];                  // Array de unidades del proyecto
  paymentPlans: PlanPago[];           // Planes de pago configurados
  fechaEntrega: string;                // Fecha de entrega (YYYY-MM-DD)
  estatus?: 'activo' | 'inactivo';    // Estado del proyecto
  stacking?: StackingState;            // Configuración del visualizador stacking
  extrasOrder?: string[];              // Orden de columnas extras personalizadas
}
```

### 2.2 Interface: Unidad
```typescript
export interface Unidad {
  id: string;                          // UUID único de la unidad
  userid: string;                      // ID del usuario creador
  numerounidad: string;                // Número de unidad (requerido)
  unidadprivativa: string;             // Torre/edificio (requerido)
  preciolista: string;                 // Precio de lista (requerido)
  extras: Record<string, string | number | boolean | null>;  // Campos dinámicos
  imagenes: Document[];                // Galería de imágenes de la unidad
  render?: Document;                   // Render de la unidad
  isometrico?: Document;               // Vista isométrica
  plano?: Document;                    // Plano arquitectónico
  proyectoid: string;                  // ID del proyecto padre
  estatus: 'disponible' | 'vendido' | 'apartado';  // Estado de la unidad
}
```

### 2.3 Interface: PlanPago
```typescript
export interface PlanPago {
  name: string;                        // Nombre del plan (ej: "Contado", "12 meses")
  months: number;                      // Cantidad de meses
  descuento: number;                   // % de descuento
  pInicial: number;                    // % pago inicial
  mensualidades: number;               // % mensualidades
  contraentrega: number;               // % contra entrega
  parcialidades: {                     // Desglose mensual
    month: number;
    value: number;
  }[];
}
```

### 2.4 Interface: Document (para archivos)
```typescript
export interface Document {
  id: string;                          // ID único del documento
  nombre: string;                      // Nombre del archivo
  file?: File;                         // Archivo temporal (antes de subir)
  url?: string;                        // URL pública o temporal
  path?: string;                       // Path en Supabase Storage
  bucket?: string;                     // Bucket de Supabase
}
```

### 2.5 Interface: StackingState (visualización interactiva)
```typescript
type StackingState = {
  zoom: number;                        // Nivel de zoom
  nodes: {                             // Posiciones de unidades
    id: string;                        // ID de unidad
    x: number;                         // Posición X
    y: number;                         // Posición Y
    w: number;                         // Ancho
    h: number;                         // Alto
  }[];
  background: Document[] | null;       // Imagen de fondo
  backgroundFit?: 'contain' | 'cover' | 'none';  // Ajuste de fondo
  backgroundOpacity?: number;          // Opacidad 0-1
};
```

---

## 🏗️ 3. BASE DE DATOS SUPABASE

### 3.1 Tabla: proyectos
```sql
CREATE TABLE proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID REFERENCES users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  logo JSONB,                          -- Document serializado
  render JSONB,                        -- Document serializado
  "imagenesProyecto" JSONB DEFAULT '[]'::jsonb,
  amenidades TEXT[] DEFAULT ARRAY[]::TEXT[],
  unidades JSONB DEFAULT '[]'::jsonb,  -- Array de Unidad serializado
  "paymentPlans" JSONB DEFAULT '[]'::jsonb,
  "fechaEntrega" TEXT,
  estatus TEXT DEFAULT 'activo',
  stacking JSONB,                      -- StackingState serializado
  "extrasOrder" TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proyectos_userid ON proyectos(userid);
CREATE INDEX idx_proyectos_estatus ON proyectos(estatus);
```

### 3.2 Storage Bucket: proyectos
```sql
-- Crear bucket con acceso público
INSERT INTO storage.buckets (id, name, public)
VALUES ('proyectos', 'proyectos', true);

-- Política de lectura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'proyectos');

-- Política de escritura autenticada
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'proyectos' AND auth.role() = 'authenticated');

-- Política de eliminación
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'proyectos' AND auth.role() = 'authenticated');
```

### 3.3 Estructura de carpetas en Storage
```
proyectos/
├── {proyectoId}/
│   ├── logo/
│   │   └── logo_normalizado.png
│   ├── render/
│   │   └── render_normalizado.jpg
│   └── unidades/
│       ├── {unidadId}/
│       │   ├── render/
│       │   │   └── render_unidad.jpg
│       │   ├── isometrico/
│       │   │   └── isometrico.png
│       │   ├── plano/
│       │   │   └── plano.pdf
│       │   └── imagenes/
│       │       ├── imagen1.jpg
│       │       ├── imagen2.jpg
│       │       └── imagen3.jpg
```

---

## 🔧 4. FUNCIONES DE BACKEND (Hooks)

### 4.1 Hook: useFetchProyects
```typescript
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

  // Suscripción en tiempo real
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
```

### 4.2 Función: actualizarProyecto
```typescript
export async function actualizarProyecto(proyecto: Proyecto): Promise<Proyecto> {
  const storage = supabase.storage.from('proyectos');
  const uploaded: string[] = [];

  // Normalizar nombres de archivo (sin acentos, espacios, etc)
  function normalizeFileName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_.-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }

  // Subir documento a Storage
  async function uploadDoc(
    doc?: Document,
    carpeta: string = ''
  ): Promise<Document | undefined> {
    if (!doc) return undefined;

    // Si NO trae File, ya está subido
    if (!doc.file) {
      const { file, ...rest } = doc as any;
      return Object.keys(rest).length ? (rest as Document) : undefined;
    }

    const safeName = normalizeFileName(doc.file.name);
    const path = `${proyecto.id}/${carpeta}${carpeta ? '/' : ''}${safeName}`;

    // Limpiar versión anterior
    await storage.remove([path]).catch(() => {});
    
    const { error: upErr } = await storage.upload(path, doc.file, { upsert: true });
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

  // 1) Subir logo y render del proyecto
  const uploadedLogo = proyecto.logo ? await uploadDoc(proyecto.logo, 'logo') : undefined;
  const uploadedRender = proyecto.render ? await uploadDoc(proyecto.render, 'render') : undefined;

  // 2) Procesar cada unidad
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

    return { ...uni, render, isometrico, plano, imagenes };
  }

  const unidadesProcesadas = await Promise.all(
    (proyecto.unidades || []).map(processUnidad)
  );

  // 3) Crear payload final
  const payload: Proyecto = {
    ...proyecto,
    logo: uploadedLogo,
    render: uploadedRender,
    unidades: unidadesProcesadas,
    stacking: proyecto.stacking ?? undefined,
  };

  // 4) UPSERT en Supabase
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data as Proyecto;
  } catch (err) {
    // Rollback de archivos subidos
    if (uploaded.length) {
      try {
        await storage.remove(uploaded);
      } catch { /* no-op */ }
    }
    throw err;
  }
}
```

### 4.3 Función: eliminarProyecto
```typescript
export async function eliminarProyecto(proyecto: Proyecto): Promise<void> {
  const storage = supabase.storage.from('proyectos');
  const filesToRemove: string[] = [];

  // Recolectar todos los archivos
  if (proyecto.logo?.path) filesToRemove.push(proyecto.logo.path);
  if (proyecto.render?.path) filesToRemove.push(proyecto.render.path);

  proyecto.unidades?.forEach(u => {
    if (u.render?.path) filesToRemove.push(u.render.path);
    if (u.isometrico?.path) filesToRemove.push(u.isometrico.path);
    if (u.plano?.path) filesToRemove.push(u.plano.path);
    u.imagenes?.forEach(img => {
      if (img.path) filesToRemove.push(img.path);
    });
  });

  try {
    // Eliminar archivos
    if (filesToRemove.length > 0) {
      const { error: removeErr } = await storage.remove(filesToRemove);
      if (removeErr) throw removeErr;
    }

    // Eliminar registro
    const { error: deleteErr } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', proyecto.id);
    
    if (deleteErr) throw deleteErr;
  } catch (error) {
    console.error('Error eliminando proyecto:', error);
    throw error;
  }
}
```

---

## 🎨 5. COMPONENTES DE UI

### 5.1 ProyectoWizard (Asistente de creación/edición)

**Ubicación**: `src/components/admin/ProyectoWizard.tsx`

**Características**:
- Modal de pantalla completa con stepper (4 pasos)
- Navegación entre pasos con validación
- Auto-guardado opcional
- Cierre con confirmación si hay cambios

**Estructura de pasos**:
1. **Información General** → Datos básicos, logo, render, amenidades
2. **Planes de Pago** → Configuración de esquemas de financiamiento
3. **Unidades** → Alta masiva/individual, extras dinámicos, importación Excel
4. **Visualización (Stacking)** → Editor drag & drop de disposición de unidades

**Props principales**:
```typescript
interface ProyectoWizardProps {
  proyecto: Proyecto;
  open: boolean;
  onClose: () => void;
  onSave: (proyecto: Proyecto) => void;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  userid: string;
  // ... handlers para cada tab
}
```

### 5.2 ProyectoGeneralTab

**Responsabilidades**:
- Editar nombre y descripción
- Subir logo y render del proyecto
- Gestionar amenidades (con sugerencias rápidas)

**Sugerencias de amenidades precargadas**:
```typescript
const SUGERENCIAS_AMENIDADES = [
  'Gimnasio', 'Alberca', 'Cowork', 'Roof Garden', 'Lobby',
  'Elevador', 'Vigilancia 24/7', 'Pet friendly', 'Terraza',
  'Estacionamiento techado', 'Área de juegos', 'Sala de cine',
  'Asadores', 'Bodega', 'Business center'
];
```

**Funcionalidades**:
- Agregar amenidades desde input o chips sugeridos
- Eliminar amenidades individuales
- Botón "Limpiar todo"
- Vista previa de imágenes subidas

### 5.3 ProyectoPlanesPagoTab

**Sistema de cálculo automático**:
- Todos los porcentajes suman 100%
- Distribución inteligente de mensualidades
- Ajuste automático al cambiar fecha de entrega
- Validación en tiempo real

**Ejemplo de plan**:
```javascript
{
  name: "12 Meses",
  months: 12,
  descuento: 5,
  pInicial: 30,           // 30% enganche
  mensualidades: 60,      // 60% distribuido en 12 meses
  contraentrega: 10,      // 10% al recibir llaves
  parcialidades: [
    { month: 1, value: 5 },
    { month: 2, value: 5 },
    // ... hasta month 12
  ]
}
```

**Funciones de validación**:
```typescript
// Total base para mensualidades
function baseMensualidades(plan: PlanPago) {
  return 100 - (plan.pInicial || 0) - (plan.contraentrega || 0);
}

// Redistribuir al editar un mes
function reprogramRight(plan: PlanPago, monthIndex: number, newValue: number, monthsCount: number): number[]

// Normalizar parcialidades al cambiar meses totales
function normalizeParcialidades(plan: PlanPago, monthsCount: number): number[]
```

### 5.4 ProyectoUnidadesTab

**Características principales**:
1. **Gestión de campos dinámicos (extras)**
   - Agregar/eliminar columnas personalizadas
   - Reordenar con drag & drop
   - Cambiar nombres de columnas

2. **Alta de unidades**
   - Formulario dinámico según extras configurados
   - Validación de campos requeridos (número, torre, precio)
   - Subida de imágenes, renders, planos

3. **Importación masiva Excel/CSV**
   - Mapeo automático de columnas
   - 3 modos: agregar, reemplazar, fusionar
   - Vista previa antes de aplicar
   - Detección de errores

4. **Funciones avanzadas**
   - Aumentar precios en % (masivo)
   - Duplicar unidades
   - Exportar a Excel

**Campos obligatorios de unidad**:
- `numerounidad`: Número/código de unidad
- `preciolista`: Precio base
- (torre viene de `unidadprivativa`)

**Ejemplo de extras dinámicos**:
```typescript
{
  "superficie": "85",
  "recamaras": "2",
  "baños": "2",
  "nivel": "5",
  "vista": "Mar"
}
```

### 5.5 ProyectoStackingTab (Visualizador interactivo)

**Tecnologías**:
- `react-dnd`: Drag and drop
- `react-rnd`: Resize y drag de nodos
- Canvas con zoom y pan

**Funcionalidades**:
1. **Imagen de fondo**
   - Subir plano/master plan
   - Ajuste: contain/cover/none
   - Control de opacidad

2. **Paleta de unidades**
   - Lista filtrable por torre/nivel
   - Código de colores por estatus:
     - Vendido: Verde (#06d6a0)
     - Apartado: Amarillo (#eab308)
     - Disponible: Blanco (#ffffff)

3. **Canvas de diseño**
   - Arrastrar unidades desde paleta
   - Redimensionar tarjetas
   - Alinear a grid (10px)
   - Zoom con slider o rueda del mouse
   - Reset de posiciones

4. **Vista pública (StackingLiveViewer)**
   - Solo lectura
   - Click en unidad para abrir cotizador
   - Leyenda de estatus
   - Responsivo

**Estructura de datos guardada**:
```typescript
{
  zoom: 1.2,
  nodes: [
    { id: "unidad-1", x: 100, y: 50, w: 120, h: 70 },
    { id: "unidad-2", x: 230, y: 50, w: 120, h: 70 }
  ],
  background: [{ id: "bg-1", path: "...", ... }],
  backgroundFit: "contain",
  backgroundOpacity: 0.5
}
```

---

## 📝 6. FLUJOS COMPLETOS

### 6.1 Crear nuevo proyecto

```typescript
// 1. Generar proyecto inicial
const nuevoProyecto: Proyecto = {
  id: crypto.randomUUID(),
  userid: currentUserId,
  nombre: '',
  descripcion: '',
  logo: undefined,
  render: undefined,
  imagenesProyecto: [],
  amenidades: [],
  unidades: [],
  paymentPlans: [
    {
      name: 'ContadoComercial',
      months: 1,
      descuento: 10,
      pInicial: 0,
      mensualidades: 0,
      contraentrega: 0,
      parcialidades: []
    }
  ],
  fechaEntrega: new Date().toISOString().split('T')[0],
  estatus: 'activo',
  extrasOrder: []
};

// 2. Abrir wizard
setProyectoActual(nuevoProyecto);
setWizardOpen(true);

// 3. Usuario completa los 4 pasos

// 4. Guardar (se ejecuta actualizarProyecto)
await actualizarProyecto(proyectoActual);
```

### 6.2 Agregar unidad a proyecto

```typescript
// 1. Crear unidad vacía
const makeInitialUnidad = (userId: string, proyectoid: string): Unidad => ({
  id: crypto.randomUUID(),
  userid: userId,
  proyectoid,
  numerounidad: '',
  unidadprivativa: '',
  preciolista: '',
  extras: {},
  imagenes: [],
  estatus: 'disponible'
});

// 2. Llenar formulario
handleChangeUnidad('numerounidad', '101');
handleChangeUnidad('unidadprivativa', 'Torre A');
handleChangeUnidad('preciolista', '2500000');
handleChangeExtraValue('superficie', '85');
handleChangeExtraValue('recamaras', '2');

// 3. Agregar al proyecto
handleAddUnidad(); // Agrega a proyecto.unidades[]

// 4. Guardar proyecto completo
await actualizarProyecto(proyecto);
```

### 6.3 Importar unidades desde Excel

**Formato esperado del Excel**:
```
| numero | torre   | precio    | superficie | recamaras | baños | nivel |
|--------|---------|-----------|------------|-----------|-------|-------|
| 101    | Torre A | 2,500,000 | 85         | 2         | 2     | 1     |
| 102    | Torre A | 2,600,000 | 90         | 2         | 2     | 1     |
| 201    | Torre A | 2,700,000 | 85         | 2         | 2     | 2     |
```

**Proceso**:
```typescript
// 1. Leer archivo
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  const reader = new FileReader();
  
  reader.onload = (evt) => {
    const workbook = XLSX.read(evt.target.result, { type: 'binary' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    // 2. Convertir a Unidad[]
    const unidadesImportadas = rows.map(row => ({
      id: crypto.randomUUID(),
      userid,
      proyectoid: proyecto.id,
      numerounidad: row['numero'] || '',
      unidadprivativa: row['torre'] || 'Torre A',
      preciolista: String(row['precio'] || ''),
      extras: {
        superficie: row['superficie'],
        recamaras: row['recamaras'],
        baños: row['baños'],
        nivel: row['nivel']
      },
      imagenes: [],
      estatus: 'disponible'
    }));
    
    setImportPreview(unidadesImportadas);
    setOpenImportDialog(true);
  };
  
  reader.readAsBinaryString(file);
};

// 3. Aplicar según modo
if (importMode === 'replace') {
  proyecto.unidades = unidadesImportadas;
} else if (importMode === 'append') {
  proyecto.unidades = [...proyecto.unidades, ...unidadesImportadas];
} else if (importMode === 'merge') {
  // Fusionar por numerounidad
}

// 4. Actualizar extrasOrder
const allKeys = new Set<string>();
unidadesImportadas.forEach(u => {
  Object.keys(u.extras).forEach(k => allKeys.add(k));
});
proyecto.extrasOrder = Array.from(allKeys);
```

### 6.4 Configurar visualización Stacking

```typescript
// 1. Subir imagen de fondo (plano maestro)
const handleBackgroundUpload = (file: File) => {
  const doc: Document = {
    id: crypto.randomUUID(),
    nombre: file.name,
    file,
    url: URL.createObjectURL(file)
  };
  
  setProyecto(prev => ({
    ...prev,
    stacking: {
      ...prev.stacking,
      background: [doc],
      backgroundFit: 'contain',
      backgroundOpacity: 0.5,
      zoom: 1,
      nodes: prev.stacking?.nodes || []
    }
  }));
};

// 2. Arrastrar unidad desde paleta
const handleDrop = (unitId: string, monitor: any) => {
  const offset = monitor.getClientOffset();
  const canvasRect = canvasRef.current.getBoundingClientRect();
  
  const x = (offset.x - canvasRect.left) / zoom;
  const y = (offset.y - canvasRect.top) / zoom;
  
  const newNode: StackingNode = {
    id: unitId,
    x: Math.round(x / GRID) * GRID,
    y: Math.round(y / GRID) * GRID,
    w: 120,
    h: 70
  };
  
  setProyecto(prev => ({
    ...prev,
    stacking: {
      ...prev.stacking,
      nodes: [...(prev.stacking?.nodes || []), newNode]
    }
  }));
};

// 3. Guardar diseño
await actualizarProyecto(proyecto); // El stacking se guarda en la BD
```

---

## 🎯 7. VALIDACIONES Y REGLAS DE NEGOCIO

### 7.1 Validación de Proyecto
```typescript
const validarProyecto = (p: Proyecto): string[] => {
  const errores: string[] = [];
  
  if (!p.nombre?.trim()) {
    errores.push('El nombre del proyecto es obligatorio');
  }
  
  if (!p.fechaEntrega) {
    errores.push('La fecha de entrega es obligatoria');
  }
  
  if (p.unidades.length === 0) {
    errores.push('Debe agregar al menos una unidad');
  }
  
  // Validar que la suma de cada plan = 100%
  p.paymentPlans.forEach((plan, idx) => {
    const total = plan.pInicial + plan.mensualidades + plan.contraentrega;
    if (Math.abs(total - 100) > 0.01) {
      errores.push(`Plan "${plan.name}": suma ${total}% (debe ser 100%)`);
    }
  });
  
  return errores;
};
```

### 7.2 Validación de Unidad
```typescript
const validarUnidad = (u: Unidad): boolean => {
  // Campos obligatorios
  if (!u.numerounidad?.trim()) return false;
  if (!u.preciolista || String(u.preciolista).trim() === '') return false;
  
  // Precio debe ser numérico positivo
  const precio = parseFloat(String(u.preciolista).replace(/[^0-9.-]/g, ''));
  if (isNaN(precio) || precio <= 0) return false;
  
  return true;
};
```

### 7.3 Reglas de Negocio

1. **Unidad única por número**: No puede haber dos unidades con el mismo `numerounidad` en el mismo proyecto
2. **Estatus de unidad**: Solo puede cambiar de disponible → apartado → vendido (no al revés sin permisos especiales)
3. **Planes de pago**: Siempre debe existir al menos un plan llamado "ContadoComercial"
4. **Fecha de entrega**: No puede ser anterior a la fecha actual
5. **Campos extras**: Se comparten entre todas las unidades del proyecto (mismo orden)
6. **Imágenes**: Máximo recomendado 10 por unidad (por performance)

---

## 📊 8. CASOS DE USO ESPECIALES

### 8.1 Aumentar precios masivamente

```typescript
const aumentarPrecios = (porcentaje: number) => {
  const factor = 1 + (porcentaje / 100);
  
  setProyecto(prev => ({
    ...prev,
    unidades: prev.unidades.map(u => {
      const precioActual = parseFloat(String(u.preciolista).replace(/[^0-9.-]/g, ''));
      const precioNuevo = Math.round(precioActual * factor);
      
      return {
        ...u,
        preciolista: String(precioNuevo)
      };
    })
  }));
};
```

### 8.2 Duplicar unidad

```typescript
const duplicarUnidad = (unidad: Unidad) => {
  const copia: Unidad = {
    ...unidad,
    id: crypto.randomUUID(),
    numerounidad: `${unidad.numerounidad}_copia`,
    imagenes: [], // No copiar archivos
    render: undefined,
    isometrico: undefined,
    plano: undefined
  };
  
  setProyecto(prev => ({
    ...prev,
    unidades: [...prev.unidades, copia]
  }));
};
```

### 8.3 Filtrar unidades por criterios

```typescript
const filtrarUnidades = (
  unidades: Unidad[],
  filtros: {
    torre?: string;
    estatusDisponible?: boolean;
    precioMin?: number;
    precioMax?: number;
  }
) => {
  return unidades.filter(u => {
    if (filtros.torre && u.unidadprivativa !== filtros.torre) return false;
    if (filtros.estatusDisponible && u.estatus !== 'disponible') return false;
    
    if (filtros.precioMin || filtros.precioMax) {
      const precio = parseFloat(String(u.preciolista).replace(/[^0-9.-]/g, ''));
      if (filtros.precioMin && precio < filtros.precioMin) return false;
      if (filtros.precioMax && precio > filtros.precioMax) return false;
    }
    
    return true;
  });
};
```

---

## 🔐 9. SEGURIDAD Y PERMISOS

### 9.1 Row Level Security (RLS) en Supabase

```sql
-- Habilitar RLS
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;

-- Política: Ver proyectos de tu empresa
CREATE POLICY "Users can view own company projects"
ON proyectos FOR SELECT
USING (
  userid IN (
    SELECT id FROM users 
    WHERE empresaid = (SELECT empresaid FROM users WHERE id = auth.uid())
  )
);

-- Política: Crear proyectos
CREATE POLICY "Users can create projects"
ON proyectos FOR INSERT
WITH CHECK (userid = auth.uid());

-- Política: Actualizar propios proyectos o si eres admin
CREATE POLICY "Users can update own projects or admin"
ON proyectos FOR UPDATE
USING (
  userid = auth.uid() OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'Administrador'
);

-- Política: Eliminar solo admin
CREATE POLICY "Only admins can delete"
ON proyectos FOR DELETE
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'Administrador');
```

### 9.2 Validación de roles en Frontend

```typescript
const puedeEditarProyecto = (user: User, proyecto: Proyecto): boolean => {
  // Admin puede todo
  if (user.role === 'Administrador') return true;
  
  // Propietario puede editar
  if (proyecto.userid === user.id) return true;
  
  return false;
};

const puedeEliminarProyecto = (user: User): boolean => {
  return user.role === 'Administrador';
};
```

---

## 🎨 10. ESTILOS Y TEMAS

### 10.1 Variables CSS principales
```css
:root {
  --primary-color: #1976d2;
  --secondary-color: #dc004e;
  --success-color: #06d6a0;
  --warning-color: #eab308;
  --error-color: #ef4444;
  --disponible-color: #ffffff;
  --apartado-color: #eab308;
  --vendido-color: #06d6a0;
}
```

### 10.2 Tema Material-UI
```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#06d6a0',
    },
    warning: {
      main: '#eab308',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});
```

---

## 📱 11. RESPONSIVE DESIGN

### Breakpoints
- **xs**: 0-600px (móvil)
- **sm**: 600-900px (tablet)
- **md**: 900-1200px (escritorio pequeño)
- **lg**: 1200-1536px (escritorio)
- **xl**: 1536px+ (pantallas grandes)

### Adaptaciones clave
```typescript
// Grid responsivo para unidades
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    <CardUnidad />
  </Grid>
</Grid>

// Modal de wizard adaptable
sx={{
  width: { xs: '95%', sm: '90%', md: '80%', lg: '70%' },
  maxHeight: { xs: '90vh', sm: '85vh', md: '80vh' },
}}

// Stacking canvas
const canvasWidth = Math.min(window.innerWidth - 400, 1200);
```

---

## 🧪 12. TESTING (Recomendaciones)

### 12.1 Tests unitarios
```typescript
describe('Validaciones de Proyecto', () => {
  test('debe rechazar proyecto sin nombre', () => {
    const proyecto = makeEmptyProyecto();
    const errores = validarProyecto(proyecto);
    expect(errores).toContain('El nombre del proyecto es obligatorio');
  });
  
  test('debe validar suma de planes de pago', () => {
    const plan: PlanPago = {
      name: 'Test',
      pInicial: 30,
      mensualidades: 50,
      contraentrega: 15, // suma 95, debería ser 100
      // ...
    };
    // Assert que detecta error
  });
});
```

### 12.2 Tests de integración
```typescript
describe('Flujo completo de proyecto', () => {
  test('crear proyecto → agregar unidad → guardar', async () => {
    const proyecto = makeEmptyProyecto();
    proyecto.nombre = 'Torre Test';
    
    const unidad = makeInitialUnidad(userId, proyecto.id);
    unidad.numerounidad = '101';
    unidad.preciolista = '1000000';
    
    proyecto.unidades.push(unidad);
    
    const saved = await actualizarProyecto(proyecto);
    expect(saved.id).toBeDefined();
    expect(saved.unidades.length).toBe(1);
  });
});
```

---

## 📈 13. OPTIMIZACIONES Y PERFORMANCE

### 13.1 Lazy loading de imágenes
```typescript
const SignedImageLazy: React.FC = ({ path }) => {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setLoaded(true);
      }
    });
    
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);
  
  if (!loaded) return <Skeleton variant="rectangular" />;
  
  return <SignedImage path={path} />;
};
```

### 13.2 Debounce en búsquedas
```typescript
const useDebouncedSearch = (value: string, delay: number = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

### 13.3 Memoización de cálculos pesados
```typescript
const unidadesFiltradas = useMemo(() => {
  return filtrarUnidades(proyecto.unidades, filtros);
}, [proyecto.unidades, filtros]);

const totalInventario = useMemo(() => {
  return proyecto.unidades.reduce((sum, u) => {
    const precio = parseFloat(String(u.preciolista).replace(/[^0-9.-]/g, ''));
    return sum + (isNaN(precio) ? 0 : precio);
  }, 0);
}, [proyecto.unidades]);
```

---

## 🚀 14. DESPLIEGUE Y PRODUCCIÓN

### 14.1 Variables de entorno
```bash
# .env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SUPABASE_PROJ_ID=tu-project-id
```

### 14.2 Build de producción
```bash
# Instalar dependencias
npm install

# Build
npm run build

# Preview local
npm run preview
```

### 14.3 Configuración de Vercel
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 📚 15. GLOSARIO

- **Proyecto**: Desarrollo inmobiliario completo (edificio, torre, complejo)
- **Unidad**: Departamento/casa individual dentro del proyecto
- **Stacking**: Visualización gráfica de la disponibilidad de unidades
- **Plan de Pago**: Esquema de financiamiento (contado, 12 meses, etc)
- **Extras**: Campos personalizables por proyecto (superficie, recámaras, etc)
- **Apartado**: Unidad reservada temporalmente
- **Contra entrega**: Pago final al recibir llaves
- **Parcialidad**: Pago mensual dentro de un plan

---

## ✅ 16. CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Crear tabla `proyectos` en Supabase
- [ ] Crear bucket `proyectos` en Storage
- [ ] Configurar RLS policies
- [ ] Implementar función `actualizarProyecto`
- [ ] Implementar función `eliminarProyecto`
- [ ] Configurar suscripciones en tiempo real

### Frontend - Estructura
- [ ] Instalar dependencias necesarias
- [ ] Crear interfaces TypeScript
- [ ] Configurar cliente Supabase
- [ ] Crear hooks de fetch

### Frontend - Componentes
- [ ] ProyectoWizard (container principal)
- [ ] ProyectoGeneralTab
- [ ] ProyectoPlanesPagoTab
- [ ] ProyectoUnidadesTab
- [ ] ProyectoStackingTab
- [ ] Componentes de visualización (cards, modals)

### Funcionalidades
- [ ] CRUD completo de proyectos
- [ ] Gestión de amenidades
- [ ] Sistema de planes de pago
- [ ] Alta/edición/eliminación de unidades
- [ ] Importación desde Excel
- [ ] Exportación a Excel
- [ ] Subida de imágenes
- [ ] Editor de stacking drag & drop
- [ ] Visualizador público de stacking
- [ ] Cotizador/PDF de unidades

### Testing
- [ ] Validaciones de formularios
- [ ] Cálculos de planes de pago
- [ ] Importación de archivos
- [ ] Flujo completo end-to-end

### Producción
- [ ] Configurar variables de entorno
- [ ] Build y deploy
- [ ] Monitoreo de errores
- [ ] Backups de base de datos

---

## 📞 17. SOPORTE Y TROUBLESHOOTING

### Problemas comunes

**1. Error al subir archivos grandes**
```typescript
// Solución: Comprimir imágenes antes de subir
const compressImage = async (file: File): Promise<File> => {
  // Implementar compresión con canvas o librería
};
```

**2. Suma de planes no da 100%**
```typescript
// Verificar con tolerancia de error
const total = pInicial + mensualidades + contraentrega;
const esValido = Math.abs(total - 100) < 0.01;
```

**3. Unidades duplicadas en import**
```typescript
// Deduplicar por numerounidad
const uniques = unidades.reduce((acc, u) => {
  if (!acc.find(x => x.numerounidad === u.numerounidad)) {
    acc.push(u);
  }
  return acc;
}, []);
```

---

## 🎓 18. MEJORES PRÁCTICAS

1. **Siempre validar antes de guardar**
2. **Normalizar nombres de archivo** (sin acentos, espacios)
3. **Usar transactions cuando sea posible** (atomicidad)
4. **Comprimir imágenes** antes de subir (optimización)
5. **Mostrar feedback visual** (spinners, mensajes)
6. **Implementar rollback** en caso de error
7. **Cachear datos frecuentes** (proyectos, usuarios)
8. **Logs de auditoría** (quién modificó qué y cuándo)
9. **Backups regulares** de la base de datos
10. **Monitorear performance** (tiempos de carga, queries lentas)

---

## 📝 CONCLUSIÓN

Este documento proporciona toda la información necesaria para replicar exactamente el sistema de proyectos. Incluye:

✅ Estructura de datos completa  
✅ Configuración de base de datos  
✅ Código de backend (hooks y funciones)  
✅ Componentes de UI detallados  
✅ Flujos de trabajo completos  
✅ Validaciones y reglas de negocio  
✅ Casos de uso especiales  
✅ Optimizaciones y mejores prácticas  

**Tiempo estimado de implementación**: 40-60 horas para un desarrollador con experiencia en React + Supabase.

---

**Documento generado**: 28 de noviembre de 2025  
**Versión**: 1.0  
**Proyecto**: CRM Objetiva - Sistema de Proyectos Inmobiliarios
