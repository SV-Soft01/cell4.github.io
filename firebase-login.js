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
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js"

// Configuración de Firebase
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
console.log("Inicializando Firebase para login...")
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const analytics = getAnalytics(app)
console.log("Firebase inicializado correctamente para login")

// ===== FUNCIONES PARA USUARIOS =====

// Función para guardar usuarios en Firebase
async function saveUsersToFirebase(users) {
  console.log("Guardando usuarios en Firebase...", users)
  try {
    // Limpiar colección existente
    await clearCollection("usuarios")

    let count = 0
    for (const user of users) {
      // No guardar la contraseña directamente en Firebase por seguridad
      // En una implementación real, deberías usar Firebase Authentication
      const userData = {
        username: user.username || "",
        password: user.password || "", // Nota: en producción, usar Firebase Auth en lugar de esto
        role: user.role || "cashier",
        fullName: user.fullName || "",
      }

      await addDoc(collection(db, "usuarios"), userData)
      count++
    }

    console.log(`Guardados ${count} usuarios en Firebase`)

    // También guardar en el formato antiguo para compatibilidad
    saveUsersToLocalStorage(users)

    return { success: true, count }
  } catch (error) {
    console.error("Error al guardar usuarios en Firebase:", error)
    return { success: false, error: error.message }
  }
}

// Función para obtener usuarios desde Firebase
async function getUsersFromFirebase() {
  console.log("Obteniendo usuarios desde Firebase...")
  try {
    const querySnapshot = await getDocs(collection(db, "usuarios"))
    const users = []

    querySnapshot.forEach((doc) => {
      // Asegurarse de que todos los campos necesarios estén presentes
      const userData = doc.data()
      users.push({
        id: doc.id,
        username: userData.username || "",
        password: userData.password || "",
        role: userData.role || "cashier",
        fullName: userData.fullName || "",
      })
    })

    console.log(`Cargados ${users.length} usuarios desde Firebase:`, users)

    // Si no hay usuarios en Firebase, intentar cargar desde localStorage
    if (users.length === 0) {
      const localUsers = loadUsersFromLocalStorage()
      if (localUsers && localUsers.length > 0) {
        console.log("Cargando usuarios desde localStorage y guardándolos en Firebase")
        await saveUsersToFirebase(localUsers)
        return localUsers
      }
    }

    return users
  } catch (error) {
    console.error("Error al cargar usuarios desde Firebase:", error)
    // Intentar cargar desde localStorage como respaldo
    return loadUsersFromLocalStorage()
  }
}

// Función para guardar usuarios en el formato antiguo (localStorage)
function saveUsersToLocalStorage(users) {
  try {
    // Guardar en el formato nuevo
    localStorage.setItem("inventoryUsers", JSON.stringify(users))

    // Guardar en el formato antiguo para compatibilidad
    const tiendaCelulares = JSON.parse(localStorage.getItem("tiendaCelulares")) || {}
    tiendaCelulares.usuarios = tiendaCelulares.usuarios || []

    // Convertir usuarios al formato antiguo
    tiendaCelulares.usuarios = users.map((user) => {
      return {
        nombre: user.fullName || user.username,
        usuario: user.username,
        password: user.password,
        tipo: user.role === "admin" ? "administrador" : "cajero",
      }
    })

    localStorage.setItem("tiendaCelulares", JSON.stringify(tiendaCelulares))
    console.log("Usuarios guardados en formato antiguo para compatibilidad")
  } catch (error) {
    console.error("Error al guardar usuarios en localStorage:", error)
  }
}

// Función para cargar usuarios desde el formato antiguo (localStorage)
function loadUsersFromLocalStorage() {
  try {
    // Intentar cargar desde el formato nuevo
    const inventoryUsers = localStorage.getItem("inventoryUsers")
    if (inventoryUsers) {
      return JSON.parse(inventoryUsers)
    }

    // Intentar cargar desde el formato antiguo
    const tiendaCelulares = JSON.parse(localStorage.getItem("tiendaCelulares"))
    if (tiendaCelulares && tiendaCelulares.usuarios && tiendaCelulares.usuarios.length > 0) {
      // Convertir usuarios del formato antiguo al nuevo
      const users = tiendaCelulares.usuarios.map((user) => {
        return {
          username: user.usuario,
          password: user.password,
          role: user.tipo === "administrador" ? "admin" : "cashier",
          fullName: user.nombre,
        }
      })

      // Guardar en el formato nuevo para futuras referencias
      localStorage.setItem("inventoryUsers", JSON.stringify(users))

      return users
    }

    return []
  } catch (error) {
    console.error("Error al cargar usuarios desde localStorage:", error)
    return []
  }
}

// ===== FUNCIONES PARA INFORMACIÓN DE LA EMPRESA =====

// Función para guardar información de la empresa en Firebase
async function saveCompanyInfoToFirebase(companyInfo) {
  console.log("Guardando información de la empresa en Firebase...")
  try {
    await setDoc(doc(db, "configuracion", "empresa"), companyInfo)
    console.log("Información de la empresa guardada en Firebase")

    // También guardar en el formato antiguo para compatibilidad
    saveCompanyInfoToLocalStorage(companyInfo)

    return { success: true }
  } catch (error) {
    console.error("Error al guardar información de la empresa en Firebase:", error)
    return { success: false, error: error.message }
  }
}

// Función para obtener información de la empresa desde Firebase
async function getCompanyInfoFromFirebase() {
  console.log("Obteniendo información de la empresa desde Firebase...")
  try {
    const docRef = doc(db, "configuracion", "empresa")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      console.log("Información de la empresa cargada desde Firebase")
      return docSnap.data()
    } else {
      console.log("No se encontró información de la empresa en Firebase")
      // Intentar cargar desde localStorage
      const localCompanyInfo = loadCompanyInfoFromLocalStorage()
      if (localCompanyInfo) {
        // Guardar en Firebase para futuras referencias
        await saveCompanyInfoToFirebase(localCompanyInfo)
        return localCompanyInfo
      }
      return null
    }
  } catch (error) {
    console.error("Error al cargar información de la empresa desde Firebase:", error)
    // Intentar cargar desde localStorage como respaldo
    return loadCompanyInfoFromLocalStorage()
  }
}

// Función para guardar información de la empresa en localStorage (formato antiguo)
function saveCompanyInfoToLocalStorage(companyInfo) {
  try {
    // Guardar en el formato nuevo
    localStorage.setItem("companyInfo", JSON.stringify(companyInfo))

    // Guardar en el formato antiguo para compatibilidad
    const tiendaCelulares = JSON.parse(localStorage.getItem("tiendaCelulares")) || {}
    const adminUser = tiendaCelulares.usuarios?.find((u) => u.tipo === "administrador")

    if (adminUser) {
      adminUser.infoEmpresa = {
        nombre: companyInfo.name || "",
        direccion: companyInfo.address || "",
        telefono: companyInfo.phone || "",
        mensajeFactura: companyInfo.message || "¡Gracias por su compra!",
      }

      localStorage.setItem("tiendaCelulares", JSON.stringify(tiendaCelulares))
      console.log("Información de empresa guardada en formato antiguo para compatibilidad")
    }
  } catch (error) {
    console.error("Error al guardar información de empresa en localStorage:", error)
  }
}

// Función para cargar información de la empresa desde localStorage (formato antiguo)
function loadCompanyInfoFromLocalStorage() {
  try {
    // Intentar cargar desde el formato nuevo
    const companyInfo = localStorage.getItem("companyInfo")
    if (companyInfo) {
      return JSON.parse(companyInfo)
    }

    // Intentar cargar desde el formato antiguo
    const tiendaCelulares = JSON.parse(localStorage.getItem("tiendaCelulares"))
    const adminUser = tiendaCelulares?.usuarios?.find((u) => u.tipo === "administrador")

    if (adminUser && adminUser.infoEmpresa) {
      const newFormatCompanyInfo = {
        name: adminUser.infoEmpresa.nombre || "",
        address: adminUser.infoEmpresa.direccion || "",
        phone: adminUser.infoEmpresa.telefono || "",
        logo: "",
        message: adminUser.infoEmpresa.mensajeFactura || "",
      }

      // Guardar en el formato nuevo para futuras referencias
      localStorage.setItem("companyInfo", JSON.stringify(newFormatCompanyInfo))

      return newFormatCompanyInfo
    }

    return null
  } catch (error) {
    console.error("Error al cargar información de empresa desde localStorage:", error)
    return null
  }
}

// ===== FUNCIONES PARA CONTRASEÑA DE ADMINISTRACIÓN =====

// Función para guardar contraseña de administración en Firebase
async function saveAdminPasswordToFirebase(password) {
  console.log("Guardando contraseña de administración en Firebase...")
  try {
    await setDoc(doc(db, "configuracion", "adminPassword"), { password })
    console.log("Contraseña de administración guardada en Firebase")

    // También guardar en localStorage
    localStorage.setItem("adminPassword", password)

    return { success: true }
  } catch (error) {
    console.error("Error al guardar contraseña de administración en Firebase:", error)
    return { success: false, error: error.message }
  }
}

// Función para obtener contraseña de administración desde Firebase
async function getAdminPasswordFromFirebase() {
  console.log("Obteniendo contraseña de administración desde Firebase...")
  try {
    const docRef = doc(db, "configuracion", "adminPassword")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      console.log("Contraseña de administración cargada desde Firebase")
      return docSnap.data().password
    } else {
      console.log("No se encontró contraseña de administración en Firebase")
      // Usar la contraseña por defecto de localStorage si existe
      const localPassword = localStorage.getItem("adminPassword")
      if (localPassword) {
        // Guardar en Firebase para futuras referencias
        await saveAdminPasswordToFirebase(localPassword)
        return localPassword
      }
      return "12345" // Contraseña por defecto
    }
  } catch (error) {
    console.error("Error al cargar contraseña de administración desde Firebase:", error)
    // Usar la contraseña de localStorage como respaldo
    return localStorage.getItem("adminPassword") || "12345"
  }
}

// ===== FUNCIONES AUXILIARES =====

// Función para limpiar una colección
async function clearCollection(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName))
    const deletePromises = []

    querySnapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, collectionName, document.id)))
    })

    await Promise.all(deletePromises)
    console.log(`Colección ${collectionName} limpiada correctamente`)
  } catch (error) {
    console.error(`Error al limpiar colección ${collectionName}:`, error)
    throw error
  }
}

// Función para mostrar notificaciones pequeñas
function showMiniNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `mini-notification ${type}`
  notification.textContent = message
  document.body.appendChild(notification)

  // Estilo para la notificación mini
  notification.style.position = "fixed"
  notification.style.bottom = "10px"
  notification.style.right = "10px"
  notification.style.padding = "8px 12px"
  notification.style.borderRadius = "4px"
  notification.style.zIndex = "1001"
  notification.style.maxWidth = "200px"
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

  // Eliminar después de 2 segundos
  setTimeout(() => {
    notification.style.opacity = "0"
    notification.style.transition = "opacity 0.3s"
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 2000)
}

// Verificar y migrar usuarios del formato antiguo al nuevo
async function migrateUsersIfNeeded() {
  try {
    // Verificar si hay usuarios en el formato antiguo
    const tiendaCelulares = JSON.parse(localStorage.getItem("tiendaCelulares"))
    if (tiendaCelulares && tiendaCelulares.usuarios && tiendaCelulares.usuarios.length > 0) {
      // Verificar si ya hay usuarios en el formato nuevo
      const inventoryUsers = localStorage.getItem("inventoryUsers")
      if (!inventoryUsers || JSON.parse(inventoryUsers).length === 0) {
        console.log("Migrando usuarios del formato antiguo al nuevo...")

        // Convertir usuarios del formato antiguo al nuevo
        const users = tiendaCelulares.usuarios.map((user) => {
          return {
            username: user.usuario,
            password: user.password,
            role: user.tipo === "administrador" ? "admin" : "cashier",
            fullName: user.nombre,
          }
        })

        // Guardar en el formato nuevo
        localStorage.setItem("inventoryUsers", JSON.stringify(users))

        // Guardar en Firebase
        await saveUsersToFirebase(users)

        console.log("Migración de usuarios completada")
        return true
      }
    }
    return false
  } catch (error) {
    console.error("Error al migrar usuarios:", error)
    return false
  }
}

// Ejecutar migración al cargar
migrateUsersIfNeeded()

// Exportar funciones para uso global
window.saveUsersToFirebase = saveUsersToFirebase
window.getUsersFromFirebase = getUsersFromFirebase
window.saveCompanyInfoToFirebase = saveCompanyInfoToFirebase
window.getCompanyInfoFromFirebase = getCompanyInfoFromFirebase
window.saveAdminPasswordToFirebase = saveAdminPasswordToFirebase
window.getAdminPasswordFromFirebase = getAdminPasswordFromFirebase
window.showMiniNotification = showMiniNotification
window.migrateUsersIfNeeded = migrateUsersIfNeeded

console.log("Módulo de Firebase para login cargado correctamente")

