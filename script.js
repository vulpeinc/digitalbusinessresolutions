// Sistema de navegação entre páginas e dark mode
document.addEventListener('DOMContentLoaded', function() {
    // Loading Screen
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    
    // Função para mostrar a tela de loading
    function showLoadingScreen() {
        if (loadingScreen && loadingBar) {
            loadingScreen.style.display = 'flex';
            loadingScreen.classList.remove('hidden');
            // Reset da barra de progresso
            loadingBar.style.width = '0%';
            // Força reflow para garantir que a animação comece do zero
            void loadingBar.offsetWidth;
            // Inicia animação
            setTimeout(() => {
                loadingBar.style.width = '100%';
            }, 10);
        }
    }
    
    // Função para esconder a tela de loading
    function hideLoadingScreen() {
        if (loadingScreen) {
            // Aguarda a animação da barra completar (1.5s) + um pequeno delay
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                // Remove do DOM após a transição
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1600);
        }
    }
    
    // Verifica se a página já está carregada (apenas no carregamento inicial)
    if (document.readyState === 'complete') {
        hideLoadingScreen();
    } else {
        window.addEventListener('load', hideLoadingScreen);
    }

    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const footerLinks = document.querySelectorAll('.footer-nav a[data-page]');
    
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    
    if (darkModeToggle) {
        // Verifica se há preferência salva
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Aplica tema salvo ou preferência do sistema
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            body.classList.add('dark-mode');
            darkModeToggle.classList.add('active');
            darkModeToggle.setAttribute('aria-checked', 'true');
            darkModeToggle.querySelector('.toggle-icon').textContent = '☀️';
        } else {
            darkModeToggle.setAttribute('aria-checked', 'false');
        }
        
        // Alterna dark mode
        darkModeToggle.addEventListener('click', function() {
            body.classList.toggle('dark-mode');
            darkModeToggle.classList.toggle('active');
            
            // Atualiza aria-checked
            const isDark = body.classList.contains('dark-mode');
            darkModeToggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
            
            // Salva preferência
            if (isDark) {
                localStorage.setItem('theme', 'dark');
                darkModeToggle.querySelector('.toggle-icon').textContent = '☀️';
            } else {
                localStorage.setItem('theme', 'light');
                darkModeToggle.querySelector('.toggle-icon').textContent = '🌙';
            }
        });
    }

    // Mapeamento de títulos das páginas (padrão: "Página — Marca")
    const pageTitles = {
        'home': 'Digital Business Resolutions LLC — Digital Strategy & International Tax Optimization',
        'quem-somos': 'About Us — Digital Business Resolutions LLC'
        // Adicione novas páginas aqui seguindo o padrão "Nome da Página — Digital Business Resolutions LLC"
    };

    // Função para trocar de página
    function switchPage(targetPage) {
        // Mostra a tela de loading
        showLoadingScreen();
        
        // Remove a classe active de todas as páginas
        pages.forEach(page => {
            page.classList.remove('active');
        });

        // Remove a classe active de todos os links e aria-current
        navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });
        
        // Remove aria-current do footer também
        footerLinks.forEach(link => {
            link.removeAttribute('aria-current');
        });
        
        // Adiciona a classe active e aria-current no link correspondente
        const selectedLink = document.querySelector(`[data-page="${targetPage}"]`);
        if (selectedLink) {
            selectedLink.classList.add('active');
            selectedLink.setAttribute('aria-current', 'page');
        }
        
        // Atualiza também no footer se existir
        footerLinks.forEach(link => {
            if (link.getAttribute('data-page') === targetPage) {
                link.setAttribute('aria-current', 'page');
            }
        });

        // Pequeno delay para animação suave
        setTimeout(() => {
            // Adiciona a classe active na página selecionada
            const selectedPage = document.getElementById(targetPage);
            if (selectedPage) {
                selectedPage.classList.add('active');
            }

            // Atualiza o título da página seguindo o padrão "Página — Marca"
            if (pageTitles[targetPage]) {
                document.title = pageTitles[targetPage];
            } else {
                // Fallback caso a página não esteja no mapeamento
                const pageName = targetPage.charAt(0).toUpperCase() + targetPage.slice(1).replace('-', ' ');
                document.title = `${pageName} — Digital Business Resolutions LLC`;
            }

            // Esconde a tela de loading após a transição
            hideLoadingScreen();

            // Scroll suave para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    }

    // Adiciona evento de clique em cada link de navegação do header
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            switchPage(targetPage);
        });
    });

    // Adiciona evento de clique em cada link de navegação do footer
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            switchPage(targetPage);
        });
    });

    // Adiciona interatividade ao botão CTA do hero
    const ctaButton = document.querySelector('#cta-hero');
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Garante que estamos na página home
            const homePage = document.getElementById('home');
            if (!homePage.classList.contains('active')) {
                switchPage('home');
                // Aguarda a página carregar antes de fazer scroll
                setTimeout(() => {
                    scrollToSection('como-trabalhamos');
                }, 300);
            } else {
                scrollToSection('como-trabalhamos');
            }
        });
    }

    // Função para scroll suave até uma seção
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const sectionPosition = section.offsetTop - headerHeight - 20;
            window.scrollTo({
                top: sectionPosition,
                behavior: 'smooth'
            });
        }
    }

    // Trata links de âncora em geral (para acessibilidade)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            // Se não for um link de navegação de página, trata como âncora
            if (href !== '#' && !this.hasAttribute('data-page')) {
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                // Se a seção existe e estamos na mesma página, faz scroll suave
                if (targetElement) {
                    const currentPage = document.querySelector('.page.active');
                    if (currentPage && currentPage.contains(targetElement)) {
                        e.preventDefault();
                        scrollToSection(targetId);
                    }
                }
            }
        });
    });
});
