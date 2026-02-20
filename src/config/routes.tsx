import React from 'react';

import BathtubIcon from '@mui/icons-material/Bathtub';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import StraightenIcon from '@mui/icons-material/Straighten';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import ChatIcon from '@mui/icons-material/Chat';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SecurityIcon from '@mui/icons-material/Security';
import YardIcon from '@mui/icons-material/Yard';
import TheatersIcon from '@mui/icons-material/Theaters';
import PeopleIcon from '@mui/icons-material/PeopleOutline';
import GavelIcon from '@mui/icons-material/GavelOutlined';
import HomeIcon from '@mui/icons-material/HomeOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';

import logo from "../assets/logos/logoObjetiva.png";

// Nombre del Proyecto
export const nombreProyecto = "Nombre del Proyecto";

// Agrupación de imágenes e íconos
export const images = {
  logo,
};

export const icons = {
  materialUI: {
    home: <HomeIcon />,
    settings: <SettingsIcon />,
    business: <BusinessIcon />,
    calendar: <CalendarTodayIcon />,
    people: <PeopleIcon />,
    security: <SecurityIcon />,
    chat: <ChatIcon />,
    shoppingCart: <ShoppingCartIcon />,
    yard: <YardIcon />,
    theaters: <TheatersIcon />,
    legal: <GavelIcon />,
    attachMoney: <AttachMoneyIcon />,
    straighten: <StraightenIcon />,
    bathtub: <BathtubIcon />,
    directionsCar: <DirectionsCarIcon />,
    warehouse: <WarehouseIcon />,
  },
};
export interface RouteConfig {
  path: string
  name: string
  icon: React.ElementType
  element: React.LazyExoticComponent<React.FC>
  area?: string
  rol?: string | string[]
  nivel?: ('Administrador' | 'Usuario')[]    
  hideSelector?: boolean
  children?: RouteConfig[]
}

export const routes: RouteConfig[] = [
  {
    path: 'inicio',
    name: 'Home',
    icon: HomeIcon,
    rol: ['Gerente','GerenteGeneral', 'Plataforma', 'Usuario'],
    nivel: ['Administrador', 'Usuario'],                                            
    element: React.lazy(() => import('../pages/IndexPage')),
    hideSelector: true,
  },
  {
    path: 'perfil',
    name: 'Mi Perfil',
    icon: PeopleIcon,
    rol: ['Gerente','GerenteGeneral', 'Plataforma', 'Usuario'],
    nivel: ['Administrador', 'Usuario'],                                            
    element: React.lazy(() => import('../pages/perfil/PerfilPage')),
    hideSelector: true,
  },
  {
    path: 'configuracion',
    name: 'SettingsIcon',
    icon: BusinessIcon,
    rol: ['Gerente','GerenteGeneral', 'Plataforma', 'Usuario'],
    nivel: ['Administrador', 'Usuario'],                                            
    element: React.lazy(() => import('../pages/config/ConfiguracionPage')),
    hideSelector: true,

  },  
  {
    path: 'proyectos',
    name: 'Proyectos',
    icon: BusinessIcon,
    rol: ['Gerente','Gerente General', 'Plataforma', 'Usuario'],
    nivel: ['Administrador', 'Usuario'],                                            
    element: React.lazy(() => import('../pages/admin/InventarioPage')),
    hideSelector: true,

  },
  {
    path: 'interesados',
    name: 'Usuarios',
    icon: PeopleIcon,
    rol: ['Gerente','GerenteGeneral', 'Plataforma',],
    nivel: ['Administrador', 'Usuario'],                                            
    element: React.lazy(() => import('../pages/config/InteresadosPage')),
    hideSelector: true,
  },
  {
    path: 'easybroker',
    name: 'EasyBroker',
    icon: SettingsEthernetIcon,
    rol: ['Gerente','GerenteGeneral', 'Plataforma'],
    nivel: ['Administrador', 'Usuario'],
    element: React.lazy(() => import('../pages/config/EasyBrokerPage')),
    hideSelector: true,
  },
  {
    path: 'inventario',
    name: 'Inventario',
    icon: PeopleIcon,
    rol: ['Gerente','GerenteGeneral', 'Plataforma', 'Usuario'],
    nivel: ['Administrador', 'Usuario'],     
    element: React.lazy(() => import('../pages/admin/InventarioPage')),
    hideSelector: true,

  },
  {
    path: 'productos',
    name: 'Inventario General',
    icon: PeopleIcon,
    rol: ['Gerente','GerenteGeneral', 'Plataforma', 'Usuario'],
    nivel: ['Administrador', 'Usuario'],     
    element: React.lazy(() => import('../pages/inventario/InventarioGeneralPage')),
    hideSelector: true,

  },
    
  {
    path: 'prospeccion',
    name: 'Prospeccion',
    icon: SettingsIcon,
    element: React.lazy(() => import('../pages/prospecc/ProspeccionPage')),
    rol: ['Gerente','GerenteGeneral', 'Plataforma', 'Usuario'],
    nivel: ['Administrador', 'Usuario'], 
    hideSelector: true, 
    
  }, 
  
  // 🧪 Demo de Offline-First (solo en DEV)
  {
    path: 'offline-demo',
    name: 'Offline Demo',
    icon: SettingsIcon,
    element: React.lazy(() => import('../components/dev/OfflineDemo')),
    rol: ['GerenteGeneral', 'Plataforma'],
    nivel: ['Administrador'], 
    hideSelector: true, 
  }, 
  
]

export const routesNav: RouteConfig[] = [
  {
    path: 'inicio',
    name: 'Home',
    icon: BusinessIcon,
    rol: ['Gerente','GerenteGeneral', 'Plataforma', 'Usuario'],
    nivel: ['Administrador', 'Usuario'],                                            
    element: React.lazy(() => import('../pages/IndexPage')),
    hideSelector: true,
  },
  {
    path: 'configuracion',
    name: 'Configuración',
    icon: SettingsIcon,
    element: React.lazy(() => import('../pages/config/ConfiguracionPage')),
    rol: ['GerenteGeneral', 'Plataforma'],
    nivel: ['Administrador', 'Usuario'], 
    hideSelector: true,                                           
    children: [             
      {
        path: 'interesados',
        name: 'Usuarios',
        icon: PeopleIcon,
        rol: ['Gerente','GerenteGeneral', 'Plataforma',],
        nivel: ['Administrador', 'Usuario'],     
        element: React.lazy(() => import('../pages/config/InteresadosPage')),
        hideSelector: true,

      },
      {
        path: 'easybroker',
        name: 'EasyBroker',
        icon: SettingsEthernetIcon,
        rol: ['Gerente','GerenteGeneral', 'Plataforma'],
        nivel: ['Administrador', 'Usuario'],
        element: React.lazy(() => import('../pages/config/EasyBrokerPage')),
        hideSelector: true,

      },
    ]
  },  
  {
    path: 'administracion',
    name: 'Administracion',
    icon: SettingsIcon,
    element: React.lazy(() => import('../pages/config/ConfiguracionPage')),
    rol: ['Gerente','GerenteGeneral', 'Plataforma'],
    nivel: ['Administrador', 'Usuario'], 
    hideSelector: true,                                           
    children: [             
      {
        path: 'inventario',
        name: 'Inventario',
        icon: PeopleIcon,
        rol: ['Gerente','GerenteGeneral', 'Plataforma'],
        nivel: ['Administrador', 'Usuario'],     
        element: React.lazy(() => import('../pages/admin/InventarioPage')),
        hideSelector: true,

      },
    ]
  },    
  {
    path: 'productos',
    name: 'Productos',
    icon: SettingsIcon,
    element: React.lazy(() => import('../pages/inventario/InventarioGeneralPage')),
    rol: ['Gerente','GerenteGeneral', 'Plataforma', 'Usuario'],
    nivel: ['Administrador', 'Usuario'], 
    hideSelector: true,                                           
    children: [             
      {
        path: 'productos',
        name: 'Inventario General',
        icon: PeopleIcon,
        rol: ['Gerente','GerenteGeneral', 'Plataforma', 'Usuario'],
        nivel: ['Administrador', 'Usuario'],     
        element: React.lazy(() => import('../pages/inventario/InventarioGeneralPage')),
        hideSelector: true,

      },
    ]
  },  
      
  {
    path: 'prospeccion',
    name: 'Prospeccion',
    icon: SettingsIcon,
    element: React.lazy(() => import('../pages/prospecc/ProspeccionPage')),
    rol: ['Gerente','GerenteGeneral', 'Plataforma', 'Usuario'],
    nivel: ['Administrador', 'Usuario'], 
    hideSelector: true, 
    
  },  
]
