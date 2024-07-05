// URL base del nuevo servidor en Render
const BASE_URL = 'https://conexion-patentesd.onrender.com';

document.addEventListener('DOMContentLoaded', function () {
  const toggler = document.getElementById('navbar-toggler');
  const navMenu = document.getElementById('navbar-nav');

  if (toggler) {
    toggler.addEventListener('click', function () {
      navMenu.classList.toggle('active');
    });
  }

  updateNavBar();

  const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
  const searchContainer = document.getElementById('search-container');
  const notLoggedInMessage = document.getElementById('not-logged-in-message');

  if (usuarioLogueado) {
    if (searchContainer) searchContainer.style.display = 'block';
    if (notLoggedInMessage) notLoggedInMessage.style.display = 'none';
  } else {
    if (searchContainer) searchContainer.style.display = 'none';
    if (notLoggedInMessage) notLoggedInMessage.style.display = 'block';
  }

  const loginForm = document.querySelector('.sign-in-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');

      const correoInstitucional = emailInput.value;
      const contraseña = passwordInput.value;

      iniciarSesion(correoInstitucional, contraseña);
    });
  }

  const registerForm = document.querySelector('.register-in-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const nombreInput = document.getElementById('register-nombre');
      const emailInput = document.getElementById('register-email');
      const passwordInput = document.getElementById('register-password');
      const patenteInput = document.getElementById('register-patente');
      const telefonoInput = document.getElementById('register-telefono');

      const usuario = {
        nombre: nombreInput.value,
        correoInstitucional: emailInput.value,
        contraseña: passwordInput.value,
        numeroPatente: patenteInput.value,
        numeroTelefono: telefonoInput.value
      };

      registrarUsuario(usuario);
    });
  }

  const searchForm = document.querySelector('.search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
      if (!usuarioLogueado) {
        alert('Debe iniciar sesión para buscar por patente.');
        return;
      }

      const patenteInput = document.getElementById('patente-input');
      const numeroPatente = patenteInput.value.trim();

      if (numeroPatente) {
        buscarPorPatente(numeroPatente);
      }
    });
  }
});

function updateNavBar() {
  const userInfo = document.getElementById('user-info');
  const usernameDisplay = document.getElementById('username-display');
  const loginLink = document.getElementById('login-link');
  const registroLink = document.getElementById('registro-link');
  const logoutLink = document.getElementById('logout-link');

  const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));

  if (usuario) {
    if (userInfo) userInfo.style.display = 'block';
    if (usernameDisplay) usernameDisplay.textContent = usuario.nombre;
    if (loginLink) loginLink.style.display = 'none';
    if (registroLink) registroLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'block';
  } else {
    if (userInfo) userInfo.style.display = 'none';
    if (loginLink) loginLink.style.display = 'block';
    if (registroLink) registroLink.style.display = 'block';
    if (logoutLink) logoutLink.style.display = 'none';
  }
}

window.logout = function () {
  localStorage.removeItem('usuarioLogueado');
  updateNavBar();
  window.location.href = 'index.html';
}

async function iniciarSesion(correoInstitucional, contraseña) {
  try {
    const response = await fetch(`${BASE_URL}/usuarios`);
    if (!response.ok) {
      throw new Error('Error en la respuesta de la red');
    }

    const usuarios = await response.json();
    const usuarioEncontrado = usuarios.find(usuario =>
      usuario.correoInstitucional === correoInstitucional &&
      usuario.contraseña === contraseña
    );

    if (usuarioEncontrado) {
      localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioEncontrado));
      alert('Inicio de sesión exitoso');
      updateNavBar();
      window.location.href = 'index.html';
    } else {
      alert('Error en el inicio de sesión: Credenciales inválidas');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error en el inicio de sesión: ' + error.message);
  }
}

async function registrarUsuario(usuario) {
  try {
    const response = await fetch(`${BASE_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(usuario)
    });

    if (!response.ok) {
      throw new Error('Error en la respuesta de la red');
    }

    const data = await response.json();
    alert('Registro exitoso');
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error:', error);
    alert('Error en el registro: ' + error.message);
  }
}

async function buscarPorPatente(numeroPatente) {
  try {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (!usuarioLogueado) {
      alert('Debe iniciar sesión para buscar por patente.');
      return;
    }

    // Buscar el usuario por número de patente
    const response = await fetch(`${BASE_URL}/buscarPorPatente/${numeroPatente}`);
    if (!response.ok) {
      throw new Error('Error en la respuesta de la red');
    }

    const usuarioEncontrado = await response.json();

    const resultadosDiv = document.getElementById('search-results');
    resultadosDiv.innerHTML = ''; // Limpiar los resultados anteriores

    if (usuarioEncontrado) {
      resultadosDiv.style.display = 'block';
      resultadosDiv.innerHTML = `
        <p>Nombre: ${usuarioEncontrado.nombre}</p>
        <p>Número de Teléfono: ${usuarioEncontrado.numeroTelefono}</p>
        <p>Patente: ${usuarioEncontrado.numeroPatente}</p>
      `;

      // Registrar la consulta después de la búsqueda
      await registrarConsulta(usuarioLogueado.correoInstitucional, numeroPatente);
    } else {
      resultadosDiv.style.display = 'block';
      resultadosDiv.innerHTML = '<p>No se encontró ningún usuario con esa patente.</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error en la búsqueda: ' + error.message);
  }
}

async function registrarConsulta(correoUsuario, numeroPatente) {
  try {
    const response = await fetch(`${BASE_URL}/consultasRegistradas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ correoUsuario, numeroPatente })
    });

    if (!response.ok) {
      throw new Error('Error en la respuesta de la red');
    }

    const data = await response.json();
    console.log('Consulta registrada:', data);
  } catch (error) {
    console.error('Error al registrar la consulta:', error);
  }
}