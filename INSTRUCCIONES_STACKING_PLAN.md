# 📐 Instrucciones de Uso - Stacking Plan (Canvas de Unidades)

## 🎯 ¿Qué es el Stacking Plan?

Es una herramienta visual tipo "plano maestro" donde puedes posicionar y organizar las unidades de tu proyecto inmobiliario sobre un canvas. Útil para mostrar la disponibilidad de departamentos/casas en una vista tipo "masterplan".

---

## 🚀 Cómo Usarlo

### 1️⃣ **Acceder al Stacking**
- Ve a **Administración → Proyectos**
- Abre un proyecto (editar o crear nuevo)
- En el **Wizard/Modal**, ve a la pestaña **"Visualización"** (4to paso)

### 2️⃣ **Activar Modo Edición**
- En el panel izquierdo, activa el switch **"Modo edición"**
- Si está desactivado, solo podrás ver el diseño (modo lectura)

---

## 📋 **Panel Izquierdo - Paleta de Unidades**

### **Buscar y Filtrar**
- **Campo de búsqueda**: Escribe número de unidad o torre
- **Filtro por Torre**: Muestra solo unidades de una torre específica
- **Filtro por Estatus**: 
  - 🟢 Disponible (blanco)
  - 🟡 Apartado (amarillo)
  - 🟢 Vendido (verde)

### **Unidades Disponibles**
- Muestra tarjetas con:
  - **Número de unidad**
  - **Torre** y **Nivel** (si existe)
  - **Chip de estatus** con color

---

## 🎨 **Canvas - Área de Diseño**

### **Agregar Unidades al Canvas**
1. Busca la unidad en la paleta
2. **Arrastra** la tarjeta desde la paleta
3. **Suéltala** en el canvas donde quieras posicionarla
4. ✅ La unidad aparece en el canvas

### **Mover Unidades**
- **Haz clic y arrastra** cualquier unidad ya colocada
- Se ajusta automáticamente a la grilla (10px)

### **Redimensionar Unidades**
- **Haz clic en los bordes/esquinas** de una tarjeta
- **Arrastra** para cambiar el tamaño
- Tamaño mínimo: 120px ancho × altura según contenido

### **Eliminar del Canvas**
- Haz clic en el **ícono de basura** (🗑️) en la esquina superior derecha de la tarjeta

---

## 🖼️ **Imagen de Fondo**

### **Agregar Masterplan/Plano**
1. Click en **"Elegir imagen"**
2. Selecciona tu archivo (JPG, PNG, etc.)
3. La imagen aparece como fondo del canvas

### **Ajustar el Fondo**
- **Fit (Ajuste)**:
  - `contain`: Imagen completa visible (mantiene proporciones)
  - `cover`: Cubre todo el canvas (puede recortar)
  - `none`: Tamaño original
  
- **Opacidad**: 
  - Slider de 0% a 100%
  - Ajusta para ver mejor las unidades sobre el fondo

### **Quitar Fondo**
- Click en el **ícono de círculo con X** (❌)

---

## 🔍 **Control de Zoom**

### **Ajustar Vista**
- Usa el **slider de zoom** (0.5x a 2.0x)
- Valores comunes:
  - 0.5x = Vista alejada (todo el canvas)
  - 1.0x = Vista normal
  - 2.0x = Vista de cerca (detalle)

### **Scroll**
- El canvas permite hacer **scroll horizontal y vertical**
- Útil cuando haces zoom y necesitas navegar

---

## 💾 **Guardar el Diseño**

### **Auto-guardado**
- ✅ Se guarda automáticamente cada **800ms** cuando haces cambios
- Solo funciona en **modo edición activo**

### **Guardado Manual**
- Click en **"Guardar"**
- Guarda el layout actual en `proyecto.stacking`

### **Limpiar Todo**
- Click en **"Limpiar"**
- ⚠️ Quita todas las unidades del canvas (no las elimina del proyecto)

---

## 📊 **Información de las Tarjetas**

### **Unidades en el Canvas Muestran**:
- **Número de unidad** (grande, en negrita)
- **Torre** y **Nivel** (ej: "Torre A · Nivel 5")
- **Área** (ej: "85 m") - si existe
- **Precio** (ej: "$2,500,000") - **solo si está disponible**
- **Chip de estatus** (color según disponibilidad)

### **Colores de Estatus**:
- 🟢 **Verde** (#06d6a0) = Vendido
- 🟡 **Amarillo** (#eab308) = Apartado  
- ⚪ **Blanco** (#ffffff) = Disponible

---

## 🎯 **Casos de Uso Típicos**

### 1. **Masterplan de Torre**
- Sube plano de planta del edificio
- Coloca cada departamento en su posición real
- Ajusta tamaños según layout arquitectónico

### 2. **Vista por Niveles**
- Filtra por **nivel** usando búsqueda
- Diseña una vista por piso
- Útil para presentaciones por planta

### 3. **Disponibilidad Visual**
- Los colores muestran instantáneamente qué está disponible
- Cliente puede ver fácilmente opciones
- Sin necesidad de listas o tablas

---

## ⚙️ **Datos Técnicos**

### **Se Guarda en**:
```typescript
proyecto.stacking = {
  zoom: 1.2,                    // Nivel de zoom
  nodes: [                      // Posiciones de unidades
    {
      id: "unidad-123",
      x: 100,                   // Posición X
      y: 200,                   // Posición Y  
      w: 120,                   // Ancho
      h: 90                     // Alto
    }
  ],
  background: [...],            // Imagen de fondo
  backgroundFit: "contain",     // Ajuste
  backgroundOpacity: 0.6        // Opacidad
}
```

### **Canvas Dimensions**:
- Ancho: **2400px**
- Alto: **1400px**
- Grilla: **10px**

---

## 💡 **Tips y Mejores Prácticas**

1. ✅ **Sube primero el plano** antes de colocar unidades
2. ✅ **Ajusta la opacidad** del fondo para ver mejor las tarjetas
3. ✅ **Usa filtros** para trabajar torre por torre
4. ✅ **Guarda frecuentemente** (aunque hay auto-guardado)
5. ✅ **Zoom in** para posicionar con precisión
6. ✅ **Zoom out** para ver el resultado general
7. ⚠️ **Modo edición OFF** = modo presentación (cliente)

---

## 🔧 **Troubleshooting**

**❓ No puedo mover unidades**
- ✅ Activa "Modo edición"

**❓ No veo la imagen de fondo**
- ✅ Verifica que el archivo sea una imagen válida
- ✅ Aumenta la opacidad

**❓ Las unidades no se ajustan al fondo**
- ✅ Cambia el "Fit" a "cover" o "contain"
- ✅ Ajusta el zoom

**❓ Una unidad desapareció de la paleta**
- ✅ Ya está en el canvas, búscala en el canvas o quítala de ahí

---

## 🎓 **Flujo Completo Recomendado**

1. Crea/edita proyecto
2. Agrega todas las unidades (Tab 3: Unidades)
3. Ve a Tab 4: Visualización
4. Activa "Modo edición"
5. Sube imagen de fondo (plano/masterplan)
6. Ajusta fit y opacidad
7. Arrastra unidades una por una
8. Posiciona y redimensiona según plano
9. Guarda
10. Desactiva "Modo edición" para vista final
11. ¡Listo! Ya puedes mostrarlo a clientes

---

## 📝 **Resumen Rápido**

| Acción | Cómo hacerlo |
|--------|--------------|
| Agregar unidad al canvas | Arrastra desde paleta y suelta en canvas |
| Mover unidad | Click y arrastra la tarjeta |
| Redimensionar | Arrastra bordes/esquinas |
| Eliminar del canvas | Click en ícono basura de la tarjeta |
| Agregar fondo | Botón "Elegir imagen" |
| Ajustar zoom | Slider de zoom (0.5x - 2.0x) |
| Guardar | Botón "Guardar" o espera auto-guardado |
| Limpiar todo | Botón "Limpiar" |

---

**Versión**: 1.0  
**Fecha**: 2 de diciembre de 2025  
**Sistema**: CRM Objetiva - Módulo de Proyectos
