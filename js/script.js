const BASE_URL = 'http://localhost:3000';
const APP_URL = '/html'; 

// Funciones de utilidad
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const validarPatente = (patente) => /^[A-Z]{2}\d{4}$|^[A-Z]{4}\d{2}$/.test(patente);

// Gestión del estado de la aplicación
const AppState = {
  usuario: JSON.parse(localStorage.getItem('usuarioLogueado')) || null,
  ultimaBusqueda: JSON.parse(localStorage.getItem('ultimaBusqueda')) || null,
  setUsuario(usuario) {
    this.usuario = usuario;
    localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
    this.actualizarUI();
  },
  setUltimaBusqueda(busqueda) {
    this.ultimaBusqueda = busqueda;
    localStorage.setItem('ultimaBusqueda', JSON.stringify(busqueda));
  },
  logout() {
    this.usuario = null;
    localStorage.removeItem('usuarioLogueado');
    this.limpiarResultadosBusqueda();
    this.actualizarUI();
    localStorage.setItem('mensajeLogout', 'Sesión cerrada exitosamente');
    window.location.href = `${APP_URL}/index.html`;
  },
  actualizarUI() {
    updateNavBar();
    toggleSearchFormVisibility();
    mostrarUltimaBusqueda();
  },
  limpiarResultadosBusqueda() {
    this.ultimaBusqueda = null;
    localStorage.removeItem('ultimaBusqueda');
    const searchResults = $('#search-results');
    if (searchResults) {
      searchResults.innerHTML = '';
      searchResults.style.display = 'none';
    }
  }
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, inicializando aplicación');
  AppState.actualizarUI();
  setupEventListeners();

  // Verificar si hay mensajes pendientes
  const mensajeLogin = localStorage.getItem('mensajeLogin');
  if (mensajeLogin) {
    mostrarMensaje(mensajeLogin, 'success');
    localStorage.removeItem('mensajeLogin');
  }

  const mensajeRegistro = localStorage.getItem('mensajeRegistro');
  if (mensajeRegistro) {
    mostrarMensaje(mensajeRegistro, 'success');
    localStorage.removeItem('mensajeRegistro');
  }

  const mensajeLogout = localStorage.getItem('mensajeLogout');
  if (mensajeLogout) {
    mostrarMensaje(mensajeLogout, 'success');
    localStorage.removeItem('mensajeLogout');
  }
});

function setupEventListeners() {
  console.log('Configurando event listeners');
  $('#navbar-toggler')?.addEventListener('click', toggleNavbar);
  $('.sign-in-form')?.addEventListener('submit', handleLogin);
  $('.register-in-form')?.addEventListener('submit', handleRegister);
  $('.search-form')?.addEventListener('submit', handleSearch);
  $('#logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    AppState.logout();
  });
}

function updateNavBar() {
  const isLoggedIn = !!AppState.usuario;
  const elements = {
    userInfo: $('#user-info'),
    usernameDisplay: $('#username-display'),
    loginLink: $('#login-link'),
    registroLink: $('#registro-link'),
    logoutLink: $('#logout-link'),
    searchWrap: $('.search-wrap')
  };

  Object.entries(elements).forEach(([key, element]) => {
    if (element) {
      switch (key) {
        case 'userInfo':
          element.style.display = isLoggedIn ? 'block' : 'none';
          break;
        case 'usernameDisplay':
          if (isLoggedIn) element.textContent = AppState.usuario.nombre;
          break;
        case 'loginLink':
        case 'registroLink':
          element.style.display = isLoggedIn ? 'none' : 'block';
          break;
        case 'logoutLink':
          element.style.display = isLoggedIn ? 'block' : 'none';
          break;
        case 'searchWrap':
          element.style.display = 'block'; // Siempre visible
          break;
      }
    }
  });
}

function toggleNavbar() {
  $('#navbar-nav')?.classList.toggle('active');
}

function toggleSearchFormVisibility() {
  const searchForm = $('.search-form');
  const notLoggedInMessage = $('#not-logged-in-message');
  if (searchForm) {
    const isLoggedIn = !!AppState.usuario;
    searchForm.style.display = 'block'; // Siempre visible
    if (notLoggedInMessage) {
      notLoggedInMessage.style.display = isLoggedIn ? 'none' : 'block';
    }
  }
}

function mostrarMensaje(mensaje, tipo) {
  const mensajeElement = document.createElement('div');
  mensajeElement.textContent = mensaje;
  mensajeElement.className = `mensaje ${tipo}`;
  document.body.appendChild(mensajeElement);

  // Estilo para el mensaje
  mensajeElement.style.position = 'fixed';
  mensajeElement.style.top = '20px';
  mensajeElement.style.left = '50%';
  mensajeElement.style.transform = 'translateX(-50%)';
  mensajeElement.style.padding = '10px';
  mensajeElement.style.borderRadius = '5px';
  mensajeElement.style.backgroundColor = tipo === 'success' ? '#4CAF50' : '#f44336';
  mensajeElement.style.color = 'white';
  mensajeElement.style.zIndex = '1000';

  // Desaparecer después de 5 segundos
  setTimeout(() => {
    mensajeElement.style.transition = 'opacity 1s';
    mensajeElement.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(mensajeElement);
    }, 1000);
  }, 5000);
}

function mostrarUltimaBusqueda() {
  if (AppState.ultimaBusqueda) {
    const searchResults = $('#search-results');
    if (searchResults) {
      searchResults.innerHTML = AppState.ultimaBusqueda.html;
      searchResults.style.display = 'block';
    }
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const correoInstitucional = $('#login-email').value;
  const contraseña = $('#login-password').value;
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correoInstitucional, contraseña })
    });
    const data = await response.json();
    if (response.ok) {
      AppState.setUsuario({
        nombre: data.usuario.nombre,
        correoInstitucional: data.usuario.correoInstitucional,
        token: data.token
      });
      localStorage.setItem('mensajeLogin', 'Inicio de sesión exitoso');
      window.location.href = `${APP_URL}/index.html`;
    } else {
      mostrarMensaje(data.message || 'Error en el inicio de sesión', 'error');
    }
  } catch (error) {
    mostrarMensaje('Error en el inicio de sesión: ' + error.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  console.log('Iniciando proceso de registro');

  const nombre = $('#register-nombre').value.trim();
  const correoInstitucional = $('#register-email').value.trim();
  const contraseña = $('#register-password').value;
  const numeroPatente = $('#register-patente').value.trim().toUpperCase();
  const numeroTelefono = $('#register-telefono').value.trim();

  console.log('Datos a enviar:', { nombre, correoInstitucional, numeroPatente, numeroTelefono });

  if (!validarPatente(numeroPatente)) {
    console.log('Patente inválida');
    mostrarMensaje('Formato de patente inválido. Use AA1000 o BBBB10.', 'error');
    return;
  }

  try {
    console.log('Enviando solicitud al servidor');
    const response = await fetch(`${BASE_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correoInstitucional, contraseña, numeroPatente, numeroTelefono })
    });

    const data = await response.json();
    console.log('Respuesta del servidor:', data);
    
    if (response.ok) {
      console.log('Registro exitoso, preparando para iniciar sesión automáticamente');
      localStorage.setItem('mensajeRegistro', 'Registro exitoso. Sesión iniciada automáticamente.');
      console.log('Iniciando sesión automáticamente');
      await autoLogin(correoInstitucional, contraseña);
    } else {
      const errorMessage = data.errors ? data.errors.map(err => err.msg).join(', ') : data.error || 'Error desconocido';
      console.error('Error en el registro:', errorMessage);
      mostrarMensaje(`Error en el registro: ${errorMessage}`, 'error');
    }
  } catch (error) {
    console.error('Error completo:', error);
    mostrarMensaje('Error en el registro: ' + error.message, 'error');
  }
}

async function autoLogin(correoInstitucional, contraseña) {
  console.log('Iniciando auto-login');
  try {
    console.log('Enviando solicitud de login');
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correoInstitucional, contraseña })
    });
    const data = await response.json();
    console.log('Respuesta del servidor de login:', data);
    
    if (response.ok) {
      console.log('Login exitoso, actualizando AppState');
      AppState.setUsuario({
        nombre: data.usuario.nombre,
        correoInstitucional: data.usuario.correoInstitucional,
        token: data.token
      });
      console.log('AppState actualizado');
      
      console.log('Preparando redirección');
      window.location.href = `${APP_URL}/index.html`;
    } else {
      throw new Error(data.message || 'Error en el inicio de sesión automático');
    }
  } catch (error) {
    console.error('Error en el inicio de sesión automático:', error);
    localStorage.setItem('mensajeRegistro', 'Error en el inicio de sesión automático. Por favor, intenta iniciar sesión manualmente.');
    window.location.href = `${APP_URL}/index.html`;
  }
}

async function handleSearch(e) {
  e.preventDefault();
  const numeroPatente = $('#patente-input').value.trim().toUpperCase();
  if (!validarPatente(numeroPatente)) {
    mostrarMensaje('Formato de patente inválido. Use AA1000 o BBBB10.', 'error');
    return;
  }
  if (!AppState.usuario) {
    mostrarMensaje('Debe iniciar sesión para buscar por patente.', 'error');
    return;
  }
  await buscarPorPatente(numeroPatente);
}

async function buscarPorPatente(numeroPatente) {
  const searchResults = $('#search-results');
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AppState.usuario.token}`
    };
    const response = await fetch(`${BASE_URL}/buscarPorPatente/${numeroPatente}`, {
      headers: headers
    });
    let resultadoHTML;
    if (response.status === 404) {
      resultadoHTML = '<p>Patente aún no registrada</p>';
    } else if (response.ok) {
      const usuarioEncontrado = await response.json();
      if (usuarioEncontrado && usuarioEncontrado.nombre) {
        resultadoHTML = `
          <p>Nombre: ${usuarioEncontrado.nombre}</p>
          <p>Número de Teléfono: ${usuarioEncontrado.numeroTelefono}</p>
          <p>Patente: ${usuarioEncontrado.numeroPatente}</p>
        `;
        await registrarConsulta(AppState.usuario.correoInstitucional, numeroPatente);
      } else {
        resultadoHTML = `<p>No se encontró información para la patente ${numeroPatente}</p>`;
      }
    } else {
      throw new Error(`Error en la respuesta del servidor: ${response.status}`);
    }
    searchResults.innerHTML = resultadoHTML;
    searchResults.style.display = 'block';
    AppState.setUltimaBusqueda({ html: resultadoHTML, patente: numeroPatente });
  } catch (error) {
    searchResults.innerHTML = `<p>Error: ${error.message}</p>`;
    AppState.setUltimaBusqueda({ html: searchResults.innerHTML, patente: numeroPatente });
  }
  console.log('Búsqueda completada, resultados mostrados');
}

async function registrarConsulta(correoUsuario, numeroPatente) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AppState.usuario.token}`
    };
    const response = await fetch(`${BASE_URL}/consultasRegistradas`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ correoUsuario, numeroPatente })
    });
    if (!response.ok) {
      throw new Error('Error al registrar la consulta');
    }
    console.log('Consulta registrada exitosamente');
  } catch (error) {
    console.error('Error al registrar la consulta:', error);
  }
}