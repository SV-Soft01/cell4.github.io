// Módulo de extensión de Firebase para sincronización automática
// Este archivo debe ser incluido después de firebase-login.js y script.js

// Importar las funciones necesarias de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"

// Configuración de Firebase (debe coincidir con la de firebase-login.js)
const firebaseConfig = {
  apiKey: "AIzaSyDKZ6zUWN9Oa3BqvdUOlDwUtMDT18V_V7U",
  authDomain: "tienda-de-celulares-23e65.firebaseapp.com",
  projectId: "tienda-de-celulares-23e65",
  storageBucket: "tienda-de-celulares-23e65.firebasestorage.app",
  messagingSenderId: "90520827298",
  appId: "1:90520827298:web:290fd6d2c677f7364faefb",
  measurementId: "G-SVN61V3YY0",
}

// Inicializar Firebase
console.log("Inicializando módulo de extensión de Firebase...")
let app
let db

try {
  // Intentar obtener la app existente de la versión compat
  if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
    console.log("Usando instancia de Firebase existente (compat)")
    app = window.firebase.app()
    db = window.firebase.firestore()
  } else {
    // Si no existe, crear una nueva con la versión modular
    app = initializeApp(firebaseConfig, "extension")
    db = getFirestore(app)
    console.log("Creada nueva instancia de Firebase (modular)")
  }
} catch (e) {
  console.error("Error al inicializar Firebase:", e)
  // Intentar inicializar de nuevo con la versión modular
  app = initializeApp(firebaseConfig, "extension")
  db = getFirestore(app)
}

console.log("Módulo de extensión de Firebase inicializado correctamente")

// Variables para controlar la sincronización
let syncInProgress = false
let autoSyncEnabled = true
let lastSyncTime = 0
// Cambiar el intervalo de sincronización automática de 1 minuto a 2 horas (en milisegundos)
const SYNC_INTERVAL = 7200000 // 2 horas = 7200000 ms (antes era 60000 ms = 1 minuto)
const unsubscribers = [] // Para almacenar las funciones de cancelación de los listeners
let initialLoadComplete = false // Para controlar la carga inicial

// Estado de conexión
let isOnline = navigator.onLine
window.addEventListener("online", () => {
  isOnline = true
  updateConnectionStatus()
  syncAllData()
})
window.addEventListener("offline", () => {
  isOnline = false
  updateConnectionStatus()
})

// Función para mostrar el estado de conexión
function updateConnectionStatus() {
  // Crear o actualizar el indicador de estado
  let statusIndicator = document.getElementById("firebase-status-indicator")

  if (!statusIndicator) {
    statusIndicator = document.createElement("div")
    statusIndicator.id = "firebase-status-indicator"
    statusIndicator.className = "firebase-status"
    statusIndicator.style.position = "fixed"
    statusIndicator.style.top = "10px"
    statusIndicator.style.right = "10px"
    statusIndicator.style.zIndex = "1000"
    statusIndicator.style.display = "flex"
    statusIndicator.style.alignItems = "center"
    statusIndicator.style.gap = "5px"
    statusIndicator.style.fontSize = "12px"
    statusIndicator.style.backgroundColor = "rgba(255, 255, 255, 0.8)"
    statusIndicator.style.padding = "5px 10px"
    statusIndicator.style.borderRadius = "4px"
    statusIndicator.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)"
    document.body.appendChild(statusIndicator)
  }

  statusIndicator.innerHTML = `
  <div class="status-indicator" style="width: 10px; height: 10px; border-radius: 50%; background-color: ${isOnline ? "#4CAF50" : "#F44336"};"></div>
  <span>Firebase: ${isOnline ? "Conectado" : "Desconectado"}</span>
`
}

// Función para cargar datos desde Firebase
async function loadDataFromFirebase() {
  if (!isOnline) {
    console.log("No hay conexión a Internet. Usando datos locales.")
    return false
  }

  console.log("Cargando datos desde Firebase...")
  showMiniNotification("Cargando datos desde Firebase...")

  try {
    // Obtener datos locales actuales para comparar
    const localDataString = localStorage.getItem("tiendaCelulares")
    const localData = localDataString ? JSON.parse(localDataString) : {}

    // Cargar datos de Firebase y construir el nuevo objeto de datos
    const newData = { ...localData }
    let cambiosDetectados = false

    // Cargar inventario con verificación de cambios
    const inventarioSnapshot = await getDocs(collection(db, "inventario"))
    const inventario = []
    const codigosInventario = new Set()

    inventarioSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      if (rest.codigo && !codigosInventario.has(rest.codigo)) {
        codigosInventario.add(rest.codigo)
        inventario.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si el inventario ha cambiado
    if (JSON.stringify(localData.inventario || []) !== JSON.stringify(inventario)) {
      newData.inventario = inventario
      cambiosDetectados = true
      console.log(`Cargados ${inventario.length} productos desde Firebase (con cambios)`)
    } else {
      console.log(`Verificados ${inventario.length} productos desde Firebase (sin cambios)`)
    }

    // Hacer lo mismo para el resto de colecciones...
    // (Código similar para facturas, compras, etc.)

    // Cargar facturas
    const facturasSnapshot = await getDocs(collection(db, "facturas"))
    const facturas = []
    const codigosFacturas = new Set() // Para evitar duplicados

    facturasSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      // Solo agregar si el código no existe ya
      if (rest.codigoFactura && !codigosFacturas.has(rest.codigoFactura)) {
        codigosFacturas.add(rest.codigoFactura)
        facturas.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si las facturas han cambiado
    if (JSON.stringify(localData.facturas || []) !== JSON.stringify(facturas)) {
      newData.facturas = facturas
      cambiosDetectados = true
      console.log(`Cargadas ${facturas.length} facturas desde Firebase (con cambios)`)
    } else {
      console.log(`Verificadas ${facturas.length} facturas desde Firebase (sin cambios)`)
    }

    // Cargar compras
    const comprasSnapshot = await getDocs(collection(db, "compras"))
    const compras = []
    const comprasIds = new Set() // Para evitar duplicados usando una combinación de fecha+proveedor+total

    comprasSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      const compraId = `${rest.fecha}-${rest.proveedor}-${rest.total}`
      if (!comprasIds.has(compraId)) {
        comprasIds.add(compraId)
        compras.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si las compras han cambiado
    if (JSON.stringify(localData.compras || []) !== JSON.stringify(compras)) {
      newData.compras = compras
      cambiosDetectados = true
      console.log(`Cargadas ${compras.length} compras desde Firebase (con cambios)`)
    } else {
      console.log(`Verificadas ${compras.length} compras desde Firebase (sin cambios)`)
    }

    // Cargar cuentas por cobrar
    const cuentasCobrarSnapshot = await getDocs(collection(db, "cuentasCobrar"))
    const cuentasCobrar = []
    const cuentasCobrarIds = new Set() // Para evitar duplicados

    cuentasCobrarSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      const cuentaId = rest.codigoFactura || `${rest.cliente}-${rest.fecha}-${rest.total}`
      if (!cuentasCobrarIds.has(cuentaId)) {
        cuentasCobrarIds.add(cuentaId)
        cuentasCobrar.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si las cuentas por cobrar han cambiado
    if (JSON.stringify(localData.cuentasCobrar || []) !== JSON.stringify(cuentasCobrar)) {
      newData.cuentasCobrar = cuentasCobrar
      cambiosDetectados = true
      console.log(`Cargadas ${cuentasCobrar.length} cuentas por cobrar desde Firebase (con cambios)`)
    } else {
      console.log(`Verificadas ${cuentasCobrar.length} cuentas por cobrar desde Firebase (sin cambios)`)
    }

    // Cargar cuentas por pagar
    const cuentasPagarSnapshot = await getDocs(collection(db, "cuentasPagar"))
    const cuentasPagar = []
    const cuentasPagarIds = new Set() // Para evitar duplicados

    cuentasPagarSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      const cuentaId = `${rest.proveedor}-${rest.fecha}-${rest.total}`
      if (!cuentasPagarIds.has(cuentaId)) {
        cuentasPagarIds.add(cuentaId)
        cuentasPagar.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si las cuentas por pagar han cambiado
    if (JSON.stringify(localData.cuentasPagar || []) !== JSON.stringify(cuentasPagar)) {
      newData.cuentasPagar = cuentasPagar
      cambiosDetectados = true
      console.log(`Cargadas ${cuentasPagar.length} cuentas por pagar desde Firebase (con cambios)`)
    } else {
      console.log(`Verificadas ${cuentasPagar.length} cuentas por pagar desde Firebase (sin cambios)`)
    }

    // Cargar ingresos
    const ingresosSnapshot = await getDocs(collection(db, "ingresos"))
    const ingresos = []
    const ingresosIds = new Set() // Para evitar duplicados

    ingresosSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      const ingresoId = `${rest.fecha}-${rest.descripcion}-${rest.monto}`
      if (!ingresosIds.has(ingresoId)) {
        ingresosIds.add(ingresoId)
        ingresos.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si los ingresos han cambiado
    if (JSON.stringify(localData.ingresos || []) !== JSON.stringify(ingresos)) {
      newData.ingresos = ingresos
      cambiosDetectados = true
      console.log(`Cargados ${ingresos.length} ingresos desde Firebase (con cambios)`)
    } else {
      console.log(`Verificados ${ingresos.length} ingresos desde Firebase (sin cambios)`)
    }

    // Cargar gastos
    const gastosSnapshot = await getDocs(collection(db, "gastos"))
    const gastos = []
    const gastosIds = new Set() // Para evitar duplicados

    gastosSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      const gastoId = `${rest.fecha}-${rest.descripcion}-${rest.monto}`
      if (!gastosIds.has(gastoId)) {
        gastosIds.add(gastoId)
        gastos.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si los gastos han cambiado
    if (JSON.stringify(localData.gastos || []) !== JSON.stringify(gastos)) {
      newData.gastos = gastos
      cambiosDetectados = true
      console.log(`Cargados ${gastos.length} gastos desde Firebase (con cambios)`)
    } else {
      console.log(`Verificados ${gastos.length} gastos desde Firebase (sin cambios)`)
    }

    // Cargar reparaciones
    const reparacionesSnapshot = await getDocs(collection(db, "reparaciones"))
    const reparaciones = []
    const reparacionesIds = new Set() // Para evitar duplicados

    reparacionesSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      const reparacionId = `${rest.cliente}-${rest.equipo}-${rest.fecha}`
      if (!reparacionesIds.has(reparacionId)) {
        reparacionesIds.add(reparacionId)
        reparaciones.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si las reparaciones han cambiado
    if (JSON.stringify(localData.reparaciones || []) !== JSON.stringify(reparaciones)) {
      newData.reparaciones = reparaciones
      cambiosDetectados = true
      console.log(`Cargadas ${reparaciones.length} reparaciones pendientes desde Firebase (con cambios)`)
    } else {
      console.log(`Verificadas ${reparaciones.length} reparaciones pendientes desde Firebase (sin cambios)`)
    }

    const reparacionesEnProcesoSnapshot = await getDocs(collection(db, "reparacionesEnProceso"))
    const reparacionesEnProceso = []
    const reparacionesEnProcesoIds = new Set() // Para evitar duplicados

    reparacionesEnProcesoSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      const reparacionId = `${rest.cliente}-${rest.equipo}-${rest.fecha}`
      if (!reparacionesEnProcesoIds.has(reparacionId)) {
        reparacionesEnProcesoIds.add(reparacionId)
        reparacionesEnProceso.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si las reparaciones en proceso han cambiado
    if (JSON.stringify(localData.reparacionesEnProceso || []) !== JSON.stringify(reparacionesEnProceso)) {
      newData.reparacionesEnProceso = reparacionesEnProceso
      cambiosDetectados = true
      console.log(`Cargadas ${reparacionesEnProceso.length} reparaciones en proceso desde Firebase (con cambios)`)
    } else {
      console.log(`Verificadas ${reparacionesEnProceso.length} reparaciones en proceso desde Firebase (sin cambios)`)
    }

    const reparacionesTerminadasSnapshot = await getDocs(collection(db, "reparacionesTerminadas"))
    const reparacionesTerminadas = []
    const reparacionesTerminadasIds = new Set() // Para evitar duplicados

    reparacionesTerminadasSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      const reparacionId = `${rest.cliente}-${rest.equipo}-${rest.fecha}`
      if (!reparacionesTerminadasIds.has(reparacionId)) {
        reparacionesTerminadasIds.add(reparacionId)
        reparacionesTerminadas.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si las reparaciones terminadas han cambiado
    if (JSON.stringify(localData.reparacionesTerminadas || []) !== JSON.stringify(reparacionesTerminadas)) {
      newData.reparacionesTerminadas = reparacionesTerminadas
      cambiosDetectados = true
      console.log(`Cargadas ${reparacionesTerminadas.length} reparaciones terminadas desde Firebase (con cambios)`)
    } else {
      console.log(`Verificadas ${reparacionesTerminadas.length} reparaciones terminadas desde Firebase (sin cambios)`)
    }

    // Cargar clientes
    const clientesSnapshot = await getDocs(collection(db, "clientes"))
    const clientes = []
    const clientesIds = new Set() // Para evitar duplicados por cédula o código

    clientesSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      const clienteId = rest.cedula || rest.codigo
      if (clienteId && !clientesIds.has(clienteId)) {
        clientesIds.add(clienteId)
        clientes.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si los clientes han cambiado
    if (JSON.stringify(localData.clientes || []) !== JSON.stringify(clientes)) {
      newData.clientes = clientes
      cambiosDetectados = true
      console.log(`Cargados ${clientes.length} clientes desde Firebase (con cambios)`)
    } else {
      console.log(`Verificados ${clientes.length} clientes desde Firebase (sin cambios)`)
    }

    // Cargar proveedores
    const proveedoresSnapshot = await getDocs(collection(db, "proveedores"))
    const proveedores = []
    const proveedoresIds = new Set() // Para evitar duplicados

    proveedoresSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data

      const proveedorId = rest.codigo || `${rest.nombre}-${rest.telefono}`
      if (!proveedoresIds.has(proveedorId)) {
        proveedoresIds.add(proveedorId)
        proveedores.push({
          ...rest,
          id: doc.id,
        })
      }
    })

    // Comparar si los proveedores han cambiado
    if (JSON.stringify(localData.proveedores || []) !== JSON.stringify(proveedores)) {
      newData.proveedores = proveedores
      cambiosDetectados = true
      console.log(`Cargados ${proveedores.length} proveedores desde Firebase (con cambios)`)
    } else {
      console.log(`Verificados ${proveedores.length} proveedores desde Firebase (sin cambios)`)
    }

    // Cargar capital
    let capital = { productos: 0, efectivo: 0, banco: 0 }
    const capitalDoc = await getDoc(doc(db, "configuracion", "capital"))
    if (capitalDoc.exists()) {
      const data = capitalDoc.data()
      const { timestamp, lastUpdate, ...rest } = data
      capital = rest
      console.log("Capital cargado desde Firebase:", capital)
    }

    // Comparar si el capital ha cambiado
    if (JSON.stringify(localData.capital || {}) !== JSON.stringify(capital)) {
      newData.capital = capital
      cambiosDetectados = true
      console.log("Capital actualizado desde Firebase (con cambios)")
    } else {
      console.log("Capital verificado desde Firebase (sin cambios)")
    }

    // Cargar ganancias
    let ganancias = 0
    const gananciasDoc = await getDoc(doc(db, "configuracion", "ganancias"))
    if (gananciasDoc.exists()) {
      const data = gananciasDoc.data()
      ganancias = data.valor || 0
      console.log("Ganancias cargadas desde Firebase:", ganancias)
    }

    // Comparar si las ganancias han cambiado
    if ((localData.ganancias || 0) !== ganancias) {
      newData.ganancias = ganancias
      cambiosDetectados = true
      console.log("Ganancias actualizadas desde Firebase (con cambios)")
    } else {
      console.log("Ganancias verificadas desde Firebase (sin cambios)")
    }

    // Solo guardar en localStorage si hay cambios
    if (cambiosDetectados) {
      localStorage.setItem("tiendaCelulares", JSON.stringify(newData))
      console.log("Datos actualizados desde Firebase y guardados en localStorage")

      // Actualizar la interfaz
      updateUI()

      showMiniNotification("Datos actualizados desde Firebase", "success")
    } else {
      console.log("No se detectaron cambios en los datos de Firebase")
      showMiniNotification("Datos ya sincronizados, no hay cambios", "info")
    }

    // Marcar que la carga inicial está completa
    initialLoadComplete = true
    return true
  } catch (error) {
    console.error("Error al cargar datos desde Firebase:", error)
    showMiniNotification("Error al cargar datos desde Firebase: " + error.message, "error")
    return false
  }
}

// Función para actualizar la interfaz después de cargar datos
function updateUI() {
  try {
    // Actualizar tablas y valores según la sección actual
    if (document.getElementById("cuerpoTablaInventario") && window.actualizarTablaInventario) {
      window.actualizarTablaInventario()
    }

    if (document.getElementById("cuerpoTablaFacturas") && window.actualizarTablaFacturas) {
      window.actualizarTablaFacturas()
    }

    if (document.getElementById("cuerpoTablaCuentasCobrar") && window.actualizarTablaCuentasCobrar) {
      window.actualizarTablaCuentasCobrar()
    }

    if (document.getElementById("cuerpoTablaCuentasPagar") && window.actualizarTablaCuentasPagar) {
      window.actualizarTablaCuentasPagar()
    }

    if (document.getElementById("cuerpoTablaReparaciones") && window.actualizarTablaReparaciones) {
      window.actualizarTablaReparaciones()
    }

    if (document.getElementById("cuerpoTablaReparacionesEnProceso") && window.actualizarTablaReparacionesEnProceso) {
      window.actualizarTablaReparacionesEnProceso()
    }

    if (document.getElementById("cuerpoTablaReparacionesTerminadas") && window.actualizarTablaReparacionesTerminadas) {
      window.actualizarTablaReparacionesTerminadas()
    }

    if (document.getElementById("cuerpoTablaClientes") && window.actualizarTablaClientes) {
      window.actualizarTablaClientes()
    }

    if (document.getElementById("cuerpoTablaProveedores") && window.actualizarTablaProveedores) {
      window.actualizarTablaProveedores()
    }

    // Actualizar valores de capital y ganancias
    if (window.actualizarCapital) {
      window.actualizarCapital()
    }

    if (window.actualizarGanancias) {
      window.actualizarGanancias()
    }

    console.log("Interfaz actualizada correctamente")
  } catch (error) {
    console.error("Error al actualizar la interfaz:", error)
  }
}

// Función para sincronizar todos los datos
async function syncAllData() {
  if (syncInProgress || !isOnline) return

  syncInProgress = true
  showMiniNotification("Sincronizando datos con Firebase...")

  try {
    // Obtener datos de localStorage
    const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

    // Si es la primera sincronización, cargar datos desde Firebase primero
    if (!initialLoadComplete) {
      await loadDataFromFirebase()
    } else {
      // Sincronizar cada tipo de dato
      await syncInventario(localData.inventario || [])
      await syncFacturas(localData.facturas || [])
      await syncCompras(localData.compras || [])
      await syncCuentasCobrar(localData.cuentasCobrar || [])
      await syncCuentasPagar(localData.cuentasPagar || [])
      await syncIngresos(localData.ingresos || [])
      await syncGastos(localData.gastos || [])
      await syncReparaciones(
        localData.reparaciones || [],
        localData.reparacionesEnProceso || [],
        localData.reparacionesTerminadas || [],
      )
      await syncClientes(localData.clientes || [])
      await syncProveedores(localData.proveedores || [])
      await syncCapital(localData.capital || {})
      await syncGanancias(localData.ganancias || 0)
    }

    lastSyncTime = Date.now()
    showMiniNotification("Sincronización completada", "success")
  } catch (error) {
    console.error("Error en la sincronización:", error)
    showMiniNotification("Error en la sincronización: " + error.message, "error")
  } finally {
    syncInProgress = false
  }
}

// Función para sincronizar inventario
async function syncInventario(inventarioLocal) {
  if (!inventarioLocal || inventarioLocal.length === 0) return

  try {
    console.log("Sincronizando inventario...")

    // Primero obtener todos los productos de Firebase para comparar
    const inventarioSnapshot = await getDocs(collection(db, "inventario"))
    const inventarioFirebase = []

    inventarioSnapshot.forEach((doc) => {
      const data = doc.data()
      // Eliminar campos internos de Firebase para comparación
      const { timestamp, lastUpdate, ...rest } = data
      inventarioFirebase.push({
        ...rest,
        id: doc.id,
      })
    })

    // Crear un mapa para búsqueda rápida por código
    const productosPorCodigo = {}
    inventarioFirebase.forEach((producto) => {
      if (producto.codigo) {
        productosPorCodigo[producto.codigo] = producto
      }
    })

    let cambiosRealizados = false

    for (const producto of inventarioLocal) {
      // Buscar si el producto ya existe en Firebase por código
      const productoExistente = productosPorCodigo[producto.codigo]

      if (!productoExistente) {
        // Si no existe, crear nuevo documento
        await addDoc(collection(db, "inventario"), {
          ...producto,
          timestamp: serverTimestamp(),
        })
        console.log(`Producto ${producto.codigo} agregado a Firebase`)
        cambiosRealizados = true
      } else {
        // Comparar si hay cambios reales antes de actualizar
        // Crear copias sin los campos de Firebase para comparación
        const productoLimpio = { ...producto }
        const existenteLimpio = { ...productoExistente }
        delete existenteLimpio.id
        delete existenteLimpio.timestamp
        delete existenteLimpio.lastUpdate

        // Comparar los objetos como strings JSON
        if (JSON.stringify(productoLimpio) !== JSON.stringify(existenteLimpio)) {
          await updateDoc(doc(db, "inventario", productoExistente.id), {
            ...producto,
            lastUpdate: serverTimestamp(),
          })
          console.log(`Producto ${producto.codigo} actualizado en Firebase (cambios detectados)`)
          cambiosRealizados = true
        } else {
          console.log(`Producto ${producto.codigo} sin cambios, no se actualiza`)
        }
      }
    }

    if (!cambiosRealizados) {
      console.log("No se detectaron cambios en el inventario, no se realizaron actualizaciones")
    } else {
      console.log("Inventario sincronizado correctamente con cambios")
    }

    return true
  } catch (error) {
    console.error("Error al sincronizar inventario:", error)
    return false
  }
}

// Aplicar el mismo patrón a las demás funciones de sincronización
// Por ejemplo, para syncFacturas:

async function syncFacturas(facturasLocal) {
  if (!facturasLocal || facturasLocal.length === 0) return

  try {
    console.log("Sincronizando facturas...")

    // Primero obtener todas las facturas de Firebase para comparar
    const facturasSnapshot = await getDocs(collection(db, "facturas"))
    const facturasFirebase = []

    facturasSnapshot.forEach((doc) => {
      const data = doc.data()
      const { timestamp, lastUpdate, ...rest } = data
      facturasFirebase.push({
        ...rest,
        id: doc.id,
      })
    })

    // Crear un mapa para búsqueda rápida por código de factura
    const facturasPorCodigo = {}
    facturasFirebase.forEach((factura) => {
      if (factura.codigoFactura) {
        facturasPorCodigo[factura.codigoFactura] = factura
      }
    })

    let cambiosRealizados = false

    for (const factura of facturasLocal) {
      // Buscar si la factura ya existe en Firebase por código
      const facturaExistente = facturasPorCodigo[factura.codigoFactura]

      if (!facturaExistente) {
        // Si no existe, crear nuevo documento
        await addDoc(collection(db, "facturas"), {
          ...factura,
          timestamp: serverTimestamp(),
        })
        console.log(`Factura ${factura.codigoFactura} agregada a Firebase`)
        cambiosRealizados = true
      } else {
        // Comparar si hay cambios reales antes de actualizar
        const facturaLimpia = { ...factura }
        const existenteLimpia = { ...facturaExistente }
        delete existenteLimpia.id
        delete existenteLimpia.timestamp
        delete existenteLimpia.lastUpdate

        if (JSON.stringify(facturaLimpia) !== JSON.stringify(existenteLimpia)) {
          await updateDoc(doc(db, "facturas", facturaExistente.id), {
            ...factura,
            lastUpdate: serverTimestamp(),
          })
          console.log(`Factura ${factura.codigoFactura} actualizada en Firebase (cambios detectados)`)
          cambiosRealizados = true
        } else {
          console.log(`Factura ${factura.codigoFactura} sin cambios, no se actualiza`)
        }
      }
    }

    if (!cambiosRealizados) {
      console.log("No se detectaron cambios en las facturas, no se realizaron actualizaciones")
    } else {
      console.log("Facturas sincronizadas correctamente con cambios")
    }

    return true
  } catch (error) {
    console.error("Error al sincronizar facturas:", error)
    return false
  }
}

// Función para sincronizar compras
async function syncCompras(comprasLocal) {
  if (!comprasLocal || comprasLocal.length === 0) return

  try {
    console.log("Sincronizando compras...")

    for (const compra of comprasLocal) {
      // Crear un identificador único para la compra
      const compraId = `${compra.fecha}-${compra.proveedor}-${compra.total}`

      // Buscar si la compra ya existe en Firebase
      const q = query(
        collection(db, "compras"),
        where("fecha", "==", compra.fecha),
        where("proveedor", "==", compra.proveedor),
        where("total", "==", compra.total),
      )
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // Si no existe, crear nuevo documento
        await addDoc(collection(db, "compras"), {
          ...compra,
          timestamp: serverTimestamp(),
        })
        console.log(`Compra ${compraId} agregada a Firebase`)
      } else {
        // Si existe, actualizar el documento existente
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...compra,
          lastUpdate: serverTimestamp(),
        })
        console.log(`Compra ${compraId} actualizada en Firebase`)
      }
    }

    console.log("Compras sincronizadas correctamente")
    return true
  } catch (error) {
    console.error("Error al sincronizar compras:", error)
    return false
  }
}

// Función para sincronizar cuentas por cobrar
async function syncCuentasCobrar(cuentasLocal) {
  if (!cuentasLocal || cuentasLocal.length === 0) return

  try {
    console.log("Sincronizando cuentas por cobrar...")

    for (const cuenta of cuentasLocal) {
      // Buscar si la cuenta ya existe en Firebase
      let q

      if (cuenta.codigoFactura) {
        q = query(collection(db, "cuentasCobrar"), where("codigoFactura", "==", cuenta.codigoFactura))
      } else {
        q = query(
          collection(db, "cuentasCobrar"),
          where("cliente", "==", cuenta.cliente),
          where("fecha", "==", cuenta.fecha),
          where("total", "==", cuenta.total),
        )
      }

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // Si no existe, crear nuevo documento
        await addDoc(collection(db, "cuentasCobrar"), {
          ...cuenta,
          timestamp: serverTimestamp(),
        })
        console.log(`Cuenta por cobrar ${cuenta.codigoFactura || cuenta.cliente} agregada a Firebase`)
      } else {
        // Si existe, actualizar el documento existente
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...cuenta,
          lastUpdate: serverTimestamp(),
        })
        console.log(`Cuenta por cobrar ${cuenta.codigoFactura || cuenta.cliente} actualizada en Firebase`)
      }
    }

    console.log("Cuentas por cobrar sincronizadas correctamente")
    return true
  } catch (error) {
    console.error("Error al sincronizar cuentas por cobrar:", error)
    return false
  }
}

// Función para sincronizar cuentas por pagar
async function syncCuentasPagar(cuentasLocal) {
  if (!cuentasLocal || cuentasLocal.length === 0) return

  try {
    console.log("Sincronizando cuentas por pagar...")

    for (const cuenta of cuentasLocal) {
      // Buscar si la cuenta ya existe en Firebase
      const q = query(
        collection(db, "cuentasPagar"),
        where("proveedor", "==", cuenta.proveedor),
        where("fecha", "==", cuenta.fecha),
        where("total", "==", cuenta.total),
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // Si no existe, crear nuevo documento
        await addDoc(collection(db, "cuentasPagar"), {
          ...cuenta,
          timestamp: serverTimestamp(),
        })
        console.log(`Cuenta por pagar ${cuenta.proveedor} agregada a Firebase`)
      } else {
        // Si existe, actualizar el documento existente
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...cuenta,
          lastUpdate: serverTimestamp(),
        })
        console.log(`Cuenta por pagar ${cuenta.proveedor} actualizada en Firebase`)
      }
    }

    console.log("Cuentas por pagar sincronizadas correctamente")
    return true
  } catch (error) {
    console.error("Error al sincronizar cuentas por pagar:", error)
    return false
  }
}

// Función para sincronizar ingresos
async function syncIngresos(ingresosLocal) {
  if (!ingresosLocal || ingresosLocal.length === 0) return

  try {
    console.log("Sincronizando ingresos...")

    for (const ingreso of ingresosLocal) {
      // Buscar si el ingreso ya existe en Firebase
      const q = query(
        collection(db, "ingresos"),
        where("fecha", "==", ingreso.fecha),
        where("descripcion", "==", ingreso.descripcion),
        where("monto", "==", ingreso.monto),
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // Si no existe, crear nuevo documento
        await addDoc(collection(db, "ingresos"), {
          ...ingreso,
          timestamp: serverTimestamp(),
        })
        console.log(`Ingreso ${ingreso.descripcion} agregado a Firebase`)
      } else {
        // Si existe, actualizar el documento existente
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...ingreso,
          lastUpdate: serverTimestamp(),
        })
        console.log(`Ingreso ${ingreso.descripcion} actualizado en Firebase`)
      }
    }

    console.log("Ingresos sincronizados correctamente")
    return true
  } catch (error) {
    console.error("Error al sincronizar ingresos:", error)
    return false
  }
}

// Función para sincronizar gastos
async function syncGastos(gastosLocal) {
  if (!gastosLocal || gastosLocal.length === 0) return

  try {
    console.log("Sincronizando gastos...")

    for (const gasto of gastosLocal) {
      // Buscar si el gasto ya existe en Firebase
      const q = query(
        collection(db, "gastos"),
        where("fecha", "==", gasto.fecha),
        where("descripcion", "==", gasto.descripcion),
        where("monto", "==", gasto.monto),
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // Si no existe, crear nuevo documento
        await addDoc(collection(db, "gastos"), {
          ...gasto,
          timestamp: serverTimestamp(),
        })
        console.log(`Gasto ${gasto.descripcion} agregado a Firebase`)
      } else {
        // Si existe, actualizar el documento existente
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...gasto,
          lastUpdate: serverTimestamp(),
        })
        console.log(`Gasto ${gasto.descripcion} actualizado en Firebase`)
      }
    }

    console.log("Gastos sincronizados correctamente")
    return true
  } catch (error) {
    console.error("Error al sincronizar gastos:", error)
    return false
  }
}

// Función para sincronizar reparaciones
async function syncReparaciones(reparacionesPendientes, reparacionesEnProceso, reparacionesTerminadas) {
  try {
    // Sincronizar reparaciones pendientes
    if (reparacionesPendientes && reparacionesPendientes.length > 0) {
      console.log("Sincronizando reparaciones pendientes...")

      for (const reparacion of reparacionesPendientes) {
        // Buscar si la reparación ya existe en Firebase
        const q = query(
          collection(db, "reparaciones"),
          where("cliente", "==", reparacion.cliente),
          where("equipo", "==", reparacion.equipo),
          where("fecha", "==", reparacion.fecha),
        )

        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          // Si no existe, crear nuevo documento
          await addDoc(collection(db, "reparaciones"), {
            ...reparacion,
            estado: "pendiente",
            timestamp: serverTimestamp(),
          })
          console.log(`Reparación pendiente ${reparacion.cliente}-${reparacion.equipo} agregada a Firebase`)
        } else {
          // Si existe, actualizar el documento existente
          const docRef = querySnapshot.docs[0].ref
          await updateDoc(docRef, {
            ...reparacion,
            estado: "pendiente",
            lastUpdate: serverTimestamp(),
          })
          console.log(`Reparación pendiente ${reparacion.cliente}-${reparacion.equipo} actualizada en Firebase`)
        }
      }
    }

    // Sincronizar reparaciones en proceso
    if (reparacionesEnProceso && reparacionesEnProceso.length > 0) {
      console.log("Sincronizando reparaciones en proceso...")

      for (const reparacion of reparacionesEnProceso) {
        // Buscar si la reparación ya existe en Firebase
        const q = query(
          collection(db, "reparacionesEnProceso"),
          where("cliente", "==", reparacion.cliente),
          where("equipo", "==", reparacion.equipo),
          where("fecha", "==", reparacion.fecha),
        )

        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          // Si no existe, crear nuevo documento
          await addDoc(collection(db, "reparacionesEnProceso"), {
            ...reparacion,
            estado: "proceso",
            timestamp: serverTimestamp(),
          })
          console.log(`Reparación en proceso ${reparacion.cliente}-${reparacion.equipo} agregada a Firebase`)
        } else {
          // Si existe, actualizar el documento existente
          const docRef = querySnapshot.docs[0].ref
          await updateDoc(docRef, {
            ...reparacion,
            estado: "proceso",
            lastUpdate: serverTimestamp(),
          })
          console.log(`Reparación en proceso ${reparacion.cliente}-${reparacion.equipo} actualizada en Firebase`)
        }
      }
    }

    // Sincronizar reparaciones terminadas
    if (reparacionesTerminadas && reparacionesTerminadas.length > 0) {
      console.log("Sincronizando reparaciones terminadas...")

      for (const reparacion of reparacionesTerminadas) {
        // Buscar si la reparación ya existe en Firebase
        const q = query(
          collection(db, "reparacionesTerminadas"),
          where("cliente", "==", reparacion.cliente),
          where("equipo", "==", reparacion.equipo),
          where("fecha", "==", reparacion.fecha),
        )

        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          // Si no existe, crear nuevo documento
          await addDoc(collection(db, "reparacionesTerminadas"), {
            ...reparacion,
            estado: "terminado",
            timestamp: serverTimestamp(),
          })
          console.log(`Reparación terminada ${reparacion.cliente}-${reparacion.equipo} agregada a Firebase`)
        } else {
          // Si existe, actualizar el documento existente
          const docRef = querySnapshot.docs[0].ref
          await updateDoc(docRef, {
            ...reparacion,
            estado: "terminado",
            lastUpdate: serverTimestamp(),
          })
          console.log(`Reparación terminada ${reparacion.cliente}-${reparacion.equipo} actualizada en Firebase`)
        }
      }
    }

    console.log("Reparaciones sincronizadas correctamente")
    return true
  } catch (error) {
    console.error("Error al sincronizar reparaciones:", error)
    return false
  }
}

// Función para sincronizar clientes
async function syncClientes(clientesLocal) {
  if (!clientesLocal || clientesLocal.length === 0) return

  try {
    console.log("Sincronizando clientes...")

    for (const cliente of clientesLocal) {
      // Buscar si el cliente ya existe en Firebase por cédula o código
      let q

      if (cliente.cedula) {
        q = query(collection(db, "clientes"), where("cedula", "==", cliente.cedula))
      } else if (cliente.codigo) {
        q = query(collection(db, "clientes"), where("codigo", "==", cliente.codigo))
      } else {
        // Si no tiene identificador único, saltamos este cliente
        console.warn("Cliente sin identificador único, no se puede sincronizar:", cliente)
        continue
      }

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // Si no existe, crear nuevo documento
        await addDoc(collection(db, "clientes"), {
          ...cliente,
          timestamp: serverTimestamp(),
        })
        console.log(`Cliente ${cliente.nombre} agregado a Firebase`)
      } else {
        // Si existe, actualizar el documento existente
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...cliente,
          lastUpdate: serverTimestamp(),
        })
        console.log(`Cliente ${cliente.nombre} actualizado en Firebase`)
      }
    }

    console.log("Clientes sincronizados correctamente")
    return true
  } catch (error) {
    console.error("Error al sincronizar clientes:", error)
    return false
  }
}

// Función para sincronizar proveedores
async function syncProveedores(proveedoresLocal) {
  if (!proveedoresLocal || proveedoresLocal.length === 0) return

  try {
    console.log("Sincronizando proveedores...")

    for (const proveedor of proveedoresLocal) {
      // Buscar si el proveedor ya existe en Firebase por código o nombre+teléfono
      let q

      if (proveedor.codigo) {
        q = query(collection(db, "proveedores"), where("codigo", "==", proveedor.codigo))
      } else {
        q = query(
          collection(db, "proveedores"),
          where("nombre", "==", proveedor.nombre),
          where("telefono", "==", proveedor.telefono),
        )
      }

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // Si no existe, crear nuevo documento
        await addDoc(collection(db, "proveedores"), {
          ...proveedor,
          timestamp: serverTimestamp(),
        })
        console.log(`Proveedor ${proveedor.nombre} agregado a Firebase`)
      } else {
        // Si existe, actualizar el documento existente
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...proveedor,
          lastUpdate: serverTimestamp(),
        })
        console.log(`Proveedor ${proveedor.nombre} actualizado en Firebase`)
      }
    }

    console.log("Proveedores sincronizados correctamente")
    return true
  } catch (error) {
    console.error("Error al sincronizar proveedores:", error)
    return false
  }
}

// Función para sincronizar capital
async function syncCapital(capitalLocal) {
  if (!capitalLocal) return

  try {
    console.log("Sincronizando capital...")

    // El capital siempre se guarda en el mismo documento
    await setDoc(doc(db, "configuracion", "capital"), {
      ...capitalLocal,
      lastUpdate: serverTimestamp(),
    })

    console.log("Capital sincronizado correctamente")
    return true
  } catch (error) {
    console.error("Error al sincronizar capital:", error)
    return false
  }
}

// Función para sincronizar ganancias
async function syncGanancias(gananciasLocal) {
  try {
    console.log("Sincronizando ganancias...")

    // Las ganancias siempre se guardan en el mismo documento
    await setDoc(doc(db, "configuracion", "ganancias"), {
      valor: gananciasLocal,
      lastUpdate: serverTimestamp(),
    })

    console.log("Ganancias sincronizadas correctamente")
    return true
  } catch (error) {
    console.error("Error al sincronizar ganancias:", error)
    return false
  }
}

// Función para agregar botón de sincronización
function addSyncButton() {
  // Crear el botón de sincronización
  const syncButton = document.createElement("button")
  syncButton.className = "firebase-sync-button"
  syncButton.innerHTML = '<i class="fas fa-sync"></i> Sincronizar con Firebase'
  syncButton.title = "Sincronizar con Firebase"
  syncButton.style.position = "fixed"
  syncButton.style.bottom = "20px"
  syncButton.style.right = "20px"
  syncButton.style.zIndex = "1000"
  syncButton.style.backgroundColor = "#4a6da7"
  syncButton.style.color = "white"
  syncButton.style.border = "none"
  syncButton.style.borderRadius = "4px"
  syncButton.style.padding = "10px 15px"
  syncButton.style.cursor = "pointer"
  syncButton.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)"
  syncButton.style.display = "flex"
  syncButton.style.alignItems = "center"
  syncButton.style.gap = "8px"

  // Agregar evento de clic
  syncButton.addEventListener("click", syncAllData)

  // Agregar toggle para sincronización automática
  const autoSyncToggle = document.createElement("div")
  autoSyncToggle.className = "auto-sync-toggle"
  autoSyncToggle.style.position = "fixed"
  autoSyncToggle.style.bottom = "70px"
  autoSyncToggle.style.right = "20px"
  autoSyncToggle.style.zIndex = "1000"
  autoSyncToggle.innerHTML = `
  <label class="switch" title="Sincronización automática" style="position: relative; display: inline-block; width: 40px; height: 20px;">
    <input type="checkbox" id="autoSyncToggle" ${autoSyncEnabled ? "checked" : ""} style="opacity: 0; width: 0; height: 0;">
    <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
  </label>
`

  // Agregar estilos para el switch
  const style = document.createElement("style")
  style.textContent = `
  input:checked + .slider {
    background-color: #4a6da7;
  }
  input:checked + .slider:before {
    background-color: white;
  }
  input:checked + .slider:before {
    transform: translateX(20px);
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`

  document.head.appendChild(style)
  document.body.appendChild(autoSyncToggle)

  // Agregar evento al toggle
  document.getElementById("autoSyncToggle").addEventListener("change", function () {
    autoSyncEnabled = this.checked
    showMiniNotification(`Sincronización automática ${autoSyncEnabled ? "activada" : "desactivada"}`, "info")
  })

  // Agregar el botón al DOM
  document.body.appendChild(syncButton)
}

// Función para mostrar notificaciones pequeñas
function showMiniNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `mini-notification ${type}`
  notification.textContent = message
  notification.style.position = "fixed"
  notification.style.bottom = "10px"
  notification.style.left = "10px"
  notification.style.padding = "8px 12px"
  notification.style.borderRadius = "4px"
  notification.style.zIndex = "1001"
  notification.style.maxWidth = "300px"
  notification.style.fontSize = "12px"
  notification.style.opacity = "0.9"

  if (type === "success") {
    notification.style.backgroundColor = "#4CAF50"
    notification.style.color = "white"
  } else if (type === "error") {
    notification.style.backgroundColor = "#F44336"
    notification.style.color = "white"
  } else {
    notification.style.backgroundColor = "#2196F3"
    notification.style.color = "white"
  }

  document.body.appendChild(notification)

  // Eliminar después de 3 segundos
  setTimeout(() => {
    notification.style.opacity = "0"
    notification.style.transition = "opacity 0.3s"
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

// Función para detectar cambios en localStorage y sincronizar
function setupLocalStorageListener() {
  // Mantener el listener para cambios entre pestañas
  window.addEventListener("storage", (event) => {
    if (event.key === "tiendaCelulares" && isOnline && !syncInProgress) {
      console.log("Detectado cambio en localStorage desde otra pestaña")
      // No sincronizar automáticamente, solo actualizar la interfaz
      updateUI()
    }
  })

  // Modificar el comportamiento del localStorage.setItem para no sincronizar automáticamente
  const originalSetItem = localStorage.setItem
  localStorage.setItem = function (key, value) {
    const event = new Event("localStorageChange")
    event.key = key
    event.newValue = value
    window.dispatchEvent(event)
    originalSetItem.apply(this, arguments)
  }

  // Solo actualizar la interfaz cuando cambie el localStorage, no sincronizar
  window.addEventListener("localStorageChange", (event) => {
    if (event.key === "tiendaCelulares") {
      console.log("Detectado cambio local en tiendaCelulares")
      // Actualizar la interfaz sin sincronizar
      if (document.getElementById("cuerpoTablaInventario") || document.getElementById("cuerpoTablaClientes")) {
        updateUI()
      }
    }
  })
}

// Modificar la función setupAutoSync para que sea menos agresiva
function setupAutoSync() {
  console.log("Configurando sincronización automática cada 2 horas")
  setInterval(() => {
    if (autoSyncEnabled && isOnline && !syncInProgress && Date.now() - lastSyncTime > SYNC_INTERVAL) {
      console.log("Ejecutando sincronización automática programada")
      syncAllData()
    }
  }, 300000) // Verificar cada 5 minutos si toca sincronizar (en lugar de cada 30 segundos)
}

// Modificar la función guardarEnLocalStorage para no sincronizar automáticamente
if (window.guardarEnLocalStorage) {
  const originalGuardarEnLocalStorage = window.guardarEnLocalStorage
  window.guardarEnLocalStorage = function () {
    // Llamar a la función original
    originalGuardarEnLocalStorage.apply(this, arguments)

    // No sincronizar automáticamente, solo actualizar la interfaz
    updateUI()

    // Guardar la hora del último cambio para saber cuándo sincronizar
    window.lastChangeTime = Date.now()
  }
}

// Función para cerrar sesión
window.cerrarSesion = () => {
  sessionStorage.removeItem("currentUser")
  localStorage.removeItem("usuarioActual") // También eliminar el formato antiguo
  window.location.href = "login.html"
}

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Inicializando extensión de Firebase...")

  // Mostrar estado de conexión
  updateConnectionStatus()

  // Agregar botón de sincronización
  addSyncButton()

  // Configurar sincronización automática (ahora cada 2 horas)
  setupAutoSync()

  // Configurar listener de localStorage (ahora optimizado)
  setupLocalStorageListener()

  // Verificar si los datos locales están vacíos
  const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")
  if (!localData.inventario || localData.inventario.length === 0) {
    await loadDataFromFirebase()
  } else {
    console.log("Usando datos locales existentes")
    initialLoadComplete = true
  }

  console.log("Extensión de Firebase inicializada correctamente")
})

// Funciones para integración con el sistema de usuarios
// Estas funciones serán utilizadas por login.js

// Función para obtener usuarios desde Firebase
window.getUsersFromFirebase = async () => {
  if (!isOnline) return null

  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    const users = []

    usersSnapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        ...data,
        id: doc.id,
      })
    })

    return users.length > 0 ? users : null
  } catch (error) {
    console.error("Error al obtener usuarios desde Firebase:", error)
    return null
  }
}

// Función para guardar usuarios en Firebase
window.saveUsersToFirebase = async (users) => {
  if (!isOnline) return false

  try {
    // Primero eliminar la colección existente
    const usersSnapshot = await getDocs(collection(db, "users"))

    // Crear un batch para operaciones en lote
    const batch = db.batch()

    // Marcar documentos existentes para eliminación
    usersSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Ejecutar el batch de eliminación
    await batch.commit()

    // Ahora crear nuevos documentos
    for (const user of users) {
      await addDoc(collection(db, "users"), {
        ...user,
        timestamp: serverTimestamp(),
      })
    }

    return true
  } catch (error) {
    console.error("Error al guardar usuarios en Firebase:", error)
    return false
  }
}

// Función para obtener información de la empresa desde Firebase
window.getCompanyInfoFromFirebase = async () => {
  if (!isOnline) return null

  try {
    const companyDoc = await getDoc(doc(db, "configuracion", "companyInfo"))

    if (companyDoc.exists()) {
      return companyDoc.data()
    }

    return null
  } catch (error) {
    console.error("Error al obtener información de la empresa desde Firebase:", error)
    return null
  }
}

// Función para guardar información de la empresa en Firebase
window.saveCompanyInfoToFirebase = async (companyInfo) => {
  if (!isOnline) return false

  try {
    await setDoc(doc(db, "configuracion", "companyInfo"), {
      ...companyInfo,
      lastUpdate: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error al guardar información de la empresa en Firebase:", error)
    return false
  }
}

// Función para obtener contraseña de administración desde Firebase
window.getAdminPasswordFromFirebase = async () => {
  if (!isOnline) return null

  try {
    const passwordDoc = await getDoc(doc(db, "configuracion", "adminPassword"))

    if (passwordDoc.exists()) {
      return passwordDoc.data().password
    }

    return null
  } catch (error) {
    console.error("Error al obtener contraseña de administración desde Firebase:", error)
    return null
  }
}

// Función para guardar contraseña de administración en Firebase
window.saveAdminPasswordToFirebase = async (password) => {
  if (!isOnline) return false

  try {
    await setDoc(doc(db, "configuracion", "adminPassword"), {
      password,
      lastUpdate: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error al guardar contraseña de administración en Firebase:", error)
    return false
  }
}

// Exportar funciones adicionales para uso global
window.syncAllData = syncAllData
window.loadDataFromFirebase = loadDataFromFirebase
window.isOnline = isOnline
window.autoSyncEnabled = autoSyncEnabled
window.showMiniNotification = showMiniNotification

