/**
 * ============================================
 * REPOSITORIOS ESPECÍFICOS
 * ============================================
 * Implementaciones concretas para cada entidad
 */

import { BaseRepository } from './BaseRepository';
import { db, LocalUser, LocalEmpresa, LocalProyecto, LocalUnidad, LocalPropiedad, LocalProspecto, LocalSeguimiento } from '../db/schema';
import type { User, Empresa, Proyecto, Unidad, Propiedad, Prospecto, Seguimiento } from '../config/types';

/**
 * Repositorio de Usuarios
 */
export class UsersRepository extends BaseRepository<User> {
  constructor() {
    super(db.users, 'users');
  }

  async findByEmail(email: string): Promise<LocalUser | undefined> {
    const users = await this.table.where('email').equals(email).toArray();
    return users.find(u => !u.deleted_at);
  }

  async findByEmpresa(empresaId: string): Promise<LocalUser[]> {
    const users = await this.table.where('empresaid').equals(empresaId).toArray();
    return users.filter(u => !u.deleted_at);
  }
}

/**
 * Repositorio de Empresas
 */
export class EmpresasRepository extends BaseRepository<Empresa> {
  constructor() {
    super(db.empresas, 'empresas');
  }

  async findByUser(userId: string): Promise<LocalEmpresa[]> {
    const empresas = await this.table.where('userid').equals(userId).toArray();
    return empresas.filter(e => !e.deleted_at);
  }
}

/**
 * Repositorio de Proyectos
 */
export class ProyectosRepository extends BaseRepository<Proyecto> {
  constructor() {
    super(db.proyectos, 'proyectos');
  }

  async findByUser(userId: string): Promise<LocalProyecto[]> {
    const proyectos = await this.table.where('userid').equals(userId).toArray();
    return proyectos.filter(p => !p.deleted_at);
  }

  async findActivos(): Promise<LocalProyecto[]> {
    const proyectos = await this.table.where('estatus').equals('activo').toArray();
    return proyectos.filter(p => !p.deleted_at);
  }
}

/**
 * Repositorio de Unidades
 */
export class UnidadesRepository extends BaseRepository<Unidad> {
  constructor() {
    super(db.unidades, 'unidades');
  }

  async findByProyecto(proyectoId: string): Promise<LocalUnidad[]> {
    const unidades = await this.table.where('proyectoid').equals(proyectoId).toArray();
    return unidades.filter(u => !u.deleted_at);
  }

  async findByEstatus(estatus: 'disponible' | 'vendido' | 'apartado'): Promise<LocalUnidad[]> {
    const unidades = await this.table.where('estatus').equals(estatus).toArray();
    return unidades.filter(u => !u.deleted_at);
  }

  async findDisponiblesByProyecto(proyectoId: string): Promise<LocalUnidad[]> {
    const unidades = await this.table
      .where('[proyectoid+estatus]')
      .equals([proyectoId, 'disponible'])
      .toArray();
    return unidades.filter(u => !u.deleted_at);
  }
}

/**
 * Repositorio de Propiedades
 */
export class PropiedadesRepository extends BaseRepository<Propiedad> {
  constructor() {
    super(db.propiedades, 'propiedades');
  }

  async findByUser(userId: string): Promise<LocalPropiedad[]> {
    const propiedades = await this.table.where('userid').equals(userId).toArray();
    return propiedades.filter(p => !p.deleted_at);
  }

  async findByTipo(tipo: string): Promise<LocalPropiedad[]> {
    const propiedades = await this.table.where('tipo').equals(tipo).toArray();
    return propiedades.filter(p => !p.deleted_at);
  }

  async findDisponibles(): Promise<LocalPropiedad[]> {
    const propiedades = await this.table.where('estatus').equals('disponible').toArray();
    return propiedades.filter(p => !p.deleted_at);
  }
}

/**
 * Repositorio de Prospectos
 */
export class ProspectosRepository extends BaseRepository<Prospecto> {
  constructor() {
    super(db.prospectos, 'prospectos');
  }

  async findByUser(userId: string): Promise<LocalProspecto[]> {
    const prospectos = await this.table.where('userid').equals(userId).toArray();
    return prospectos.filter(p => !p.deleted_at);
  }

  async findActivos(): Promise<LocalProspecto[]> {
    const prospectos = await this.table.toArray();
    return prospectos.filter(p => !p.deleted_at && !p.estatusBaja);
  }
}

/**
 * Repositorio de Seguimientos
 */
export class SeguimientosRepository extends BaseRepository<Seguimiento> {
  constructor() {
    super(db.seguimientos, 'seguimientos');
  }

  async findByProspecto(prospectoId: string): Promise<LocalSeguimiento[]> {
    const seguimientos = await this.table.where('idprospecto').equals(prospectoId).toArray();
    return seguimientos.filter(s => !s.deleted_at);
  }

  async findByUser(userId: string): Promise<LocalSeguimiento[]> {
    const seguimientos = await this.table.where('userid').equals(userId).toArray();
    return seguimientos.filter(s => !s.deleted_at);
  }

  async findByEstatus(estatus: string): Promise<LocalSeguimiento[]> {
    const seguimientos = await this.table.where('estatusSeguimiento').equals(estatus).toArray();
    return seguimientos.filter(s => !s.deleted_at);
  }
}

/**
 * Singleton instances de todos los repositorios
 */
export const repositories = {
  users: new UsersRepository(),
  empresas: new EmpresasRepository(),
  proyectos: new ProyectosRepository(),
  unidades: new UnidadesRepository(),
  propiedades: new PropiedadesRepository(),
  prospectos: new ProspectosRepository(),
  seguimientos: new SeguimientosRepository(),
};

// Exponer en desarrollo
if (import.meta.env.DEV) {
  // @ts-ignore
  window.repositories = repositories;
}
