/* ======================================================
   MathHub — Sidebar & Navigation Logic
   ====================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Active sidebar link based on current page ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const sidebarLinks = document.querySelectorAll('.sidebar-link');

  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || 
        (currentPage === '' && href === 'index.html') ||
        (currentPage === '/' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // --- Mobile sidebar toggle ---
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.3);
    z-index: 35; display: none; opacity: 0; transition: opacity 0.3s ease;
  `;
  document.body.appendChild(overlay);

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      const isOpen = sidebar.classList.contains('open');
      overlay.style.display = isOpen ? 'block' : 'none';
      requestAnimationFrame(() => {
        overlay.style.opacity = isOpen ? '1' : '0';
      });
    });
  }

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  });
});
