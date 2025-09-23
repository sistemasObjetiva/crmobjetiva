export interface Route {
  path: string;
  name: string;
  rol?: string | string[];
  nivel?:string;
  area?:string;
  element?: React.LazyExoticComponent<React.FC>;
  icon?: React.ElementType;
  children?: Route[];
}

export interface Document {
  id: string;
  nombre: string;
  path?: string; 
  url?: string;
  file?: File; 
  bucket?: string; 
}



export const ROLES = {
  Usuario:   { tipo: 'Usuario', jerarquia: 3 },
  Gerente:      { tipo: 'Gerente', jerarquia: 2 },
  GerenteGeneral:   { tipo: 'GerenteGeneral', jerarquia: 0 },
  Plataforma:    { tipo: 'Plataforma', jerarquia: 0 }, 
} as const;

export type RoleTipo = keyof typeof ROLES; 
export type Role = typeof ROLES[RoleTipo];

export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  role: Role;
  empresaid?: string;   
  estatus: 'activo' | 'inactivo'
}

export interface Empresa {
  id: string;
  userid:string;
  nombre: string;
  estatus: 'activo' | 'inactivo'
  correocontacto?: string;  
  telefono?: string;
}
export type StackingNode = {
  id: string; // unidad.id
  x: number;
  y: number;
  w: number;
  h: number;
};

export type StackingState = {
  zoom: number;
  nodes: StackingNode[];
  background: Document[] | null;            
  backgroundFit?: 'contain' | 'cover' | 'none';
  backgroundOpacity?: number; 
};

export type ProyectoLite = { id: string; nombre: string; logo?: string }


export interface Proyecto {
  id: string;
  userid: string;
  nombre: string;
  descripcion?: string;
  logo?: Document;
  render?: Document;
  imagenesProyecto: Document[];
  amenidades: string[];
  unidades:Unidad[];
  paymentPlans: PlanPago[];
  fechaEntrega:string;
  estatus?: 'activo' | 'inactivo';
  stacking?: StackingState;
}
export interface Unidad {
  id:string;
  userid: string;
  numerounidad: string;
  unidadprivativa: string;
  preciolista: string;
  extras: Record<string, string | number | boolean | null>;
  imagenes: Document[];
  render?: Document;
  isometrico?: Document;  
  plano?: Document;
  proyectoid: string;
  estatus:'disponible'|'vendido'|'apartado'
}
export interface PlanPago {
    name: string;
    months: number;
    descuento: number;
    pInicial: number;
    mensualidades: number;
    contraentrega: number;
    parcialidades: { month: number; value: number }[];
  }

  export type PropiedadLite = { id: string; tituloPropiedad: string; imagenes?: string[] }
  export interface Propiedad {
    id: string; 
    userid: string; 
    tituloPropiedad: string;
    tipo: string;
    descripcion?: string;
    estatus:'disponible'|'vendido'|'apartado',
    
    // 🔹 Datos de venta
    venta?: boolean;
    precioVenta?: number;
    comisionVenta?: number;
  
    // 🔹 Datos de renta
    renta?: boolean;
    precioRenta?: number;
    comisionRenta?: number;
  
    // 🔹 Ubicación
    pais?: string;
    estado?: string;
    ciudad?: string;
    colonia?: string;
    calle?: string;
    numero?: string | number; // 🔹 Puede ser string si tiene letras o número si es solo numérico
    interior?: string;
    esquina?: string;
    codigoPostal?: string | number;
  
    // 🔹 Exclusividad y colaboración
    exclusividad?: boolean; // 🔹 Cambiado a boolean en lugar de string ("Sí" | "No")
    comisionCompartida?: boolean;
    comparte50?: boolean;
    condicionesCompartir?: string;
  
    // 🔹 Características adicionales
    amenidades?: string[];
  
    fechaCreacion?: Date | string; // 🔹 Puede ser `serverTimestamp()`, por lo que acepta `string`
    fechaActualizacion?: Date | string; 
  
   
    imagenes?: Document[]; // 🔹 Guardará URLs de Firebase
  
    variables?: Record<string, string | number | boolean | null>;
 // 🔹 Permite agregar más propiedades dinámicas si se necesitan
  }

  export interface Prospecto {
    id: string;
    userid:string;
    nombreCompleto: string;
    correoElectronico?: string;
    celular?: string;
    ocupacionCliente?: string;
    edoCivilCliente?: string;
    clasificacionCliente?: string;
    medioCaptacion?: string;    
    comentarios?: string;
    proyectosInteres?: string[];
    fechaCreacion?: string;
    fechaActualizacion?: string;
    estatusBaja?:boolean
  }

// Define el tipo de estatus como un union type:
export const ESTATUS_LIST = [
  'contactado',
  'interaccion',
  'cotizacion',
  'visita',
  'posible',
  'apartado',
  'vendido',
  'descartado'
] as const;
// NUEVOS ESTATUS EN ESPAÑOL Y SUS COLORES
export const ESTATUS_OPCIONES = [
  { value: 'contactado', label: 'Contactado', color: 'info.main' },
  { value: 'interaccion', label: 'Interacción', color: 'primary.main' },
  { value: 'cotizacion', label: 'Cotización', color: 'secondary.main' },
  { value: 'visita', label: 'Visita', color: 'success.main' },
  { value: 'posible', label: 'Posible', color: 'warning.main' },
  { value: 'apartado', label: 'Apartado', color: 'purple.main' },
  { value: 'vendido', label: 'Vendido', color: 'grey.500' },
  { value: 'descartado', label: 'Descartado', color: 'grey.900' },
];
export const MOTIVOS_DESCARTE = [
  "Compra otro lugar",
  "Entrega Inmediata",
  "Etapa",
  "Giro",
  "Mystery Shopper",
  "No contesta",
  "Ofrece Servicios",
  "Precio",
  "Renta",
  "Spam",
  "Tamaño",
  "Zona"
]
export const MOTIVOS_INTERACCION = [
  "Asesor",
  "Seguimiento",
]
// Ahora, extrae el tipo union de ese array:
export type EstatusSeguimiento = typeof ESTATUS_LIST[number];

// Úsalo en la interfaz:
export interface Seguimiento {
  id: string;
  idprospecto: string;
  userid: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaProximoSeguimiento: string;
  unidadInteres: string;
  formaDePago: string;
  temperaturaInteres: string;
  comentarios: string;
  proyectoInteres: string;
  capacidadDePago: string;
  estatusSeguimiento: EstatusSeguimiento;
  motivo?: string[];
  historialSeguimiento: SeguimientoHistorial[];
  pdfCotizaciones?:Document[]
}

   export interface SeguimientoHistorial {
    id: string;
    idprospecto:string;    
    userid:string;
    fechaCreacion: string;  
    fechaActualizacion: string;
    fechaProximoSeguimiento: string;
    unidadInteres: string;
    formaDePago: string;
    temperaturaInteres: string;
    comentarios: string;    
    proyectoInteres: string;
    capacidadDePago: string;
    estatusSeguimiento: EstatusSeguimiento;
    pdfCotizaciones?:Document[]

  }


  export  type CotizadorOption =
  | (Propiedad & { tipo: 'propiedad' })
  | (Unidad & { proyectoObj: Proyecto; tipo: 'unidad' })
  | (Proyecto & { proyectoObj: Proyecto; tipo: 'proyecto' });