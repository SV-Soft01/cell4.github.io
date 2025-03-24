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
  deleteDoc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
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
const app = initializeApp(firebaseConfig, "extension")
const db = getFirestore(app)
console.log("Módulo de extensión de Firebase inicializado correctamente")

// Variables para controlar la sincronización
let syncInProgress = false
let autoSyncEnabled = true
let lastSyncTime = 0
const SYNC_INTERVAL = 60000 // 1 minuto entre sincronizaciones automáticas
let unsubscribers = [] // Para almacenar las funciones de cancelación de los listeners

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
    document.body.appendChild(statusIndicator)
  }

  statusIndicator.innerHTML = `
    <div class="status-indicator ${isOnline ? "online" : "offline"}"></div>
    <span>Firebase: ${isOnline ? "Conectado" : "Desconectado"}</span>
  `
}

// Función para sincronizar todos los datos
async function syncAllData() {
  if (syncInProgress || !isOnline) return

  syncInProgress = true
  window.showMiniNotification("Sincronizando datos con Firebase...")

  try {
    // Obtener datos de localStorage
    const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

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

    lastSyncTime = Date.now()
    window.showMiniNotification("Sincronización completada", "success")
  } catch (error) {
    console.error("Error en la sincronización:", error)
    window.showMiniNotification("Error en la sincronización", "error")
  } finally {
    syncInProgress = false
  }
}

// Función para configurar listeners de cambios en Firestore
function setupFirestoreListeners() {
  // Cancelar listeners existentes
  unsubscribers.forEach((unsub) => unsub())
  unsubscribers = []

  // Configurar nuevos listeners
  setupInventarioListener()
  setupFacturasListener()
  setupComprasListener()
  setupCuentasCobrarListener()
  setupCuentasPagarListener()
  setupIngresosListener()
  setupGastosListener()
  setupReparacionesListener()
  setupClientesListener()
  setupProveedoresListener()
  setupCapitalListener()
  setupGananciasListener()
}

// Funciones específicas para cada tipo de dato

// Inventario
async function syncInventario(inventarioLocal) {
  if (!inventarioLocal || inventarioLocal.length === 0) return

  try {
    // Obtener datos de Firestore
    const querySnapshot = await getDocs(collection(db, "inventario"))
    const inventarioFirestore = []
    querySnapshot.forEach((doc) => {
      inventarioFirestore.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Si no hay datos en Firestore, subir los locales
    if (inventarioFirestore.length === 0) {
      for (const producto of inventarioLocal) {
        await addDoc(collection(db, "inventario"), {
          ...producto,
          timestamp: serverTimestamp(),
        })
      }
      console.log("Inventario subido a Firebase")
      return
    }

    // Comparar y actualizar
    for (const productoLocal of inventarioLocal) {
      const productoFirestore = inventarioFirestore.find((p) => p.codigo === productoLocal.codigo)

      if (productoFirestore) {
        // Actualizar si hay cambios
        if (JSON.stringify(productoLocal) !== JSON.stringify(productoFirestore)) {
          await updateDoc(doc(db, "inventario", productoFirestore.id), {
            ...productoLocal,
            lastUpdate: serverTimestamp(),
          })
        }
      } else {
        // Añadir nuevo producto
        await addDoc(collection(db, "inventario"), {
          ...productoLocal,
          timestamp: serverTimestamp(),
        })
      }
    }

    // Verificar productos eliminados localmente
    for (const productoFirestore of inventarioFirestore) {
      if (!inventarioLocal.some((p) => p.codigo === productoFirestore.codigo)) {
        await deleteDoc(doc(db, "inventario", productoFirestore.id))
      }
    }

    console.log("Inventario sincronizado correctamente")
  } catch (error) {
    console.error("Error al sincronizar inventario:", error)
    throw error
  }
}

function setupInventarioListener() {
  const unsub = onSnapshot(collection(db, "inventario"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const inventarioFirestore = []
      snapshot.forEach((doc) => {
        inventarioFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      // Obtener datos locales
      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      // Actualizar solo si hay diferencias
      if (
        inventarioFirestore.length > 0 &&
        JSON.stringify(localData.inventario) !== JSON.stringify(inventarioFirestore)
      ) {
        // Actualizar datos locales
        localData.inventario = inventarioFirestore.map((p) => {
          const { id, timestamp, lastUpdate, ...rest } = p
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        // Actualizar la interfaz si estamos en la página de inventario
        if (document.getElementById("cuerpoTablaInventario")) {
          window.actualizarTablaInventario()
          window.actualizarCapital()
          window.showMiniNotification("Inventario actualizado desde Firebase", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de inventario:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Facturas
async function syncFacturas(facturasLocal) {
  if (!facturasLocal || facturasLocal.length === 0) return

  try {
    // Obtener datos de Firestore
    const querySnapshot = await getDocs(collection(db, "facturas"))
    const facturasFirestore = []
    querySnapshot.forEach((doc) => {
      facturasFirestore.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Si no hay datos en Firestore, subir los locales
    if (facturasFirestore.length === 0) {
      for (const factura of facturasLocal) {
        await addDoc(collection(db, "facturas"), {
          ...factura,
          timestamp: serverTimestamp(),
        })
      }
      console.log("Facturas subidas a Firebase")
      return
    }

    // Comparar y actualizar
    for (const facturaLocal of facturasLocal) {
      // Usar codigoFactura como identificador único
      const facturaFirestore = facturasFirestore.find((f) => f.codigoFactura === facturaLocal.codigoFactura)

      if (facturaFirestore) {
        // Actualizar si hay cambios
        if (JSON.stringify(facturaLocal) !== JSON.stringify(facturaFirestore)) {
          await updateDoc(doc(db, "facturas", facturaFirestore.id), {
            ...facturaLocal,
            lastUpdate: serverTimestamp(),
          })
        }
      } else {
        // Añadir nueva factura
        await addDoc(collection(db, "facturas"), {
          ...facturaLocal,
          timestamp: serverTimestamp(),
        })
      }
    }

    console.log("Facturas sincronizadas correctamente")
  } catch (error) {
    console.error("Error al sincronizar facturas:", error)
    throw error
  }
}

function setupFacturasListener() {
  const unsub = onSnapshot(collection(db, "facturas"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const facturasFirestore = []
      snapshot.forEach((doc) => {
        facturasFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      // Obtener datos locales
      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      // Actualizar solo si hay diferencias
      if (facturasFirestore.length > 0 && JSON.stringify(localData.facturas) !== JSON.stringify(facturasFirestore)) {
        // Actualizar datos locales
        localData.facturas = facturasFirestore.map((f) => {
          const { id, timestamp, lastUpdate, ...rest } = f
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        // Actualizar la interfaz si estamos en la página de facturas
        if (document.getElementById("cuerpoTablaFacturas")) {
          window.actualizarTablaFacturas()
          window.showMiniNotification("Facturas actualizadas desde Firebase", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de facturas:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Compras
async function syncCompras(comprasLocal) {
  // Implementación similar a syncFacturas
  if (!comprasLocal || comprasLocal.length === 0) return

  try {
    const querySnapshot = await getDocs(collection(db, "compras"))
    const comprasFirestore = []
    querySnapshot.forEach((doc) => {
      comprasFirestore.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    if (comprasFirestore.length === 0) {
      for (const compra of comprasLocal) {
        await addDoc(collection(db, "compras"), {
          ...compra,
          timestamp: serverTimestamp(),
        })
      }
      console.log("Compras subidas a Firebase")
      return
    }

    // Comparar por fecha y proveedor (no hay un ID único como en facturas)
    for (const compraLocal of comprasLocal) {
      const compraFirestore = comprasFirestore.find(
        (c) => c.fecha === compraLocal.fecha && c.proveedor === compraLocal.proveedor && c.total === compraLocal.total,
      )

      if (compraFirestore) {
        if (JSON.stringify(compraLocal) !== JSON.stringify(compraFirestore)) {
          await updateDoc(doc(db, "compras", compraFirestore.id), {
            ...compraLocal,
            lastUpdate: serverTimestamp(),
          })
        }
      } else {
        await addDoc(collection(db, "compras"), {
          ...compraLocal,
          timestamp: serverTimestamp(),
        })
      }
    }

    console.log("Compras sincronizadas correctamente")
  } catch (error) {
    console.error("Error al sincronizar compras:", error)
    throw error
  }
}

function setupComprasListener() {
  const unsub = onSnapshot(collection(db, "compras"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const comprasFirestore = []
      snapshot.forEach((doc) => {
        comprasFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      if (comprasFirestore.length > 0 && JSON.stringify(localData.compras) !== JSON.stringify(comprasFirestore)) {
        localData.compras = comprasFirestore.map((c) => {
          const { id, timestamp, lastUpdate, ...rest } = c
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        if (document.getElementById("cuerpoTablaCompras")) {
          window.actualizarTablaCompras()
          window.showMiniNotification("Compras actualizadas desde Firebase", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de compras:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Cuentas por Cobrar
async function syncCuentasCobrar(cuentasLocal) {
  if (!cuentasLocal || cuentasLocal.length === 0) return

  try {
    const querySnapshot = await getDocs(collection(db, "cuentasCobrar"))
    const cuentasFirestore = []
    querySnapshot.forEach((doc) => {
      cuentasFirestore.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    if (cuentasFirestore.length === 0) {
      for (const cuenta of cuentasLocal) {
        await addDoc(collection(db, "cuentasCobrar"), {
          ...cuenta,
          timestamp: serverTimestamp(),
        })
      }
      console.log("Cuentas por cobrar subidas a Firebase")
      return
    }

    // Comparar por codigoFactura si existe, o por cliente y fecha
    for (const cuentaLocal of cuentasLocal) {
      const cuentaFirestore = cuentasFirestore.find(
        (c) =>
          (cuentaLocal.codigoFactura && c.codigoFactura === cuentaLocal.codigoFactura) ||
          (c.cliente === cuentaLocal.cliente && c.fecha === cuentaLocal.fecha && c.total === cuentaLocal.total),
      )

      if (cuentaFirestore) {
        if (JSON.stringify(cuentaLocal) !== JSON.stringify(cuentaFirestore)) {
          await updateDoc(doc(db, "cuentasCobrar", cuentaFirestore.id), {
            ...cuentaLocal,
            lastUpdate: serverTimestamp(),
          })
        }
      } else {
        await addDoc(collection(db, "cuentasCobrar"), {
          ...cuentaLocal,
          timestamp: serverTimestamp(),
        })
      }
    }

    // Verificar cuentas pagadas (eliminadas localmente)
    for (const cuentaFirestore of cuentasFirestore) {
      if (
        !cuentasLocal.some(
          (c) =>
            (c.codigoFactura && c.codigoFactura === cuentaFirestore.codigoFactura) ||
            (c.cliente === cuentaFirestore.cliente &&
              c.fecha === cuentaFirestore.fecha &&
              c.total === cuentaFirestore.total),
        )
      ) {
        await deleteDoc(doc(db, "cuentasCobrar", cuentaFirestore.id))
      }
    }

    console.log("Cuentas por cobrar sincronizadas correctamente")
  } catch (error) {
    console.error("Error al sincronizar cuentas por cobrar:", error)
    throw error
  }
}

function setupCuentasCobrarListener() {
  const unsub = onSnapshot(collection(db, "cuentasCobrar"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const cuentasFirestore = []
      snapshot.forEach((doc) => {
        cuentasFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      if (cuentasFirestore.length > 0 && JSON.stringify(localData.cuentasCobrar) !== JSON.stringify(cuentasFirestore)) {
        localData.cuentasCobrar = cuentasFirestore.map((c) => {
          const { id, timestamp, lastUpdate, ...rest } = c
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        if (document.getElementById("cuerpoTablaCuentasCobrar")) {
          window.actualizarTablaCuentasCobrar()
          window.showMiniNotification("Cuentas por cobrar actualizadas", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de cuentas por cobrar:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Cuentas por Pagar
async function syncCuentasPagar(cuentasLocal) {
  // Implementación similar a syncCuentasCobrar
  if (!cuentasLocal || cuentasLocal.length === 0) return

  try {
    const querySnapshot = await getDocs(collection(db, "cuentasPagar"))
    const cuentasFirestore = []
    querySnapshot.forEach((doc) => {
      cuentasFirestore.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    if (cuentasFirestore.length === 0) {
      for (const cuenta of cuentasLocal) {
        await addDoc(collection(db, "cuentasPagar"), {
          ...cuenta,
          timestamp: serverTimestamp(),
        })
      }
      console.log("Cuentas por pagar subidas a Firebase")
      return
    }

    // Comparar por proveedor, fecha y total
    for (const cuentaLocal of cuentasLocal) {
      const cuentaFirestore = cuentasFirestore.find(
        (c) => c.proveedor === cuentaLocal.proveedor && c.fecha === cuentaLocal.fecha && c.total === cuentaLocal.total,
      )

      if (cuentaFirestore) {
        if (JSON.stringify(cuentaLocal) !== JSON.stringify(cuentaFirestore)) {
          await updateDoc(doc(db, "cuentasPagar", cuentaFirestore.id), {
            ...cuentaLocal,
            lastUpdate: serverTimestamp(),
          })
        }
      } else {
        await addDoc(collection(db, "cuentasPagar"), {
          ...cuentaLocal,
          timestamp: serverTimestamp(),
        })
      }
    }

    // Verificar cuentas pagadas (eliminadas localmente)
    for (const cuentaFirestore of cuentasFirestore) {
      if (
        !cuentasLocal.some(
          (c) =>
            c.proveedor === cuentaFirestore.proveedor &&
            c.fecha === cuentaFirestore.fecha &&
            c.total === cuentaFirestore.total,
        )
      ) {
        await deleteDoc(doc(db, "cuentasPagar", cuentaFirestore.id))
      }
    }

    console.log("Cuentas por pagar sincronizadas correctamente")
  } catch (error) {
    console.error("Error al sincronizar cuentas por pagar:", error)
    throw error
  }
}

function setupCuentasPagarListener() {
  const unsub = onSnapshot(collection(db, "cuentasPagar"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const cuentasFirestore = []
      snapshot.forEach((doc) => {
        cuentasFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      if (cuentasFirestore.length > 0 && JSON.stringify(localData.cuentasPagar) !== JSON.stringify(cuentasFirestore)) {
        localData.cuentasPagar = cuentasFirestore.map((c) => {
          const { id, timestamp, lastUpdate, ...rest } = c
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        if (document.getElementById("cuerpoTablaCuentasPagar")) {
          window.actualizarTablaCuentasPagar()
          window.showMiniNotification("Cuentas por pagar actualizadas", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de cuentas por pagar:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Ingresos
async function syncIngresos(ingresosLocal) {
  if (!ingresosLocal || ingresosLocal.length === 0) return

  try {
    const querySnapshot = await getDocs(collection(db, "ingresos"))
    const ingresosFirestore = []
    querySnapshot.forEach((doc) => {
      ingresosFirestore.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    if (ingresosFirestore.length === 0) {
      for (const ingreso of ingresosLocal) {
        await addDoc(collection(db, "ingresos"), {
          ...ingreso,
          timestamp: serverTimestamp(),
        })
      }
      console.log("Ingresos subidos a Firebase")
      return
    }

    // Comparar por fecha, monto y descripción
    for (const ingresoLocal of ingresosLocal) {
      const ingresoFirestore = ingresosFirestore.find(
        (i) =>
          i.fecha === ingresoLocal.fecha &&
          i.monto === ingresoLocal.monto &&
          i.descripcion === ingresoLocal.descripcion,
      )

      if (!ingresoFirestore) {
        await addDoc(collection(db, "ingresos"), {
          ...ingresoLocal,
          timestamp: serverTimestamp(),
        })
      }
    }

    console.log("Ingresos sincronizados correctamente")
  } catch (error) {
    console.error("Error al sincronizar ingresos:", error)
    throw error
  }
}

function setupIngresosListener() {
  const unsub = onSnapshot(collection(db, "ingresos"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const ingresosFirestore = []
      snapshot.forEach((doc) => {
        ingresosFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      if (ingresosFirestore.length > 0 && JSON.stringify(localData.ingresos) !== JSON.stringify(ingresosFirestore)) {
        localData.ingresos = ingresosFirestore.map((i) => {
          const { id, timestamp, lastUpdate, ...rest } = i
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        // Actualizar ganancias
        window.actualizarGanancias()

        if (document.getElementById("gananciasTotal")) {
          window.showMiniNotification("Ingresos actualizados desde Firebase", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de ingresos:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Gastos
async function syncGastos(gastosLocal) {
  // Implementación similar a syncIngresos
  if (!gastosLocal || gastosLocal.length === 0) return

  try {
    const querySnapshot = await getDocs(collection(db, "gastos"))
    const gastosFirestore = []
    querySnapshot.forEach((doc) => {
      gastosFirestore.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    if (gastosFirestore.length === 0) {
      for (const gasto of gastosLocal) {
        await addDoc(collection(db, "gastos"), {
          ...gasto,
          timestamp: serverTimestamp(),
        })
      }
      console.log("Gastos subidos a Firebase")
      return
    }

    // Comparar por fecha, monto y descripción
    for (const gastoLocal of gastosLocal) {
      const gastoFirestore = gastosFirestore.find(
        (g) => g.fecha === gastoLocal.fecha && g.monto === gastoLocal.monto && g.descripcion === gastoLocal.descripcion,
      )

      if (!gastoFirestore) {
        await addDoc(collection(db, "gastos"), {
          ...gastoLocal,
          timestamp: serverTimestamp(),
        })
      }
    }

    console.log("Gastos sincronizados correctamente")
  } catch (error) {
    console.error("Error al sincronizar gastos:", error)
    throw error
  }
}

function setupGastosListener() {
  const unsub = onSnapshot(collection(db, "gastos"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const gastosFirestore = []
      snapshot.forEach((doc) => {
        gastosFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      if (gastosFirestore.length > 0 && JSON.stringify(localData.gastos) !== JSON.stringify(gastosFirestore)) {
        localData.gastos = gastosFirestore.map((g) => {
          const { id, timestamp, lastUpdate, ...rest } = g
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        // Actualizar ganancias
        window.actualizarGanancias()

        if (document.getElementById("gananciasTotal")) {
          window.showMiniNotification("Gastos actualizados desde Firebase", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de gastos:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Reparaciones
async function syncReparaciones(reparacionesPendientes, reparacionesEnProceso, reparacionesTerminadas) {
  try {
    // Sincronizar reparaciones pendientes
    if (reparacionesPendientes && reparacionesPendientes.length > 0) {
      const querySnapshot = await getDocs(collection(db, "reparaciones"))
      const reparacionesFirestore = []
      querySnapshot.forEach((doc) => {
        reparacionesFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      if (reparacionesFirestore.length === 0) {
        for (const reparacion of reparacionesPendientes) {
          await addDoc(collection(db, "reparaciones"), {
            ...reparacion,
            estado: "pendiente",
            timestamp: serverTimestamp(),
          })
        }
        console.log("Reparaciones pendientes subidas a Firebase")
      } else {
        // Comparar y actualizar
        for (const reparacionLocal of reparacionesPendientes) {
          // Comparar por cliente, equipo y fecha
          const reparacionFirestore = reparacionesFirestore.find(
            (r) =>
              r.cliente === reparacionLocal.cliente &&
              r.equipo === reparacionLocal.equipo &&
              r.fecha === reparacionLocal.fecha,
          )

          if (reparacionFirestore) {
            if (JSON.stringify(reparacionLocal) !== JSON.stringify(reparacionFirestore)) {
              await updateDoc(doc(db, "reparaciones", reparacionFirestore.id), {
                ...reparacionLocal,
                estado: "pendiente",
                lastUpdate: serverTimestamp(),
              })
            }
          } else {
            await addDoc(collection(db, "reparaciones"), {
              ...reparacionLocal,
              estado: "pendiente",
              timestamp: serverTimestamp(),
            })
          }
        }

        // Verificar reparaciones eliminadas localmente
        for (const reparacionFirestore of reparacionesFirestore) {
          if (
            !reparacionesPendientes.some(
              (r) =>
                r.cliente === reparacionFirestore.cliente &&
                r.equipo === reparacionFirestore.equipo &&
                r.fecha === reparacionFirestore.fecha,
            )
          ) {
            await deleteDoc(doc(db, "reparaciones", reparacionFirestore.id))
          }
        }
      }
    }

    // Sincronizar reparaciones en proceso
    if (reparacionesEnProceso && reparacionesEnProceso.length > 0) {
      const querySnapshot = await getDocs(collection(db, "reparacionesEnProceso"))
      const reparacionesFirestore = []
      querySnapshot.forEach((doc) => {
        reparacionesFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      if (reparacionesFirestore.length === 0) {
        for (const reparacion of reparacionesEnProceso) {
          await addDoc(collection(db, "reparacionesEnProceso"), {
            ...reparacion,
            estado: "proceso",
            timestamp: serverTimestamp(),
          })
        }
        console.log("Reparaciones en proceso subidas a Firebase")
      } else {
        // Comparar y actualizar (similar a reparaciones pendientes)
        for (const reparacionLocal of reparacionesEnProceso) {
          const reparacionFirestore = reparacionesFirestore.find(
            (r) =>
              r.cliente === reparacionLocal.cliente &&
              r.equipo === reparacionLocal.equipo &&
              r.fecha === reparacionLocal.fecha,
          )

          if (reparacionFirestore) {
            if (JSON.stringify(reparacionLocal) !== JSON.stringify(reparacionFirestore)) {
              await updateDoc(doc(db, "reparacionesEnProceso", reparacionFirestore.id), {
                ...reparacionLocal,
                estado: "proceso",
                lastUpdate: serverTimestamp(),
              })
            }
          } else {
            await addDoc(collection(db, "reparacionesEnProceso"), {
              ...reparacionLocal,
              estado: "proceso",
              timestamp: serverTimestamp(),
            })
          }
        }

        // Verificar reparaciones eliminadas localmente
        for (const reparacionFirestore of reparacionesFirestore) {
          if (
            !reparacionesEnProceso.some(
              (r) =>
                r.cliente === reparacionFirestore.cliente &&
                r.equipo === reparacionFirestore.equipo &&
                r.fecha === reparacionFirestore.fecha,
            )
          ) {
            await deleteDoc(doc(db, "reparacionesEnProceso", reparacionFirestore.id))
          }
        }
      }
    }

    // Sincronizar reparaciones terminadas
    if (reparacionesTerminadas && reparacionesTerminadas.length > 0) {
      const querySnapshot = await getDocs(collection(db, "reparacionesTerminadas"))
      const reparacionesFirestore = []
      querySnapshot.forEach((doc) => {
        reparacionesFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      if (reparacionesFirestore.length === 0) {
        for (const reparacion of reparacionesTerminadas) {
          await addDoc(collection(db, "reparacionesTerminadas"), {
            ...reparacion,
            estado: "terminado",
            timestamp: serverTimestamp(),
          })
        }
        console.log("Reparaciones terminadas subidas a Firebase")
      } else {
        // Comparar y actualizar (similar a las anteriores)
        for (const reparacionLocal of reparacionesTerminadas) {
          const reparacionFirestore = reparacionesFirestore.find(
            (r) =>
              r.cliente === reparacionLocal.cliente &&
              r.equipo === reparacionLocal.equipo &&
              r.fecha === reparacionLocal.fecha,
          )

          if (reparacionFirestore) {
            if (JSON.stringify(reparacionLocal) !== JSON.stringify(reparacionFirestore)) {
              await updateDoc(doc(db, "reparacionesTerminadas", reparacionFirestore.id), {
                ...reparacionLocal,
                estado: "terminado",
                lastUpdate: serverTimestamp(),
              })
            }
          } else {
            await addDoc(collection(db, "reparacionesTerminadas"), {
              ...reparacionLocal,
              estado: "terminado",
              timestamp: serverTimestamp(),
            })
          }
        }

        // Verificar reparaciones eliminadas localmente
        for (const reparacionFirestore of reparacionesFirestore) {
          if (
            !reparacionesTerminadas.some(
              (r) =>
                r.cliente === reparacionFirestore.cliente &&
                r.equipo === reparacionFirestore.equipo &&
                r.fecha === reparacionFirestore.fecha,
            )
          ) {
            await deleteDoc(doc(db, "reparacionesTerminadas", reparacionFirestore.id))
          }
        }
      }
    }

    console.log("Reparaciones sincronizadas correctamente")
  } catch (error) {
    console.error("Error al sincronizar reparaciones:", error)
    throw error
  }
}

function setupReparacionesListener() {
  // Listener para reparaciones pendientes
  const unsubPendientes = onSnapshot(collection(db, "reparaciones"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const reparacionesFirestore = []
      snapshot.forEach((doc) => {
        reparacionesFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      if (
        reparacionesFirestore.length > 0 &&
        JSON.stringify(localData.reparaciones) !== JSON.stringify(reparacionesFirestore)
      ) {
        localData.reparaciones = reparacionesFirestore.map((r) => {
          const { id, timestamp, lastUpdate, ...rest } = r
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        if (document.getElementById("cuerpoTablaReparaciones")) {
          window.actualizarTablaReparaciones()
          window.showMiniNotification("Reparaciones actualizadas", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de reparaciones pendientes:", error)
    }
  })

  // Listener para reparaciones en proceso
  const unsubEnProceso = onSnapshot(collection(db, "reparacionesEnProceso"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const reparacionesFirestore = []
      snapshot.forEach((doc) => {
        reparacionesFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      if (
        reparacionesFirestore.length > 0 &&
        JSON.stringify(localData.reparacionesEnProceso) !== JSON.stringify(reparacionesFirestore)
      ) {
        localData.reparacionesEnProceso = reparacionesFirestore.map((r) => {
          const { id, timestamp, lastUpdate, ...rest } = r
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        if (document.getElementById("cuerpoTablaReparacionesEnProceso")) {
          window.actualizarTablaReparacionesEnProceso()
          window.showMiniNotification("Reparaciones en proceso actualizadas", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de reparaciones en proceso:", error)
    }
  })

  // Listener para reparaciones terminadas
  const unsubTerminadas = onSnapshot(collection(db, "reparacionesTerminadas"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const reparacionesFirestore = []
      snapshot.forEach((doc) => {
        reparacionesFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      if (
        reparacionesFirestore.length > 0 &&
        JSON.stringify(localData.reparacionesTerminadas) !== JSON.stringify(reparacionesFirestore)
      ) {
        localData.reparacionesTerminadas = reparacionesFirestore.map((r) => {
          const { id, timestamp, lastUpdate, ...rest } = r
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        if (document.getElementById("cuerpoTablaReparacionesTerminadas")) {
          window.actualizarTablaReparacionesTerminadas()
          window.showMiniNotification("Reparaciones terminadas actualizadas", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de reparaciones terminadas:", error)
    }
  })

  unsubscribers.push(unsubPendientes, unsubEnProceso, unsubTerminadas)
}

// Clientes
async function syncClientes(clientesLocal) {
  if (!clientesLocal || clientesLocal.length === 0) return

  try {
    const querySnapshot = await getDocs(collection(db, "clientes"))
    const clientesFirestore = []
    querySnapshot.forEach((doc) => {
      clientesFirestore.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    if (clientesFirestore.length === 0) {
      for (const cliente of clientesLocal) {
        await addDoc(collection(db, "clientes"), {
          ...cliente,
          timestamp: serverTimestamp(),
        })
      }
      console.log("Clientes subidos a Firebase")
      return
    }

    // Comparar por código o nombre y cédula
    for (const clienteLocal of clientesLocal) {
      const clienteFirestore = clientesFirestore.find(
        (c) =>
          (clienteLocal.codigo && c.codigo === clienteLocal.codigo) ||
          (c.nombre === clienteLocal.nombre && c.cedula === clienteLocal.cedula),
      )

      if (clienteFirestore) {
        if (JSON.stringify(clienteLocal) !== JSON.stringify(clienteFirestore)) {
          await updateDoc(doc(db, "clientes", clienteFirestore.id), {
            ...clienteLocal,
            lastUpdate: serverTimestamp(),
          })
        }
      } else {
        await addDoc(collection(db, "clientes"), {
          ...clienteLocal,
          timestamp: serverTimestamp(),
        })
      }
    }

    // Verificar clientes eliminados localmente
    for (const clienteFirestore of clientesFirestore) {
      if (
        !clientesLocal.some(
          (c) =>
            (c.codigo && c.codigo === clienteFirestore.codigo) ||
            (c.nombre === clienteFirestore.nombre && c.cedula === clienteFirestore.cedula),
        )
      ) {
        await deleteDoc(doc(db, "clientes", clienteFirestore.id))
      }
    }

    console.log("Clientes sincronizados correctamente")
  } catch (error) {
    console.error("Error al sincronizar clientes:", error)
    throw error
  }
}

function setupClientesListener() {
  const unsub = onSnapshot(collection(db, "clientes"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const clientesFirestore = []
      snapshot.forEach((doc) => {
        clientesFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      if (clientesFirestore.length > 0 && JSON.stringify(localData.clientes) !== JSON.stringify(clientesFirestore)) {
        localData.clientes = clientesFirestore.map((c) => {
          const { id, timestamp, lastUpdate, ...rest } = c
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        if (document.getElementById("cuerpoTablaClientes")) {
          window.actualizarTablaClientes()
          window.showMiniNotification("Clientes actualizados desde Firebase", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de clientes:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Proveedores
async function syncProveedores(proveedoresLocal) {
  // Implementación similar a syncClientes
  if (!proveedoresLocal || proveedoresLocal.length === 0) return

  try {
    const querySnapshot = await getDocs(collection(db, "proveedores"))
    const proveedoresFirestore = []
    querySnapshot.forEach((doc) => {
      proveedoresFirestore.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    if (proveedoresFirestore.length === 0) {
      for (const proveedor of proveedoresLocal) {
        await addDoc(collection(db, "proveedores"), {
          ...proveedor,
          timestamp: serverTimestamp(),
        })
      }
      console.log("Proveedores subidos a Firebase")
      return
    }

    // Comparar por código o nombre y teléfono
    for (const proveedorLocal of proveedoresLocal) {
      const proveedorFirestore = proveedoresFirestore.find(
        (p) =>
          (proveedorLocal.codigo && p.codigo === proveedorLocal.codigo) ||
          (p.nombre === proveedorLocal.nombre && p.telefono === proveedorLocal.telefono),
      )

      if (proveedorFirestore) {
        if (JSON.stringify(proveedorLocal) !== JSON.stringify(proveedorFirestore)) {
          await updateDoc(doc(db, "proveedores", proveedorFirestore.id), {
            ...proveedorLocal,
            lastUpdate: serverTimestamp(),
          })
        }
      } else {
        await addDoc(collection(db, "proveedores"), {
          ...proveedorLocal,
          timestamp: serverTimestamp(),
        })
      }
    }

    // Verificar proveedores eliminados localmente
    for (const proveedorFirestore of proveedoresFirestore) {
      if (
        !proveedoresLocal.some(
          (p) =>
            (p.codigo && p.codigo === proveedorFirestore.codigo) ||
            (p.nombre === proveedorFirestore.nombre && p.telefono === proveedorFirestore.telefono),
        )
      ) {
        await deleteDoc(doc(db, "proveedores", proveedorFirestore.id))
      }
    }

    console.log("Proveedores sincronizados correctamente")
  } catch (error) {
    console.error("Error al sincronizar proveedores:", error)
    throw error
  }
}

function setupProveedoresListener() {
  const unsub = onSnapshot(collection(db, "proveedores"), (snapshot) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      const proveedoresFirestore = []
      snapshot.forEach((doc) => {
        proveedoresFirestore.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

      if (
        proveedoresFirestore.length > 0 &&
        JSON.stringify(localData.proveedores) !== JSON.stringify(proveedoresFirestore)
      ) {
        localData.proveedores = proveedoresFirestore.map((p) => {
          const { id, timestamp, lastUpdate, ...rest } = p
          return rest
        })

        localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

        if (document.getElementById("cuerpoTablaProveedores")) {
          window.actualizarTablaProveedores()
          window.showMiniNotification("Proveedores actualizados desde Firebase", "info")
        }
      }
    } catch (error) {
      console.error("Error en listener de proveedores:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Capital
async function syncCapital(capitalLocal) {
  if (!capitalLocal) return

  try {
    const docRef = doc(db, "configuracion", "capital")
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        ...capitalLocal,
        timestamp: serverTimestamp(),
      })
      console.log("Capital subido a Firebase")
    } else {
      const capitalFirestore = docSnap.data()

      if (JSON.stringify(capitalLocal) !== JSON.stringify(capitalFirestore)) {
        await updateDoc(docRef, {
          ...capitalLocal,
          lastUpdate: serverTimestamp(),
        })
        console.log("Capital actualizado en Firebase")
      }
    }
  } catch (error) {
    console.error("Error al sincronizar capital:", error)
    throw error
  }
}

function setupCapitalListener() {
  const unsub = onSnapshot(doc(db, "configuracion", "capital"), (docSnap) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      if (docSnap.exists()) {
        const capitalFirestore = docSnap.data()
        const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

        if (JSON.stringify(localData.capital) !== JSON.stringify(capitalFirestore)) {
          const { timestamp, lastUpdate, ...capitalData } = capitalFirestore
          localData.capital = capitalData

          localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

          if (document.getElementById("capitalTotal")) {
            window.actualizarCapital()
            window.showMiniNotification("Capital actualizado desde Firebase", "info")
          }
        }
      }
    } catch (error) {
      console.error("Error en listener de capital:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Ganancias
async function syncGanancias(gananciasLocal) {
  try {
    const docRef = doc(db, "configuracion", "ganancias")
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        valor: gananciasLocal,
        timestamp: serverTimestamp(),
      })
      console.log("Ganancias subidas a Firebase")
    } else {
      const gananciasFirestore = docSnap.data()

      if (gananciasLocal !== gananciasFirestore.valor) {
        await updateDoc(docRef, {
          valor: gananciasLocal,
          lastUpdate: serverTimestamp(),
        })
        console.log("Ganancias actualizadas en Firebase")
      }
    }
  } catch (error) {
    console.error("Error al sincronizar ganancias:", error)
    throw error
  }
}

function setupGananciasListener() {
  const unsub = onSnapshot(doc(db, "configuracion", "ganancias"), (docSnap) => {
    if (!autoSyncEnabled || syncInProgress) return

    try {
      if (docSnap.exists()) {
        const gananciasFirestore = docSnap.data()
        const localData = JSON.parse(localStorage.getItem("tiendaCelulares") || "{}")

        if (localData.ganancias !== gananciasFirestore.valor) {
          localData.ganancias = gananciasFirestore.valor

          localStorage.setItem("tiendaCelulares", JSON.stringify(localData))

          if (document.getElementById("gananciasTotal")) {
            window.actualizarGanancias()
            window.showMiniNotification("Ganancias actualizadas desde Firebase", "info")
          }
        }
      }
    } catch (error) {
      console.error("Error en listener de ganancias:", error)
    }
  })

  unsubscribers.push(unsub)
}

// Función para agregar botón de sincronización
function addSyncButton() {
  // Crear el botón de sincronización
  const syncButton = document.createElement("button")
  syncButton.className = "firebase-sync-button"
  syncButton.innerHTML = '<i class="fas fa-sync"></i> Sincronizar con Firebase'
  syncButton.title = "Sincronizar con Firebase"

  // Agregar evento de clic
  syncButton.addEventListener("click", syncAllData)

  // Agregar toggle para sincronización automática
  const autoSyncToggle = document.createElement("div")
  autoSyncToggle.className = "auto-sync-toggle"
  autoSyncToggle.innerHTML = `
    <label class="switch" title="Sincronización automática">
      <input type="checkbox" id="autoSyncToggle" ${autoSyncEnabled ? "checked" : ""}>
      <span class="slider round"></span>
    </label>
  `

  // Agregar evento al toggle
  document.body.appendChild(autoSyncToggle)
  document.getElementById("autoSyncToggle").addEventListener("change", function () {
    autoSyncEnabled = this.checked
    window.showMiniNotification(`Sincronización automática ${autoSyncEnabled ? "activada" : "desactivada"}`, "info")
  })

  // Agregar el botón al DOM
  document.body.appendChild(syncButton)
}

// Función para sincronizar automáticamente cada cierto tiempo
function setupAutoSync() {
  setInterval(() => {
    if (autoSyncEnabled && isOnline && !syncInProgress && Date.now() - lastSyncTime > SYNC_INTERVAL) {
      syncAllData()
    }
  }, SYNC_INTERVAL / 2)
}

// Función para detectar cambios en localStorage y sincronizar
function setupLocalStorageListener() {
  window.addEventListener("storage", (event) => {
    if (event.key === "tiendaCelulares" && autoSyncEnabled && isOnline && !syncInProgress) {
      // Esperar un poco para evitar múltiples sincronizaciones
      setTimeout(() => {
        syncAllData()
      }, 2000)
    }
  })
}

// Función para guardar datos en localStorage y Firebase
window.guardarEnLocalStorageYFirebase = () => {
  // Guardar en localStorage (usando la función original)
  window.guardarEnLocalStorage()

  // Sincronizar con Firebase si está habilitado
  if (autoSyncEnabled && isOnline) {
    syncAllData()
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Inicializando extensión de Firebase...")

  // Mostrar estado de conexión
  updateConnectionStatus()

  // Agregar botón de sincronización
  addSyncButton()

  // Configurar sincronización automática
  setupAutoSync()

  // Configurar listeners de localStorage
  setupLocalStorageListener()

  // Configurar listeners de Firestore
  setupFirestoreListeners()

  // Sincronizar datos al inicio
  await syncAllData()

  console.log("Extensión de Firebase inicializada correctamente")
})

// Exportar funciones para uso global
window.syncAllData = syncAllData
window.toggleAutoSync = (enabled) => {
  autoSyncEnabled = enabled
  document.getElementById("autoSyncToggle").checked = enabled
}

