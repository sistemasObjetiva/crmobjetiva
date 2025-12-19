/**
 * ============================================
 * NOTIFICATION SERVICE
 * ============================================
 * Servicio de notificaciones para:
 * - Estado de sincronización
 * - Eventos de negocio
 * - Alertas offline
 * - Centro de notificaciones persistente
 */

import { db, type AppNotification } from '../db/schema';
import { supabase } from '../config/supabase';

export type NotificationType = 'sync' | 'business' | 'system' | 'error';

export interface NotificationOptions {
  title: string;
  body: string;
  type: NotificationType;
  icon?: string;
  actionUrl?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = 'Notification' in window;
  private listeners: Array<() => void> = [];

  constructor() {
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Solicitar permiso para notificaciones
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Guardar notificación en IndexedDB
   */
  private async saveNotification(options: NotificationOptions): Promise<AppNotification> {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      type: options.type,
      title: options.title,
      body: options.body,
      icon: options.icon,
      actionUrl: options.actionUrl,
      data: options.data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    try {
      await db.notifications.add(notification);
      this.notifyListeners();
      return notification;
    } catch (error) {
      console.error('Error saving notification:', error);
      return notification;
    }
  }

  /**
   * Mostrar notificación
   */
  async show(options: NotificationOptions): Promise<void> {
    // Guardar en IndexedDB (centro de notificaciones)
    const notification = await this.saveNotification(options);

    // Mostrar notificación del navegador si hay permiso
    if (!this.isSupported) {
      return;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return;
      }
    }

    try {
      // Si hay service worker, usar showNotification
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: notification.id,
          data: options.data,
          requireInteraction: options.requireInteraction,
          silent: options.silent,
        });
      } else {
        // Fallback a Notification API
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/pwa-192x192.png',
          tag: notification.id,
          data: options.data,
          requireInteraction: options.requireInteraction,
          silent: options.silent,
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Obtener todas las notificaciones
   */
  async getNotifications(limit = 50): Promise<AppNotification[]> {
    try {
      return await db.notifications
        .orderBy('timestamp')
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Sincronizar notificaciones desde Supabase
   * Solo trae notificaciones enviadas por GerenteGeneral o Plataforma
   */
  async syncFromSupabase(): Promise<void> {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener notificaciones de Supabase para el usuario actual
      const { data: customNotifications, error } = await supabase
        .from('custom_notifications')
        .select(`
          id,
          title,
          body,
          type,
          recipients,
          attachments,
          created_at,
          created_by,
          creator:users!custom_notifications_created_by_fkey(role)
        `)
        .contains('recipients', [user.id])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching custom notifications:', error);
        return;
      }

      if (!customNotifications || customNotifications.length === 0) return;

      // Filtrar solo notificaciones enviadas por GerenteGeneral o Plataforma
      const allowedNotifications = customNotifications.filter((notif: any) => {
        const creatorRole = notif.creator?.role?.tipo;
        return creatorRole === 'GerenteGeneral' || creatorRole === 'Plataforma';
      });

      // Guardar en IndexedDB (evitar duplicados)
      for (const notif of allowedNotifications) {
        const exists = await db.notifications.get(notif.id);
        if (!exists) {
          const appNotification: AppNotification = {
            id: notif.id,
            type: notif.type || 'business',
            title: notif.title,
            body: notif.body,
            icon: '📢',
            timestamp: notif.created_at,
            read: false,
            data: {
              attachments: notif.attachments || [],
              customNotification: true,
            },
          };
          await db.notifications.add(appNotification);
        }
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Error syncing notifications from Supabase:', error);
    }
  }

  /**
   * Contar notificaciones no leídas
   */
  async getUnreadCount(): Promise<number> {
    try {
      return await db.notifications.filter(n => !n.read).count();
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(id: string): Promise<void> {
    try {
      await db.notifications.update(id, { read: true });
      this.notifyListeners();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(): Promise<void> {
    try {
      const unread = await db.notifications.filter(n => !n.read).toArray();
      await Promise.all(
        unread.map((notification) =>
          db.notifications.update(notification.id, { read: true })
        )
      );
      this.notifyListeners();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      await db.notifications.delete(id);
      this.notifyListeners();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Limpiar todas las notificaciones
   */
  async clearAll(): Promise<void> {
    try {
      await db.notifications.clear();
      this.notifyListeners();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Suscribirse a cambios en notificaciones
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Notificación de sincronización exitosa
   */
  async notifySyncSuccess(uploaded: number, downloaded: number): Promise<void> {
    await this.show({
      title: '✅ Sincronización completa',
      body: `${uploaded} cambios subidos, ${downloaded} cambios descargados`,
      type: 'sync',
      silent: true,
    });
  }

  /**
   * Notificación de error de sincronización
   */
  async notifySyncError(error: string): Promise<void> {
    await this.show({
      title: '❌ Error de sincronización',
      body: error,
      type: 'error',
      requireInteraction: true,
    });
  }

  /**
   * Notificación de modo offline
   */
  async notifyOffline(): Promise<void> {
    await this.show({
      title: '📡 Modo offline',
      body: 'Trabajando sin conexión. Los cambios se sincronizarán automáticamente.',
      type: 'system',
      icon: '📡',
    });
  }

  /**
   * Notificación de conexión restaurada
   */
  async notifyOnline(): Promise<void> {
    await this.show({
      title: '🌐 Conexión restaurada',
      body: 'Sincronizando cambios...',
      type: 'sync',
      icon: '🌐',
      silent: true,
    });
  }

  /**
   * Notificación de operaciones pendientes
   */
  async notifyPendingOperations(count: number): Promise<void> {
    if (count === 0) return;

    await this.show({
      title: '⏳ Operaciones pendientes',
      body: `Tienes ${count} cambio${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''} de sincronizar`,
      type: 'sync',
    });
  }

  /**
   * Notificaciones de negocio
   */

  async notifyNewProspecto(nombre: string): Promise<void> {
    await this.show({
      title: '👤 Nuevo prospecto',
      body: `${nombre} ha sido agregado`,
      type: 'business',
      icon: '👤',
      actionUrl: '/prospeccion',
    });
  }

  async notifyNewSeguimiento(prospecto: string): Promise<void> {
    await this.show({
      title: '📝 Nuevo seguimiento',
      body: `Seguimiento registrado para ${prospecto}`,
      type: 'business',
      icon: '📝',
      actionUrl: '/prospeccion',
    });
  }

  async notifyProximoSeguimiento(prospecto: string, fecha: string): Promise<void> {
    await this.show({
      title: '⏰ Seguimiento pendiente',
      body: `Recuerda hacer seguimiento a ${prospecto} - ${fecha}`,
      type: 'business',
      icon: '⏰',
      actionUrl: '/prospeccion',
      requireInteraction: true,
    });
  }

  async notifyVentaCerrada(proyecto: string, unidad: string): Promise<void> {
    await this.show({
      title: '🎉 Venta cerrada',
      body: `${proyecto} - ${unidad}`,
      type: 'business',
      icon: '🎉',
      actionUrl: '/operaciones',
      requireInteraction: true,
    });
  }

  /**
   * Verificar si las notificaciones están habilitadas
   */
  areEnabled(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  /**
   * Obtener estado de permiso
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Exponer en desarrollo
if (import.meta.env.DEV) {
  // @ts-ignore
  window.notificationService = notificationService;
}
