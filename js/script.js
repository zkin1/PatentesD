//Funcion para el nav en dispositivos moviles 
document.addEventListener('DOMContentLoaded', function() {
  const toggler = document.getElementById('navbar-toggler');
  const navMenu = document.getElementById('navbar-nav');

  toggler.addEventListener('click', function() {
    navMenu.classList.toggle('active');
  });
});

//Inicio sesion
const loginForm = document.querySelector('.sign-in-form');

loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const emailInput = loginForm.querySelector('input[type="text"]');
  const passwordInput = loginForm.querySelector('input[type="password"]');
  
  const correoInstitucional = emailInput.value;
  const contraseña = passwordInput.value;
  
  // Realiza la solicitud a la API de usuarios
  fetch('http://localhost:3000/usuarios')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(usuarios => {
      const usuarioEncontrado = usuarios.find(usuario => 
        usuario.correoInstitucional === correoInstitucional && 
        usuario.contraseña === contraseña
      );
      
      if (usuarioEncontrado) {
        alert('Inicio de sesión exitoso');
        window.location.href = 'index.html';
      } else {
        alert('Error en el inicio de sesión: Credenciales inválidas');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error en el inicio de sesión: ' + error.message);
    });
});