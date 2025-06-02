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
import BlockIcon from '@mui/icons-material/Block';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import FireplaceIcon from '@mui/icons-material/Fireplace';
import BedroomBabyIcon from '@mui/icons-material/BedroomBaby';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ElevatorIcon from '@mui/icons-material/Elevator';
import KitchenIcon from '@mui/icons-material/Kitchen';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WeekendIcon from '@mui/icons-material/Weekend';
import ElderlyIcon from '@mui/icons-material/Elderly';
import DeskIcon from '@mui/icons-material/Desk';
import PersonIcon from '@mui/icons-material/Person';
import WbSunny from '@mui/icons-material/WbSunny';
import RoomIcon from '@mui/icons-material/Room';
import RouterIcon from '@mui/icons-material/Router';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PowerIcon from '@mui/icons-material/Power';
import ParkIcon from '@mui/icons-material/Park';
import WaterIcon from '@mui/icons-material/Water';
import WavesIcon from '@mui/icons-material/Waves';
import LayersIcon from '@mui/icons-material/Layers';
import HouseIcon from '@mui/icons-material/House';
import WheelchairPickupIcon from '@mui/icons-material/WheelchairPickup';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

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
      "Espectacular", "Redes sociales", "Recomendacion", "En sitio showroom",
      "Revista", "Prospecto Propio", "Otra inmobiliaria", "Ferias","Página web"
    ],
    CapacidadDePago: [ "< 2 millones","2-4 millones", "4-6 millones","> 6 millones"],
    FormaDePago: ["Un solo pago", "Plazos", "Crédito bancario"],
    EstadoCivil: ["Casado", "Soltero", "Viudo", "Divorciado", "Unión libre"],
    TemperaturaDeInteres: [
      "0% (Lo voy a pensar)", "40% (Lo consultare con...)", "60% (Solicita información detallada)",
      "80% (Realiza un apartado)", "100% (Compra)"
    ],
    EstatusSeguimiento: [
      "Contactado", "Interacción", "Detalle y cotización",
      "Visita","Posible", "Descartado"
    ],
    ClasificacionCliente: ["Inversionista", "Cliente Final","Inmobiliaria"],
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
        { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
        { label: "Terreno (m)²", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
        { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
        { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],
      
      "Casa Condominio": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
        { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
        { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
        { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Ubicación piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "" },
        { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],
      
      Departamento: [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Ubicación piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],
      "Quinta": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
        { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
        { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
        { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],

      "Rancho": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
        { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
        { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
        { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],

      "Terreno": [
        { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
        { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
        { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],

      "Villa": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
        { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
        { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
        { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],
      "Bodega Comercial": [
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
        { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
        { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
        { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],

      "Casa Uso Comercial": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
        { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
        { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
        { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Ubicación piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "" },
        { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],

      "Edificio": [
        { label: "Espacios", labelSQL: "espacios", icon: BusinessIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
        { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
        { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
        { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],

      "Huerta": [
        { label: "Recámaras", labelSQL: "recamaras", icon: BedIcon, unit: "" },
        { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
        { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
        { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
        { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
        { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
        { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
        { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
        { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
        { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
      ],
        "Local Comercial": [
          { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
          { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
          { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
          { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
          { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
          { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
          { label: "Ubicación piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "" },
          { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
          { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
        ],

        "Local Centro Comercial": [
          { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
          { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
          { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
          { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
          { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
          { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
          { label: "Ubicación piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "" },
          { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
        ],

        "Oficina": [
          { label: "Espacios", labelSQL: "espacios", icon: BusinessIcon, unit: "" },
          { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
          { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
          { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
          { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
          { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
          { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
          { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
          { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
          { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
          { label: "Ubicación piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "" },
          { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
        ],

        "Terreno Comercial": [
          { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
          { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
          { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
          { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        ],

        "Bodega Industrial": [
          { label: "Espacios", labelSQL: "espacios", icon: WarehouseIcon, unit: "" },
          { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
          { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
          { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
          { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
          { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
          { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
          { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
          { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
          { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
          { label: "Ubicación piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "" },
          { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
        ],

        "Nave Industrial": [
          { label: "Espacios", labelSQL: "espacios", icon: WarehouseIcon, unit: "" },
          { label: "Baños", labelSQL: "banos", icon: BathtubIcon, unit: "" },
          { label: "Medios baños", labelSQL: "mediosBanos", icon: BathtubIcon, unit: "" },
          { label: "Estacionamientos", labelSQL: "estacionamientos", icon: DirectionsCarIcon, unit: "" },
          { label: "Construcción (m²)", labelSQL: "construccion", icon: StraightenIcon, unit: "" },
          { label: "Terreno (m²)", labelSQL: "terreno", icon: StraightenIcon, unit: "" },
          { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
          { label: "Cantidad de pisos", labelSQL: "cantidadPisos", icon: BusinessIcon, unit: "" },
          { label: "Ubicación piso", labelSQL: "ubicacionPiso", icon: BusinessIcon, unit: "" },
          { label: "Mantenimiento mensual ($/mes)", labelSQL: "mantenimientoMensual", icon: AttachMoneyIcon, unit: "" },
        ],
        "Terreno Industrial": [
          { label: "Terreno", labelSQL: "terreno", icon: StraightenIcon, unit: "m²" },
          { label: "Largo terreno (m)", labelSQL: "largoTerreno", icon: StraightenIcon, unit: "" },
          { label: "Frente terreno (m)", labelSQL: "frenteTerreno", icon: StraightenIcon, unit: "" },
          { label: "Año construcción", labelSQL: "anoConstruccion", icon: CalendarTodayIcon, unit: "" },
        ],
      
    },
    "amenidades": {
  "Exterior": [
    { label: "Acceso a la playa", labelSQL: "accesoPlaya", icon: BeachAccess },
    { label: "Andén", labelSQL: "anden", icon: LocalShipping },
    { label: "Balcón", labelSQL: "balcon", icon: Balcony },
    { label: "Cisterna", labelSQL: "cisterna", icon: WaterIcon  },
    { label: "Estacionamiento techado", labelSQL: "estacionamientoTechado", icon: LocalParking },
    { label: "Facilidad para estacionarse", labelSQL: "facilidadEstacionarse", icon: LocalParking },
    { label: "Frente a la playa", labelSQL: "frentePlaya", icon: WavesIcon  },
    { label: "Frente al agua", labelSQL: "frenteAgua", icon: WaterIcon },
    { label: "Garaje", labelSQL: "garaje", icon: Garage },
    { label: "Jardín", labelSQL: "jardin", icon: Yard },
    { label: "Muelle de carga", labelSQL: "muelleCarga", icon: LocalShipping },
    { label: "Parrilla", labelSQL: "parrilla", icon: OutdoorGrill },
    { label: "Patio", labelSQL: "patio", icon: Yard },
    { label: "Riego por aspersión", labelSQL: "riegoAspersion", icon: LocalFloristIcon  },
    { label: "Roof garden", labelSQL: "roofGarden", icon: Deck },
    { label: "Terraza", labelSQL: "terraza", icon: Balcony },
    { label: "Vista al agua", labelSQL: "vistaAgua", icon: WaterIcon  },
    { label: "Vista al mar", labelSQL: "vistaMar", icon: WavesIcon  },
  ],

  "General": [
    { label: "Accesibilidad a adultos mayores", labelSQL: "accesibilidadAdultos", icon: ElderlyIcon  },
    { label: "Accesibilidad a personas con discapacidad", labelSQL: "accesibilidadDiscapacidad", icon: WheelchairPickupIcon  },
    { label: "Aire acondicionado", labelSQL: "aireAcondicionado", icon: AcUnitIcon },
    { label: "Alarma", labelSQL: "alarma", icon: Security },
    { label: "Amueblado", labelSQL: "amueblado", icon: WeekendIcon  },
    { label: "Bodega", labelSQL: "bodega", icon: WarehouseIcon  },
    { label: "Calefacción", labelSQL: "calefaccion", icon: ThermostatIcon   },
    { label: "Chimenea", labelSQL: "chimenea", icon: FireplaceIcon },
    { label: "Circuito cerrado", labelSQL: "circuitoCerrado", icon: Security },
    { label: "Cocina", labelSQL: "cocina", icon: KitchenIcon  },
    { label: "Cocina equipada", labelSQL: "cocinaEquipada", icon: KitchenIcon  },
    { label: "Cocina integral", labelSQL: "cocinaIntegral", icon: KitchenIcon  },
    { label: "Conmutador", labelSQL: "conmutador", icon: RouterIcon   },
    { label: "Cuarto de servicio", labelSQL: "cuartoServicio", icon: RoomIcon    },
    { label: "Dos plantas", labelSQL: "dosPlantas", icon: LayersIcon  },
    { label: "Elevador", labelSQL: "elevador", icon: ElevatorIcon  },
    { label: "Estudio", labelSQL: "estudio", icon: DeskIcon },
    { label: "Fraccionamiento privado", labelSQL: "fraccionamientoPrivado", icon: LocationCityIcon  },
    { label: "Hidroneumático", labelSQL: "hidroneumatico", icon: WaterDropIcon },
    { label: "Oficina", labelSQL: "oficina", icon: DeskIcon  },
    { label: "Panel solar", labelSQL: "panelSolar", icon: WbSunny },
    { label: "Penthouse", labelSQL: "penthouse", icon: ApartmentIcon  },
    { label: "Planta Baja", labelSQL: "plantaBaja", icon: HouseIcon   },
    { label: "Planta eléctrica", labelSQL: "plantaElectrica", icon: PowerIcon },
    { label: "Portero", labelSQL: "portero", icon: PersonIcon  },
    { label: "Rampas", labelSQL: "rampas", icon: WheelchairPickupIcon    },
    { label: "Recámara en planta baja", labelSQL: "recamaraPlantaBaja", icon: BedroomBabyIcon  },
    { label: "Seguridad 12 horas", labelSQL: "seguridad12Horas", icon: Security },
    { label: "Seguridad 24 horas", labelSQL: "seguridad24Horas", icon: Security },
    { label: "Una sola planta", labelSQL: "unaSolaPlanta", icon: HouseIcon },
  ],

  "Políticas": [
    { label: "Mascotas permitidas", labelSQL: "mascotasPermitidas", icon: Pets },
    { label: "No se aceptan mascotas", labelSQL: "noMascotas", icon: BlockIcon },
    { label: "Permitido fumar", labelSQL: "permitidoFumar", icon: SmokingRooms },
    { label: "Prohibido fumar", labelSQL: "prohibidoFumar", icon: SmokeFree },
  ],

  "Recreación": [
    { label: "Alberca", labelSQL: "alberca", icon: Pool },
    { label: "Área de juegos infantiles", labelSQL: "areaJuegosInfantiles", icon: ParkIcon   },
    { label: "Cancha de pádel", labelSQL: "canchaPadel", icon: SportsTennisIcon  },
    { label: "Cancha de tenis", labelSQL: "canchaTenis", icon: SportsTennisIcon  },
    { label: "Cine", labelSQL: "cine", icon: Theaters },
    { label: "Fogatero", labelSQL: "fogatero", icon: FireplaceIcon },
    { label: "Gimnasio", labelSQL: "gimnasio", icon: FitnessCenter },
    { label: "Jacuzzi", labelSQL: "jacuzzi", icon: HotTub },
    { label: "Salón de usos múltiples", labelSQL: "salonUsosMultiples", icon: MeetingRoomIcon },
  ],
},
  
  };


  export const routes = [
    { path: '/inicio', name: 'Inicio', element: React.lazy(() => import('../pages/IndexPage')) },
    { path: '/usuarios', name: 'Usuarios', element: React.lazy(() => import('../pages/UsuariosPage.tsx')),rol:"Gerente"},
    { path: '/configuracion', name: 'Configuración Inventario', element: React.lazy(() => import('../pages/ControlInventarioPage.tsx')),rol:"Gerente"},
    { path: '/inventario', name: 'Inventario', element: React.lazy(() => import('../pages/InventarioPage.tsx'))},
    { path: '/seguimientos', name: 'Seguimientos', element: React.lazy(() => import('../pages/SeguimientosPage.tsx'))},    
    { path: '/clientes', name: 'Clientes', element: React.lazy(() => import('../pages/ClientesPage.tsx')) },
  ];
  