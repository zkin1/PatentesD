const BASE_URL = 'http://localhost:3000';
const APP_URL = '/html'; // Ajusta esto según tu configuración

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
    mostrarMensaje('Sesión cerrada exitosamente', 'success');
    setTimeout(() => {
      window.location.href = `${APP_URL}/index.html`;
    }, 1500);
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
  const mensajeElement = $('#mensaje');
  if (mensajeElement) {
    mensajeElement.textContent = mensaje;
    mensajeElement.className = `mensaje ${tipo}`;
    mensajeElement.style.display = 'block';
    setTimeout(() => { mensajeElement.style.display = 'none'; }, 3000);
  } else {
    alert(mensaje);
  }
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
    if (data.valido) {
      AppState.setUsuario({
        nombre: data.usuario.nombre,
        correoInstitucional: data.usuario.correoInstitucional,
        token: data.token 
      });
      mostrarMensaje('Inicio de sesión exitoso', 'success');
      setTimeout(() => {
        window.location.href = `${APP_URL}/index.html`;
      }, 1500);
    } else {
      mostrarMensaje('Credenciales inválidas', 'error');
    }
  } catch (error) {
    mostrarMensaje('Error en el inicio de sesión: ' + error.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const usuario = {
    nombre: $('#register-nombre').value,
    correoInstitucional: $('#register-email').value,
    contraseña: $('#register-password').value,
    numeroPatente: $('#register-patente').value.toUpperCase(),
    numeroTelefono: $('#register-telefono').value
  };
  if (!validarPatente(usuario.numeroPatente)) {
    mostrarMensaje('Formato de patente inválido. Use AA1000 o BBBB10.', 'error');
    return;
  }
  try {
    const verificacionResponse = await fetch(`${BASE_URL}/verificarPatente/${usuario.numeroPatente}`);
    if (verificacionResponse.ok) {
      mostrarMensaje('La patente ya está registrada.', 'error');
      return;
    }
    const response = await fetch(`${BASE_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario)
    });
    if (response.ok) {
      mostrarMensaje('Registro exitoso', 'success');
      setTimeout(() => {
        window.location.href = `${APP_URL}/login.html`;
      }, 1500);
    } else {
      throw new Error('Error en el registro');
    }
  } catch (error) {
    mostrarMensaje('Error en el registro: ' + error.message, 'error');
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
      'Content-Type': 'application/json'
    };
    if (AppState.usuario && AppState.usuario.token) {
      headers['Authorization'] = `Bearer ${AppState.usuario.token}`;
    }
    const response = await fetch(`${BASE_URL}/buscarPorPatente/${numeroPatente}`, {
      headers: headers
    });
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
    const response = await fetch(`${BASE_URL}/consultasRegistradas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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