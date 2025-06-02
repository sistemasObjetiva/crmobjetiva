
export interface Usuario {
    id: string;
    nombreCompleto: string;
    correoElectronico: string;
    celular?: string;
    empresa: string;
    contrasena: string;
    rol: "Gerente" | "Usuario";
  }
  
export interface Event {
    id: string;
    fecha: string;
    cliente: string;
  }
  export interface Cliente {
    id: string;
    nombreCompleto: string;
    correoElectronico: string;
    celular?: string;
    correoUsuario: string;
    fechaCreacion: string;
    ocupacionCliente: string;
    edoCivilCliente: string;
    clasificacionCliente: string;
    medioCaptacion: string;
    proyectosInteres: string[];
  }
  
  
  // Definir el tipo Seguimiento
  export interface ActualizacionSeguimiento {
    fechaActualizacion: string;  // Almacenado como string para Firebase
    comentarios: string;
    temperaturaInteres: string;
}
  export interface Seguimiento {
    id?: string;
    idCliente?:string;
    cliente: string;
    correoUsuario: string;
    fechaCreacion: string;  // Almacenado como string para Firebase
    fechaActualizacion: string;
    fechaProximoSeguimiento: string;
    unidadInteres: string;
    formaDePago: string;
    temperaturaInteres: string;
    estatusSeguimiento:string;
    comentarios: string;    
    proyectoInteres: string;
    capacidadDePago: string;
    actualizaciones: ActualizacionSeguimiento[];
  }

export interface Proyecto {
    id?: string;
    descripcion?: string;
    fechaCreacion?: string;
    nombreProyecto: string;
    logo: string;
    fachada: string;
    imagenesProyecto: string[];
    amenidades: string[];
    unidades:Unidad[];
    paymentPlans: PaymentPlan[];
    [key: string]: unknown;
    fechaEntrega:string;
  }
  export interface Propiedad {
    id?: string; // 🔹 Identificador único en Firestore
    tituloPropiedad: string;
    tipo?: string;
    descripcion?: string;
    
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
  
    // 🔹 Auditoría
    creadoPor?: string; // 🔹 Email o ID del usuario que la creó
    actualizadoPor?: string; // 🔹 Último usuario que la modificó
    fechaCreacion?: Date | string; // 🔹 Puede ser `serverTimestamp()`, por lo que acepta `string`
    fechaActualizacion?: Date | string; 
  
   
    imagenes?: string[]; // 🔹 Guardará URLs de Firebase
  
    [key: string]: any; // 🔹 Permite agregar más propiedades dinámicas si se necesitan
  }
  export interface Unidad {
    numerounidad: string;
    unidadprivativa: string;
    preciolista: string;
    extras: Record<string, string>;
    imagenes: { name: string; data: string }[];
    render?: { name: string; data: string };
    isometrico?: { name: string; data: string };
    proyecto?: Proyecto;
  }
  export interface PaymentPlan {
    name: string;
    months: number;
    descuento: number;
    pInicial: number;
    mensualidades: number;
    contraentrega: number;
    parcialidades: { month: number; value: number }[];
  }
  
  
  export interface CustomPlan {
    customPrecioPlan: number;
    customPagoInicial: number;
    customContraEntrega: number;
    customPayments: { mes: string; monto: number }[];
  }
  
  export type PaymentPlanOrCustom = PaymentPlan | CustomPlan;
  