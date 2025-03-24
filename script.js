// Asegurarse de que las funciones de navegación estén definidas al inicio
if (typeof mostrarSeccion !== "function") {
    function mostrarSeccion(seccion) {
      document.querySelector(".dashboard").style.display = "none"
      document.getElementById("back-to-dashboard").style.display = "block"
      document.querySelectorAll(".seccion").forEach((s) => (s.style.display = "none"))
      document.getElementById(seccion).style.display = "block"
    }
  }
  
  if (typeof volverAlDashboard !== "function") {
    function volverAlDashboard() {
      document.querySelectorAll(".seccion").forEach((s) => (s.style.display = "none"))
      document.querySelector(".dashboard").style.display = "grid"
      document.getElementById("back-to-dashboard").style.display = "none"
    }
  }
  
  if (typeof toggleSection !== "function") {
    function toggleSection(seccion) {
      mostrarSeccion(seccion)
    }
  }
  
  // Asegurarse de que estas funciones estén disponibles globalmente
  window.mostrarSeccion = mostrarSeccion
  window.volverAlDashboard = volverAlDashboard
  window.toggleSection = toggleSection
  
  // Variables globales
  const inventario = []
  const facturas = []
  const compras = []
  const cuentasCobrar = []
  const cuentasPagar = []
  const ingresos = []
  const gastos = []
  const reparaciones = []
  const reparacionesEnProceso = []
  const reparacionesTerminadas = []
  const clientes = []
  const proveedores = []
  const capital = {
    productos: 0,
    efectivo: 0,
    banco: 0,
  }
  let ganancias = 0
  let productosEnFactura = []
  let productosEnCompra = []
  let facturaSeleccionadaParaAbono = null
  let tipoFacturaAbono = ""
  
  // Añadir variable global para almacenar el usuario actual
  let usuarioActual = {
    nombre: "Usuario del Sistema",
    tipo: "Cajero", // "Cajero" o "Administrador"
  }
  
  // Función para calcular vuelto
  function calcularVuelto() {
    const totalFactura = Number.parseFloat(document.getElementById("totalFactura").textContent)
    const pagoConFactura = Number.parseFloat(document.getElementById("pagoConFactura").value)
    const vueltoFacturaElement = document.getElementById("vueltoFactura")
  
    if (isNaN(pagoConFactura)) {
      vueltoFacturaElement.textContent = "0.00"
      return
    }
  
    const vuelto = pagoConFactura - totalFactura
    vueltoFacturaElement.textContent = vuelto.toFixed(2)
  }
  
  // Modificar la función imprimirFactura para incluir el nombre del cajero
  // y cambiar el formato de hora a 12 horas
  window.imprimirFactura = () => {
    console.log("Ejecutando función imprimirFactura con datos de empresa")
  
    try {
      // Obtener información de la empresa desde localStorage
      let companyInfo = {
        name: "Mi Empresa",
        phone: "No disponible",
        address: "Dirección no disponible",
        logo: "",
      }
  
      try {
        const storedCompanyInfo = localStorage.getItem("companyInfo")
        if (storedCompanyInfo) {
          companyInfo = JSON.parse(storedCompanyInfo)
          console.log("Información de empresa cargada:", companyInfo)
        } else {
          console.log("No se encontró información de empresa en localStorage")
        }
      } catch (e) {
        console.error("Error al cargar información de empresa:", e)
      }
  
      // Obtener productos directamente de la tabla de factura
      const productosFactura = []
      const filas = document.querySelectorAll("#cuerpoTablaFactura tr")
  
      filas.forEach((fila) => {
        const celdas = fila.querySelectorAll("td")
        if (celdas.length >= 4) {
          const nombre = celdas[0].textContent
          const cantidad = Number.parseInt(celdas[1].textContent)
          const precioText = celdas[2].textContent.trim()
          const precio = Number.parseFloat(precioText)
  
          productosFactura.push({
            nombre: nombre,
            cantidad: cantidad,
            precio: precio,
          })
        }
      })
  
      // Verificar si hay productos
      if (productosFactura.length === 0) {
        alert("La factura no tiene productos para imprimir.")
        return
      }
  
      // Obtener datos básicos
      const cliente = document.getElementById("clienteFactura").value || "Cliente"
      const codigoFactura = "FAC-" + Date.now().toString().slice(-8)
  
      // Formatear fecha con hora en formato 12 horas
      const fechaActual = new Date()
      const opciones = {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      }
      const horaFormateada = fechaActual.toLocaleTimeString("es-ES", opciones)
      const fechaFormateada = fechaActual.toLocaleDateString() + " " + horaFormateada
  
      // Buscar si el cliente está registrado para obtener su código
      let codigoCliente = ""
      const clienteRegistrado = clientes.find((c) => c.nombre.toLowerCase() === cliente.toLowerCase())
      if (clienteRegistrado) {
        codigoCliente = clienteRegistrado.codigo || ""
      }
  
      // Calcular total
      let totalCalculado = 0
      productosFactura.forEach((producto) => {
        totalCalculado += producto.cantidad * producto.precio
      })
  
      // Generar HTML de la factura
      let filasHTML = ""
      productosFactura.forEach((producto) => {
        const subtotal = producto.cantidad * producto.precio
        filasHTML += `
          <tr>
            <td>${producto.nombre}</td>
            <td>${producto.cantidad}</td>
            <td>${producto.precio.toFixed(2)}</td>
            <td>${subtotal.toFixed(2)}</td>
          </tr>
        `
      })
  
      // Obtener configuración de impresión
      const printConfig = JSON.parse(localStorage.getItem("printConfig")) || {
        showLogo: true,
        showFooter: true,
        paperSize: "80mm",
        fontSize: "normal",
      }
  
      // Preparar el logo si existe y está habilitado
      const logoHTML =
        companyInfo.logo && printConfig.showLogo
          ? `<img src="${companyInfo.logo}" alt="Logo de la empresa" style="max-width: 60mm; max-height: 30mm; margin-bottom: 10px;">`
          : ""
  
      // Determinar tamaño de fuente
      let fontSizeClass = ""
      if (printConfig.fontSize === "small") {
        fontSizeClass = "font-size-small"
      } else if (printConfig.fontSize === "large") {
        fontSizeClass = "font-size-large"
      }
  
      // Obtener el nombre del cajero/administrador
      const nombreCajero = usuarioActual.nombre || "Usuario no identificado"
      const tipoCajero = usuarioActual.tipo || "Usuario"
  
      const contenidoFactura = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Factura - ${companyInfo.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .factura {
              width: ${printConfig.paperSize === "letter" ? "210mm" : printConfig.paperSize};
              padding: 5mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 10px;
            }
            .logo {
              max-width: 60mm;
              max-height: 30mm;
              margin-bottom: 10px;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin: 5px 0;
            }
            .company-info p {
              font-size: 12px;
              margin: 3px 0;
            }
            .customer-info {
              margin-bottom: 15px;
              font-size: 12px;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 10px;
            }
            .customer-info h2 {
              font-size: 14px;
              margin: 5px 0;
            }
            .customer-info p {
              margin: 3px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 12px;
            }
            th, td {
              border-bottom: 1px dashed #ccc;
              padding: 5px;
              text-align: left;
            }
            th {
              font-weight: bold;
            }
            .total {
              text-align: right;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 15px;
              border-top: 1px dashed #ccc;
              padding-top: 10px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              margin-top: 20px;
              border-top: 1px dashed #ccc;
              padding-top: 10px;
              display: ${printConfig.showFooter ? "block" : "none"};
            }
            .footer p {
              margin: 5px 0;
            }
            .font-size-small {
              font-size: 90%;
            }
            .font-size-large {
              font-size: 110%;
            }
            .cajero-info {
              text-align: center;
              font-size: 12px;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #ccc;
            }
          </style>
        </head>
        <body class="${fontSizeClass}">
          <div class="factura">
            <div class="header">
              ${logoHTML}
              <div class="company-info">
                <h1 class="company-name">${companyInfo.name}</h1>
                <p>${companyInfo.address}</p>
                <p>Teléfono: ${companyInfo.phone}</p>
                <p>Código de Factura: ${codigoFactura}</p>
                <p>Fecha: ${fechaFormateada}</p>
              </div>
            </div>
            
            <div class="customer-info">
              <h2>Datos del Cliente</h2>
              <p>Nombre: ${cliente}</p>
              ${codigoCliente ? `<p>Código: ${codigoCliente}</p>` : ""}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${filasHTML}
              </tbody>
            </table>
            
            <div class="total">
              Total Final: ${totalCalculado.toFixed(2)}
            </div>
            
            <div class="cajero-info">
              <p>Le atendió: ${nombreCajero} (${tipoCajero})</p>
            </div>
            
            <div class="footer">
              <p>¡Gracias por su compra!</p>
              <p>No se aceptan devoluciones sin su factura</p>
            </div>
          </div>
        </body>
        </html>
      `
  
      // Crear un iframe temporal para imprimir
      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      document.body.appendChild(iframe)
  
      // Escribir el contenido en el iframe
      const iframeDoc = iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(contenidoFactura)
      iframeDoc.close()
  
      // Esperar a que se cargue el contenido y las imágenes
      setTimeout(() => {
        // Imprimir el iframe
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
  
        // Eliminar el iframe después de un tiempo
        setTimeout(() => {
          document.body.removeChild(iframe)
  
          // NUEVO: Finalizar la factura automáticamente después de imprimir
          finalizarFactura()
        }, 1000)
      }, 1000) // Aumentamos el tiempo de espera para asegurar que el logo se cargue
    } catch (error) {
      console.error("Error al imprimir factura:", error)
      alert("Ocurrió un error al preparar la factura para imprimir: " + error.message)
    }
  }
  
  // Función para mostrar secciones
  function mostrarSeccion(seccion) {
    document.querySelector(".dashboard").style.display = "none"
    document.getElementById("back-to-dashboard").style.display = "block"
    document.querySelectorAll(".seccion").forEach((s) => (s.style.display = "none"))
    document.getElementById(seccion).style.display = "block"
  }
  
  // Función para volver al dashboard
  function volverAlDashboard() {
    document.querySelectorAll(".seccion").forEach((s) => (s.style.display = "none"))
    document.querySelector(".dashboard").style.display = "grid"
    document.getElementById("back-to-dashboard").style.display = "none"
  }
  
  // Función para alternar secciones (para las tarjetas)
  function toggleSection(seccion) {
    mostrarSeccion(seccion)
  }
  
  // Funciones de actualización
  function actualizarCapital() {
    capital.productos = inventario.reduce((total, producto) => {
      return total + producto.cantidad * producto.precioCompra
    }, 0)
  
    const capitalProductosElement = document.getElementById("capitalProductos")
    const capitalEfectivoElement = document.getElementById("capitalEfectivo")
    const capitalBancoElement = document.getElementById("capitalBanco")
    const capitalTotalElement = document.getElementById("capitalTotal")
  
    if (capitalProductosElement) capitalProductosElement.textContent = capital.productos.toFixed(2)
    if (capitalEfectivoElement) capitalEfectivoElement.textContent = capital.efectivo.toFixed(2)
    if (capitalBancoElement) capitalBancoElement.textContent = capital.banco.toFixed(2)
    if (capitalTotalElement)
      capitalTotalElement.textContent = (capital.productos + capital.efectivo + capital.banco).toFixed(2)
  }
  
  function actualizarGanancias() {
    const gananciasTotalElement = document.getElementById("gananciasTotal")
    if (gananciasTotalElement) gananciasTotalElement.textContent = ganancias.toFixed(2)
  }
  
  function actualizarTablaCuentasPagar() {
    const tbody = document.getElementById("cuerpoTablaCuentasPagar")
    if (!tbody) return
  
    tbody.innerHTML = ""
    cuentasPagar.forEach((compra, index) => {
      const tr = document.createElement("tr")
  
      // Calcular saldo pendiente (si hay abonos)
      let saldoPendiente = compra.total
      if (compra.abonos && compra.abonos.length > 0) {
        const totalAbonos = compra.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = compra.total - totalAbonos
      }
  
      tr.innerHTML = `
        <td>${compra.fecha}</td>
        <td>${compra.proveedor}</td>
        <td>${compra.total.toFixed(2)}</td>
        <td>${saldoPendiente.toFixed(2)}</td>
        <td>
          <button onclick="abrirModalAbonarPago(${index}, 'pagar')" class="action-button">
            <i class="fas fa-money-bill-wave"></i> Abonar Pago
          </button>
          <button onclick="verDetallesCuentaPagar(${index})" class="action-button">
            <i class="fas fa-info-circle"></i> Ver Detalles
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function actualizarTablaInventario(productosFiltrados = inventario) {
    const tbody = document.getElementById("cuerpoTablaInventario")
    if (!tbody) return
  
    tbody.innerHTML = ""
    productosFiltrados.forEach((producto, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${producto.nombre}</td>
        <td>${producto.codigo}</td>
        <td>${producto.precioCompra.toFixed(2)}</td>
        <td>${producto.precioVenta.toFixed(2)}</td>
        <td>${producto.cantidad}</td>
        <td>${producto.minimo}</td>
        <td>${producto.etiqueta}</td>
        <td>${producto.ubicacion || "N/A"}</td>
        <td>
          <button onclick="editarProducto(${index})" class="action-button">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button onclick="eliminarProducto(${index})" class="action-button">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  // Modificar la función de inicio de sesión para guardar el usuario actual
  // Busca la función de login en tu código y modifícala para incluir esto:
  function iniciarSesion(usuario, tipo, nombreCompleto) {
    usuarioActual.nombre = nombreCompleto || usuario
    usuarioActual.tipo = tipo
    // Guardar en localStorage para mantener la sesión
    localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual))
    // Resto de tu código de inicio de sesión...
  }
  
  // Añadir al inicio del script para cargar el usuario actual al cargar la página
  document.addEventListener("DOMContentLoaded", () => {
    // Cargar usuario actual si existe
    const usuarioGuardado = localStorage.getItem("usuarioActual")
    if (usuarioGuardado) {
      usuarioActual = JSON.parse(usuarioGuardado)
    }
  
    // Resto de tu código existente para DOMContentLoaded...
    cargarDesdeLocalStorage()
    console.log("DOM completamente cargado")
  
    // Inicializar todas las secciones
    inicializarInventario()
    inicializarFacturacion()
    inicializarCompras()
    inicializarCapital()
    inicializarTaller()
    inicializarClientesProveedores()
  
    // Mostrar el dashboard al inicio
    const dashboardElement = document.querySelector(".dashboard")
    const backToDashboardElement = document.getElementById("back-to-dashboard")
  
    if (dashboardElement) dashboardElement.style.display = "grid"
    if (backToDashboardElement) backToDashboardElement.style.display = "none"
  
    // Ocultar todas las secciones
    document.querySelectorAll(".seccion").forEach((s) => (s.style.display = "none"))
  
    // Actualizar todas las tablas y valores
    actualizarTablaInventario()
    actualizarCapital()
    actualizarGanancias()
    actualizarTablaFacturas()
    actualizarTablaCuentasCobrar()
    actualizarTablaCuentasPagar()
    actualizarTablaReparaciones()
    actualizarTablaReparacionesEnProceso()
    actualizarTablaReparacionesTerminadas()
    actualizarTablaClientes()
    actualizarTablaProveedores()
  
    // Añadir event listener para el formulario de ingresos/gastos
    const formIngresoGasto = document.getElementById("formIngresoGasto")
    if (formIngresoGasto) {
      formIngresoGasto.addEventListener("submit", registrarIngresoGasto)
    }
  
    // Añadir event listeners para la sección de registros
    const tipoRegistro = document.getElementById("tipoRegistro")
    const buscarRegistro = document.getElementById("buscarRegistro")
  
    if (tipoRegistro) {
      tipoRegistro.addEventListener("change", actualizarTablaRegistros)
    }
  
    if (buscarRegistro) {
      buscarRegistro.addEventListener("input", actualizarTablaRegistros)
    }
  
    // Inicializar formulario de abonos
    const formAbonarPago = document.getElementById("formAbonarPago")
    if (formAbonarPago) {
      formAbonarPago.addEventListener("submit", (e) => {
        e.preventDefault()
        guardarAbono()
      })
    }
  
    // Actualizar tabla de registros al inicio
    actualizarTablaRegistros()
  })
  
  // Función para registrar ingresos y gastos (modificada para afectar ganancias, no capital)
  function registrarIngresoGasto(event) {
    event.preventDefault()
    const tipoMovimiento = document.getElementById("tipoMovimiento").value
    const monto = Number.parseFloat(document.getElementById("montoMovimiento").value)
    const descripcion = document.getElementById("descripcionMovimiento").value
    const etiqueta = document.getElementById("etiquetaMovimiento").value
  
    if (isNaN(monto) || monto <= 0) {
      alert("Por favor, ingrese un monto válido.")
      return
    }
  
    const registro = {
      fecha: new Date().toLocaleDateString(),
      monto,
      descripcion,
      etiqueta,
    }
  
    if (tipoMovimiento === "ingreso") {
      ingresos.push(registro)
      // Aumentar ganancias, no capital
      ganancias += monto
    } else {
      gastos.push(registro)
      // Disminuir ganancias, no capital
      ganancias -= monto
    }
  
    actualizarGanancias()
    actualizarTablaRegistros()
    guardarEnLocalStorage()
    alert("Registro guardado correctamente.")
    document.getElementById("formIngresoGasto").reset()
  }
  
  function inicializarInventario() {
    const btnAgregarProducto = document.getElementById("btnAgregarProducto")
    if (btnAgregarProducto) {
      btnAgregarProducto.addEventListener("click", () => {
        const form = document.getElementById("formInventario")
        if (!form) return
  
        form.style.display = "block"
        const btnGuardarProducto = document.getElementById("btnGuardarProducto")
        const btnCancelarEdicion = document.getElementById("btnCancelarEdicion")
  
        if (btnGuardarProducto) btnGuardarProducto.textContent = "Agregar Producto"
        if (btnCancelarEdicion) btnCancelarEdicion.style.display = "none"
        form.reset()
      })
    }
  
    const formInventario = document.getElementById("formInventario")
    if (formInventario) {
      formInventario.addEventListener("submit", function (e) {
        e.preventDefault()
        const producto = {
          nombre: document.getElementById("nombreProducto").value,
          codigo: document.getElementById("codigoProducto").value,
          precioCompra: Number.parseFloat(document.getElementById("precioCompra").value),
          precioVenta: Number.parseFloat(document.getElementById("precioVenta").value),
          cantidad: Number.parseInt(document.getElementById("cantidadInventario").value),
          minimo: Number.parseInt(document.getElementById("cantidadMinima").value),
          etiqueta: document.getElementById("etiquetaProducto").value,
          ubicacion: document.getElementById("ubicacionProducto").value,
        }
  
        const index = inventario.findIndex((p) => p.codigo === producto.codigo)
        if (index !== -1) {
          const cantidadAnterior = inventario[index].cantidad
          inventario[index] = producto
          capital.productos += (producto.cantidad - cantidadAnterior) * producto.precioCompra
        } else {
          inventario.push(producto)
          capital.productos += producto.cantidad * producto.precioCompra
        }
  
        actualizarTablaInventario()
        this.reset()
        this.style.display = "none"
        actualizarCapital()
        guardarEnLocalStorage()
      })
    }
  
    const btnCancelarEdicion = document.getElementById("btnCancelarEdicion")
    if (btnCancelarEdicion) {
      btnCancelarEdicion.addEventListener("click", function () {
        const formInventario = document.getElementById("formInventario")
        const btnGuardarProducto = document.getElementById("btnGuardarProducto")
  
        if (formInventario) {
          formInventario.reset()
          formInventario.style.display = "none"
        }
  
        if (btnGuardarProducto) btnGuardarProducto.textContent = "Agregar Producto"
        this.style.display = "none"
      })
    }
  
    const buscarProducto = document.getElementById("buscarProducto")
    if (buscarProducto) {
      buscarProducto.addEventListener("input", (e) => {
        const busqueda = e.target.value.toLowerCase()
        const productosFiltrados = inventario.filter(
          (p) =>
            p.nombre.toLowerCase().includes(busqueda) ||
            p.codigo.toLowerCase().includes(busqueda) ||
            p.etiqueta.toLowerCase().includes(busqueda),
        )
        productosFiltrados.sort((a, b) => {
          const aIncludes = a.nombre.toLowerCase().includes(busqueda)
          const bIncludes = b.nombre.toLowerCase().includes(busqueda)
          if (aIncludes && !bIncludes) return -1
          if (!aIncludes && bIncludes) return 1
          return 0
        })
        actualizarTablaInventario(productosFiltrados)
      })
    }
  
    const ordenarProductos = document.getElementById("ordenarProductos")
    if (ordenarProductos) {
      ordenarProductos.addEventListener("change", (e) => {
        const criterio = e.target.value
        if (criterio === "alfabetico") {
          inventario.sort((a, b) => a.nombre.localeCompare(b.nombre))
        } else if (criterio === "stock_bajo") {
          inventario.sort((a, b) => a.cantidad - b.cantidad)
        }
        actualizarTablaInventario()
      })
    }
  }
  
  function editarProducto(index) {
    const producto = inventario[index]
    const nombreProducto = document.getElementById("nombreProducto")
    const codigoProducto = document.getElementById("codigoProducto")
    const precioCompra = document.getElementById("precioCompra")
    const precioVenta = document.getElementById("precioVenta")
    const cantidadInventario = document.getElementById("cantidadInventario")
    const cantidadMinima = document.getElementById("cantidadMinima")
    const etiquetaProducto = document.getElementById("etiquetaProducto")
    const ubicacionProducto = document.getElementById("ubicacionProducto")
    const formInventario = document.getElementById("formInventario")
    const btnGuardarProducto = document.getElementById("btnGuardarProducto")
    const btnCancelarEdicion = document.getElementById("btnCancelarEdicion")
  
    if (nombreProducto) nombreProducto.value = producto.nombre
    if (codigoProducto) codigoProducto.value = producto.codigo
    if (precioCompra) precioCompra.value = producto.precioCompra
    if (precioVenta) precioVenta.value = producto.precioVenta
    if (cantidadInventario) cantidadInventario.value = producto.cantidad
    if (cantidadMinima) cantidadMinima.value = producto.minimo
    if (etiquetaProducto) etiquetaProducto.value = producto.etiqueta
    if (ubicacionProducto) ubicacionProducto.value = producto.ubicacion || ""
  
    if (formInventario) formInventario.style.display = "block"
    if (btnGuardarProducto) btnGuardarProducto.textContent = "Guardar Cambios"
    if (btnCancelarEdicion) btnCancelarEdicion.style.display = "inline-block"
  }
  
  function eliminarProducto(index) {
    if (confirm("¿Está seguro de que desea eliminar este producto?")) {
      const producto = inventario[index]
      capital.productos -= producto.precioCompra * producto.cantidad
      inventario.splice(index, 1)
      actualizarTablaInventario()
      actualizarCapital()
      guardarEnLocalStorage()
    }
  }
  
  // Funciones para el Taller de Reparación
  function inicializarTaller() {
    const formReparacion = document.getElementById("formReparacion")
    if (formReparacion) {
      formReparacion.addEventListener("submit", function (e) {
        e.preventDefault()
  
        const reparacion = {
          cliente: document.getElementById("clienteReparacion").value,
          fecha: new Date().toLocaleDateString(),
          cedula: document.getElementById("cedulaReparacion").value,
          telefono: document.getElementById("telefonoReparacion").value,
          equipo: document.getElementById("equipoReparacion").value,
          detalles: document.getElementById("detallesReparacion").value,
          piezas: document.getElementById("piezasReparacion").value,
          precio: Number.parseFloat(document.getElementById("precioReparacion").value) || 0,
          estado: "pendiente",
        }
  
        reparaciones.push(reparacion)
        actualizarTablaReparaciones()
        this.reset()
        alert("Reparación registrada correctamente")
        guardarEnLocalStorage()
      })
    }
  
    // Configurar autocompletado para clientes en reparaciones
    const clienteReparacionInput = document.getElementById("clienteReparacion")
    const sugerenciasClientesReparacion = document.getElementById("sugerenciasClientesReparacion")
  
    if (clienteReparacionInput && sugerenciasClientesReparacion) {
      clienteReparacionInput.addEventListener("input", function () {
        const busqueda = this.value.toLowerCase()
  
        if (busqueda.length < 2) {
          sugerenciasClientesReparacion.style.display = "none"
          return
        }
  
        const clientesFiltrados = clientes.filter(
          (c) => c.nombre.toLowerCase().includes(busqueda) || (c.telefono && c.telefono.includes(busqueda)),
        )
  
        if (clientesFiltrados.length > 0) {
          sugerenciasClientesReparacion.innerHTML = ""
          clientesFiltrados.forEach((cliente) => {
            const div = document.createElement("div")
            div.className = "sugerencia-item"
            div.textContent = `${cliente.nombre} - ${cliente.telefono}`
            div.addEventListener("click", () => {
              clienteReparacionInput.value = cliente.nombre
              document.getElementById("cedulaReparacion").value = cliente.cedula || ""
              document.getElementById("telefonoReparacion").value = cliente.telefono || ""
              sugerenciasClientesReparacion.style.display = "none"
            })
            sugerenciasClientesReparacion.appendChild(div)
          })
          sugerenciasClientesReparacion.style.display = "block"
        } else {
          sugerenciasClientesReparacion.style.display = "none"
        }
      })
  
      // Ocultar sugerencias al hacer clic fuera
      document.addEventListener("click", (e) => {
        if (e.target !== clienteReparacionInput && e.target !== sugerenciasClientesReparacion) {
          sugerenciasClientesReparacion.style.display = "none"
        }
      })
    }
  
    actualizarTablaReparaciones()
    actualizarTablaReparacionesEnProceso()
    actualizarTablaReparacionesTerminadas()
  }
  
  function actualizarTablaReparaciones() {
    const tbody = document.getElementById("cuerpoTablaReparaciones")
    if (!tbody) return
  
    tbody.innerHTML = ""
    // Ordenar por fecha, las más recientes primero
    const reparacionesOrdenadas = [...reparaciones].sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha)
    })
  
    reparacionesOrdenadas.forEach((reparacion, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${reparacion.fecha}</td>
        <td>${reparacion.cliente}</td>
        <td>${reparacion.telefono}</td>
        <td>${reparacion.equipo}</td>
        <td>${reparacion.detalles}</td>
        <td>${reparacion.precio.toFixed(2)}</td>
        <td>
          <button onclick="moverAEnProceso(${index})" class="action-button">
            <i class="fas fa-tools"></i> En Proceso
          </button>
          <button onclick="verDetallesReparacion(${index}, 'pendiente')" class="action-button">
            <i class="fas fa-info-circle"></i> Detalles
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function actualizarTablaReparacionesEnProceso() {
    const tbody = document.getElementById("cuerpoTablaReparacionesEnProceso")
    if (!tbody) return
  
    tbody.innerHTML = ""
    // Ordenar por fecha, las más antiguas primero
    const reparacionesOrdenadas = [...reparacionesEnProceso].sort((a, b) => {
      return new Date(a.fecha) - new Date(b.fecha)
    })
  
    reparacionesOrdenadas.forEach((reparacion, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${reparacion.fecha}</td>
        <td>${reparacion.cliente}</td>
        <td>${reparacion.telefono}</td>
        <td>${reparacion.equipo}</td>
        <td>${reparacion.detalles}</td>
        <td>${reparacion.precio.toFixed(2)}</td>
        <td>
          <button onclick="finalizarReparacion(${index})" class="action-button">
            <i class="fas fa-check"></i> Finalizar
          </button>
          <button onclick="verDetallesReparacion(${index}, 'proceso')" class="action-button">
            <i class="fas fa-info-circle"></i> Detalles
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function actualizarTablaReparacionesTerminadas() {
    const tbody = document.getElementById("cuerpoTablaReparacionesTerminadas")
    if (!tbody) return
  
    tbody.innerHTML = ""
    // Ordenar por fecha, las más antiguas primero
    const reparacionesOrdenadas = [...reparacionesTerminadas].sort((a, b) => {
      return new Date(a.fecha) - new Date(b.fecha)
    })
  
    reparacionesOrdenadas.forEach((reparacion, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${reparacion.fecha}</td>
        <td>${reparacion.cliente}</td>
        <td>${reparacion.telefono}</td>
        <td>${reparacion.equipo}</td>
        <td>${reparacion.detalles}</td>
        <td>${reparacion.precio.toFixed(2)}</td>
        <td>
          <button onclick="facturarReparacion(${index})" class="action-button">
            <i class="fas fa-file-invoice-dollar"></i> Facturar
          </button>
          <button onclick="verDetallesReparacion(${index}, 'terminado')" class="action-button">
            <i class="fas fa-info-circle"></i> Detalles
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function moverAEnProceso(index) {
    const reparacion = reparaciones[index]
    reparacion.estado = "proceso"
    reparacionesEnProceso.push(reparacion)
    reparaciones.splice(index, 1)
    actualizarTablaReparaciones()
    actualizarTablaReparacionesEnProceso()
    alert("Reparación movida a 'En Proceso'")
    guardarEnLocalStorage()
  }
  
  function finalizarReparacion(index) {
    const reparacion = reparacionesEnProceso[index]
    reparacion.estado = "terminado"
    reparacionesTerminadas.push(reparacion)
    reparacionesEnProceso.splice(index, 1)
    actualizarTablaReparacionesEnProceso()
    actualizarTablaReparacionesTerminadas()
    alert("Reparación finalizada")
    guardarEnLocalStorage()
  }
  
  function verDetallesReparacion(index, estado) {
    let reparacion
    if (estado === "pendiente") {
      reparacion = reparaciones[index]
    } else if (estado === "proceso") {
      reparacion = reparacionesEnProceso[index]
    } else {
      reparacion = reparacionesTerminadas[index]
    }
  
    alert(`Detalles de la reparación:
  Cliente: ${reparacion.cliente}
  Cédula: ${reparacion.cedula}
  Teléfono: ${reparacion.telefono}
  Fecha: ${reparacion.fecha}
  Equipo: ${reparacion.equipo}
  Detalles: ${reparacion.detalles}
  Piezas funcionales: ${reparacion.piezas || "N/A"}
  Precio estimado: ${reparacion.precio.toFixed(2)}`)
  }
  
  function facturarReparacion(index) {
    const reparacion = reparacionesTerminadas[index]
    mostrarSeccion("facturacion")
  
    // Llenar datos de la factura
    document.getElementById("clienteFactura").value = reparacion.cliente
  
    // Crear un producto virtual para la reparación
    const productoReparacion = {
      nombre: `Reparación - ${reparacion.equipo}`,
      codigo: `REP-${Date.now()}`,
      precioCompra: 0,
      precioVenta: reparacion.precio,
      cantidad: 1,
      detalles: reparacion.detalles,
    }
  
    productosEnFactura.push(productoReparacion)
    actualizarTablaFactura()
  
    // Eliminar de reparaciones terminadas
    reparacionesTerminadas.splice(index, 1)
    actualizarTablaReparacionesTerminadas()
    guardarEnLocalStorage()
  }
  
  // Funciones para facturación
  function inicializarFacturacion() {
    const buscarProductoFactura = document.getElementById("buscarProductoFactura")
    if (buscarProductoFactura) {
      buscarProductoFactura.addEventListener("input", (e) => {
        const busqueda = e.target.value.toLowerCase()
        const select = document.getElementById("productoSeleccionado")
        if (!select) return
  
        select.innerHTML = ""
        inventario
          .filter((p) => p.nombre.toLowerCase().includes(busqueda) || p.codigo.toLowerCase().includes(busqueda))
          .forEach((p) => {
            const option = document.createElement("option")
            option.value = p.codigo
            option.textContent = `${p.nombre} - ${p.codigo}`
            select.appendChild(option)
          })
      })
    }
  
    const productoSeleccionado = document.getElementById("productoSeleccionado")
    if (productoSeleccionado) {
      productoSeleccionado.addEventListener("change", (e) => {
        const producto = inventario.find((p) => p.codigo === e.target.value)
        const precioFacturaElement = document.getElementById("precioFactura")
  
        if (producto && precioFacturaElement) {
          precioFacturaElement.value = producto.precioVenta.toFixed(2)
        } else if (precioFacturaElement) {
          precioFacturaElement.value = ""
        }
      })
    }
  
    const fechaFactura = document.getElementById("fechaFactura")
    if (fechaFactura) {
      fechaFactura.value = new Date().toLocaleDateString()
    }
  
    const btnBuscarReparacion = document.getElementById("btnBuscarReparacion")
    if (btnBuscarReparacion) {
      btnBuscarReparacion.addEventListener("click", mostrarReparacionesParaFacturar)
    }
  
    // Configurar autocompletado para clientes en facturación
    const clienteFacturaInput = document.getElementById("clienteFactura")
    const sugerenciasClientes = document.getElementById("sugerenciasClientes")
  
    if (clienteFacturaInput && sugerenciasClientes) {
      clienteFacturaInput.addEventListener("input", function () {
        const busqueda = this.value.toLowerCase()
  
        if (busqueda.length < 2) {
          sugerenciasClientes.style.display = "none"
          return
        }
  
        const clientesFiltrados = clientes.filter(
          (c) => c.nombre.toLowerCase().includes(busqueda) || (c.telefono && c.telefono.includes(busqueda)),
        )
  
        if (clientesFiltrados.length > 0) {
          sugerenciasClientes.innerHTML = ""
          clientesFiltrados.forEach((cliente) => {
            const div = document.createElement("div")
            div.className = "sugerencia-item"
            div.textContent = `${cliente.nombre} - ${cliente.telefono}`
            div.addEventListener("click", () => {
              clienteFacturaInput.value = cliente.nombre
              sugerenciasClientes.style.display = "none"
            })
            sugerenciasClientes.appendChild(div)
          })
          sugerenciasClientes.style.display = "block"
        } else {
          sugerenciasClientes.style.display = "none"
        }
      })
  
      // Ocultar sugerencias al hacer clic fuera
      document.addEventListener("click", (e) => {
        if (e.target !== clienteFacturaInput && e.target !== sugerenciasClientes) {
          sugerenciasClientes.style.display = "none"
        }
      })
    }
  }
  
  function agregarProductoFactura() {
    const codigo = document.getElementById("productoSeleccionado").value
    const cantidad = Number.parseInt(document.getElementById("cantidadFactura").value)
    const precioFactura = document.getElementById("precioFactura")
  
    if (!codigo || !cantidad || !precioFactura) return
  
    const producto = inventario.find((p) => p.codigo === codigo)
    if (producto && cantidad > 0) {
      if (cantidad > producto.cantidad) {
        alert(`No hay suficiente stock. Stock disponible: ${producto.cantidad}`)
        return
      }
  
      // Usar el precio que está en el campo de precio, o si está vacío, usar el precio de venta del producto
      const precio = precioFactura.value ? Number.parseFloat(precioFactura.value) : producto.precioVenta
  
      if (isNaN(precio)) {
        alert("El precio no es válido")
        return
      }
  
      productosEnFactura.push({ ...producto, cantidad, precio })
      actualizarTablaFactura()
  
      // Limpiar los campos después de agregar
      document.getElementById("productoSeleccionado").value = ""
      document.getElementById("cantidadFactura").value = ""
      document.getElementById("precioFactura").value = ""
      document.getElementById("buscarProductoFactura").value = ""
    }
  }
  
  function actualizarTablaFactura() {
    const tbody = document.getElementById("cuerpoTablaFactura")
    if (!tbody) return
  
    tbody.innerHTML = ""
    let total = 0
    productosEnFactura.forEach((p, index) => {
      const subtotal = p.cantidad * p.precio
      total += subtotal
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td>
          <div class="precio-editable">
            <span>${p.precio.toFixed(2)}</span>
            <button onclick="editarPrecioFactura(${index})" class="action-button btn-edit-precio">
              <i class="fas fa-pencil-alt"></i>
            </button>
          </div>
        </td>
        <td>${subtotal.toFixed(2)}</td>
        <td>
          <button onclick="eliminarProductoFactura(${index})" class="action-button">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  
    const totalFacturaElement = document.getElementById("totalFactura")
    if (totalFacturaElement) totalFacturaElement.textContent = total.toFixed(2)
  }
  
  function editarPrecioFactura(index) {
    const producto = productosEnFactura[index]
    const nuevoPrecio = prompt("Ingrese el nuevo precio:", producto.precio)
  
    if (nuevoPrecio !== null && !isNaN(nuevoPrecio) && Number(nuevoPrecio) > 0) {
      productosEnFactura[index].precio = Number(nuevoPrecio)
      actualizarTablaFactura()
    }
  }
  
  function eliminarProductoFactura(index) {
    productosEnFactura.splice(index, 1)
    actualizarTablaFactura()
  }
  
  // Corregir la función finalizarFactura para que las ganancias no afecten al capital
  function finalizarFactura() {
    const cliente = document.getElementById("clienteFactura").value.trim()
    const fecha = document.getElementById("fechaFactura").value
    const totalElement = document.getElementById("totalFactura")
    const tipoFacturaElement = document.getElementById("tipoFactura")
    const metodoPagoElement = document.getElementById("metodoPago")
  
    if (!totalElement || !tipoFacturaElement || !metodoPagoElement) return
  
    const total = Number.parseFloat(totalElement.textContent)
    const tipoFactura = tipoFacturaElement.value
    const metodoPago = metodoPagoElement.value
  
    if (cliente === "") {
      alert("Por favor, ingrese el nombre del cliente.")
      return
    }
  
    if (productosEnFactura.length === 0) {
      alert("No hay productos en la factura. Añada productos antes de finalizar.")
      return
    }
  
    let gananciaFactura = 0
    productosEnFactura.forEach((p) => {
      // Si es un producto del inventario (no una reparación)
      if (p.codigo.indexOf("REP-") !== 0) {
        const productoInventario = inventario.find((inv) => inv.codigo === p.codigo)
        if (productoInventario) {
          productoInventario.cantidad -= p.cantidad
          gananciaFactura += (p.precio - p.precioCompra) * p.cantidad
          // Solo reducir el capital de productos por el costo de los productos vendidos
          capital.productos -= p.precioCompra * p.cantidad
        }
      } else {
        // Si es una reparación, toda la venta es ganancia
        gananciaFactura += p.precio * p.cantidad
      }
    })
  
    const factura = {
      fecha,
      cliente,
      total,
      ganancia: gananciaFactura,
      productos: productosEnFactura,
      tipo: tipoFactura,
      metodoPago,
      abonos: [],
      codigoFactura: "FAC-" + Date.now().toString().slice(-8),
      // Guardar información del cajero que emitió la factura
      cajero: usuarioActual.nombre,
      tipoCajero: usuarioActual.tipo,
    }
  
    if (tipoFactura === "contado") {
      facturas.push(factura)
      // Agregar solo la ganancia a las ganancias, no el total
      ganancias += gananciaFactura
  
      if (metodoPago === "efectivo") {
        capital.efectivo += total
      } else {
        capital.banco += total
      }
  
      ingresos.push({
        fecha,
        monto: total,
        descripcion: `Factura al contado - ${cliente} (${metodoPago})`,
        etiqueta: "Venta",
      })
  
      // Registrar venta en el historial del cliente
      registrarVentaEnCliente(cliente, factura)
    } else {
      cuentasCobrar.push(factura)
      // Registrar venta a crédito en el historial del cliente
      registrarVentaEnCliente(cliente, factura)
    }
  
    actualizarTablaFacturas()
    actualizarTablaCuentasCobrar()
    actualizarGanancias()
    actualizarCapital()
    actualizarTablaInventario()
    guardarEnLocalStorage()
  
    productosEnFactura = []
    const formFacturaElement = document.getElementById("formFactura")
    if (formFacturaElement) formFacturaElement.reset()
  
    const fechaFacturaElement = document.getElementById("fechaFactura")
    if (fechaFacturaElement) fechaFacturaElement.value = new Date().toLocaleDateString()
  
    const cuerpoTablaFacturaElement = document.getElementById("cuerpoTablaFactura")
    if (cuerpoTablaFacturaElement) cuerpoTablaFacturaElement.innerHTML = ""
  
    if (totalElement) totalElement.textContent = "0"
  
    alert("Factura emitida correctamente")
  }
  
  function registrarVentaEnCliente(nombreCliente, factura) {
    // Buscar el cliente por nombre
    const clienteIndex = clientes.findIndex((c) => c.nombre.toLowerCase() === nombreCliente.toLowerCase())
  
    if (clienteIndex !== -1) {
      // Si el cliente existe, agregar la venta a su historial
      if (!clientes[clienteIndex].historial) {
        clientes[clienteIndex].historial = []
      }
  
      clientes[clienteIndex].historial.push({
        tipo: "venta",
        fecha: factura.fecha,
        total: factura.total,
        productos: factura.productos.map((p) => ({
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio,
        })),
        tipoFactura: factura.tipo,
      })
  
      guardarEnLocalStorage()
    }
  }
  
  // Modificar la función actualizarTablaFacturas para añadir el botón de reimprimir
  function actualizarTablaFacturas() {
    const tbody = document.getElementById("cuerpoTablaFacturas")
    if (!tbody) return
  
    tbody.innerHTML = ""
    facturas.forEach((f, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${f.fecha}</td>
        <td>${f.cliente}</td>
        <td>${f.total.toFixed(2)}</td>
        <td>${f.ganancia.toFixed(2)}</td>
        <td>${f.tipo}</td>
        <td>
          <button onclick="verDetallesFactura(${index})" class="action-button">
            <i class="fas fa-info-circle"></i> Ver Detalles
          </button>
          <button onclick="reimprimirFactura(${index})" class="action-button">
            <i class="fas fa-print"></i> Reimprimir
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function actualizarTablaCuentasCobrar() {
    const tbody = document.getElementById("cuerpoTablaCuentasCobrar")
    if (!tbody) return
  
    tbody.innerHTML = ""
    cuentasCobrar.forEach((factura, index) => {
      // Calcular saldo pendiente (si hay abonos)
      let saldoPendiente = factura.total
      if (factura.abonos && factura.abonos.length > 0) {
        const totalAbonos = factura.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = factura.total - totalAbonos
      }
  
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${factura.fecha}</td>
        <td>${factura.cliente}</td>
        <td>${factura.total.toFixed(2)}</td>
        <td>${saldoPendiente.toFixed(2)}</td>
        <td>
          <button onclick="abrirModalAbonarPago(${index}, 'cobrar')" class="action-button">
            <i class="fas fa-money-bill-wave"></i> Abonar Pago
          </button>
          <button onclick="verDetallesCuentaCobrar(${index})" class="action-button">
            <i class="fas fa-info-circle"></i> Ver Detalles
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function abrirModalAbonarPago(index, tipo) {
    facturaSeleccionadaParaAbono = index
    tipoFacturaAbono = tipo
  
    const modal = document.getElementById("modalAbonarPago")
    const titulo = document.getElementById("tituloModalAbonarPago")
    const idFacturaAbono = document.getElementById("idFacturaAbono")
    const tipoFacturaAbonoInput = document.getElementById("tipoFacturaAbono")
  
    if (tipo === "cobrar") {
      titulo.textContent = "Abonar Pago - Cuenta por Cobrar"
      const factura = cuentasCobrar[index]
  
      // Calcular saldo pendiente
      let saldoPendiente = factura.total
      if (factura.abonos && factura.abonos.length > 0) {
        const totalAbonos = factura.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = factura.total - totalAbonos
      }
  
      document.getElementById("montoAbono").max = saldoPendiente
      document.getElementById("montoAbono").placeholder = `Máximo: ${saldoPendiente.toFixed(2)}`
    } else {
      titulo.textContent = "Abonar Pago - Cuenta por Pagar"
      const compra = cuentasPagar[index]
  
      // Calcular saldo pendiente
      let saldoPendiente = compra.total
      if (compra.abonos && compra.abonos.length > 0) {
        const totalAbonos = compra.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = compra.total - totalAbonos
      }
  
      document.getElementById("montoAbono").max = saldoPendiente
      document.getElementById("montoAbono").placeholder = `Máximo: ${saldoPendiente.toFixed(2)}`
    }
  
    idFacturaAbono.value = index
    tipoFacturaAbonoInput.value = tipo
    modal.style.display = "block"
  }
  
  function guardarAbono() {
    const index = facturaSeleccionadaParaAbono
    const tipo = tipoFacturaAbono
    const monto = Number.parseFloat(document.getElementById("montoAbono").value)
    const metodoPago = document.getElementById("metodoPagoAbono").value
    const observaciones = document.getElementById("observacionesAbono").value
  
    if (isNaN(monto) || monto <= 0) {
      alert("Por favor, ingrese un monto válido")
      return
    }
  
    const fecha = new Date().toLocaleDateString()
    const abono = {
      fecha,
      monto,
      metodoPago,
      observaciones,
    }
  
    if (tipo === "cobrar") {
      const factura = cuentasCobrar[index]
  
      // Verificar que el monto no exceda el saldo pendiente
      let saldoPendiente = factura.total
      if (factura.abonos && factura.abonos.length > 0) {
        const totalAbonos = factura.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = factura.total - totalAbonos
      }
  
      if (monto > saldoPendiente) {
        alert(`El monto excede el saldo pendiente (${saldoPendiente.toFixed(2)})`)
        return
      }
  
      // Agregar el abono
      if (!factura.abonos) factura.abonos = []
      factura.abonos.push(abono)
  
      // Registrar ingreso
      ingresos.push({
        fecha,
        monto,
        descripcion: `Abono a factura - ${factura.cliente}`,
        etiqueta: "Abono",
      })
  
      // Actualizar capital
      if (metodoPago === "efectivo") {
        capital.efectivo += monto
      } else {
        capital.banco += monto
      }
  
      // Si el abono completa el pago, mover a facturas pagadas
      if (saldoPendiente - monto <= 0.01) {
        // Usar una pequeña tolerancia para evitar problemas de redondeo
        factura.pagada = true
        facturas.push(factura)
        cuentasCobrar.splice(index, 1)
        ganancias += factura.ganancia
      }
    } else {
      // Cuenta por pagar
      const compra = cuentasPagar[index]
  
      // Verificar que el monto no exceda el saldo pendiente
      let saldoPendiente = compra.total
      if (compra.abonos && compra.abonos.length > 0) {
        const totalAbonos = compra.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = compra.total - totalAbonos
      }
  
      if (monto > saldoPendiente) {
        alert(`El monto excede el saldo pendiente (${saldoPendiente.toFixed(2)})`)
        return
      }
  
      // Agregar el abono
      if (!compra.abonos) compra.abonos = []
      compra.abonos.push(abono)
  
      // Registrar gasto
      gastos.push({
        fecha,
        monto,
        descripcion: `Abono a compra - ${compra.proveedor}`,
        etiqueta: "Abono",
      })
  
      // Actualizar capital
      if (metodoPago === "efectivo") {
        capital.efectivo -= monto
      } else {
        capital.banco -= monto
      }
  
      // Si el abono completa el pago, mover a compras pagadas
      if (saldoPendiente - monto <= 0.01) {
        // Usar una pequeña tolerancia para evitar problemas de redondeo
        compra.pagada = true
        compras.push(compra)
        cuentasPagar.splice(index, 1)
      }
    }
  
    // Cerrar modal y actualizar
    document.getElementById("modalAbonarPago").style.display = "none"
    document.getElementById("formAbonarPago").reset()
  
    actualizarTablaCuentasCobrar()
    actualizarTablaCuentasPagar()
    actualizarCapital()
    actualizarGanancias()
    guardarEnLocalStorage()
  
    alert("Abono registrado correctamente")
  }
  
  function registrarPagoCuentaCobrar(index) {
    const factura = cuentasCobrar[index]
    facturas.push(factura)
    ganancias += factura.ganancia
    capital.efectivo += factura.total
    ingresos.push({
      fecha: new Date().toLocaleDateString(),
      monto: factura.total,
      descripcion: `Pago de factura a crédito - ${factura.cliente}`,
      etiqueta: "Venta",
    })
    cuentasCobrar.splice(index, 1)
    actualizarTablaFacturas()
    actualizarTablaCuentasCobrar()
    actualizarGanancias()
    actualizarCapital()
    guardarEnLocalStorage()
    alert("Pago registrado correctamente")
  }
  
  function verDetallesCuentaCobrar(index) {
    const factura = cuentasCobrar[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Detalles de Factura - ${factura.cliente}`
  
    // Calcular saldo pendiente
    let saldoPendiente = factura.total
    if (factura.abonos && factura.abonos.length > 0) {
      const totalAbonos = factura.abonos.reduce((sum, abono) => sum + abono.monto, 0)
      saldoPendiente = factura.total - totalAbonos
    }
  
    let html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información General</div>
        <p><strong>Cliente:</strong> ${factura.cliente}</p>
        <p><strong>Fecha:</strong> ${factura.fecha}</p>
        <p><strong>Total:</strong> ${factura.total.toFixed(2)}</p>
        <p><strong>Saldo Pendiente:</strong> ${saldoPendiente.toFixed(2)}</p>
      </div>
      
      <div class="detalle-grupo">
        <div class="detalle-titulo">Productos</div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
    `
  
    factura.productos.forEach((p) => {
      const subtotal = p.cantidad * p.precio
      html += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.cantidad}</td>
          <td>${p.precio.toFixed(2)}</td>
          <td>${subtotal.toFixed(2)}</td>
        </tr>
      `
    })
  
    html += `
          </tbody>
        </table>
      </div>
    `
  
    // Mostrar abonos si existen
    if (factura.abonos && factura.abonos.length > 0) {
      html += `
        <div class="detalle-grupo">
          <div class="detalle-titulo">Abonos Realizados</div>
          <div class="abonos-lista">
      `
  
      factura.abonos.forEach((abono) => {
        html += `
          <div class="abono-item">
            <div>
              <div class="abono-fecha">${abono.fecha}</div>
              <div>${abono.metodoPago} - ${abono.observaciones || "Sin observaciones"}</div>
            </div>
            <div class="abono-monto">${abono.monto.toFixed(2)}</div>
          </div>
        `
      })
  
      html += `
          </div>
        </div>
      `
    }
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  // Funciones para compras
  function inicializarCompras() {
    const buscarProductoCompra = document.getElementById("buscarProductoCompra")
    if (buscarProductoCompra) {
      buscarProductoCompra.addEventListener("input", (e) => {
        const busqueda = e.target.value.toLowerCase()
        const select = document.getElementById("productoCompraSeleccionado")
        if (!select) return
  
        select.innerHTML = ""
        inventario
          .filter((p) => p.nombre.toLowerCase().includes(busqueda) || p.codigo.toLowerCase().includes(busqueda))
          .forEach((p) => {
            const option = document.createElement("option")
            option.value = p.codigo
            option.textContent = `${p.nombre} - ${p.codigo}`
            select.appendChild(option)
          })
      })
    }
  
    const formCompra = document.getElementById("formCompra")
    if (formCompra) {
      formCompra.addEventListener("submit", (e) => {
        e.preventDefault()
        finalizarCompra()
      })
    }
  
    const fechaCompra = document.getElementById("fechaCompra")
    if (fechaCompra) {
      fechaCompra.value = new Date().toLocaleDateString()
    }
  
    // Configurar autocompletado para proveedores
    const proveedorCompraInput = document.getElementById("proveedorCompra")
    const sugerenciasProveedores = document.getElementById("sugerenciasProveedores")
  
    if (proveedorCompraInput && sugerenciasProveedores) {
      proveedorCompraInput.addEventListener("input", function () {
        const busqueda = this.value.toLowerCase()
  
        if (busqueda.length < 2) {
          sugerenciasProveedores.style.display = "none"
          return
        }
  
        const proveedoresFiltrados = proveedores.filter(
          (p) => p.nombre.toLowerCase().includes(busqueda) || (p.telefono && p.telefono.includes(busqueda)),
        )
  
        if (proveedoresFiltrados.length > 0) {
          sugerenciasProveedores.innerHTML = ""
          proveedoresFiltrados.forEach((proveedor) => {
            const div = document.createElement("div")
            div.className = "sugerencia-item"
            div.textContent = `${proveedor.nombre} - ${proveedor.telefono}`
            div.addEventListener("click", () => {
              proveedorCompraInput.value = proveedor.nombre
              sugerenciasProveedores.style.display = "none"
            })
            sugerenciasProveedores.appendChild(div)
          })
          sugerenciasProveedores.style.display = "block"
        } else {
          sugerenciasProveedores.style.display = "none"
        }
      })
  
      // Ocultar sugerencias al hacer clic fuera
      document.addEventListener("click", (e) => {
        if (e.target !== proveedorCompraInput && e.target !== sugerenciasProveedores) {
          sugerenciasProveedores.style.display = "none"
        }
      })
    }
  }
  
  function agregarProductoCompra() {
    const codigo = document.getElementById("productoCompraSeleccionado").value
    const cantidad = Number.parseInt(document.getElementById("cantidadCompra").value)
    const precio = Number.parseFloat(document.getElementById("precioCompraProducto").value)
    const producto = inventario.find((p) => p.codigo === codigo)
    if (producto && cantidad > 0 && !isNaN(precio)) {
      productosEnCompra.push({ ...producto, cantidad, precio })
      actualizarTablaCompra()
      document.getElementById("productoCompraSeleccionado").value = ""
      document.getElementById("cantidadCompra").value = ""
      document.getElementById("precioCompraProducto").value = ""
      document.getElementById("buscarProductoCompra").value = ""
    } else {
      alert("Por favor, ingrese datos válidos para el producto.")
    }
  }
  
  function actualizarTablaCompra() {
    const tbody = document.getElementById("cuerpoTablaCompra")
    if (!tbody) return
  
    tbody.innerHTML = ""
    let total = 0
    productosEnCompra.forEach((p, index) => {
      const subtotal = p.cantidad * p.precio
      total += subtotal
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td>${p.precio.toFixed(2)}</td>
        <td>${subtotal.toFixed(2)}</td>
        <td>
          <button onclick="eliminarProductoCompra(${index})" class="action-button">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
    document.getElementById("totalCompra").textContent = total.toFixed(2)
  }
  
  function eliminarProductoCompra(index) {
    productosEnCompra.splice(index, 1)
    actualizarTablaCompra()
  }
  
  function mostrarFormNuevoProducto() {
    document.getElementById("formNuevoProductoCompra").style.display = "block"
  }
  
  function agregarNuevoProductoCompra() {
    const nuevoProducto = {
      nombre: document.getElementById("nombreNuevoProducto").value,
      codigo: document.getElementById("codigoNuevoProducto").value,
      precioCompra: Number.parseFloat(document.getElementById("precioCompraNuevoProducto").value),
      precioVenta: Number.parseFloat(document.getElementById("precioVentaNuevoProducto").value),
      cantidad: Number.parseInt(document.getElementById("cantidadNuevoProducto").value),
      minimo: Number.parseInt(document.getElementById("cantidadMinimaNuevoProducto").value),
      etiqueta: document.getElementById("etiquetaNuevoProducto").value,
      ubicacion: document.getElementById("ubicacionNuevoProducto").value,
    }
  
    // Agregar el nuevo producto a productosEnCompra, pero no al inventario todavía
    productosEnCompra.push({ ...nuevoProducto, precio: nuevoProducto.precioCompra })
  
    actualizarTablaCompra()
  
    document.getElementById("formNuevoProductoCompra").style.display = "none"
    document.getElementById("formNuevoProductoCompra").reset()
    guardarEnLocalStorage()
  }
  
  // Corregir la función finalizarCompra para que las compras al contado no afecten a las ganancias
  function finalizarCompra() {
    const proveedor = document.getElementById("proveedorCompra").value.trim()
    const fecha = document.getElementById("fechaCompra").value
    const tipoCompra = document.getElementById("tipoCompra").value
    const total = Number.parseFloat(document.getElementById("totalCompra").textContent)
  
    if (proveedor === "") {
      alert("Por favor, ingrese el nombre del proveedor.")
      return
    }
  
    if (productosEnCompra.length === 0) {
      alert("No hay productos en la compra. Añada productos antes de finalizar.")
      return
    }
  
    const compra = {
      proveedor,
      fecha,
      total,
      productos: productosEnCompra,
      tipo: tipoCompra,
      abonos: [],
    }
  
    if (tipoCompra === "contado") {
      compras.push(compra)
      capital.efectivo -= total
      gastos.push({
        fecha,
        monto: total,
        descripcion: `Compra al contado - ${proveedor}`,
        etiqueta: "Compra",
      })
      // Las compras no afectan a las ganancias directamente, solo al capital
      // Eliminamos: ganancias -= total
    } else {
      cuentasPagar.push(compra)
    }
  
    // Registrar compra en el historial del proveedor
    registrarCompraEnProveedor(proveedor, compra)
  
    productosEnCompra.forEach((p) => {
      const productoInventario = inventario.find((inv) => inv.codigo === p.codigo)
      if (productoInventario) {
        productoInventario.cantidad += p.cantidad
        productoInventario.precioCompra = p.precio
      } else {
        // Este es un producto nuevo, lo agregamos al inventario
        inventario.push({
          nombre: p.nombre,
          codigo: p.codigo,
          precioCompra: p.precio,
          precioVenta: p.precioVenta || p.precio * 1.3, // Usamos precioVenta si está disponible, de lo contrario calculamos
          cantidad: p.cantidad,
          minimo: p.minimo || 5, // Usamos minimo si está disponible, de lo contrario usamos un valor por defecto
          etiqueta: p.etiqueta || "",
          ubicacion: p.ubicacion || "",
        })
      }
    })
  
    // Actualizamos capital.productos después de procesar todos los productos
    actualizarCapital()
  
    actualizarTablaCompras()
    actualizarTablaCuentasPagar()
    actualizarTablaInventario()
    actualizarGanancias() // Actualizar ganancias después de la compra
    guardarEnLocalStorage()
  
    productosEnCompra = []
    document.getElementById("formCompra").reset()
    document.getElementById("cuerpoTablaCompra").innerHTML = ""
    document.getElementById("totalCompra").textContent = "0"
    document.getElementById("fechaCompra").value = new Date().toLocaleDateString()
  
    alert("Compra registrada correctamente")
  }
  
  function registrarCompraEnProveedor(nombreProveedor, compra) {
    // Buscar el proveedor por nombre
    const proveedorIndex = proveedores.findIndex((p) => p.nombre.toLowerCase() === nombreProveedor.toLowerCase())
  
    if (proveedorIndex !== -1) {
      // Si el proveedor existe, agregar la compra a su historial
      if (!proveedores[proveedorIndex].historial) {
        proveedores[proveedorIndex].historial = []
      }
  
      proveedores[proveedorIndex].historial.push({
        tipo: "compra",
        fecha: compra.fecha,
        total: compra.total,
        productos: compra.productos.map((p) => ({
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio,
        })),
        tipoCompra: compra.tipo,
      })
  
      guardarEnLocalStorage()
    }
  }
  
  function actualizarTablaCompras() {
    const tbody = document.getElementById("cuerpoTablaCompras")
    if (!tbody) return
  
    tbody.innerHTML = ""
    compras.forEach((c, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${c.fecha}</td>
        <td>${c.proveedor}</td>
        <td>${c.total.toFixed(2)}</td>
        <td>
          <button onclick="verDetallesCompra(${index})" class="action-button">
            <i class="fas fa-info-circle"></i> Ver Detalles
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function verDetallesCompra(index) {
    const compra = compras[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Detalles de Compra - ${compra.proveedor}`
  
    let html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información General</div>
        <p><strong>Proveedor:</strong> ${compra.proveedor}</p>
        <p><strong>Fecha:</strong> ${compra.fecha}</p>
        <p><strong>Total:</strong> ${compra.total.toFixed(2)}</p>
      </div>
      
      <div class="detalle-grupo">
        <div class="detalle-titulo">Productos</div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
    `
  
    compra.productos.forEach((p) => {
      const subtotal = p.cantidad * p.precio
      html += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.cantidad}</td>
          <td>${p.precio.toFixed(2)}</td>
          <td>${subtotal.toFixed(2)}</td>
        </tr>
      `
    })
  
    html += `
          </tbody>
        </table>
      </div>
    `
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  function verDetallesCuentaPagar(index) {
    const compra = cuentasPagar[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Detalles de Compra a Crédito - ${compra.proveedor}`
  
    // Calcular saldo pendiente
    let saldoPendiente = compra.total
    if (compra.abonos && compra.abonos.length > 0) {
      const totalAbonos = compra.abonos.reduce((sum, abono) => sum + abono.monto, 0)
      saldoPendiente = compra.total - totalAbonos
    }
  
    let html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información General</div>
        <p><strong>Proveedor:</strong> ${compra.proveedor}</p>
        <p><strong>Fecha:</strong> ${compra.fecha}</p>
        <p><strong>Total:</strong> ${compra.total.toFixed(2)}</p>
        <p><strong>Saldo Pendiente:</strong> ${saldoPendiente.toFixed(2)}</p>
      </div>
      
      <div class="detalle-grupo">
        <div class="detalle-titulo">Productos</div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
    `
  
    compra.productos.forEach((p) => {
      const subtotal = p.cantidad * p.precio
      html += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.cantidad}</td>
          <td>${p.precio.toFixed(2)}</td>
          <td>${subtotal.toFixed(2)}</td>
        </tr>
      `
    })
  
    html += `
          </tbody>
        </table>
      </div>
    `
  
    // Mostrar abonos si existen
    if (compra.abonos && compra.abonos.length > 0) {
      html += `
        <div class="detalle-grupo">
          <div class="detalle-titulo">Abonos Realizados</div>
          <div class="abonos-lista">
      `
  
      compra.abonos.forEach((abono) => {
        html += `
          <div class="abono-item">
            <div>
              <div class="abono-fecha">${abono.fecha}</div>
              <div>${abono.metodoPago} - ${abono.observaciones || "Sin observaciones"}</div>
            </div>
            <div class="abono-monto">${abono.monto.toFixed(2)}</div>
          </div>
        `
      })
  
      html += `
          </div>
        </div>
      `
    }
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  // Funciones para capital
  function inicializarCapital() {
    const formCapital = document.getElementById("formCapital")
    if (formCapital) {
      formCapital.addEventListener("submit", function (e) {
        e.preventDefault()
        const monto = Number.parseFloat(document.getElementById("montoCapital").value)
        const descripcion = document.getElementById("descripcionCapital").value
        capital.efectivo += monto
        actualizarCapital()
        alert(`Se ha añadido ${monto.toFixed(2)} al capital. Descripción: ${descripcion}`)
        this.reset()
        guardarEnLocalStorage()
      })
    }
  
    const btnAnadirBanco = document.getElementById("btnAnadirBanco")
    if (btnAnadirBanco) {
      btnAnadirBanco.addEventListener("click", () => {
        const monto = Number.parseFloat(document.getElementById("montoBanco").value)
        if (isNaN(monto) || monto <= 0) {
          alert("Por favor, ingrese un monto válido.")
          return
        }
        capital.banco += monto
        actualizarCapital()
        alert(`Se han añadido ${monto.toFixed(2)} al capital en banco.`)
        document.getElementById("montoBanco").value = ""
        guardarEnLocalStorage()
      })
    }
  }
  
  function anadirGananciasCapital() {
    const monto = Number.parseFloat(document.getElementById("montoGananciasCapital").value)
    if (isNaN(monto) || monto <= 0) {
      alert("Por favor, ingrese un monto válido.")
      return
    }
    if (monto > ganancias) {
      alert("No puedes añadir más de las ganancias actuales al capital.")
      return
    }
    capital.efectivo += monto
    ganancias -= monto
    actualizarCapital()
    actualizarGanancias()
    alert(`Se han añadido ${monto.toFixed(2)} de las ganancias al capital.`)
    document.getElementById("montoGananciasCapital").value = ""
    guardarEnLocalStorage()
  }
  
  function restarCapital() {
    const monto = Number.parseFloat(document.getElementById("montoRestarCapital").value)
    if (isNaN(monto) || monto <= 0) {
      alert("Por favor, ingrese un monto válido.")
      return
    }
    if (monto > capital.efectivo) {
      alert("No puedes restar más del capital en efectivo actual.")
      return
    }
    capital.efectivo -= monto
    actualizarCapital()
    alert(`Se han restado ${monto.toFixed(2)} del capital.`)
    document.getElementById("montoRestarCapital").value = ""
    guardarEnLocalStorage()
  }
  
  // Funciones para ingresos/gastos
  function buscarGananciasPorFecha() {
    const fechaInicioInput = document.getElementById("fechaInicioGanancias")
    const fechaFinInput = document.getElementById("fechaFinGanancias")
  
    if (!fechaInicioInput.value || !fechaFinInput.value) {
      alert("Por favor, seleccione ambas fechas (inicio y fin)")
      return
    }
  
    const fechaInicio = new Date(fechaInicioInput.value)
    const fechaFin = new Date(fechaFinInput.value)
  
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      alert("Por favor, seleccione fechas válidas")
      return
    }
  
    // Ajustar la fecha fin al final del día
    fechaFin.setHours(23, 59, 59, 999)
  
    let totalIngresos = 0
    let totalGastos = 0
    let gananciasEnPeriodo = 0
  
    // Sumar ganancias de facturas
    facturas.forEach((f) => {
      const fechaFactura = new Date(f.fecha)
      if (fechaFactura >= fechaInicio && fechaFactura <= fechaFin) {
        gananciasEnPeriodo += f.ganancia
        totalIngresos += f.total
      }
    })
  
    // Sumar ingresos
    ingresos.forEach((i) => {
      const fechaIngreso = new Date(i.fecha)
      if (fechaIngreso >= fechaInicio && fechaIngreso <= fechaFin) {
        gananciasEnPeriodo += i.monto
        totalIngresos += i.monto
      }
    })
  
    // Restar gastos
    gastos.forEach((g) => {
      const fechaGasto = new Date(g.fecha)
      if (fechaGasto >= fechaInicio && fechaGasto <= fechaFin) {
        gananciasEnPeriodo -= g.monto
        totalGastos += g.monto
      }
    })
  
    const gananciasEnPeriodoElement = document.getElementById("gananciasEnPeriodo")
    if (gananciasEnPeriodoElement) {
      // Crear un resumen detallado
      const resumen = `
        <div class="form-group">
          <p><strong>Total Ingresos:</strong> ${totalIngresos.toFixed(2)}</p>
          <p><strong>Total Gastos:</strong> ${totalGastos.toFixed(2)}</p>
          <p><strong>Balance Neto:</strong> ${gananciasEnPeriodo.toFixed(2)}</p>
        </div>
      `
  
      gananciasEnPeriodoElement.innerHTML = resumen
    }
  }
  
  // Funciones para clientes y proveedores
  function cambiarTab(tabId) {
    // Ocultar todos los contenidos de pestañas
    document.querySelectorAll(".tab-content").forEach((tab) => {
      tab.classList.remove("active")
    })
  
    // Desactivar todos los botones de pestañas
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.remove("active")
    })
  
    // Mostrar el contenido de la pestaña seleccionada
    document.getElementById(tabId).classList.add("active")
  
    // Activar el botón de la pestaña seleccionada
    const button = document.querySelector(`[onclick="cambiarTab('${tabId}')"]`)
    if (button) {
      button.classList.add("active")
    }
  }
  
  function inicializarClientesProveedores() {
    // Inicializar pestañas
    const tabButtons = document.querySelectorAll(".tab-button")
    if (tabButtons) {
      tabButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const tabId = this.getAttribute("onclick").match(/'([^']+)'/)[1]
          cambiarTab(tabId)
        })
      })
    }
  
    // Inicializar formulario de clientes
    const btnAgregarCliente = document.getElementById("btnAgregarCliente")
    if (btnAgregarCliente) {
      btnAgregarCliente.addEventListener("click", () => {
        document.getElementById("formCliente").style.display = "block"
      })
    }
  
    const formCliente = document.getElementById("formCliente")
    if (formCliente) {
      formCliente.addEventListener("submit", function (e) {
        e.preventDefault()
  
        // Generar código automático para el cliente
        let ultimoCodigo = 0
        if (clientes.length > 0) {
          // Buscar el último código numérico
          clientes.forEach((cliente) => {
            if (cliente.codigo) {
              const codigoNum = Number.parseInt(cliente.codigo, 10)
              if (!isNaN(codigoNum) && codigoNum > ultimoCodigo) {
                ultimoCodigo = codigoNum
              }
            }
          })
        }
        // Incrementar el código y formatearlo con ceros a la izquierda
        const nuevoCodigo = String(ultimoCodigo + 1).padStart(4, "0")
  
        const cliente = {
          codigo: nuevoCodigo,
          nombre: document.getElementById("nombreCliente").value,
          cedula: document.getElementById("cedulaCliente").value,
          telefono: document.getElementById("telefonoCliente").value,
          direccion: document.getElementById("direccionCliente").value,
          correo: document.getElementById("correoCliente").value,
          historial: [],
        }
  
        clientes.push(cliente)
        actualizarTablaClientes()
        this.reset()
        this.style.display = "none"
        guardarEnLocalStorage()
        alert("Cliente agregado correctamente con código: " + nuevoCodigo)
      })
    }
  
    // Inicializar formulario de proveedores
    const btnAgregarProveedor = document.getElementById("btnAgregarProveedor")
    if (btnAgregarProveedor) {
      btnAgregarProveedor.addEventListener("click", () => {
        document.getElementById("formProveedor").style.display = "block"
      })
    }
  
    const formProveedor = document.getElementById("formProveedor")
    if (formProveedor) {
      formProveedor.addEventListener("submit", function (e) {
        e.preventDefault()
  
        // Generar código automático para el proveedor
        let ultimoCodigo = 0
        if (proveedores.length > 0) {
          // Buscar el último código numérico
          proveedores.forEach((proveedor) => {
            if (proveedor.codigo) {
              const codigoNum = Number.parseInt(proveedor.codigo, 10)
              if (!isNaN(codigoNum) && codigoNum > ultimoCodigo) {
                ultimoCodigo = codigoNum
              }
            }
          })
        }
        // Incrementar el código y formatearlo con ceros a la izquierda
        const nuevoCodigo = String(ultimoCodigo + 1).padStart(4, "0")
  
        const proveedor = {
          codigo: nuevoCodigo,
          nombre: document.getElementById("nombreProveedor").value,
          telefono: document.getElementById("telefonoProveedor").value,
          direccion: document.getElementById("direccionProveedor").value,
          contacto: document.getElementById("contactoProveedor").value,
          historial: [],
        }
  
        proveedores.push(proveedor)
        actualizarTablaProveedores()
        this.reset()
        this.style.display = "none"
        guardarEnLocalStorage()
        alert("Proveedor agregado correctamente con código: " + nuevoCodigo)
      })
    }
  
    // Inicializar búsqueda de clientes
    const buscarCliente = document.getElementById("buscarCliente")
    if (buscarCliente) {
      buscarCliente.addEventListener("input", function () {
        const busqueda = this.value.toLowerCase()
        const clientesFiltrados = clientes.filter(
          (c) =>
            c.nombre.toLowerCase().includes(busqueda) ||
            c.cedula.toLowerCase().includes(busqueda) ||
            (c.telefono && c.telefono.toLowerCase().includes(busqueda)) ||
            (c.codigo && c.codigo.toLowerCase().includes(busqueda)),
        )
        actualizarTablaClientes(clientesFiltrados)
      })
    }
  
    // Inicializar búsqueda de proveedores
    const buscarProveedor = document.getElementById("buscarProveedor")
    if (buscarProveedor) {
      buscarProveedor.addEventListener("input", function () {
        const busqueda = this.value.toLowerCase()
        const proveedoresFiltrados = proveedores.filter(
          (p) =>
            p.nombre.toLowerCase().includes(busqueda) ||
            (p.telefono && p.telefono.toLowerCase().includes(busqueda)) ||
            (p.codigo && p.codigo.toLowerCase().includes(busqueda)),
        )
        actualizarTablaProveedores(proveedoresFiltrados)
      })
    }
  
    actualizarTablaClientes()
    actualizarTablaProveedores()
  }
  
  function actualizarTablaClientes(clientesFiltrados = clientes) {
    const tbody = document.getElementById("cuerpoTablaClientes")
    if (!tbody) return
  
    tbody.innerHTML = ""
    clientesFiltrados.forEach((cliente, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${cliente.codigo || "N/A"}</td>
        <td>${cliente.nombre}</td>
        <td>${cliente.cedula}</td>
        <td>${cliente.telefono}</td>
        <td>${cliente.direccion || "N/A"}</td>
        <td>${cliente.correo || "N/A"}</td>
        <td>
          <button onclick="editarCliente(${index})" class="action-button">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button onclick="verHistorialCliente(${index})" class="action-button">
            <i class="fas fa-history"></i> Historial
          </button>
          <button onclick="eliminarCliente(${index})" class="action-button">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function actualizarTablaProveedores(proveedoresFiltrados = proveedores) {
    const tbody = document.getElementById("cuerpoTablaProveedores")
    if (!tbody) return
  
    tbody.innerHTML = ""
    proveedoresFiltrados.forEach((proveedor, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${proveedor.codigo || "N/A"}</td>
        <td>${proveedor.nombre}</td>
        <td>${proveedor.telefono}</td>
        <td>${proveedor.direccion}</td>
        <td>${proveedor.contacto || "N/A"}</td>
        <td>
          <button onclick="editarProveedor(${index})" class="action-button">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button onclick="verHistorialProveedor(${index})" class="action-button">
            <i class="fas fa-history"></i> Historial
          </button>
          <button onclick="eliminarProveedor(${index})" class="action-button">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function editarCliente(index) {
    const cliente = clientes[index]
  
    document.getElementById("nombreCliente").value = cliente.nombre
    document.getElementById("cedulaCliente").value = cliente.cedula
    document.getElementById("telefonoCliente").value = cliente.telefono
    document.getElementById("direccionCliente").value = cliente.direccion || ""
    document.getElementById("correoCliente").value = cliente.correo || ""
  
    const formCliente = document.getElementById("formCliente")
    const btnGuardarCliente = document.getElementById("btnGuardarCliente")
  
    formCliente.style.display = "block"
    btnGuardarCliente.textContent = "Guardar Cambios"
  
    // Modificar el evento submit para actualizar en lugar de agregar
    formCliente.onsubmit = function (e) {
      e.preventDefault()
  
      clientes[index] = {
        codigo: cliente.codigo, // Mantener el código original
        nombre: document.getElementById("nombreCliente").value,
        cedula: document.getElementById("cedulaCliente").value,
        telefono: document.getElementById("telefonoCliente").value,
        direccion: document.getElementById("direccionCliente").value,
        correo: document.getElementById("correoCliente").value,
        historial: cliente.historial || [],
      }
  
      actualizarTablaClientes()
      this.reset()
      this.style.display = "none"
      guardarEnLocalStorage()
      alert("Cliente actualizado correctamente")
  
      // Restaurar el evento submit original
      this.onsubmit = null
      btnGuardarCliente.textContent = "Agregar Cliente"
      formCliente.addEventListener("submit", function (e) {
        e.preventDefault()
  
        // Generar código automático para el cliente
        let ultimoCodigo = 0
        if (clientes.length > 0) {
          // Buscar el último código numérico
          clientes.forEach((cliente) => {
            if (cliente.codigo) {
              const codigoNum = Number.parseInt(cliente.codigo, 10)
              if (!isNaN(codigoNum) && codigoNum > ultimoCodigo) {
                ultimoCodigo = codigoNum
              }
            }
          })
        }
        // Incrementar el código y formatearlo con ceros a la izquierda
        const nuevoCodigo = String(ultimoCodigo + 1).padStart(4, "0")
  
        const nuevoCliente = {
          codigo: nuevoCodigo,
          nombre: document.getElementById("nombreCliente").value,
          cedula: document.getElementById("cedulaCliente").value,
          telefono: document.getElementById("telefonoCliente").value,
          direccion: document.getElementById("direccionCliente").value,
          correo: document.getElementById("correoCliente").value,
          historial: [],
        }
  
        clientes.push(nuevoCliente)
        actualizarTablaClientes()
        this.reset()
        this.style.display = "none"
        guardarEnLocalStorage()
        alert("Cliente agregado correctamente con código: " + nuevoCodigo)
      })
    }
  }
  
  function editarProveedor(index) {
    const proveedor = proveedores[index]
  
    document.getElementById("nombreProveedor").value = proveedor.nombre
    document.getElementById("telefonoProveedor").value = proveedor.telefono
    document.getElementById("direccionProveedor").value = proveedor.direccion
    document.getElementById("contactoProveedor").value = proveedor.contacto || ""
  
    const formProveedor = document.getElementById("formProveedor")
    const btnGuardarProveedor = document.getElementById("btnGuardarProveedor")
  
    formProveedor.style.display = "block"
    btnGuardarProveedor.textContent = "Guardar Cambios"
  
    // Modificar el evento submit para actualizar en lugar de agregar
    formProveedor.onsubmit = function (e) {
      e.preventDefault()
  
      proveedores[index] = {
        codigo: proveedor.codigo, // Mantener el código original
        nombre: document.getElementById("nombreProveedor").value,
        telefono: document.getElementById("telefonoProveedor").value,
        direccion: document.getElementById("direccionProveedor").value,
        contacto: document.getElementById("contactoProveedor").value,
        historial: proveedor.historial || [],
      }
  
      actualizarTablaProveedores()
      this.reset()
      this.style.display = "none"
      guardarEnLocalStorage()
      alert("Proveedor actualizado correctamente")
  
      // Restaurar el evento submit original
      this.onsubmit = null
      btnGuardarProveedor.textContent = "Agregar Proveedor"
      formProveedor.addEventListener("submit", function (e) {
        e.preventDefault()
  
        // Generar código automático para el proveedor
        let ultimoCodigo = 0
        if (proveedores.length > 0) {
          // Buscar el último código numérico
          proveedores.forEach((proveedor) => {
            if (proveedor.codigo) {
              const codigoNum = Number.parseInt(proveedor.codigo, 10)
              if (!isNaN(codigoNum) && codigoNum > ultimoCodigo) {
                ultimoCodigo = codigoNum
              }
            }
          })
        }
        // Incrementar el código y formatearlo con ceros a la izquierda
        const nuevoCodigo = String(ultimoCodigo + 1).padStart(4, "0")
  
        const nuevoProveedor = {
          codigo: nuevoCodigo,
          nombre: document.getElementById("nombreProveedor").value,
          telefono: document.getElementById("telefonoProveedor").value,
          direccion: document.getElementById("direccionProveedor").value,
          contacto: document.getElementById("contactoProveedor").value,
          historial: [],
        }
  
        proveedores.push(nuevoProveedor)
        actualizarTablaProveedores()
        this.reset()
        this.style.display = "none"
        guardarEnLocalStorage()
        alert("Proveedor agregado correctamente con código: " + nuevoCodigo)
      })
    }
  }
  
  function mostrarReparacionesParaFacturar() {
    const modal = document.getElementById("modalReparaciones")
    const tbody = document.getElementById("cuerpoTablaReparacionesFacturar")
  
    if (!modal || !tbody) return
  
    tbody.innerHTML = ""
  
    reparacionesTerminadas.forEach((reparacion, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${reparacion.cliente}</td>
        <td>${reparacion.equipo}</td>
        <td>${reparacion.detalles}</td>
        <td>
          <div class="precio-editable">
            <input type="number" value="${reparacion.precio.toFixed(2)}" step="0.01" id="precio-reparacion-${index}" class="form-control">
          </div>
        </td>
        <td>
          <button onclick="seleccionarReparacionParaFacturar(${index})" class="action-button">
            <i class="fas fa-check"></i> Seleccionar
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  
    modal.style.display = "block"
  }
  
  function seleccionarReparacionParaFacturar(index) {
    const reparacion = reparacionesTerminadas[index]
    document.getElementById("clienteFactura").value = reparacion.cliente
  
    // Obtener el precio editado si existe
    const precioInput = document.getElementById(`precio-reparacion-${index}`)
    const precioEditado = precioInput ? Number.parseFloat(precioInput.value) : reparacion.precio
  
    // Crear un producto virtual para la reparación
    const productoReparacion = {
      nombre: `Reparación - ${reparacion.equipo}`,
      codigo: `REP-${Date.now()}`,
      precioCompra: 0,
      precioVenta: precioEditado,
      precio: precioEditado, // Añadir el precio para que se muestre correctamente en la factura
      cantidad: 1,
      detalles: reparacion.detalles,
    }
  
    productosEnFactura.push(productoReparacion)
    actualizarTablaFactura()
  
    // Eliminar de reparaciones terminadas
    reparacionesTerminadas.splice(index, 1)
    actualizarTablaReparacionesTerminadas()
  
    // Cerrar el modal
    document.getElementById("modalReparaciones").style.display = "none"
    guardarEnLocalStorage()
  }
  
  // Modificar la función actualizarTablaRegistros para añadir el botón de reimprimir en la sección de facturas
  function actualizarTablaRegistros() {
    const tbody = document.getElementById("cuerpoTablaRegistros")
    const tipoRegistro = document.getElementById("tipoRegistro").value
    const busqueda = document.getElementById("buscarRegistro").value.toLowerCase()
  
    if (!tbody) return
  
    tbody.innerHTML = ""
    let registros = []
  
    switch (tipoRegistro) {
      case "facturas":
        registros = facturas
        tbody.parentElement.querySelector("thead").innerHTML = `
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Ganancia</th>
            <th>Tipo</th>
            <th>Método de Pago</th>
            <th>Acciones</th>
          </tr>
        `
        registros.forEach((f, index) => {
          if (f.cliente.toLowerCase().includes(busqueda)) {
            const tr = document.createElement("tr")
            tr.innerHTML = `
              <td>${f.fecha}</td>
              <td>${f.cliente}</td>
              <td>${f.total.toFixed(2)}</td>
              <td>${f.ganancia.toFixed(2)}</td>
              <td>${f.tipo}</td>
              <td>${f.metodoPago || "N/A"}</td>
              <td>
                <button onclick="verDetallesFactura(${index})" class="action-button">
                  <i class="fas fa-info-circle"></i> Ver Detalles
                </button>
                <button onclick="reimprimirFactura(${index})" class="action-button">
                  <i class="fas fa-print"></i> Reimprimir
                </button>
              </td>
            `
            tbody.appendChild(tr)
          }
        })
        break
  
      // El resto del código permanece igual
      case "ingresos":
        registros = ingresos
        tbody.parentElement.querySelector("thead").innerHTML = `
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Etiqueta</th>
            <th>Acciones</th>
          </tr>
        `
        registros.forEach((i, index) => {
          if (i.descripcion.toLowerCase().includes(busqueda)) {
            const tr = document.createElement("tr")
            tr.innerHTML = `
              <td>${i.fecha}</td>
              <td>${i.descripcion}</td>
              <td>${i.monto.toFixed(2)}</td>
              <td>${i.etiqueta || "N/A"}</td>
              <td>
                <button onclick="verDetallesIngreso(${index})" class="action-button">
                  <i class="fas fa-info-circle"></i> Ver Detalles
                </button>
              </td>
            `
            tbody.appendChild(tr)
          }
        })
        break
  
      case "gastos":
        registros = gastos
        tbody.parentElement.querySelector("thead").innerHTML = `
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Etiqueta</th>
            <th>Acciones</th>
          </tr>
        `
        registros.forEach((g, index) => {
          if (g.descripcion.toLowerCase().includes(busqueda)) {
            const tr = document.createElement("tr")
            tr.innerHTML = `
              <td>${g.fecha}</td>
              <td>${g.descripcion}</td>
              <td>${g.monto.toFixed(2)}</td>
              <td>${g.etiqueta || "N/A"}</td>
              <td>
                <button onclick="verDetallesGasto(${index})" class="action-button">
                  <i class="fas fa-info-circle"></i> Ver Detalles
                </button>
              </td>
            `
            tbody.appendChild(tr)
          }
        })
        break
  
      case "compras":
        registros = compras
        tbody.parentElement.querySelector("thead").innerHTML = `
          <tr>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Total</th>
            <th>Tipo</th>
            <th>Acciones</th>
          </tr>
        `
        registros.forEach((c, index) => {
          if (c.proveedor.toLowerCase().includes(busqueda)) {
            const tr = document.createElement("tr")
            tr.innerHTML = `
              <td>${c.fecha}</td>
              <td>${c.proveedor}</td>
              <td>${c.total.toFixed(2)}</td>
              <td>${c.tipo}</td>
              <td>
                <button onclick="verDetallesCompra(${index})" class="action-button">
                  <i class="fas fa-info-circle"></i> Ver Detalles
                </button>
              </td>
            `
            tbody.appendChild(tr)
          }
        })
        break
    }
  }
  
  function verDetallesFactura(index) {
    const factura = facturas[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Detalles de Factura - ${factura.cliente}`
  
    let html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información General</div>
        <p><strong>Cliente:</strong> ${factura.cliente}</p>
        <p><strong>Fecha:</strong> ${factura.fecha}</p>
        <p><strong>Total:</strong> ${factura.total.toFixed(2)}</p>
        <p><strong>Ganancia:</strong> ${factura.ganancia.toFixed(2)}</p>
        <p><strong>Tipo:</strong> ${factura.tipo}</p>
      </div>
      
      <div class="detalle-grupo">
        <div class="detalle-titulo">Productos</div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
    `
  
    factura.productos.forEach((p) => {
      const subtotal = p.cantidad * p.precio
      html += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.cantidad}</td>
          <td>${p.precio.toFixed(2)}</td>
          <td>${subtotal.toFixed(2)}</td>
        </tr>
      `
    })
  
    html += `
          </tbody>
        </table>
      </div>
    `
  
    // Mostrar abonos si existen
    if (factura.abonos && factura.abonos.length > 0) {
      html += `
        <div class="detalle-grupo">
          <div class="detalle-titulo">Abonos Realizados</div>
          <div class="abonos-lista">
      `
  
      factura.abonos.forEach((abono) => {
        html += `
          <div class="abono-item">
            <div>
              <div class="abono-fecha">${abono.fecha}</div>
              <div>${abono.metodoPago} - ${abono.observaciones || "Sin observaciones"}</div>
            </div>
            <div class="abono-monto">${abono.monto.toFixed(2)}</div>
          </div>
        `
      })
  
      html += `
          </div>
        </div>
      `
    }
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  function verDetallesIngreso(index) {
    const ingreso = ingresos[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Detalles de Ingreso`
  
    const html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información del Ingreso</div>
        <p><strong>Fecha:</strong> ${ingreso.fecha}</p>
        <p><strong>Descripción:</strong> ${ingreso.descripcion}</p>
        <p><strong>Monto:</strong> ${ingreso.monto.toFixed(2)}</p>
        <p><strong>Etiqueta:</strong> ${ingreso.etiqueta || "N/A"}</p>
      </div>
    `
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  function verDetallesGasto(index) {
    const gasto = gastos[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Detalles de Gasto`
  
    const html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información del Gasto</div>
        <p><strong>Fecha:</strong> ${gasto.fecha}</p>
        <p><strong>Descripción:</strong> ${gasto.descripcion}</p>
        <p><strong>Monto:</strong> ${gasto.monto.toFixed(2)}</p>
        <p><strong>Etiqueta:</strong> ${gasto.etiqueta || "N/A"}</p>
      </div>
    `
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  function verHistorialCliente(index) {
    const cliente = clientes[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Historial del Cliente - ${cliente.nombre}`
  
    if (!cliente.historial || cliente.historial.length === 0) {
      contenido.innerHTML = `
        <div class="detalle-grupo">
          <p>Este cliente no tiene historial de compras.</p>
        </div>
      `
      modal.style.display = "block"
      return
    }
  
    let html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información del Cliente</div>
        <p><strong>Código:</strong> ${cliente.codigo || "N/A"}</p>
        <p><strong>Nombre:</strong> ${cliente.nombre}</p>
        <p><strong>Cédula:</strong> ${cliente.cedula}</p>
        <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
        <p><strong>Dirección:</strong> ${cliente.direccion || "N/A"}</p>
        <p><strong>Correo:</strong> ${cliente.correo || "N/A"}</p>
      </div>
      
      <div class="detalle-grupo">
        <div class="detalle-titulo">Historial de Compras</div>
    `
  
    cliente.historial.forEach((item, i) => {
      html += `
        <div class="historial-item">
          <div class="historial-fecha">${item.fecha}</div>
          <p><strong>Tipo:</strong> ${item.tipo === "venta" ? "Venta" : "Otro"}</p>
          <p><strong>Total:</strong> ${item.total.toFixed(2)}</p>
          <p><strong>Tipo de Factura:</strong> ${item.tipoFactura === "contado" ? "Contado" : "Crédito"}</p>
          
          <div class="detalle-titulo">Productos</div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
      `
  
      item.productos.forEach((p) => {
        const subtotal = p.cantidad * p.precio
        html += `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>${p.precio.toFixed(2)}</td>
            <td>${subtotal.toFixed(2)}</td>
          </tr>
        `
      })
  
      html += `
            </tbody>
          </table>
        </div>
      `
    })
  
    html += `
      </div>
    `
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  function verHistorialProveedor(index) {
    const proveedor = proveedores[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Historial del Proveedor - ${proveedor.nombre}`
  
    if (!proveedor.historial || proveedor.historial.length === 0) {
      contenido.innerHTML = `
        <div class="detalle-grupo">
          <p>Este proveedor no tiene historial de compras.</p>
        </div>
      `
      modal.style.display = "block"
      return
    }
  
    let html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información del Proveedor</div>
        <p><strong>Código:</strong> ${proveedor.codigo || "N/A"}</p>
        <p><strong>Nombre:</strong> ${proveedor.nombre}</p>
        <p><strong>Teléfono:</strong> ${proveedor.telefono}</p>
        <p><strong>Dirección:</strong> ${proveedor.direccion}</p>
        <p><strong>Contacto:</strong> ${proveedor.contacto || "N/A"}</p>
      </div>
      
      <div class="detalle-grupo">
        <div class="detalle-titulo">Historial de Compras</div>
    `
  
    proveedor.historial.forEach((item, i) => {
      html += `
        <div class="historial-item">
          <div class="historial-fecha">${item.fecha}</div>
          <p><strong>Tipo:</strong> ${item.tipo === "compra" ? "Compra" : "Otro"}</p>
          <p><strong>Total:</strong> ${item.total.toFixed(2)}</p>
          <p><strong>Tipo de Compra:</strong> ${item.tipoCompra === "contado" ? "Contado" : "Crédito"}</p>
          
          <div class="detalle-titulo">Productos</div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
      `
  
      item.productos.forEach((p) => {
        const subtotal = p.cantidad * p.precio
        html += `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>${p.precio.toFixed(2)}</td>
            <td>${subtotal.toFixed(2)}</td>
          </tr>
        `
      })
  
      html += `
            </tbody>
          </table>
        </div>
      `
    })
  
    html += `
      </div>
    `
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  function eliminarCliente(index) {
    if (confirm("¿Está seguro de que desea eliminar este cliente?")) {
      clientes.splice(index, 1)
      actualizarTablaClientes()
      guardarEnLocalStorage()
      alert("Cliente eliminado correctamente")
    }
  }
  
  function eliminarProveedor(index) {
    if (confirm("¿Está seguro de que desea eliminar este proveedor?")) {
      proveedores.splice(index, 1)
      actualizarTablaProveedores()
      guardarEnLocalStorage()
      alert("Proveedor eliminado correctamente")
    }
  }
  
  // Asegurarse de que las nuevas funciones estén disponibles globalmente
  window.verDetallesFactura = verDetallesFactura
  window.verDetallesIngreso = verDetallesIngreso
  window.verDetallesGasto = verDetallesGasto
  window.verHistorialCliente = verHistorialCliente
  window.verHistorialProveedor = verHistorialProveedor
  window.eliminarCliente = eliminarCliente
  window.eliminarProveedor = eliminarProveedor
  
  // Agregar el LocalStorage
  function guardarEnLocalStorage() {
    const datos = {
      inventario,
      facturas,
      compras,
      cuentasCobrar,
      cuentasPagar,
      ingresos,
      gastos,
      reparaciones,
      reparacionesEnProceso,
      reparacionesTerminadas,
      clientes,
      proveedores,
      capital,
      ganancias,
    }
    localStorage.setItem("tiendaCelulares", JSON.stringify(datos))
  }
  
  function cargarDesdeLocalStorage() {
    const datos = JSON.parse(localStorage.getItem("tiendaCelulares"))
    if (datos) {
      inventario.length = 0
      inventario.push(...datos.inventario)
      facturas.length = 0
      facturas.push(...datos.facturas)
      compras.length = 0
      compras.push(...datos.compras)
      cuentasCobrar.length = 0
      cuentasCobrar.push(...datos.cuentasCobrar)
      cuentasPagar.length = 0
      cuentasPagar.push(...datos.cuentasPagar)
      ingresos.length = 0
      ingresos.push(...datos.ingresos)
      gastos.length = 0
      gastos.push(...datos.gastos)
      reparaciones.length = 0
      reparaciones.push(...datos.reparaciones)
      reparacionesEnProceso.length = 0
      reparacionesEnProceso.push(...datos.reparacionesEnProceso)
      reparacionesTerminadas.length = 0
      reparacionesTerminadas.push(...datos.reparacionesTerminadas)
      clientes.length = 0
      clientes.push(...datos.clientes)
      proveedores.length = 0
      proveedores.push(...datos.proveedores)
      Object.assign(capital, datos.capital)
      ganancias = datos.ganancias
    }
  }
  
  // Modificar la función iniciarSesion para guardar correctamente el nombre del usuario
  function iniciarSesion(usuario, tipo, nombreCompleto) {
    usuarioActual.nombre = nombreCompleto || usuario
    usuarioActual.tipo = tipo
    // Guardar en localStorage para mantener la sesión
    localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual))
    // Resto de tu código de inicio de sesión...
  }
  
  // Añadir función para reimprimir facturas desde los registros
  function reimprimirFactura(index) {
    const factura = facturas[index]
    console.log("Reimprimiendo factura:", factura)
  
    try {
      // Obtener información de la empresa desde localStorage
      let companyInfo = {
        name: "Mi Empresa",
        phone: "No disponible",
        address: "Dirección no disponible",
        logo: "",
      }
  
      try {
        const storedCompanyInfo = localStorage.getItem("companyInfo")
        if (storedCompanyInfo) {
          companyInfo = JSON.parse(storedCompanyInfo)
        }
      } catch (e) {
        console.error("Error al cargar información de empresa:", e)
      }
  
      // Verificar si hay productos en la factura
      if (!factura.productos || factura.productos.length === 0) {
        alert("La factura no tiene productos para imprimir.")
        return
      }
  
      // Formatear fecha con hora en formato 12 horas
      const fechaActual = new Date()
      const opciones = {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      }
      const horaFormateada = fechaActual.toLocaleTimeString("es-ES", opciones)
      const fechaFormateada = fechaActual.toLocaleDateString() + " " + horaFormateada
  
      // Buscar si el cliente está registrado para obtener su código
      let codigoCliente = ""
      const clienteRegistrado = clientes.find((c) => c.nombre.toLowerCase() === factura.cliente.toLowerCase())
      if (clienteRegistrado) {
        codigoCliente = clienteRegistrado.codigo || ""
      }
  
      // Generar HTML de la factura
      let filasHTML = ""
      factura.productos.forEach((producto) => {
        const subtotal = producto.cantidad * producto.precio
        filasHTML += `
          <tr>
            <td>${producto.nombre}</td>
            <td>${producto.cantidad}</td>
            <td>${producto.precio.toFixed(2)}</td>
            <td>${subtotal.toFixed(2)}</td>
          </tr>
        `
      })
  
      // Obtener configuración de impresión
      const printConfig = JSON.parse(localStorage.getItem("printConfig")) || {
        showLogo: true,
        showFooter: true,
        paperSize: "80mm",
        fontSize: "normal",
      }
  
      // Preparar el logo si existe y está habilitado
      const logoHTML =
        companyInfo.logo && printConfig.showLogo
          ? `<img src="${companyInfo.logo}" alt="Logo de la empresa" style="max-width: 60mm; max-height: 30mm; margin-bottom: 10px;">`
          : ""
  
      // Determinar tamaño de fuente
      let fontSizeClass = ""
      if (printConfig.fontSize === "small") {
        fontSizeClass = "font-size-small"
      } else if (printConfig.fontSize === "large") {
        fontSizeClass = "font-size-large"
      }
  
      // Obtener el nombre del cajero que emitió la factura originalmente
      // Si no está disponible, usar el usuario actual
      const nombreCajero = factura.cajero || usuarioActual.nombre || "Usuario no identificado"
      const tipoCajero = factura.tipoCajero || usuarioActual.tipo || "Usuario"
  
      const contenidoFactura = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Factura - ${companyInfo.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .factura {
              width: ${printConfig.paperSize === "letter" ? "210mm" : printConfig.paperSize};
              padding: 5mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 10px;
            }
            .logo {
              max-width: 60mm;
              max-height: 30mm;
              margin-bottom: 10px;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin: 5px 0;
            }
            .company-info p {
              font-size: 12px;
              margin: 3px 0;
            }
            .customer-info {
              margin-bottom: 15px;
              font-size: 12px;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 10px;
            }
            .customer-info h2 {
              font-size: 14px;
              margin: 5px 0;
            }
            .customer-info p {
              margin: 3px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 12px;
            }
            th, td {
              border-bottom: 1px dashed #ccc;
              padding: 5px;
              text-align: left;
            }
            th {
              font-weight: bold;
            }
            .total {
              text-align: right;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 15px;
              border-top: 1px dashed #ccc;
              padding-top: 10px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              margin-top: 20px;
              border-top: 1px dashed #ccc;
              padding-top: 10px;
              display: ${printConfig.showFooter ? "block" : "none"};
            }
            .footer p {
              margin: 5px 0;
            }
            .font-size-small {
              font-size: 90%;
            }
            .font-size-large {
              font-size: 110%;
            }
            .cajero-info {
              text-align: center;
              font-size: 12px;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #ccc;
            }
            .copia-factura {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              color: #666;
              margin-top: 10px;
              font-style: italic;
            }
          </style>
        </head>
        <body class="${fontSizeClass}">
          <div class="factura">
            <div class="header">
              ${logoHTML}
              <div class="company-info">
                <h1 class="company-name">${companyInfo.name}</h1>
                <p>${companyInfo.address}</p>
                <p>Teléfono: ${companyInfo.phone}</p>
                <p>Código de Factura: ${factura.codigoFactura || "FAC-" + Date.now().toString().slice(-8)}</p>
                <p>Fecha Original: ${factura.fecha}</p>
                <p>Fecha Reimpresión: ${fechaFormateada}</p>
                <div class="copia-factura">COPIA DE FACTURA</div>
              </div>
            </div>
            
            <div class="customer-info">
              <h2>Datos del Cliente</h2>
              <p>Nombre: ${factura.cliente}</p>
              ${codigoCliente ? `<p>Código: ${codigoCliente}</p>` : ""}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${filasHTML}
              </tbody>
            </table>
            
            <div class="total">
              Total Final: ${factura.total.toFixed(2)}
            </div>
            
            <div class="cajero-info">
              <p>Le atendió: ${nombreCajero} (${tipoCajero})</p>
            </div>
            
            <div class="footer">
              <p>¡Gracias por su compra!</p>
              <p>No se aceptan devoluciones sin su factura</p>
            </div>
          </div>
        </body>
        </html>
      `
  
      // Crear un iframe temporal para imprimir
      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      document.body.appendChild(iframe)
  
      // Escribir el contenido en el iframe
      const iframeDoc = iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(contenidoFactura)
      iframeDoc.close()
  
      // Esperar a que se cargue el contenido y las imágenes
      setTimeout(() => {
        // Imprimir el iframe
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
  
        // Eliminar el iframe después de un tiempo
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 1000)
    } catch (error) {
      console.error("Error al reimprimir factura:", error)
      alert("Ocurrió un error al preparar la factura para reimprimir: " + error.message)
    }
  }
  
  // Modificar la función finalizarFactura para guardar el nombre del cajero
  function finalizarFactura() {
    const cliente = document.getElementById("clienteFactura").value.trim()
    const fecha = document.getElementById("fechaFactura").value
    const totalElement = document.getElementById("totalFactura")
    const tipoFacturaElement = document.getElementById("tipoFactura")
    const metodoPagoElement = document.getElementById("metodoPago")
  
    if (!totalElement || !tipoFacturaElement || !metodoPagoElement) return
  
    const total = Number.parseFloat(totalElement.textContent)
    const tipoFactura = tipoFacturaElement.value
    const metodoPago = metodoPagoElement.value
  
    if (cliente === "") {
      alert("Por favor, ingrese el nombre del cliente.")
      return
    }
  
    if (productosEnFactura.length === 0) {
      alert("No hay productos en la factura. Añada productos antes de finalizar.")
      return
    }
  
    let gananciaFactura = 0
    productosEnFactura.forEach((p) => {
      // Si es un producto del inventario (no una reparación)
      if (p.codigo.indexOf("REP-") !== 0) {
        const productoInventario = inventario.find((inv) => inv.codigo === p.codigo)
        if (productoInventario) {
          productoInventario.cantidad -= p.cantidad
          gananciaFactura += (p.precio - p.precioCompra) * p.cantidad
          // Solo reducir el capital de productos por el costo de los productos vendidos
          capital.productos -= p.precioCompra * p.cantidad
        }
      } else {
        // Si es una reparación, toda la venta es ganancia
        gananciaFactura += p.precio * p.cantidad
      }
    })
  
    const factura = {
      fecha,
      cliente,
      total,
      ganancia: gananciaFactura,
      productos: productosEnFactura,
      tipo: tipoFactura,
      metodoPago,
      abonos: [],
      codigoFactura: "FAC-" + Date.now().toString().slice(-8),
      // Guardar información del cajero que emitió la factura
      cajero: usuarioActual.nombre,
      tipoCajero: usuarioActual.tipo,
    }
  
    if (tipoFactura === "contado") {
      facturas.push(factura)
      // Agregar solo la ganancia a las ganancias, no el total
      ganancias += gananciaFactura
  
      if (metodoPago === "efectivo") {
        capital.efectivo += total
      } else {
        capital.banco += total
      }
  
      ingresos.push({
        fecha,
        monto: total,
        descripcion: `Factura al contado - ${cliente} (${metodoPago})`,
        etiqueta: "Venta",
      })
  
      // Registrar venta en el historial del cliente
      registrarVentaEnCliente(cliente, factura)
    } else {
      cuentasCobrar.push(factura)
      // Registrar venta a crédito en el historial del cliente
      registrarVentaEnCliente(cliente, factura)
    }
  
    actualizarTablaFacturas()
    actualizarTablaCuentasCobrar()
    actualizarGanancias()
    actualizarCapital()
    actualizarTablaInventario()
    guardarEnLocalStorage()
  
    productosEnFactura = []
    const formFacturaElement = document.getElementById("formFactura")
    if (formFacturaElement) formFacturaElement.reset()
  
    const fechaFacturaElement = document.getElementById("fechaFactura")
    if (fechaFacturaElement) fechaFacturaElement.value = new Date().toLocaleDateString()
  
    const cuerpoTablaFacturaElement = document.getElementById("cuerpoTablaFactura")
    if (cuerpoTablaFacturaElement) cuerpoTablaFacturaElement.innerHTML = ""
  
    if (totalElement) totalElement.textContent = "0"
  
    alert("Factura emitida correctamente")
  }
  
  function registrarVentaEnCliente(nombreCliente, factura) {
    // Buscar el cliente por nombre
    const clienteIndex = clientes.findIndex((c) => c.nombre.toLowerCase() === nombreCliente.toLowerCase())
  
    if (clienteIndex !== -1) {
      // Si el cliente existe, agregar la venta a su historial
      if (!clientes[clienteIndex].historial) {
        clientes[clienteIndex].historial = []
      }
  
      clientes[clienteIndex].historial.push({
        tipo: "venta",
        fecha: factura.fecha,
        total: factura.total,
        productos: factura.productos.map((p) => ({
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio,
        })),
        tipoFactura: factura.tipo,
      })
  
      guardarEnLocalStorage()
    }
  }
  
  // Modificar la función actualizarTablaFacturas para añadir el botón de reimprimir
  function actualizarTablaFacturas() {
    const tbody = document.getElementById("cuerpoTablaFacturas")
    if (!tbody) return
  
    tbody.innerHTML = ""
    facturas.forEach((f, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${f.fecha}</td>
        <td>${f.cliente}</td>
        <td>${f.total.toFixed(2)}</td>
        <td>${f.ganancia.toFixed(2)}</td>
        <td>${f.tipo}</td>
        <td>
          <button onclick="verDetallesFactura(${index})" class="action-button">
            <i class="fas fa-info-circle"></i> Ver Detalles
          </button>
          <button onclick="reimprimirFactura(${index})" class="action-button">
            <i class="fas fa-print"></i> Reimprimir
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function actualizarTablaCuentasCobrar() {
    const tbody = document.getElementById("cuerpoTablaCuentasCobrar")
    if (!tbody) return
  
    tbody.innerHTML = ""
    cuentasCobrar.forEach((factura, index) => {
      // Calcular saldo pendiente (si hay abonos)
      let saldoPendiente = factura.total
      if (factura.abonos && factura.abonos.length > 0) {
        const totalAbonos = factura.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = factura.total - totalAbonos
      }
  
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${factura.fecha}</td>
        <td>${factura.cliente}</td>
        <td>${factura.total.toFixed(2)}</td>
        <td>${saldoPendiente.toFixed(2)}</td>
        <td>
          <button onclick="abrirModalAbonarPago(${index}, 'cobrar')" class="action-button">
            <i class="fas fa-money-bill-wave"></i> Abonar Pago
          </button>
          <button onclick="verDetallesCuentaCobrar(${index})" class="action-button">
            <i class="fas fa-info-circle"></i> Ver Detalles
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function abrirModalAbonarPago(index, tipo) {
    facturaSeleccionadaParaAbono = index
    tipoFacturaAbono = tipo
  
    const modal = document.getElementById("modalAbonarPago")
    const titulo = document.getElementById("tituloModalAbonarPago")
    const idFacturaAbono = document.getElementById("idFacturaAbono")
    const tipoFacturaAbonoInput = document.getElementById("tipoFacturaAbono")
  
    if (tipo === "cobrar") {
      titulo.textContent = "Abonar Pago - Cuenta por Cobrar"
      const factura = cuentasCobrar[index]
  
      // Calcular saldo pendiente
      let saldoPendiente = factura.total
      if (factura.abonos && factura.abonos.length > 0) {
        const totalAbonos = factura.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = factura.total - totalAbonos
      }
  
      document.getElementById("montoAbono").max = saldoPendiente
      document.getElementById("montoAbono").placeholder = `Máximo: ${saldoPendiente.toFixed(2)}`
    } else {
      titulo.textContent = "Abonar Pago - Cuenta por Pagar"
      const compra = cuentasPagar[index]
  
      // Calcular saldo pendiente
      let saldoPendiente = compra.total
      if (compra.abonos && compra.abonos.length > 0) {
        const totalAbonos = compra.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = compra.total - totalAbonos
      }
  
      document.getElementById("montoAbono").max = saldoPendiente
      document.getElementById("montoAbono").placeholder = `Máximo: ${saldoPendiente.toFixed(2)}`
    }
  
    idFacturaAbono.value = index
    tipoFacturaAbonoInput.value = tipo
    modal.style.display = "block"
  }
  
  function guardarAbono() {
    const index = facturaSeleccionadaParaAbono
    const tipo = tipoFacturaAbono
    const monto = Number.parseFloat(document.getElementById("montoAbono").value)
    const metodoPago = document.getElementById("metodoPagoAbono").value
    const observaciones = document.getElementById("observacionesAbono").value
  
    if (isNaN(monto) || monto <= 0) {
      alert("Por favor, ingrese un monto válido")
      return
    }
  
    const fecha = new Date().toLocaleDateString()
    const abono = {
      fecha,
      monto,
      metodoPago,
      observaciones,
    }
  
    if (tipo === "cobrar") {
      const factura = cuentasCobrar[index]
  
      // Verificar que el monto no exceda el saldo pendiente
      let saldoPendiente = factura.total
      if (factura.abonos && factura.abonos.length > 0) {
        const totalAbonos = factura.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = factura.total - totalAbonos
      }
  
      if (monto > saldoPendiente) {
        alert(`El monto excede el saldo pendiente (${saldoPendiente.toFixed(2)})`)
        return
      }
  
      // Agregar el abono
      if (!factura.abonos) factura.abonos = []
      factura.abonos.push(abono)
  
      // Registrar ingreso
      ingresos.push({
        fecha,
        monto,
        descripcion: `Abono a factura - ${factura.cliente}`,
        etiqueta: "Abono",
      })
  
      // Actualizar capital
      if (metodoPago === "efectivo") {
        capital.efectivo += monto
      } else {
        capital.banco += monto
      }
  
      // Si el abono completa el pago, mover a facturas pagadas
      if (saldoPendiente - monto <= 0.01) {
        // Usar una pequeña tolerancia para evitar problemas de redondeo
        factura.pagada = true
        facturas.push(factura)
        cuentasCobrar.splice(index, 1)
        ganancias += factura.ganancia
      }
    } else {
      // Cuenta por pagar
      const compra = cuentasPagar[index]
  
      // Verificar que el monto no exceda el saldo pendiente
      let saldoPendiente = compra.total
      if (compra.abonos && compra.abonos.length > 0) {
        const totalAbonos = compra.abonos.reduce((sum, abono) => sum + abono.monto, 0)
        saldoPendiente = compra.total - totalAbonos
      }
  
      if (monto > saldoPendiente) {
        alert(`El monto excede el saldo pendiente (${saldoPendiente.toFixed(2)})`)
        return
      }
  
      // Agregar el abono
      if (!compra.abonos) compra.abonos = []
      compra.abonos.push(abono)
  
      // Registrar gasto
      gastos.push({
        fecha,
        monto,
        descripcion: `Abono a compra - ${compra.proveedor}`,
        etiqueta: "Abono",
      })
  
      // Actualizar capital
      if (metodoPago === "efectivo") {
        capital.efectivo -= monto
      } else {
        capital.banco -= monto
      }
  
      // Si el abono completa el pago, mover a compras pagadas
      if (saldoPendiente - monto <= 0.01) {
        // Usar una pequeña tolerancia para evitar problemas de redondeo
        compra.pagada = true
        compras.push(compra)
        cuentasPagar.splice(index, 1)
      }
    }
  
    // Cerrar modal y actualizar
    document.getElementById("modalAbonarPago").style.display = "none"
    document.getElementById("formAbonarPago").reset()
  
    actualizarTablaCuentasCobrar()
    actualizarTablaCuentasPagar()
    actualizarCapital()
    actualizarGanancias()
    guardarEnLocalStorage()
  
    alert("Abono registrado correctamente")
  }
  
  function registrarPagoCuentaCobrar(index) {
    const factura = cuentasCobrar[index]
    facturas.push(factura)
    ganancias += factura.ganancia
    capital.efectivo += factura.total
    ingresos.push({
      fecha: new Date().toLocaleDateString(),
      monto: factura.total,
      descripcion: `Pago de factura a crédito - ${factura.cliente}`,
      etiqueta: "Venta",
    })
    cuentasCobrar.splice(index, 1)
    actualizarTablaFacturas()
    actualizarTablaCuentasCobrar()
    actualizarGanancias()
    actualizarCapital()
    guardarEnLocalStorage()
    alert("Pago registrado correctamente")
  }
  
  function verDetallesCuentaCobrar(index) {
    const factura = cuentasCobrar[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Detalles de Factura - ${factura.cliente}`
  
    // Calcular saldo pendiente
    let saldoPendiente = factura.total
    if (factura.abonos && factura.abonos.length > 0) {
      const totalAbonos = factura.abonos.reduce((sum, abono) => sum + abono.monto, 0)
      saldoPendiente = factura.total - totalAbonos
    }
  
    let html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información General</div>
        <p><strong>Cliente:</strong> ${factura.cliente}</p>
        <p><strong>Fecha:</strong> ${factura.fecha}</p>
        <p><strong>Total:</strong> ${factura.total.toFixed(2)}</p>
        <p><strong>Saldo Pendiente:</strong> ${saldoPendiente.toFixed(2)}</p>
      </div>
      
      <div class="detalle-grupo">
        <div class="detalle-titulo">Productos</div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
    `
  
    factura.productos.forEach((p) => {
      const subtotal = p.cantidad * p.precio
      html += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.cantidad}</td>
          <td>${p.precio.toFixed(2)}</td>
          <td>${subtotal.toFixed(2)}</td>
        </tr>
      `
    })
  
    html += `
          </tbody>
        </table>
      </div>
    `
  
    // Mostrar abonos si existen
    if (factura.abonos && factura.abonos.length > 0) {
      html += `
        <div class="detalle-grupo">
          <div class="detalle-titulo">Abonos Realizados</div>
          <div class="abonos-lista">
      `
  
      factura.abonos.forEach((abono) => {
        html += `
          <div class="abono-item">
            <div>
              <div class="abono-fecha">${abono.fecha}</div>
              <div>${abono.metodoPago} - ${abono.observaciones || "Sin observaciones"}</div>
            </div>
            <div class="abono-monto">${abono.monto.toFixed(2)}</div>
          </div>
        `
      })
  
      html += `
          </div>
        </div>
      `
    }
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  // Funciones para compras
  function inicializarCompras() {
    const buscarProductoCompra = document.getElementById("buscarProductoCompra")
    if (buscarProductoCompra) {
      buscarProductoCompra.addEventListener("input", (e) => {
        const busqueda = e.target.value.toLowerCase()
        const select = document.getElementById("productoCompraSeleccionado")
        if (!select) return
  
        select.innerHTML = ""
        inventario
          .filter((p) => p.nombre.toLowerCase().includes(busqueda) || p.codigo.toLowerCase().includes(busqueda))
          .forEach((p) => {
            const option = document.createElement("option")
            option.value = p.codigo
            option.textContent = `${p.nombre} - ${p.codigo}`
            select.appendChild(option)
          })
      })
    }
  
    const formCompra = document.getElementById("formCompra")
    if (formCompra) {
      formCompra.addEventListener("submit", (e) => {
        e.preventDefault()
        finalizarCompra()
      })
    }
  
    const fechaCompra = document.getElementById("fechaCompra")
    if (fechaCompra) {
      fechaCompra.value = new Date().toLocaleDateString()
    }
  
    // Configurar autocompletado para proveedores
    const proveedorCompraInput = document.getElementById("proveedorCompra")
    const sugerenciasProveedores = document.getElementById("sugerenciasProveedores")
  
    if (proveedorCompraInput && sugerenciasProveedores) {
      proveedorCompraInput.addEventListener("input", function () {
        const busqueda = this.value.toLowerCase()
  
        if (busqueda.length < 2) {
          sugerenciasProveedores.style.display = "none"
          return
        }
  
        const proveedoresFiltrados = proveedores.filter(
          (p) => p.nombre.toLowerCase().includes(busqueda) || (p.telefono && p.telefono.includes(busqueda)),
        )
  
        if (proveedoresFiltrados.length > 0) {
          sugerenciasProveedores.innerHTML = ""
          proveedoresFiltrados.forEach((proveedor) => {
            const div = document.createElement("div")
            div.className = "sugerencia-item"
            div.textContent = `${proveedor.nombre} - ${proveedor.telefono}`
            div.addEventListener("click", () => {
              proveedorCompraInput.value = proveedor.nombre
              sugerenciasProveedores.style.display = "none"
            })
            sugerenciasProveedores.appendChild(div)
          })
          sugerenciasProveedores.style.display = "block"
        } else {
          sugerenciasProveedores.style.display = "none"
        }
      })
  
      // Ocultar sugerencias al hacer clic fuera
      document.addEventListener("click", (e) => {
        if (e.target !== proveedorCompraInput && e.target !== sugerenciasProveedores) {
          sugerenciasProveedores.style.display = "none"
        }
      })
    }
  }
  
  function agregarProductoCompra() {
    const codigo = document.getElementById("productoCompraSeleccionado").value
    const cantidad = Number.parseInt(document.getElementById("cantidadCompra").value)
    const precio = Number.parseFloat(document.getElementById("precioCompraProducto").value)
    const producto = inventario.find((p) => p.codigo === codigo)
    if (producto && cantidad > 0 && !isNaN(precio)) {
      productosEnCompra.push({ ...producto, cantidad, precio })
      actualizarTablaCompra()
      document.getElementById("productoCompraSeleccionado").value = ""
      document.getElementById("cantidadCompra").value = ""
      document.getElementById("precioCompraProducto").value = ""
      document.getElementById("buscarProductoCompra").value = ""
    } else {
      alert("Por favor, ingrese datos válidos para el producto.")
    }
  }
  
  function actualizarTablaCompra() {
    const tbody = document.getElementById("cuerpoTablaCompra")
    if (!tbody) return
  
    tbody.innerHTML = ""
    let total = 0
    productosEnCompra.forEach((p, index) => {
      const subtotal = p.cantidad * p.precio
      total += subtotal
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td>${p.precio.toFixed(2)}</td>
        <td>${subtotal.toFixed(2)}</td>
        <td>
          <button onclick="eliminarProductoCompra(${index})" class="action-button">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
    document.getElementById("totalCompra").textContent = total.toFixed(2)
  }
  
  function eliminarProductoCompra(index) {
    productosEnCompra.splice(index, 1)
    actualizarTablaCompra()
  }
  
  function mostrarFormNuevoProducto() {
    document.getElementById("formNuevoProductoCompra").style.display = "block"
  }
  
  function agregarNuevoProductoCompra() {
    const nuevoProducto = {
      nombre: document.getElementById("nombreNuevoProducto").value,
      codigo: document.getElementById("codigoNuevoProducto").value,
      precioCompra: Number.parseFloat(document.getElementById("precioCompraNuevoProducto").value),
      precioVenta: Number.parseFloat(document.getElementById("precioVentaNuevoProducto").value),
      cantidad: Number.parseInt(document.getElementById("cantidadNuevoProducto").value),
      minimo: Number.parseInt(document.getElementById("cantidadMinimaNuevoProducto").value),
      etiqueta: document.getElementById("etiquetaNuevoProducto").value,
      ubicacion: document.getElementById("ubicacionNuevoProducto").value,
    }
  
    // Agregar el nuevo producto a productosEnCompra, pero no al inventario todavía
    productosEnCompra.push({ ...nuevoProducto, precio: nuevoProducto.precioCompra })
  
    actualizarTablaCompra()
  
    document.getElementById("formNuevoProductoCompra").style.display = "none"
    document.getElementById("formNuevoProductoCompra").reset()
    guardarEnLocalStorage()
  }
  
  // Corregir la función finalizarCompra para que las compras al contado no afecten a las ganancias
  function finalizarCompra() {
    const proveedor = document.getElementById("proveedorCompra").value.trim()
    const fecha = document.getElementById("fechaCompra").value
    const tipoCompra = document.getElementById("tipoCompra").value
    const total = Number.parseFloat(document.getElementById("totalCompra").textContent)
  
    if (proveedor === "") {
      alert("Por favor, ingrese el nombre del proveedor.")
      return
    }
  
    if (productosEnCompra.length === 0) {
      alert("No hay productos en la compra. Añada productos antes de finalizar.")
      return
    }
  
    const compra = {
      proveedor,
      fecha,
      total,
      productos: productosEnCompra,
      tipo: tipoCompra,
      abonos: [],
    }
  
    if (tipoCompra === "contado") {
      compras.push(compra)
      capital.efectivo -= total
      gastos.push({
        fecha,
        monto: total,
        descripcion: `Compra al contado - ${proveedor}`,
        etiqueta: "Compra",
      })
      // Las compras no afectan a las ganancias directamente, solo al capital
      // Eliminamos: ganancias -= total
    } else {
      cuentasPagar.push(compra)
    }
  
    // Registrar compra en el historial del proveedor
    registrarCompraEnProveedor(proveedor, compra)
  
    productosEnCompra.forEach((p) => {
      const productoInventario = inventario.find((inv) => inv.codigo === p.codigo)
      if (productoInventario) {
        productoInventario.cantidad += p.cantidad
        productoInventario.precioCompra = p.precio
      } else {
        // Este es un producto nuevo, lo agregamos al inventario
        inventario.push({
          nombre: p.nombre,
          codigo: p.codigo,
          precioCompra: p.precio,
          precioVenta: p.precioVenta || p.precio * 1.3, // Usamos precioVenta si está disponible, de lo contrario calculamos
          cantidad: p.cantidad,
          minimo: p.minimo || 5, // Usamos minimo si está disponible, de lo contrario usamos un valor por defecto
          etiqueta: p.etiqueta || "",
          ubicacion: p.ubicacion || "",
        })
      }
    })
  
    // Actualizamos capital.productos después de procesar todos los productos
    actualizarCapital()
  
    actualizarTablaCompras()
    actualizarTablaCuentasPagar()
    actualizarTablaInventario()
    actualizarGanancias() // Actualizar ganancias después de la compra
    guardarEnLocalStorage()
  
    productosEnCompra = []
    document.getElementById("formCompra").reset()
    document.getElementById("cuerpoTablaCompra").innerHTML = ""
    document.getElementById("totalCompra").textContent = "0"
    document.getElementById("fechaCompra").value = new Date().toLocaleDateString()
  
    alert("Compra registrada correctamente")
  }
  
  function registrarCompraEnProveedor(nombreProveedor, compra) {
    // Buscar el proveedor por nombre
    const proveedorIndex = proveedores.findIndex((p) => p.nombre.toLowerCase() === nombreProveedor.toLowerCase())
  
    if (proveedorIndex !== -1) {
      // Si el proveedor existe, agregar la compra a su historial
      if (!proveedores[proveedorIndex].historial) {
        proveedores[proveedorIndex].historial = []
      }
  
      proveedores[proveedorIndex].historial.push({
        tipo: "compra",
        fecha: compra.fecha,
        total: compra.total,
        productos: compra.productos.map((p) => ({
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio,
        })),
        tipoCompra: compra.tipo,
      })
  
      guardarEnLocalStorage()
    }
  }
  
  function actualizarTablaCompras() {
    const tbody = document.getElementById("cuerpoTablaCompras")
    if (!tbody) return
  
    tbody.innerHTML = ""
    compras.forEach((c, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${c.fecha}</td>
        <td>${c.proveedor}</td>
        <td>${c.total.toFixed(2)}</td>
        <td>
          <button onclick="verDetallesCompra(${index})" class="action-button">
            <i class="fas fa-info-circle"></i> Ver Detalles
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function verDetallesCompra(index) {
    const compra = compras[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Detalles de Compra - ${compra.proveedor}`
  
    let html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información General</div>
        <p><strong>Proveedor:</strong> ${compra.proveedor}</p>
        <p><strong>Fecha:</strong> ${compra.fecha}</p>
        <p><strong>Total:</strong> ${compra.total.toFixed(2)}</p>
      </div>
      
      <div class="detalle-grupo">
        <div class="detalle-titulo">Productos</div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
    `
  
    compra.productos.forEach((p) => {
      const subtotal = p.cantidad * p.precio
      html += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.cantidad}</td>
          <td>${p.precio.toFixed(2)}</td>
          <td>${subtotal.toFixed(2)}</td>
        </tr>
      `
    })
  
    html += `
          </tbody>
        </table>
      </div>
    `
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  function verDetallesCuentaPagar(index) {
    const compra = cuentasPagar[index]
    const modal = document.getElementById("modalDetalles")
    const titulo = document.getElementById("tituloModalDetalles")
    const contenido = document.getElementById("contenidoModalDetalles")
  
    titulo.textContent = `Detalles de Compra a Crédito - ${compra.proveedor}`
  
    // Calcular saldo pendiente
    let saldoPendiente = compra.total
    if (compra.abonos && compra.abonos.length > 0) {
      const totalAbonos = compra.abonos.reduce((sum, abono) => sum + abono.monto, 0)
      saldoPendiente = compra.total - totalAbonos
    }
  
    let html = `
      <div class="detalle-grupo">
        <div class="detalle-titulo">Información General</div>
        <p><strong>Proveedor:</strong> ${compra.proveedor}</p>
        <p><strong>Fecha:</strong> ${compra.fecha}</p>
        <p><strong>Total:</strong> ${compra.total.toFixed(2)}</p>
        <p><strong>Saldo Pendiente:</strong> ${saldoPendiente.toFixed(2)}</p>
      </div>
      
      <div class="detalle-grupo">
        <div class="detalle-titulo">Productos</div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
    `
  
    compra.productos.forEach((p) => {
      const subtotal = p.cantidad * p.precio
      html += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.cantidad}</td>
          <td>${p.precio.toFixed(2)}</td>
          <td>${subtotal.toFixed(2)}</td>
        </tr>
      `
    })
  
    html += `
          </tbody>
        </table>
      </div>
    `
  
    // Mostrar abonos si existen
    if (compra.abonos && compra.abonos.length > 0) {
      html += `
        <div class="detalle-grupo">
          <div class="detalle-titulo">Abonos Realizados</div>
          <div class="abonos-lista">
      `
  
      compra.abonos.forEach((abono) => {
        html += `
          <div class="abono-item">
            <div>
              <div class="abono-fecha">${abono.fecha}</div>
              <div>${abono.metodoPago} - ${abono.observaciones || "Sin observaciones"}</div>
            </div>
            <div class="abono-monto">${abono.monto.toFixed(2)}</div>
          </div>
        `
      })
  
      html += `
          </div>
        </div>
      `
    }
  
    contenido.innerHTML = html
    modal.style.display = "block"
  }
  
  // Funciones para capital
  function inicializarCapital() {
    const formCapital = document.getElementById("formCapital")
    if (formCapital) {
      formCapital.addEventListener("submit", function (e) {
        e.preventDefault()
        const monto = Number.parseFloat(document.getElementById("montoCapital").value)
        const descripcion = document.getElementById("descripcionCapital").value
        capital.efectivo += monto
        actualizarCapital()
        alert(`Se ha añadido ${monto.toFixed(2)} al capital. Descripción: ${descripcion}`)
        this.reset()
        guardarEnLocalStorage()
      })
    }
  
    const btnAnadirBanco = document.getElementById("btnAnadirBanco")
    if (btnAnadirBanco) {
      btnAnadirBanco.addEventListener("click", () => {
        const monto = Number.parseFloat(document.getElementById("montoBanco").value)
        if (isNaN(monto) || monto <= 0) {
          alert("Por favor, ingrese un monto válido.")
          return
        }
        capital.banco += monto
        actualizarCapital()
        alert(`Se han añadido ${monto.toFixed(2)} al capital en banco.`)
        document.getElementById("montoBanco").value = ""
        guardarEnLocalStorage()
      })
    }
  }
  
  function anadirGananciasCapital() {
    const monto = Number.parseFloat(document.getElementById("montoGananciasCapital").value)
    if (isNaN(monto) || monto <= 0) {
      alert("Por favor, ingrese un monto válido.")
      return
    }
    if (monto > ganancias) {
      alert("No puedes añadir más de las ganancias actuales al capital.")
      return
    }
    capital.efectivo += monto
    ganancias -= monto
    actualizarCapital()
    actualizarGanancias()
    alert(`Se han añadido ${monto.toFixed(2)} de las ganancias al capital.`)
    document.getElementById("montoGananciasCapital").value = ""
    guardarEnLocalStorage()
  }
  
  function restarCapital() {
    const monto = Number.parseFloat(document.getElementById("montoRestarCapital").value)
    if (isNaN(monto) || monto <= 0) {
      alert("Por favor, ingrese un monto válido.")
      return
    }
    if (monto > capital.efectivo) {
      alert("No puedes restar más del capital en efectivo actual.")
      return
    }
    capital.efectivo -= monto
    actualizarCapital()
    alert(`Se han restado ${monto.toFixed(2)} del capital.`)
    document.getElementById("montoRestarCapital").value = ""
    guardarEnLocalStorage()
  }
  
  // Funciones para ingresos/gastos
  function buscarGananciasPorFecha() {
    const fechaInicioInput = document.getElementById("fechaInicioGanancias")
    const fechaFinInput = document.getElementById("fechaFinGanancias")
  
    if (!fechaInicioInput.value || !fechaFinInput.value) {
      alert("Por favor, seleccione ambas fechas (inicio y fin)")
      return
    }
  
    const fechaInicio = new Date(fechaInicioInput.value)
    const fechaFin = new Date(fechaFinInput.value)
  
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      alert("Por favor, seleccione fechas válidas")
      return
    }
  
    // Ajustar la fecha fin al final del día
    fechaFin.setHours(23, 59, 59, 999)
  
    let totalIngresos = 0
    let totalGastos = 0
    let gananciasEnPeriodo = 0
  
    // Sumar ganancias de facturas
    facturas.forEach((f) => {
      const fechaFactura = new Date(f.fecha)
      if (fechaFactura >= fechaInicio && fechaFactura <= fechaFin) {
        gananciasEnPeriodo += f.ganancia
        totalIngresos += f.total
      }
    })
  
    // Sumar ingresos
    ingresos.forEach((i) => {
      const fechaIngreso = new Date(i.fecha)
      if (fechaIngreso >= fechaInicio && fechaIngreso <= fechaFin) {
        gananciasEnPeriodo += i.monto
        totalIngresos += i.monto
      }
    })
  
    // Restar gastos
    gastos.forEach((g) => {
      const fechaGasto = new Date(g.fecha)
      if (fechaGasto >= fechaInicio && fechaGasto <= fechaFin) {
        gananciasEnPeriodo -= g.monto
        totalGastos += g.monto
      }
    })
  
    const gananciasEnPeriodoElement = document.getElementById("gananciasEnPeriodo")
    if (gananciasEnPeriodoElement) {
      // Crear un resumen detallado
      const resumen = `
        <div class="form-group">
          <p><strong>Total Ingresos:</strong> ${totalIngresos.toFixed(2)}</p>
          <p><strong>Total Gastos:</strong> ${totalGastos.toFixed(2)}</p>
          <p><strong>Balance Neto:</strong> ${gananciasEnPeriodo.toFixed(2)}</p>
        </div>
      `
  
      gananciasEnPeriodoElement.innerHTML = resumen
    }
  }
  
  // Funciones para clientes y proveedores
  function cambiarTab(tabId) {
    // Ocultar todos los contenidos de pestañas
    document.querySelectorAll(".tab-content").forEach((tab) => {
      tab.classList.remove("active")
    })
  
    // Desactivar todos los botones de pestañas
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.remove("active")
    })
  
    // Mostrar el contenido de la pestaña seleccionada
    document.getElementById(tabId).classList.add("active")
  
    // Activar el botón de la pestaña seleccionada
    const button = document.querySelector(`[onclick="cambiarTab('${tabId}')"]`)
    if (button) {
      button.classList.add("active")
    }
  }
  
  function inicializarClientesProveedores() {
    // Inicializar pestañas
    const tabButtons = document.querySelectorAll(".tab-button")
    if (tabButtons) {
      tabButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const tabId = this.getAttribute("onclick").match(/'([^']+)'/)[1]
          cambiarTab(tabId)
        })
      })
    }
  
    // Inicializar formulario de clientes
    const btnAgregarCliente = document.getElementById("btnAgregarCliente")
    if (btnAgregarCliente) {
      btnAgregarCliente.addEventListener("click", () => {
        document.getElementById("formCliente").style.display = "block"
      })
    }
  
    const formCliente = document.getElementById("formCliente")
    if (formCliente) {
      formCliente.addEventListener("submit", function (e) {
        e.preventDefault()
  
        // Generar código automático para el cliente
        let ultimoCodigo = 0
        if (clientes.length > 0) {
          // Buscar el último código numérico
          clientes.forEach((cliente) => {
            if (cliente.codigo) {
              const codigoNum = Number.parseInt(cliente.codigo, 10)
              if (!isNaN(codigoNum) && codigoNum > ultimoCodigo) {
                ultimoCodigo = codigoNum
              }
            }
          })
        }
        // Incrementar el código y formatearlo con ceros a la izquierda
        const nuevoCodigo = String(ultimoCodigo + 1).padStart(4, "0")
  
        const cliente = {
          codigo: nuevoCodigo,
          nombre: document.getElementById("nombreCliente").value,
          cedula: document.getElementById("cedulaCliente").value,
          telefono: document.getElementById("telefonoCliente").value,
          direccion: document.getElementById("direccionCliente").value,
          correo: document.getElementById("correoCliente").value,
          historial: [],
        }
  
        clientes.push(cliente)
        actualizarTablaClientes()
        this.reset()
        this.style.display = "none"
        guardarEnLocalStorage()
        alert("Cliente agregado correctamente con código: " + nuevoCodigo)
      })
    }
  
    // Inicializar formulario de proveedores
    const btnAgregarProveedor = document.getElementById("btnAgregarProveedor")
    if (btnAgregarProveedor) {
      btnAgregarProveedor.addEventListener("click", () => {
        document.getElementById("formProveedor").style.display = "block"
      })
    }
  
    const formProveedor = document.getElementById("formProveedor")
    if (formProveedor) {
      formProveedor.addEventListener("submit", function (e) {
        e.preventDefault()
  
        // Generar código automático para el proveedor
        let ultimoCodigo = 0
        if (proveedores.length > 0) {
          // Buscar el último código numérico
          proveedores.forEach((proveedor) => {
            if (proveedor.codigo) {
              const codigoNum = Number.parseInt(proveedor.codigo, 10)
              if (!isNaN(codigoNum) && codigoNum > ultimoCodigo) {
                ultimoCodigo = codigoNum
              }
            }
          })
        }
        // Incrementar el código y formatearlo con ceros a la izquierda
        const nuevoCodigo = String(ultimoCodigo + 1).padStart(4, "0")
  
        const proveedor = {
          codigo: nuevoCodigo,
          nombre: document.getElementById("nombreProveedor").value,
          telefono: document.getElementById("telefonoProveedor").value,
          direccion: document.getElementById("direccionProveedor").value,
          contacto: document.getElementById("contactoProveedor").value,
          historial: [],
        }
  
        proveedores.push(proveedor)
        actualizarTablaProveedores()
        this.reset()
        this.style.display = "none"
        guardarEnLocalStorage()
        alert("Proveedor agregado correctamente con código: " + nuevoCodigo)
      })
    }
  
    // Inicializar búsqueda de clientes
    const buscarCliente = document.getElementById("buscarCliente")
    if (buscarCliente) {
      buscarCliente.addEventListener("input", function () {
        const busqueda = this.value.toLowerCase()
        const clientesFiltrados = clientes.filter(
          (c) =>
            c.nombre.toLowerCase().includes(busqueda) ||
            c.cedula.toLowerCase().includes(busqueda) ||
            (c.telefono && c.telefono.toLowerCase().includes(busqueda)) ||
            (c.codigo && c.codigo.toLowerCase().includes(busqueda)),
        )
        actualizarTablaClientes(clientesFiltrados)
      })
    }
  
    // Inicializar búsqueda de proveedores
    const buscarProveedor = document.getElementById("buscarProveedor")
    if (buscarProveedor) {
      buscarProveedor.addEventListener("input", function () {
        const busqueda = this.value.toLowerCase()
        const proveedoresFiltrados = proveedores.filter(
          (p) =>
            p.nombre.toLowerCase().includes(busqueda) ||
            (p.telefono && p.telefono.toLowerCase().includes(busqueda)) ||
            (p.codigo && p.codigo.toLowerCase().includes(busqueda)),
        )
        actualizarTablaProveedores(proveedoresFiltrados)
      })
    }
  
    actualizarTablaClientes()
    actualizarTablaProveedores()
  }
  
  function actualizarTablaClientes(clientesFiltrados = clientes) {
    const tbody = document.getElementById("cuerpoTablaClientes")
    if (!tbody) return
  
    tbody.innerHTML = ""
    clientesFiltrados.forEach((cliente, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${cliente.codigo || "N/A"}</td>
        <td>${cliente.nombre}</td>
        <td>${cliente.cedula}</td>
        <td>${cliente.telefono}</td>
        <td>${cliente.direccion || "N/A"}</td>
        <td>${cliente.correo || "N/A"}</td>
        <td>
          <button onclick="editarCliente(${index})" class="action-button">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button onclick="verHistorialCliente(${index})" class="action-button">
            <i class="fas fa-history"></i> Historial
          </button>
          <button onclick="eliminarCliente(${index})" class="action-button">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function actualizarTablaProveedores(proveedoresFiltrados = proveedores) {
    const tbody = document.getElementById("cuerpoTablaProveedores")
    if (!tbody) return
  
    tbody.innerHTML = ""
    proveedoresFiltrados.forEach((proveedor, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${proveedor.codigo || "N/A"}</td>
        <td>${proveedor.nombre}</td>
        <td>${proveedor.telefono}</td>
        <td>${proveedor.direccion}</td>
        <td>${proveedor.contacto || "N/A"}</td>
        <td>
          <button onclick="editarProveedor(${index})" class="action-button">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button onclick="verHistorialProveedor(${index})" class="action-button">
            <i class="fas fa-history"></i> Historial
          </button>
          <button onclick="eliminarProveedor(${index})" class="action-button">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  }
  
  function editarCliente(index) {
    const cliente = clientes[index]
  
    document.getElementById("nombreCliente").value = cliente.nombre
    document.getElementById("cedulaCliente").value = cliente.cedula
    document.getElementById("telefonoCliente").value = cliente.telefono
    document.getElementById("direccionCliente").value = cliente.direccion || ""
    document.getElementById("correoCliente").value = cliente.correo || ""
  
    const formCliente = document.getElementById("formCliente")
    const btnGuardarCliente = document.getElementById("btnGuardarCliente")
  
    formCliente.style.display = "block"
    btnGuardarCliente.textContent = "Guardar Cambios"
  
    // Modificar el evento submit para actualizar en lugar de agregar
    formCliente.onsubmit = function (e) {
      e.preventDefault()
  
      clientes[index] = {
        codigo: cliente.codigo, // Mantener el código original
        nombre: document.getElementById("nombreCliente").value,
        cedula: document.getElementById("cedulaCliente").value,
        telefono: document.getElementById("telefonoCliente").value,
        direccion: document.getElementById("direccionCliente").value,
        correo: document.getElementById("correoCliente").value,
        historial: cliente.historial || [],
      }
  
      actualizarTablaClientes()
      this.reset()
      this.style.display = "none"
      guardarEnLocalStorage()
      alert("Cliente actualizado correctamente")
  
      // Restaurar el evento submit original
        this.onsubmit = null;
            };
      
      }
  
  