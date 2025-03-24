// Verificar si el usuario está autenticado
function checkAuth() {
    const currentUser = sessionStorage.getItem("currentUser")
  
    if (!currentUser) {
      // Redirigir a la página de login si no hay usuario autenticado
      window.location.href = "login.html"
      return null
    }
  
    return JSON.parse(currentUser)
  }
  
  // Obtener información de la empresa
  function getCompanyInfo() {
    const companyInfo = localStorage.getItem("companyInfo")
  
    if (!companyInfo) {
      return {
        name: "Mi Empresa",
        phone: "",
        address: "",
        logo: "",
      }
    }
  
    return JSON.parse(companyInfo)
  }
  
  // Verificar permisos según el rol
  function checkPermission(requiredRole) {
    const user = checkAuth()
  
    if (!user) return false
  
    // El administrador tiene acceso a todo
    if (user.role === "admin") return true
  
    // Verificar si el rol del usuario coincide con el requerido
    return user.role === requiredRole
  }
  
  // Aplicar restricciones de acceso según el rol
  function applyRoleRestrictions() {
    const user = checkAuth()
  
    if (!user) return
  
    // Elementos a restringir según el rol
    const restrictedElements = {
      cashier: [
        document.getElementById("capital"),
        document.getElementById("ganancias"),
        document.getElementById("registros"),
      ],
      workshop: [
        document.getElementById("facturacion"),
        document.getElementById("compras"),
        document.getElementById("cuentasCobrar"),
        document.getElementById("cuentasPagar"),
        document.getElementById("capital"),
        document.getElementById("ganancias"),
        document.getElementById("registros"),
      ],
    }
  
    // Aplicar restricciones según el rol
    if (user.role !== "admin") {
      const elementsToHide = restrictedElements[user.role] || []
      elementsToHide.forEach((element) => {
        if (element) {
          // Ocultar elementos en el dashboard
          const dashboardCard = document.querySelector(`.card[onclick="toggleSection('${element.id}')"]`)
          if (dashboardCard) {
            dashboardCard.style.display = "none"
          }
  
          // Ocultar secciones
          element.style.display = "none"
        }
      })
    }
  
    // Mostrar información del usuario
    const userInfoElement = document.createElement("div")
    userInfoElement.className = "user-info"
    userInfoElement.innerHTML = `
    <span class="user-name">${user.fullName || user.username}</span>
    <span class="user-role">${getRoleName(user.role)}</span>
    <button id="logout-btn" class="logout-button" onclick="cerrarSesion()">
      <i class="fas fa-sign-out-alt"></i> Salir
    </button>
  `
  
    // Añadir al header
    const header = document.querySelector("header")
    if (header) {
      header.appendChild(userInfoElement)
    }
  }
  
  // Función global para cerrar sesión
  function cerrarSesion() {
    console.log("Cerrando sesión...")
    sessionStorage.removeItem("currentUser")
    localStorage.removeItem("usuarioActual") // También eliminar en formato antiguo
    window.location.href = "login.html"
  }
  
  // Obtener nombre legible del rol
  function getRoleName(role) {
    switch (role) {
      case "admin":
        return "Administrador"
      case "cashier":
        return "Cajero"
      case "workshop":
        return "Técnico de Taller"
      default:
        return role
    }
  }
  
  // Cerrar sesión (función original mantenida por compatibilidad)
  function logout() {
    cerrarSesion()
  }
  
  // Asegurarse de que las funciones de navegación estén disponibles globalmente
  window.mostrarSeccion = (seccion) => {
    document.querySelector(".dashboard").style.display = "none"
    document.getElementById("back-to-dashboard").style.display = "block"
    document.querySelectorAll(".seccion").forEach((s) => (s.style.display = "none"))
    document.getElementById(seccion).style.display = "block"
  }
  
  window.volverAlDashboard = () => {
    document.querySelectorAll(".seccion").forEach((s) => (s.style.display = "none"))
    document.querySelector(".dashboard").style.display = "grid"
    document.getElementById("back-to-dashboard").style.display = "none"
  }
  
  window.toggleSection = (seccion) => {
    // Verificar permisos antes de mostrar la sección
    const user = checkAuth()
    if (!user) return
  
    // Verificar restricciones según el rol
    if (user.role === "cashier" && ["capital", "ganancias", "registros"].includes(seccion)) {
      alert("No tienes permisos para acceder a esta sección")
      return
    }
  
    if (
      user.role === "workshop" &&
      ["facturacion", "compras", "cuentasCobrar", "cuentasPagar", "capital", "ganancias", "registros"].includes(seccion)
    ) {
      alert("No tienes permisos para acceder a esta sección")
      return
    }
  
    window.mostrarSeccion(seccion)
  }
  
  // Ejecutar al cargar la página
  document.addEventListener("DOMContentLoaded", () => {
    applyRoleRestrictions()
  
    // Asegurarse de que el botón de cerrar sesión funcione
    setTimeout(() => {
      const logoutBtn = document.getElementById("logout-btn")
      if (logoutBtn) {
        logoutBtn.onclick = cerrarSesion
      }
    }, 500)
  })
  
  // Exportar funciones para uso global
  window.checkAuth = checkAuth
  window.getCompanyInfo = getCompanyInfo
  window.checkPermission = checkPermission
  window.applyRoleRestrictions = applyRoleRestrictions
  window.getRoleName = getRoleName
  window.logout = logout
  window.cerrarSesion = cerrarSesion
  
  