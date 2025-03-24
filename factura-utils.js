// Utilidades para la generación de facturas

// Función para generar el encabezado de la factura con la información de la empresa
function generarEncabezadoFactura() {
    // Obtener información de la empresa
    const companyInfo = window.getCompanyInfo
      ? window.getCompanyInfo()
      : JSON.parse(localStorage.getItem("companyInfo") || '{"name":"Mi Empresa","phone":"","address":"","logo":""}')
  
    // Obtener información del usuario actual
    const currentUser = window.checkAuth
      ? window.checkAuth()
      : JSON.parse(sessionStorage.getItem("currentUser") || '{"username":"Usuario","role":"cashier","fullName":""}')
  
    // Crear el contenedor del encabezado
    const header = document.createElement("div")
    header.className = "factura-header"
  
    // Añadir logo si existe
    if (companyInfo.logo) {
      const logo = document.createElement("img")
      logo.src = companyInfo.logo
      logo.alt = "Logo de la empresa"
      logo.className = "factura-logo"
      header.appendChild(logo)
    }
  
    // Añadir información de la empresa
    const info = document.createElement("div")
    info.className = "factura-info"
  
    // Nombre de la empresa
    const nombre = document.createElement("div")
    nombre.className = "factura-empresa"
    nombre.textContent = companyInfo.name || "Mi Empresa"
    info.appendChild(nombre)
  
    // Contacto (teléfono y dirección)
    const contacto = document.createElement("div")
    contacto.className = "factura-contacto"
  
    if (companyInfo.phone) {
      contacto.innerHTML += `Tel: ${companyInfo.phone}<br>`
    }
  
    if (companyInfo.address) {
      contacto.innerHTML += `Dir: ${companyInfo.address}`
    }
  
    info.appendChild(contacto)
  
    // Añadir información de quien atendió
    const atencion = document.createElement("div")
    atencion.className = "factura-atencion"
  
    if (currentUser.role === "admin") {
      atencion.textContent = `Lo atendió: ${companyInfo.name}`
    } else {
      atencion.textContent = `Lo atendió: ${currentUser.fullName || currentUser.username}`
    }
  
    info.appendChild(atencion)
  
    // Añadir la información al encabezado
    header.appendChild(info)
  
    return header
  }
  
  // Función para añadir el encabezado a una factura existente
  function añadirEncabezadoFactura(contenedorFactura) {
    if (!contenedorFactura) return
  
    const encabezado = generarEncabezadoFactura()
  
    // Insertar al principio del contenedor
    if (contenedorFactura.firstChild) {
      contenedorFactura.insertBefore(encabezado, contenedorFactura.firstChild)
    } else {
      contenedorFactura.appendChild(encabezado)
    }
  }
  
  // Exportar funciones para uso global
  window.generarEncabezadoFactura = generarEncabezadoFactura
  window.añadirEncabezadoFactura = añadirEncabezadoFactura
  
  