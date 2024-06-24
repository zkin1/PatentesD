document.addEventListener('DOMContentLoaded', function () {
  const toggler = document.getElementById('navbar-toggler');
  const navMenu = document.getElementById('navbar-nav');

  if (toggler) {
    toggler.addEventListener('click', function () {
      navMenu.classList.toggle('active');
    });
  }

  // Llamar a updateNavBar al cargar la página
  updateNavBar();

  // Manejo de formulario de inicio de sesión
  const loginForm = document.querySelector('.sign-in-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailInput = loginForm.querySelector('input[type="text"]');
      const passwordInput = loginForm.querySelector('input[type="password"]');

      const correoInstitucional = emailInput.value;
      const contraseña = passwordInput.value;

      iniciarSesion(correoInstitucional, contraseña);
    });
  }

  // Manejo de formulario de registro
  const registerForm = document.querySelector('.register-in-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const nombreInput = registerForm.querySelector('input[placeholder="Nombre"]');
      const emailInput = registerForm.querySelector('input[placeholder="Correo institucional"]');
      const passwordInput = registerForm.querySelector('input[placeholder="Contraseña"]');
      const patenteInput = registerForm.querySelector('input[placeholder="Numero Patente (ABC123)"]');
      const telefonoInput = registerForm.querySelector('input[placeholder="Número telefónico"]');

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

  // Manejo del formulario de búsqueda de patentes
  const searchForm = document.querySelector('.search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const patenteInput = document.getElementById('patente-input');
      const numeroPatente = patenteInput.value.trim();

      if (numeroPatente) {
        buscarPorPatente(numeroPatente);
      }
    });
  }
});

// Función para actualizar la barra de navegación
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

// Función para cerrar sesión
window.logout = function () {
  localStorage.removeItem('usuarioLogueado');
  updateNavBar();
  window.location.href = 'index.html';
}

// Función asincrónica para manejar el inicio de sesión
async function iniciarSesion(correoInstitucional, contraseña) {
  try {
    const response = await fetch('http://localhost:3000/usuarios');
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

// Función asincrónica para manejar el registro de usuarios
async function registrarUsuario(usuario) {
  try {
    const response = await fetch('http://localhost:3000/usuarios', {
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
    window.location.href = 'login.html'; // Redirige al usuario a la página de inicio de sesión después del registro
  } catch (error) {
    console.error('Error:', error);
    alert('Error en el registro: ' + error.message);
  }
}

// Función asincrónica para buscar un usuario por su número de patente
async function buscarPorPatente(numeroPatente) {
  try {
    const response = await fetch('http://localhost:3000/usuarios');
    if (!response.ok) {
      throw new Error('Error en la respuesta de la red');
    }

    const usuarios = await response.json();
    const usuarioEncontrado = usuarios.find(usuario =>
      usuario.numeroPatente === numeroPatente
    );

    const resultadosDiv = document.getElementById('search-results');
    resultadosDiv.innerHTML = ''; // Limpiar los resultados anteriores

    if (usuarioEncontrado) {
      resultadosDiv.style.display = 'block';
      resultadosDiv.innerHTML = `
        <p>Nombre: ${usuarioEncontrado.nombre}</p>
        <p>Número de Teléfono: ${usuarioEncontrado.numeroTelefono}</p>
        <p>Patente: ${usuarioEncontrado.numeroPatente}</p>
      `;
    } else {
      resultadosDiv.style.display = 'block';
      resultadosDiv.innerHTML = '<p>No se encontró ningún usuario con esa patente.</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error en la búsqueda: ' + error.message);
  }
}
