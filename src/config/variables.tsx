import React from 'react';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import StraightenIcon from '@mui/icons-material/Straighten';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BeachAccess from '@mui/icons-material/BeachAccess';
import Balcony from '@mui/icons-material/Balcony';
import LocalParking from '@mui/icons-material/LocalParking';
import Garage from '@mui/icons-material/Garage';
import Yard from '@mui/icons-material/Yard';
import LocalShipping from '@mui/icons-material/LocalShipping';
import OutdoorGrill from '@mui/icons-material/OutdoorGrill';
import Deck from '@mui/icons-material/Deck';
import Pool from '@mui/icons-material/Pool';
import Security from '@mui/icons-material/Security';
import Pets from '@mui/icons-material/Pets';
import SmokingRooms from '@mui/icons-material/SmokingRooms';
import SmokeFree from '@mui/icons-material/SmokeFree';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import HotTub from '@mui/icons-material/HotTub';
import Theaters from '@mui/icons-material/Theaters';

export const collectionDBUsers = "crmobjetivarealestate/crmobjetivarealestate/users";
export const collectionDBProyectos = "crmobjetivarealestate/crmobjetivarealestate/proyectos";
export const collectionDBClientes = "crmobjetivarealestate/crmobjetivarealestate/clientes";
export const collectionDBSeguimientos = "crmobjetivarealestate/crmobjetivarealestate/seguimientos";
export const collectionDBPropiedades = "crmobjetivarealestate/crmobjetivarealestate/propiedades";

import logo from "../assets/logos/logoObjetiva.png";
import logoRealEstate from "../assets/logos/logoObjetivaRealEstate.png";
import logoGoogle from '../assets/logos/logoGoogle.png';

import iconoMuestra from "../assets/icons/iconoMuestra.png";
import iconoUsuarios from '../assets/icons/iconoUsuarios.png';
import iconoClientes from '../assets/icons/iconoClientes.png';

// Agrupación de imágenes e íconos
export const images = {
  logo,
  logoRealEstate,
  logoGoogle,
};

export const icons = {
    iconoMuestra,
    iconoUsuarios,
    iconoClientes,
  };



  export const ListasDesplegables = {
    MedioDeCaptacion: [
      "Espectacular", "Redes sociales", "Recomendacion", "De paso",
      "Revista", "Prospecto Propio", "Otra inmobiliaria", "Ferias",
    ],
    CapacidadDePago: ["2-3 millones", "3-4 millones", "4-5 millones", "> 5 millones"],
    FormaDePago: ["Un solo pago", "Plazos", "Crédito bancario"],
    EstadoCivil: ["Casado", "Soltero", "Viudo", "Divorciado", "Unión libre"],
    TemperaturaDeInteres: [
      "0% (Lo voy a pensar)", "40% (Lo consultare con...)", "60% (Solicita información detallada)",
      "80% (Realiza un apartado)", "100% (Compra)"
    ],
    ClasificacionCliente: ["Inversionista", "Cliente Final"],
    SiNo: ["Si", "No"],
  
    TipoPropiedad: {
      Residencial: ["Casa", "Casa Condominio", "Departamento", "Quinta", "Rancho", "Terreno", "Villa"],
      Comercial: [
        "Bodega Comercial", "Casa uso Comercial", "Edificio", "Huerta",
        "Local Comercial", "Local Centro Comercial", "Oficina", "Terreno Comercial"
      ],
      Industrial: ["Bodega Industrial", "Nave Industrial", "Terreno Industrial"],
    },
  
    Propiedades: {
      Casa: [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
        { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
        { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],
      
      "Casa Condominio": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
        { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
        { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Ubicación Piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "piso" },
        { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],
      
      Departamento: [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Ubicación Piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "piso" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],
      "Quinta": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
        { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
        { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],

      "Rancho": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
        { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
        { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],

      "Terreno": [
        { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
        { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],

      "Villa": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
        { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
        { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],
      "Bodega Comercial": [
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
        { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
        { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],

      "Casa Uso Comercial": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
        { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
        { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Ubicación Piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "piso" },
        { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],

      "Edificio": [
        { label: "Espacios", labelSQL: "espacios", icon: BusinessIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
        { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
        { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],

      "Huerta": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
        { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
        { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
        { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
        { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
      ],
        "Local Comercial": [
          { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
          { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
          { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
          { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
          { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
          { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
          { label: "Ubicación Piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "piso" },
          { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
          { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
        ],

        "Local Centro Comercial": [
          { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
          { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
          { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
          { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
          { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
          { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
          { label: "Ubicación Piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "piso" },
          { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
        ],

        "Oficina": [
          { label: "Espacios", labelSQL: "espacios", icon: BusinessIcon, unit: "" },
          { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
          { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
          { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
          { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
          { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
          { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
          { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
          { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
          { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
          { label: "Ubicación Piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "piso" },
          { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
        ],

        "Terreno Comercial": [
          { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
          { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
          { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
          { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        ],

        "Bodega Industrial": [
          { label: "Espacios", labelSQL: "espacios", icon: WarehouseIcon, unit: "" },
          { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
          { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
          { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
          { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
          { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
          { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
          { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
          { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
          { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
          { label: "Ubicación Piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "piso" },
          { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
        ],

        "Nave Industrial": [
          { label: "Espacios", labelSQL: "espacios", icon: WarehouseIcon, unit: "" },
          { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
          { label: "Medios Baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
          { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
          { label: "Construcción", labelSQL: "construccion", icon: StraightenIcon, unit: "m²" },
          { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
          { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
          { label: "Cantidad de Pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "pisos" },
          { label: "Ubicación Piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "piso" },
          { label: "Mantenimiento Mensual", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "$/mes" },
        ],
        "Terreno Industrial": [
          { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
          { label: "Largo Terreno", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "m" },
          { label: "Frente Terreno", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "m" },
          { label: "Año Construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "años" },
        ],
      
    },
    "amenidades": {
  "Exterior": [
    { label: "Acceso a la playa", labelSQL: "accesoPlaya", icon: BeachAccess },
    { label: "Andén", labelSQL: "anden", icon: LocalShipping },
    { label: "Balcón", labelSQL: "balcon", icon: Balcony },
    { label: "Cisterna", labelSQL: "cisterna", icon: null },
    { label: "Estacionamiento techado", labelSQL: "estacionamientoTechado", icon: LocalParking },
    { label: "Facilidad para estacionarse", labelSQL: "facilidadEstacionarse", icon: LocalParking },
    { label: "Frente a la playa", labelSQL: "frentePlaya", icon: BeachAccess },
    { label: "Frente al agua", labelSQL: "frenteAgua", icon: BeachAccess },
    { label: "Garaje", labelSQL: "garaje", icon: Garage },
    { label: "Jardín", labelSQL: "jardin", icon: Yard },
    { label: "Muelle de carga", labelSQL: "muelleCarga", icon: LocalShipping },
    { label: "Parrilla", labelSQL: "parrilla", icon: OutdoorGrill },
    { label: "Patio", labelSQL: "patio", icon: Yard },
    { label: "Riego por aspersión", labelSQL: "riegoAspersion", icon: null },
    { label: "Roof garden", labelSQL: "roofGarden", icon: Deck },
    { label: "Terraza", labelSQL: "terraza", icon: Balcony },
    { label: "Vista al agua", labelSQL: "vistaAgua", icon: BeachAccess },
    { label: "Vista al mar", labelSQL: "vistaMar", icon: BeachAccess },
  ],

  "General": [
    { label: "Accesibilidad para adultos mayores", labelSQL: "accesibilidadAdultos", icon: null },
    { label: "Accesibilidad para personas con discapacidad", labelSQL: "accesibilidadDiscapacidad", icon: null },
    { label: "Aire acondicionado", labelSQL: "aireAcondicionado", icon: null },
    { label: "Alarma", labelSQL: "alarma", icon: Security },
    { label: "Amueblado", labelSQL: "amueblado", icon: null },
    { label: "Bodega", labelSQL: "bodega", icon: null },
    { label: "Calefacción", labelSQL: "calefaccion", icon: null },
    { label: "Chimenea", labelSQL: "chimenea", icon: null },
    { label: "Circuito cerrado", labelSQL: "circuitoCerrado", icon: Security },
    { label: "Cocina", labelSQL: "cocina", icon: null },
    { label: "Cocina equipada", labelSQL: "cocinaEquipada", icon: null },
    { label: "Cocina integral", labelSQL: "cocinaIntegral", icon: null },
    { label: "Conmutador", labelSQL: "conmutador", icon: null },
    { label: "Cuarto de servicio", labelSQL: "cuartoServicio", icon: null },
    { label: "Dos plantas", labelSQL: "dosPlantas", icon: null },
    { label: "Elevador", labelSQL: "elevador", icon: null },
    { label: "Estudio", labelSQL: "estudio", icon: null },
    { label: "Fraccionamiento privado", labelSQL: "fraccionamientoPrivado", icon: null },
    { label: "Hidroneumático", labelSQL: "hidroneumatico", icon: null },
    { label: "Oficina", labelSQL: "oficina", icon: null },
    { label: "Panel solar", labelSQL: "panelSolar", icon: null },
    { label: "Penthouse", labelSQL: "penthouse", icon: null },
    { label: "Planta Baja", labelSQL: "plantaBaja", icon: null },
    { label: "Planta eléctrica", labelSQL: "plantaElectrica", icon: null },
    { label: "Portero", labelSQL: "portero", icon: null },
    { label: "Rampas", labelSQL: "rampas", icon: null },
    { label: "Recámara en planta baja", labelSQL: "recamaraPlantaBaja", icon: null },
    { label: "Seguridad 12 horas", labelSQL: "seguridad12Horas", icon: Security },
    { label: "Seguridad 24 horas", labelSQL: "seguridad24Horas", icon: Security },
    { label: "Una sola planta", labelSQL: "unaSolaPlanta", icon: null },
  ],

  "Políticas": [
    { label: "Mascotas permitidas", labelSQL: "mascotasPermitidas", icon: Pets },
    { label: "No se aceptan mascotas", labelSQL: "noMascotas", icon: Pets },
    { label: "Permitido fumar", labelSQL: "permitidoFumar", icon: SmokingRooms },
    { label: "Prohibido fumar", labelSQL: "prohibidoFumar", icon: SmokeFree },
  ],

  "Recreación": [
    { label: "Alberca", labelSQL: "alberca", icon: Pool },
    { label: "Área de juegos infantiles", labelSQL: "areaJuegosInfantiles", icon: null },
    { label: "Cancha de pádel", labelSQL: "canchaPadel", icon: null },
    { label: "Cancha de tenis", labelSQL: "canchaTenis", icon: null },
    { label: "Cine", labelSQL: "cine", icon: Theaters },
    { label: "Fogatero", labelSQL: "fogatero", icon: null },
    { label: "Gimnasio", labelSQL: "gimnasio", icon: FitnessCenter },
    { label: "Jacuzzi", labelSQL: "jacuzzi", icon: HotTub },
    { label: "Salón de usos múltiples", labelSQL: "salonUsosMultiples", icon: null },
  ],
},
  
  };


  export const routes = [
    { path: '/inicio', name: 'Home', element: React.lazy(() => import('../pages/IndexPage')) },
    { path: '/usuarios', name: 'Usuarios', element: React.lazy(() => import('../pages/UsuariosPage.tsx')),rol:"Gerente"},
    { path: '/configuracion', name: 'Configuración Inventario', element: React.lazy(() => import('../pages/ControlInventarioPage.tsx')),rol:"Gerente"},
    { path: '/inventario', name: 'Inventario', element: React.lazy(() => import('../pages/InventarioPage.tsx'))},
    { path: '/seguimientos', name: 'Seguimientos', element: React.lazy(() => import('../pages/SeguimientosPage.tsx'))},    
    { path: '/clientes', name: 'Clientes', element: React.lazy(() => import('../pages/ClientesPage.tsx')) },
  ];
  