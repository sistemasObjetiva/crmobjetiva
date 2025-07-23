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
  GerenteGeneral:   { tipo: 'GerenteGeneral', jerarquia: 1 },
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
    fechaCreacion?: string;
    ocupacionCliente?: string;
    edoCivilCliente?: string;
    clasificacionCliente?: string;
    medioCaptacion?: string;    
    comentarios?: string;
    proyectosInteres?: string[];
  }

// Define el tipo de estatus como un union type:
export const ESTATUS_LIST = [
  'contactado',
  'interaccion',
  'cotizacion',
  'visita',
  'posible',
  'apartado',
  'vendido'
] as const;

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
  historialSeguimiento: SeguimientoHistorial[];
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
  }