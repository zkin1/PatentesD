document.addEventListener('DOMContentLoaded', function() {
    const toggler = document.getElementById('navbar-toggler');
    const navMenu = document.getElementById('navbar-nav');
  
    toggler.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  });