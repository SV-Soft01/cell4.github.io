// Script para manejar la sesión en todas las páginas excepto login
// Este archivo debe incluirse en tus páginas HTML después de firebase-extension-fixed.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("Inicializando gestor de sesión...")
  
    // Verificar si hay una sesión guardada
    const currentUser = sessionStorage.getItem("currentUser")
  
    // Si no estamos en la página de login, verificar la sesión
    const isLoginPage =
      window.location.pathname.includes("login.html") ||
      window.location.pathname === "/" ||
      window.location.pathname === "/index.html"
  
    if (!isLoginPage) {
      if (!currentUser) {
        console.log("No hay sesión activa, redirigiendo al login")
        window.location.href = "login.html"
        return
      }
  
      try {
        const user = JSON.parse(currentUser)
  
        // Opcional: Agregar botón de cerrar sesión si no existe
        if (!document.getElementById("btn-cerrar-sesion")) {
          const btnCerrarSesion = document.createElement("button")
          btnCerrarSesion.id = "btn-cerrar-sesion"
          btnCerrarSesion.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cerrar Sesión'
          btnCerrarSesion.style.position = "fixed"
          btnCerrarSesion.style.top = "10px"
          btnCerrarSesion.style.left = "10px"
          btnCerrarSesion.style.zIndex = "1000"
          btnCerrarSesion.style.backgroundColor = "#4a6da7"
          btnCerrarSesion.style.color = "white"
          btnCerrarSesion.style.border = "none"
          btnCerrarSesion.style.borderRadius = "4px"
          btnCerrarSesion.style.padding = "8px 12px"
          btnCerrarSesion.style.cursor = "pointer"
          btnCerrarSesion.style.fontSize = "12px"
  
          btnCerrarSesion.onclick = () => {
            cerrarSesion()
          }
  
          document.body.appendChild(btnCerrarSesion)
        }
      } catch (e) {
        console.error("Error al procesar datos de sesión:", e)
        sessionStorage.removeItem("currentUser")
        window.location.href = "login.html"
        return
      }
    }
  
    console.log("Gestor de sesión inicializado correctamente")
  })
  
  // Función para cerrar sesión
  function cerrarSesion() {
    sessionStorage.removeItem("currentUser")
    localStorage.removeItem("usuarioActual") // También eliminar el formato antiguo
    window.location.href = "login.html"
  }
  
  // Exportar función para uso global
  window.cerrarSesion = cerrarSesion
  
  