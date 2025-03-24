// Script para manejar el inicio de sesión

document.addEventListener("DOMContentLoaded", () => {
    console.log("Inicializando manejador de login...")
  
    // Verificar si ya hay una sesión activa
    const sessionData = localStorage.getItem("sessionData")
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData)
        if (session.expiresAt > Date.now()) {
          console.log("Sesión activa encontrada, redirigiendo...")
          window.location.href = "pagina.html"
          return
        }
      } catch (e) {
        console.error("Error al procesar datos de sesión:", e)
        localStorage.removeItem("sessionData")
      }
    }
  
    // Configurar el formulario de login
    const loginForm = document.getElementById("login-form")
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault()
  
        const usuario = document.getElementById("username").value
        const password = document.getElementById("password").value
  
        // Validación simple
        if (!usuario || !password) {
          mostrarError("Por favor, complete todos los campos")
          return
        }
  
        // Aquí iría la lógica de autenticación real con Firebase
        // Por ahora, simplemente aceptamos cualquier usuario/contraseña
        console.log("Iniciando sesión para usuario:", usuario)
  
        // Guardar la sesión (30 días)
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
        localStorage.setItem(
          "sessionData",
          JSON.stringify({
            usuario: usuario,
            expiresAt: expiresAt,
            lastSync: Date.now(),
          }),
        )
  
        // Redirigir a la página principal
        window.location.href = "tienda-celulares.html"
      })
    } else {
      console.error("No se encontró el formulario de login")
    }
  
    function mostrarError(mensaje) {
      const errorDiv = document.getElementById("error-message")
      if (errorDiv) {
        errorDiv.textContent = mensaje
        errorDiv.style.display = "block"
  
        // Ocultar después de 3 segundos
        setTimeout(() => {
          errorDiv.style.display = "none"
        }, 3000)
      } else {
        alert(mensaje)
      }
    }
  
    console.log("Manejador de login inicializado correctamente")
  })
  
  