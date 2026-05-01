# Documento detallado: alta de proyecto en CRM Objetiva

## 1. Objetivo del flujo
Describir de extremo a extremo cómo se da de alta un proyecto en la app, qué captura el usuario, cómo se guarda técnicamente, cómo se visualiza para administración y para inventario general, y qué interacciones existen durante el proceso.

## 2. Dónde inicia el alta de proyecto

### 2.1 Pantalla de administración
Ruta funcional:
- Módulo Administración/Inventario.
- Contenedor principal de proyectos: src/components/admin/ContainerProyectos.tsx.

El alta inicia cuando el usuario presiona el botón de Agregar Proyecto (ícono de edificio). Ese botón llama:
- handleAgregarProyecto().
- Inicializa un objeto Proyecto con makeInitialProyecto(userId).
- Abre el modal de control ProyectoControlModal.

### 2.2 Estado inicial que se crea al dar alta
La función makeInitialProyecto(userId) preconfigura:
- id: UUID nuevo.
- userid: usuario autenticado que crea.
- nombre: vacío.
- descripcion: vacío.
- imagenesProyecto: vacío.
- amenidades: arreglo vacío.
- unidades: arreglo vacío.
- paymentPlans: 3 planes base precargados.
- fechaEntrega: fecha actual.
- estatus: activo.

Los 3 planes base son:
- Contado.
- ContadoComercial.
- Crédito.

Esto asegura que el proyecto siempre arranque con estructura comercial mínima.

## 3. Qué se ve en administración antes y después del alta

En el contenedor admin se muestran:
- KPIs de proyectos (total, activos, inactivos).
- KPIs de unidades (totales, disponibles, apartados, vendidos).
- Próxima entrega calculada por fecha.
- Cards visuales por proyecto.

Cada card de proyecto muestra:
- Render principal (si existe).
- Logo (si existe).
- Nombre y descripción.
- Estatus del proyecto con chip de color.
- Mini tabla de unidades con número, precio y estatus.
- Acciones: editar y eliminar.

Archivo principal de esta experiencia:
- src/components/admin/ContainerProyectos.tsx
- src/components/admin/CardProyecto.tsx

## 4. Modal de alta/edición y lógica de flujo

### 4.1 Componente orquestador
- src/components/admin/ProyectoControlModal.tsx

Este componente decide el modo de interacción:
- Si el proyecto es nuevo (sin unidades), usa wizard paso a paso.
- Si ya existe, usa modal con pestañas para edición rápida.

### 4.2 Criterio de proyecto nuevo
- isNewProyecto = no hay unidades o arreglo de unidades vacío.

### 4.3 Modo Wizard (alta guiada)
Componente:
- src/components/admin/ProyectoWizard.tsx

Pasos visibles para el usuario:
1. Información General.
2. Planes de Pago.
3. Unidades.
4. Visualización (Stacking).

Reglas para avanzar:
- Paso 1 exige nombre no vacío.
- Paso 2 exige al menos un plan de pago.
- Pasos 3 y 4 son opcionales para continuar.

Al finalizar:
- Guardar Proyecto llama onSave(proyecto).
- onSave llega al contenedor y ejecuta actualización en backend.

### 4.4 Modo Tabs (edición)
En proyecto existente aparecen tabs:
- Información General.
- Unidades.
- Planes de Pago.
- Stacking Plan.

Con botones inferiores:
- Cancelar.
- Eliminar.
- Guardar Cambios.

## 5. Captura detallada: Información General

Componente:
- src/components/admin/ProyectoGeneralTab.tsx

Campos y comportamiento:
- Nombre del proyecto.
- Logo del proyecto (archivo único).
- Render del proyecto (archivo único).
- Amenidades dinámicas (chips).

Interacciones de amenidades:
- Agregar por input + Enter o botón.
- Evita duplicados por comparación case-insensitive.
- Eliminar chip individual.
- Doble clic sobre chip para editar rápido (lo mueve al input).
- Sugerencias predefinidas clicables (gimnasio, alberca, etc.).
- Botón limpiar amenidades.

Componente de carga de archivos:
- FileUploadPreview.

En este paso, el archivo aún vive en memoria como objeto Document con file y url local para vista previa. El upload real ocurre al guardar todo el proyecto.

## 6. Captura detallada: Planes de pago

Componente:
- src/components/admin/ProyectoPlanesPAgoTabs.tsx

Qué controla el usuario:
- Fecha de entrega del proyecto.
- Nombre del plan.
- Descuento.
- Enganche (pInicial).
- Parcialidades por mes.
- Contraentrega.
- Alta/eliminación de planes.

Lógica financiera implementada:
- El total del plan debe sumar 100%.
- Si cambias enganche o contraentrega, redistribuye mensualidades.
- Si cambias una mensualidad intermedia, reprograma meses siguientes.
- Número de meses se ajusta en función de fecha de entrega.
- Si cambia la fecha de entrega, se recalcula estructura mensual.

Resultado UX:
- Tabla horizontal con columnas por mes (etiquetadas por mes/año).
- Feedback de porcentaje restante.
- Control granular por celda para cada parcialidad.

## 7. Captura detallada: Unidades

Componente:
- src/components/admin/ProyectoUnidadesTab.tsx

### 7.1 Datos por unidad
- Número de unidad.
- Unidad privativa.
- Precio de lista.
- Estatus: disponible, apartado, vendido.
- Extras dinámicos (variables personalizadas por proyecto).
- Render de unidad.
- Isométrico.
- Plano.
- Galería de imágenes.

### 7.2 Modo de guardado
Dos formas:
- Guardado automático activo: al escribir, la unidad se inserta/actualiza en la lista.
- Guardado manual: usuario presiona Agregar o Actualizar.

Además muestra:
- Indicador visual Guardado cuando hace autosave local al estado del proyecto.

### 7.3 Extras dinámicos
- Se pueden crear nuevas llaves de extras.
- Renombrar llaves existentes.
- Reordenar (subir/bajar).
- Eliminar llave.

Importante:
- Si renombras una llave, se renombra en todas las unidades existentes.
- Si eliminas una llave, se elimina en todas las unidades.
- Se conserva orden con extrasOrder a nivel proyecto.

### 7.4 Importación masiva Excel/CSV
Funciones incluidas:
- Descargar plantilla de unidades.
- Importar archivo xlsx/xls/csv.
- Previsualizar filas detectadas.
- Ver advertencias de parseo.
- Elegir modo de importación:
  - append: agregar al final.
  - replace: reemplazar todo.
  - merge: actualizar por numerounidad y agregar faltantes.

También:
- Reconoce columnas base y extras dinámicos.
- Fusiona extrasOrder del archivo con el existente según modo.

### 7.5 Aumento masivo de precios
- Dialog para aplicar porcentaje.
- Afecta unidades en disponible y apartado.
- No modifica vendidas.
- Muestra cuántas unidades serán afectadas.

### 7.6 Tabla final de unidades
Vista de tabla con:
- Datos básicos + columnas de extras.
- Preview de render/isométrico/plano.
- Carrusel de galería.
- Acciones por fila: editar y eliminar.

## 8. Captura detallada: Visualización (Stacking Plan)

Componente:
- src/components/admin/ProyectoStackingTab.tsx

Objetivo:
- Construir layout visual de unidades sobre un canvas editable.

### 8.1 Elementos de interacción
Sidebar:
- Paleta de unidades disponibles (no colocadas aún).
- Búsqueda por número/torre.
- Filtros por torre y estatus.
- Carga de imagen de fondo del canvas.
- Ajuste de fit de fondo: contain, cover, none.
- Slider de opacidad de fondo.
- Switch modo edición.
- Slider de zoom.
- Botón limpiar canvas.
- Botón guardar layout.

Canvas:
- Drag and drop de unidades desde paleta.
- Mover y redimensionar nodos con snap a grid.
- Eliminar nodo desde tarjeta en canvas.

### 8.2 Qué guarda
Dentro de proyecto.stacking:
- zoom.
- nodes (x, y, w, h por unidad).
- background (documento de fondo).
- backgroundFit.
- backgroundOpacity.

### 8.3 Autosave técnico
Además del botón Guardar, hay autosave debounced (800 ms) que llama actualizarProyecto mientras editas stacking.

## 9. Guardado final en backend (persistencia real)

### 9.1 Punto de guardado
En contenedor admin:
- handleSaveProyecto ejecuta actualizarProyecto(proyecto).
- Luego refresca listado con fetchProyectos().

Archivo:
- src/hooks/useFetchFunctions.tsx

### 9.2 Qué hace actualizarProyecto
Proceso completo:
1. Toma proyecto en memoria.
2. Sube archivos nuevos a bucket proyectos de Supabase Storage:
   - logo.
   - render.
   - render/isométrico/plano/galería de unidades.
   - background de stacking.
3. Optimiza imágenes (si son image/*) antes de subir.
4. Genera payload final con rutas/path/bucket en cada Document.
5. Hace upsert en tabla proyectos por id.
6. Si falla, intenta rollback de archivos subidos en esa transacción.

### 9.3 Realtime
La app está suscrita a cambios postgres_changes en proyectos, por lo que la vista se refresca cuando hay cambios en la tabla.

## 10. Eliminación de proyecto

Flujo visible:
- Botón eliminar en card o modal.
- Diálogo de confirmación.

Persistencia:
- Intenta borrar archivos principales del storage (logo/render).
- Borra registro en tabla proyectos por id.

## 11. Cómo se muestra el proyecto después del alta (vista usuario/inventario)

### 11.1 Pantalla de Inventario General
- src/pages/inventario/InventarioGeneralPage.tsx
- Tab Proyectos usa ContainerInventarioProyectos.

Componente:
- src/components/inventario/ContainerInventarioProyectos.tsx

Se presenta:
- Grid de cards de proyectos.
- Modal de detalle al presionar ver.
- Apertura de cotizador por unidad (si aplica).

### 11.2 Card de proyecto para usuario
Componente:
- src/components/inventario/CardProyectoView.tsx

Muestra:
- Render principal y logo.
- Nombre, descripción, estatus.
- Mini tabla de unidades.

Regla comercial importante:
- Si unidad está vendido o apartado, oculta precio con guion.

### 11.3 Modal de vista de proyecto
Componente:
- src/components/inventario/ModalProyectoView.tsx

Incluye:
- Encabezado visual con logo/render.
- Datos generales: nombre, estatus, fecha de entrega, amenidades, número de unidades, planes.
- Descripción.
- Galería de imágenes del proyecto (si aplica).
- Tabla de unidades con botón de cotizar solo cuando unidad no está vendida.
- Tabla comparativa de planes de pago por meses.
- Botón Ver stacking para abrir visor.

### 11.4 Visor de stacking en lectura
Componente:
- src/components/inventario/StakingViewerModal.tsx

Comportamiento:
- Carga layout guardado desde proyecto.stacking.
- Modo solo lectura (sin arrastrar ni editar).
- Zoom manual o ajuste automático a ventana.
- Si no hay nodes guardados, muestra mensaje de estado vacío.

### 11.5 Cotizador de unidad
Componente:
- src/components/inventario/CotizadorModal.tsx

Permite:
- Seleccionar plan de pago del proyecto.
- Crear plan personalizado por montos.
- Generar PDF de cotización.
- Incluir datos del vendedor (email/teléfono) del usuario autenticado.
- Firmar URLs de imágenes para incrustarlas en PDF.

## 12. Flujo de interacción del usuario (UX) paso a paso

1. Entra a módulo de inventario admin y ve resumen de proyectos.
2. Presiona Agregar Proyecto.
3. Se crea proyecto base y se abre wizard.
4. Captura nombre, logo/render, amenidades.
5. Ajusta fecha de entrega y planes de pago.
6. Agrega unidades manual o masivamente por Excel/CSV.
7. Carga archivos por unidad y define extras.
8. Diseña stacking arrastrando unidades al canvas.
9. Presiona Guardar Proyecto.
10. El sistema sube archivos, arma payload, hace upsert y refresca lista.
11. Proyecto aparece en cards de administración con resumen.
12. En Inventario General se muestra para consumo comercial.
13. Usuario abre detalle, revisa unidades, cotiza y exporta PDF.

## 13. Estados visuales y feedback al usuario

Feedback implementado:
- Spinner de carga en operaciones de guardado/eliminación.
- Mensajes de éxito/error con useStatusChip.
- Dialogs de confirmación para acciones destructivas.
- Chips de estatus para proyectos y unidades.
- Mensajes de estado vacío cuando no hay datos.

## 14. Estructura de datos principal (Proyecto)

Entidad Proyecto contiene, entre otros:
- id, userid.
- nombre, descripcion.
- logo y render como Document JSON.
- amenidades.
- unidades con multimedia y extras.
- paymentPlans.
- fechaEntrega.
- estatus.
- stacking.
- extrasOrder.

Definición:
- src/config/types.tsx

## 15. Consideraciones técnicas relevantes del flujo

- El alta usa un id UUID local desde el inicio, lo que permite preparar upload de archivos antes del upsert final.
- Los archivos se normalizan de nombre para storage.
- Las imágenes se procesan (resize/quality) antes de subir.
- Stacking guarda coordenadas y tamaño por unidad para reproducir layout exacto en vista de lectura.
- La suscripción realtime a proyectos sincroniza cambios visuales sin recargar manual.

## 16. Vista resumida de componentes clave

Orquestación:
- src/components/admin/ContainerProyectos.tsx
- src/components/admin/ProyectoControlModal.tsx

Wizard/edición:
- src/components/admin/ProyectoWizard.tsx
- src/components/admin/ProyectoGeneralTab.tsx
- src/components/admin/ProyectoPlanesPAgoTabs.tsx
- src/components/admin/ProyectoUnidadesTab.tsx
- src/components/admin/ProyectoStackingTab.tsx

Persistencia:
- src/hooks/useFetchFunctions.tsx

Visualización comercial:
- src/components/inventario/ContainerInventarioProyectos.tsx
- src/components/inventario/CardProyectoView.tsx
- src/components/inventario/ModalProyectoView.tsx
- src/components/inventario/StakingViewerModal.tsx
- src/components/inventario/CotizadorModal.tsx

## 17. Checklist operativo para alta correcta

1. Definir nombre de proyecto.
2. Cargar logo y render.
3. Configurar amenidades clave.
4. Revisar fecha de entrega.
5. Validar que planes sumen 100%.
6. Cargar unidades con número, privativa, precio y estatus.
7. Confirmar extras esperados por negocio.
8. Adjuntar archivos de unidad (render/isométrico/plano/galería).
9. Diseñar stacking base para ventas.
10. Guardar y validar visualización en Inventario General.
11. Probar cotización PDF de al menos una unidad disponible.

## 18. Resultado funcional esperado

Al terminar el flujo, el proyecto queda:
- Persistido en Supabase (tabla proyectos).
- Con assets en storage bucket proyectos.
- Disponible para administración y para inventario comercial.
- Listo para cotización por unidad y lectura visual con stacking.
