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
    mensajeElement.style.opacity = '1';
    
    // Animación de desvanecimiento
    setTimeout(() => {
      let opacity = 1;
      const fadeInterval = setInterval(() => {
        if (opacity <= 0) {
          clearInterval(fadeInterval);
          mensajeElement.style.display = 'none';
        } else {
          opacity -= 0.1;
          mensajeElement.style.opacity = opacity;
        }
      }, 50);
    }, 2500); // Comienza a desvanecerse después de 2.5 segundos
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
    if (response.ok) {
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
      mostrarMensaje(data.message || 'Error en el inicio de sesión', 'error');
    }
  } catch (error) {
    mostrarMensaje('Error en el inicio de sesión: ' + error.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  console.log('Iniciando proceso de registro');

  const usuario = {
    nombre: $('#register-nombre').value.trim(),
    correoInstitucional: $('#register-email').value.trim(),
    contraseña: $('#register-password').value,
    numeroPatente: $('#register-patente').value.trim().toUpperCase(),
    numeroTelefono: $('#register-telefono').value.trim()
  };

  console.log('Datos a enviar:', usuario);

  if (!validarPatente(usuario.numeroPatente)) {
    mostrarMensaje('Formato de patente inválido. Use AA1000 o BBBB10.', 'error');
    return;
  }

  try {
    console.log('Enviando solicitud al servidor');
    const response = await fetch(`${BASE_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario)
    });

    const data = await response.json();
    console.log('Respuesta del servidor:', data);
    
    if (response.ok) {
      console.log('Registro exitoso, iniciando sesión automáticamente');
      mostrarMensaje('Registro exitoso. Iniciando sesión automáticamente', 'success');
      
      // Iniciar sesión automáticamente y redirigir a index.html
      await autoLogin(usuario.correoInstitucional, usuario.contraseña);
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
      mostrarMensaje('Inicio de sesión exitoso', 'success');
      
      setTimeout(() => {
        window.location.href = `${APP_URL}/index.html`;
      }, 3000); // Redirigir después de 3 segundos
    } else {
      throw new Error(data.message || 'Error en el inicio de sesión automático');
    }
  } catch (error) {
    console.error('Error en el inicio de sesión automático:', error);
    mostrarMensaje('Error en el inicio de sesión automático. Por favor, intenta iniciar sesión manualmente.', 'error');
  }
}


async function autoLogin(correoInstitucional, contraseña) {
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
      mostrarMensaje('Inicio de sesión exitoso', 'success');
      setTimeout(() => {
        window.location.href = `${APP_URL}/index.html`;
      }, 2500 );
    } else {
      throw new Error(data.message || 'Error en el inicio de sesión automático');
    }
  } catch (error) {
    console.error('Error en el inicio de sesión automático:', error);
    mostrarMensaje('Error en el inicio de sesión automático. Por favor, intenta iniciar sesión manualmente.', 'error');
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