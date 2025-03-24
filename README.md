# Sistema de Gestión para Tienda de Celulares

Sistema web para la gestión completa de una tienda de celulares con sincronización en la nube mediante Firebase.

## Características

- 📱 Gestión de inventario de productos
- 📄 Facturación y ventas
- 🛒 Control de compras a proveedores
- 💰 Cuentas por cobrar y pagar
- 🔧 Gestión de reparaciones y servicio técnico
- 👥 Administración de clientes y proveedores
- 📊 Control de capital, ingresos y gastos
- ☁️ Sincronización bidireccional con Firebase

## Tecnologías

- HTML5, CSS3 y JavaScript (Frontend)
- Firebase Firestore (Base de datos en la nube)
- LocalStorage (Almacenamiento local)

## Sincronización Inteligente

El sistema implementa una sincronización bidireccional inteligente:

- **Local → Firebase**: Envía cambios locales a la nube cuando se detectan modificaciones
- **Firebase → Local**: Descarga datos de la nube solo cuando hay cambios
- **Prevención de duplicados**: Compara datos antes de sincronizar para evitar duplicaciones
- **Modo offline**: Funciona sin conexión y sincroniza automáticamente al recuperar conexión

## Instalación

1. Clona este repositorio
2. Configura tu proyecto en Firebase y actualiza las credenciales en `firebase-extension-fixed.js`
3. Abre `login.html` en tu navegador

## Uso

- Inicia sesión con cualquier usuario/contraseña (modo demo)
- Navega por las diferentes secciones desde el dashboard
- Utiliza el botón de sincronización para forzar la sincronización con Firebase
- Activa/desactiva la sincronización automática con el interruptor
