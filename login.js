// Variables para almacenar usuarios y configuración de la empresa
let users = [
    {
      username: "admin",
      password: "admin123",
      role: "admin",
    },
  ]
  
  let companyInfo = {
    name: "",
    phone: "",
    address: "",
    logo: "",
  }
  
  // Contraseña para acceder a la gestión de usuarios
  let adminPassword = "12345"
  
  // Variable para controlar la sincronización automática
  let autoSyncEnabled = true
  
  // Elementos DOM
  const loginBtn = document.getElementById("login-btn")
  const addAdminBtn = document.getElementById("add-admin-btn")
  const addCashierBtn = document.getElementById("add-cashier-btn")
  const addWorkshopBtn = document.getElementById("add-workshop-btn")
  const modal = document.getElementById("add-user-modal")
  const closeModal = document.querySelector(".close")
  const addUserForm = document.getElementById("add-user-form")
  const modalTitle = document.getElementById("modal-title")
  const userRoleInput = document.getElementById("user-role")
  const adminFields = document.getElementById("admin-fields")
  const cashierFields = document.getElementById("cashier-fields")
  const companyLogo = document.getElementById("company-logo")
  const logoPreview = document.getElementById("logo-preview")
  
  // Variable para controlar si estamos editando o añadiendo un usuario
  let editingUserIndex = -1
  
  // Cargar usuarios y configuración desde localStorage y Firebase
  async function loadUsers() {
    console.log("Cargando usuarios...")
  
    // Primero intentar cargar desde localStorage
    const storedUsers = localStorage.getItem("inventoryUsers")
    if (storedUsers) {
      try {
        users = JSON.parse(storedUsers)
        console.log("Usuarios cargados desde localStorage:", users)
      } catch (error) {
        console.error("Error al parsear usuarios desde localStorage:", error)
      }
    }
  
    const storedCompanyInfo = localStorage.getItem("companyInfo")
    if (storedCompanyInfo) {
      try {
        companyInfo = JSON.parse(storedCompanyInfo)
      } catch (error) {
        console.error("Error al parsear información de la empresa desde localStorage:", error)
      }
    }
  
    // Cargar contraseña de administración si existe
    const storedPassword = localStorage.getItem("adminPassword")
    if (storedPassword) {
      adminPassword = storedPassword
    }
  
    // Luego intentar cargar desde Firebase
    try {
      // Verificar si hay usuarios en el formato antiguo que necesiten ser migrados
      if (window.migrateUsersIfNeeded) {
        await window.migrateUsersIfNeeded()
      }
  
      // Cargar usuarios
      if (window.getUsersFromFirebase) {
        const firebaseUsers = await window.getUsersFromFirebase()
        if (firebaseUsers && firebaseUsers.length > 0) {
          users = firebaseUsers
          localStorage.setItem("inventoryUsers", JSON.stringify(users))
          console.log("Usuarios cargados desde Firebase:", users)
          if (window.showMiniNotification) {
            window.showMiniNotification("Usuarios cargados desde Firebase", "success")
          }
        }
      }
  
      // Cargar información de la empresa
      if (window.getCompanyInfoFromFirebase) {
        const firebaseCompanyInfo = await window.getCompanyInfoFromFirebase()
        if (firebaseCompanyInfo) {
          companyInfo = firebaseCompanyInfo
          localStorage.setItem("companyInfo", JSON.stringify(companyInfo))
        }
      }
  
      // Cargar contraseña de administración
      if (window.getAdminPasswordFromFirebase) {
        const firebaseAdminPassword = await window.getAdminPasswordFromFirebase()
        if (firebaseAdminPassword) {
          adminPassword = firebaseAdminPassword
          localStorage.setItem("adminPassword", adminPassword)
        }
      }
    } catch (error) {
      console.error("Error al cargar datos desde Firebase:", error)
    }
  
    // Actualizar la lista de usuarios si estamos en la página de gestión
    if (document.getElementById("users-list")) {
      displayUsersList()
    }
  }
  
  // Guardar usuarios en localStorage y Firebase
  async function saveUsers() {
    console.log("Guardando usuarios:", users)
  
    // Guardar en localStorage
    localStorage.setItem("inventoryUsers", JSON.stringify(users))
  
    // Guardar en Firebase si está activada la sincronización automática
    if (autoSyncEnabled && window.saveUsersToFirebase) {
      try {
        await window.saveUsersToFirebase(users)
        if (window.showMiniNotification) {
          window.showMiniNotification("Usuarios guardados en Firebase", "success")
        }
      } catch (error) {
        console.error("Error al guardar usuarios en Firebase:", error)
        if (window.showMiniNotification) {
          window.showMiniNotification("Error al guardar usuarios", "error")
        }
      }
    }
  }
  
  // Guardar información de la empresa en localStorage y Firebase
  async function saveCompanyInfo() {
    // Guardar en localStorage
    localStorage.setItem("companyInfo", JSON.stringify(companyInfo))
  
    // Guardar en Firebase si está activada la sincronización automática
    if (autoSyncEnabled && window.saveCompanyInfoToFirebase) {
      try {
        await window.saveCompanyInfoToFirebase(companyInfo)
        if (window.showMiniNotification) {
          window.showMiniNotification("Información de empresa guardada", "success")
        }
      } catch (error) {
        console.error("Error al guardar información de la empresa en Firebase:", error)
        if (window.showMiniNotification) {
          window.showMiniNotification("Error al guardar información", "error")
        }
      }
    }
  }
  
  // Guardar contraseña de administración en localStorage y Firebase
  async function saveAdminPassword() {
    // Guardar en localStorage
    localStorage.setItem("adminPassword", adminPassword)
  
    // Guardar en Firebase si está activada la sincronización automática
    if (autoSyncEnabled && window.saveAdminPasswordToFirebase) {
      try {
        await window.saveAdminPasswordToFirebase(adminPassword)
        if (window.showMiniNotification) {
          window.showMiniNotification("Contraseña guardada", "success")
        }
      } catch (error) {
        console.error("Error al guardar contraseña de administración en Firebase:", error)
        if (window.showMiniNotification) {
          window.showMiniNotification("Error al guardar contraseña", "error")
        }
      }
    }
  }
  
  // Iniciar sesión
  function login() {
    const username = document.getElementById("username").value
    const password = document.getElementById("password").value
  
    if (!username || !password) {
      alert("Por favor, ingrese usuario y contraseña")
      return
    }
  
    const user = users.find((u) => u.username === username && u.password === password)
  
    if (user) {
      // Guardar información de sesión
      sessionStorage.setItem(
        "currentUser",
        JSON.stringify({
          username: user.username,
          role: user.role,
          fullName: user.fullName || user.username,
        }),
      )
  
      // También guardar en el formato antiguo para compatibilidad
      try {
        const usuarioActual = {
          usuario: user.username,
          tipo: user.role === "admin" ? "administrador" : user.role === "workshop" ? "taller" : "cajero",
          nombre: user.fullName || user.username,
        }
        localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual))
      } catch (error) {
        console.error("Error al guardar usuario actual en formato antiguo:", error)
      }
  
      // Redirigir a la página principal
      window.location.href = "pagina.html"
    } else {
      alert("Usuario o contraseña incorrectos")
    }
  }
  
  // Abrir modal para añadir usuario
  function openAddUserModal(role) {
    // Solicitar contraseña de administración
    const password = prompt("Ingrese la contraseña de administración para añadir un usuario:")
  
    // Verificar si la contraseña es correcta
    if (password !== adminPassword) {
      alert("Contraseña incorrecta. No puede añadir usuarios.")
      return
    }
  
    editingUserIndex = -1 // Reiniciar el índice de edición
    userRoleInput.value = role
  
    // Ocultar todos los campos específicos
    adminFields.style.display = "none"
    cashierFields.style.display = "none"
  
    // Limpiar el formulario
    addUserForm.reset()
    logoPreview.innerHTML = ""
  
    switch (role) {
      case "admin":
        modalTitle.textContent = "Añadir Administrador"
        adminFields.style.display = "block"
        break
      case "cashier":
        modalTitle.textContent = "Añadir Cajero"
        cashierFields.style.display = "block"
        break
      case "workshop":
        modalTitle.textContent = "Añadir Técnico de Taller"
        break
    }
  
    modal.style.display = "block"
  }
  
  // Abrir modal para editar usuario
  function openEditUserModal(index) {
    editingUserIndex = index
    const user = users[index]
  
    // Establecer el rol y mostrar los campos correspondientes
    userRoleInput.value = user.role
  
    // Ocultar todos los campos específicos primero
    adminFields.style.display = "none"
    cashierFields.style.display = "none"
  
    // Mostrar los campos según el rol
    switch (user.role) {
      case "admin":
        modalTitle.textContent = "Editar Administrador"
        adminFields.style.display = "block"
  
        // Cargar datos de la empresa si este usuario es admin
        if (companyInfo) {
          document.getElementById("company-name").value = companyInfo.name || ""
          document.getElementById("company-phone").value = companyInfo.phone || ""
          document.getElementById("company-address").value = companyInfo.address || ""
  
          // Mostrar logo si existe
          if (companyInfo.logo) {
            logoPreview.innerHTML = `<img src="${companyInfo.logo}" alt="Logo Preview">`
          }
        }
        break
      case "cashier":
        modalTitle.textContent = "Editar Cajero"
        cashierFields.style.display = "block"
  
        // Cargar datos del cajero
        if (user.fullName) {
          document.getElementById("cashier-fullname").value = user.fullName
        }
        break
      case "workshop":
        modalTitle.textContent = "Editar Técnico de Taller"
        break
    }
  
    // Cargar datos básicos del usuario
    document.getElementById("new-username").value = user.username
    document.getElementById("new-password").value = user.password
    document.getElementById("confirm-password").value = user.password
  
    // Mostrar el modal
    modal.style.display = "block"
  }
  
  // Cerrar modal
  function closeAddUserModal() {
    modal.style.display = "none"
    addUserForm.reset()
    logoPreview.innerHTML = ""
    editingUserIndex = -1 // Reiniciar el índice de edición
  }
  
  // Convertir imagen a Base64
  function convertImageToBase64(file, callback) {
    const reader = new FileReader()
    reader.onload = (e) => {
      callback(e.target.result)
    }
    reader.readAsDataURL(file)
  }
  
  // Añadir o actualizar usuario
  function addUser(e) {
    e.preventDefault()
  
    const username = document.getElementById("new-username").value
    const password = document.getElementById("new-password").value
    const confirmPassword = document.getElementById("confirm-password").value
    const role = userRoleInput.value
  
    // Validaciones
    if (!username || !password || !confirmPassword) {
      alert("Por favor, complete todos los campos obligatorios")
      return
    }
  
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }
  
    // Si estamos editando, no validamos el nombre de usuario duplicado para el mismo usuario
    if (editingUserIndex === -1 && users.some((u) => u.username === username)) {
      alert("El nombre de usuario ya existe")
      return
    }
  
    // Crear objeto de usuario base
    const newUser = {
      username,
      password,
      role,
    }
  
    // Añadir campos específicos según el rol
    if (role === "admin") {
      const companyName = document.getElementById("company-name").value
      const companyPhone = document.getElementById("company-phone").value
      const companyAddress = document.getElementById("company-address").value
      const logoFile = document.getElementById("company-logo").files[0]
  
      if (!companyName) {
        alert("Por favor, ingrese el nombre de la empresa")
        return
      }
  
      // Actualizar información de la empresa
      companyInfo.name = companyName
      companyInfo.phone = companyPhone
      companyInfo.address = companyAddress
  
      // Si hay un logo, convertirlo a Base64
      if (logoFile) {
        convertImageToBase64(logoFile, async (base64Image) => {
          companyInfo.logo = base64Image
          await saveCompanyInfo()
  
          // Añadir o actualizar usuario y finalizar
          if (editingUserIndex !== -1) {
            users[editingUserIndex] = newUser
          } else {
            users.push(newUser)
          }
  
          // Guardar usuarios explícitamente
          await saveUsers()
  
          // Actualizar la lista de usuarios
          displayUsersList()
  
          alert(
            `Usuario ${username} ${editingUserIndex !== -1 ? "actualizado" : "creado"} correctamente como ${getRoleName(role)}`,
          )
          closeAddUserModal()
        })
      } else {
        // Función asíncrona inmediata para poder usar await
        ;(async () => {
          await saveCompanyInfo()
  
          // Añadir o actualizar usuario y finalizar
          if (editingUserIndex !== -1) {
            users[editingUserIndex] = newUser
          } else {
            users.push(newUser)
          }
  
          // Guardar usuarios explícitamente
          await saveUsers()
  
          // Actualizar la lista de usuarios
          displayUsersList()
  
          alert(
            `Usuario ${username} ${editingUserIndex !== -1 ? "actualizado" : "creado"} correctamente como ${getRoleName(role)}`,
          )
          closeAddUserModal()
        })()
      }
    } else if (role === "cashier" || role === "workshop") {
      const fullName = document.getElementById(role === "cashier" ? "cashier-fullname" : "workshop-fullname")?.value || ""
  
      if (!fullName && role === "cashier") {
        alert("Por favor, ingrese el nombre completo del cajero")
        return
      }
  
      newUser.fullName = fullName
  
      // Función asíncrona inmediata para poder usar await
      ;(async () => {
        // Añadir o actualizar usuario y finalizar
        if (editingUserIndex !== -1) {
          users[editingUserIndex] = newUser
        } else {
          users.push(newUser)
        }
  
        // Guardar usuarios explícitamente
        await saveUsers()
  
        // Actualizar la lista de usuarios
        displayUsersList()
  
        alert(
          `Usuario ${username} ${editingUserIndex !== -1 ? "actualizado" : "creado"} correctamente como ${getRoleName(role)}`,
        )
        closeAddUserModal()
      })()
    } else {
      // Para otros roles, simplemente añadir o actualizar el usuario
      // Función asíncrona inmediata para poder usar await
      ;(async () => {
        if (editingUserIndex !== -1) {
          users[editingUserIndex] = newUser
        } else {
          users.push(newUser)
        }
  
        // Guardar usuarios explícitamente
        await saveUsers()
  
        // Actualizar la lista de usuarios
        displayUsersList()
  
        alert(
          `Usuario ${username} ${editingUserIndex !== -1 ? "actualizado" : "creado"} correctamente como ${getRoleName(role)}`,
        )
        closeAddUserModal()
      })()
    }
  }
  
  // Eliminar usuario
  function deleteUser(index) {
    if (confirm("¿Está seguro que desea eliminar este usuario?")) {
      users.splice(index, 1)
      saveUsers()
      displayUsersList()
      alert("Usuario eliminado correctamente")
    }
  }
  
  // Verificar contraseña para mostrar la lista de usuarios
  function verifyAdminPassword() {
    const passwordInput = document.getElementById("admin-password-input").value
  
    if (passwordInput === adminPassword) {
      // Mostrar la lista de usuarios y el formulario para cambiar contraseña
      document.getElementById("users-list-container").style.display = "block"
      document.getElementById("change-password-container").style.display = "block"
      document.getElementById("password-protection").style.display = "none"
  
      // Mostrar la lista de usuarios
      displayUsersList()
    } else {
      alert("Contraseña incorrecta")
    }
  }
  
  // Cambiar la contraseña de administración
  function changeAdminPassword() {
    const currentPassword = document.getElementById("current-password").value
    const newPassword = document.getElementById("new-password-admin").value
    const confirmNewPassword = document.getElementById("confirm-new-password").value
  
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert("Por favor, complete todos los campos")
      return
    }
  
    if (currentPassword !== adminPassword) {
      alert("La contraseña actual es incorrecta")
      return
    }
  
    if (newPassword !== confirmNewPassword) {
      alert("Las nuevas contraseñas no coinciden")
      return
    }
  
    // Actualizar la contraseña
    adminPassword = newPassword
    saveAdminPassword()
  
    alert("Contraseña actualizada correctamente")
  
    // Limpiar el formulario
    document.getElementById("current-password").value = ""
    document.getElementById("new-password-admin").value = ""
    document.getElementById("confirm-new-password").value = ""
  }
  
  // Cerrar la gestión de usuarios
  function closeUserManagement() {
    // Ocultar la lista de usuarios y el formulario para cambiar contraseña
    document.getElementById("users-list-container").style.display = "none"
    document.getElementById("change-password-container").style.display = "none"
  
    // Mostrar la protección con contraseña
    document.getElementById("password-protection").style.display = "block"
  
    // Limpiar el campo de contraseña
    document.getElementById("admin-password-input").value = ""
  }
  
  // Mostrar lista de usuarios
  function displayUsersList() {
    const userListContainer = document.getElementById("users-list")
    if (!userListContainer) return
  
    userListContainer.innerHTML = ""
  
    if (users.length === 0) {
      userListContainer.innerHTML = "<p>No hay usuarios registrados</p>"
      return
    }
  
    const table = document.createElement("table")
    table.className = "users-table"
  
    // Crear encabezado
    const thead = document.createElement("thead")
    thead.innerHTML = `
      <tr>
        <th>Usuario</th>
        <th>Rol</th>
        <th>Nombre Completo</th>
        <th>Acciones</th>
      </tr>
    `
    table.appendChild(thead)
  
    // Crear cuerpo de la tabla
    const tbody = document.createElement("tbody")
    users.forEach((user, index) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${user.username}</td>
        <td>${getRoleName(user.role)}</td>
        <td>${user.fullName || "N/A"}</td>
        <td>
          <button onclick="openEditUserModal(${index})" class="edit-btn">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button onclick="deleteUser(${index})" class="delete-btn">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </td>
      `
      tbody.appendChild(tr)
    })
  
    table.appendChild(tbody)
    userListContainer.appendChild(table)
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
  
  // Función para sincronizar todos los datos con Firebase
  async function sincronizarLoginConFirebase() {
    if (window.showMiniNotification) {
      window.showMiniNotification("Sincronizando datos de usuarios...")
    }
  
    try {
      // Guardar usuarios
      if (window.saveUsersToFirebase) {
        await window.saveUsersToFirebase(users)
      }
  
      // Guardar información de la empresa
      if (window.saveCompanyInfoToFirebase) {
        await window.saveCompanyInfoToFirebase(companyInfo)
      }
  
      // Guardar contraseña de administración
      if (window.saveAdminPasswordToFirebase) {
        await window.saveAdminPasswordToFirebase(adminPassword)
      }
  
      if (window.showMiniNotification) {
        window.showMiniNotification("Datos sincronizados correctamente", "success")
      }
    } catch (error) {
      console.error("Error al sincronizar con Firebase:", error)
      if (window.showMiniNotification) {
        window.showMiniNotification("Error al sincronizar", "error")
      }
    }
  }
  
  // Agregar botón de sincronización
  function addSyncButton() {
    // Crear el botón de sincronización
    const syncButton = document.createElement("button")
    syncButton.className = "firebase-sync-button"
    syncButton.innerHTML = '<i class="fas fa-sync"></i>'
    syncButton.title = "Sincronizar con Firebase"
    syncButton.style.position = "fixed"
    syncButton.style.bottom = "20px"
    syncButton.style.right = "20px"
    syncButton.style.width = "40px"
    syncButton.style.height = "40px"
    syncButton.style.borderRadius = "50%"
    syncButton.style.backgroundColor = "#4a6da7"
    syncButton.style.color = "white"
    syncButton.style.border = "none"
    syncButton.style.display = "flex"
    syncButton.style.justifyContent = "center"
    syncButton.style.alignItems = "center"
    syncButton.style.cursor = "pointer"
    syncButton.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)"
    syncButton.style.zIndex = "1000"
  
    // Agregar evento de clic
    syncButton.addEventListener("click", sincronizarLoginConFirebase)
  
    // Agregar toggle para sincronización automática
    const autoSyncToggle = document.createElement("div")
    autoSyncToggle.className = "auto-sync-toggle"
    autoSyncToggle.innerHTML = `
      <label class="switch" title="Sincronización automática">
        <input type="checkbox" id="autoSyncToggleLogin" ${autoSyncEnabled ? "checked" : ""}>
        <span class="slider round"></span>
      </label>
    `
    autoSyncToggle.style.position = "fixed"
    autoSyncToggle.style.bottom = "70px"
    autoSyncToggle.style.right = "20px"
    autoSyncToggle.style.zIndex = "1000"
  
    // Estilos para el switch
    const style = document.createElement("style")
    style.textContent = `
      .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 20px;
      }
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
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
      }
      input:checked + .slider {
        background-color: #4a6da7;
      }
      input:checked + .slider:before {
        transform: translateX(20px);
      }
      .slider.round {
        border-radius: 34px;
      }
      .slider.round:before {
        border-radius: 50%;
      }
    `
  
    document.head.appendChild(style)
    document.body.appendChild(autoSyncToggle)
  
    // Agregar evento al toggle
    document.getElementById("autoSyncToggleLogin").addEventListener("change", function () {
      autoSyncEnabled = this.checked
      if (window.showMiniNotification) {
        window.showMiniNotification(`Sincronización automática ${autoSyncEnabled ? "activada" : "desactivada"}`, "info")
      }
    })
  
    // Agregar el botón al DOM
    document.body.appendChild(syncButton)
  }
  
  // Event listeners
  document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM cargado, inicializando login...")
  
    // Cargar usuarios y configuración
    await loadUsers()
  
    // Agregar botón de sincronización si Firebase está disponible
    if (typeof window.saveUsersToFirebase === "function") {
      addSyncButton()
    }
  
    if (loginBtn) loginBtn.addEventListener("click", login)
    if (addAdminBtn) addAdminBtn.addEventListener("click", () => openAddUserModal("admin"))
    if (addCashierBtn) addCashierBtn.addEventListener("click", () => openAddUserModal("cashier"))
    if (addWorkshopBtn) addWorkshopBtn.addEventListener("click", () => openAddUserModal("workshop"))
    if (closeModal) closeModal.addEventListener("click", closeAddUserModal)
    if (addUserForm) addUserForm.addEventListener("submit", addUser)
  
    // Botón para verificar contraseña
    const verifyPasswordBtn = document.getElementById("verify-password-btn")
    if (verifyPasswordBtn) {
      verifyPasswordBtn.addEventListener("click", verifyAdminPassword)
    }
  
    // Botón para cambiar contraseña
    const changePasswordBtn = document.getElementById("change-password-btn")
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener("click", changeAdminPassword)
    }
  
    // Botón para cerrar la gestión de usuarios
    const closeUserManagementBtn = document.getElementById("close-user-management-btn")
    if (closeUserManagementBtn) {
      closeUserManagementBtn.addEventListener("click", closeUserManagement)
    }
  
    // Previsualizar logo
    if (companyLogo) {
      companyLogo.addEventListener("change", function () {
        const file = this.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo Preview">`
          }
          reader.readAsDataURL(file)
        }
      })
    }
  
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeAddUserModal()
      }
    })
  
    // Permitir iniciar sesión con Enter
    const passwordInput = document.getElementById("password")
    if (passwordInput) {
      passwordInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          login()
        }
      })
    }
  
    // Permitir verificar contraseña con Enter
    const adminPasswordInput = document.getElementById("admin-password-input")
    if (adminPasswordInput) {
      adminPasswordInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          verifyAdminPassword()
        }
      })
    }
  })
  
  // Exportar funciones para uso global
  window.login = login
  window.openAddUserModal = openAddUserModal
  window.openEditUserModal = openEditUserModal
  window.closeAddUserModal = closeAddUserModal
  window.addUser = addUser
  window.deleteUser = deleteUser
  window.verifyAdminPassword = verifyAdminPassword
  window.changeAdminPassword = changeAdminPassword
  window.closeUserManagement = closeUserManagement
  window.sincronizarLoginConFirebase = sincronizarLoginConFirebase
  
  