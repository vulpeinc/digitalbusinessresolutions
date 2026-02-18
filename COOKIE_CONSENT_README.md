# Sistema de Consentimento de Cookies - Documentação

## Visão Geral

Este sistema implementa um consentimento de cookies compatível com LGPD/GDPR que permite aos usuários controlar quais tipos de cookies são aceitos no site.

## Arquivos Criados

1. **cookie-consent.js** - Lógica principal do sistema de consentimento
2. **styles.css** - Estilos para banner e modal de cookies (adicionados ao arquivo existente)
3. **privacy-policy.html** - Página de Política de Privacidade
4. **cookie-policy.html** - Página de Política de Cookies

## Como Funciona

### 1. Banner de Cookies

Quando um usuário visita o site pela primeira vez (ou se não houver consentimento salvo), um banner aparece na parte inferior da página com três opções:
- **Aceitar todos** - Ativa todos os cookies (Necessários + Analytics + Marketing)
- **Rejeitar** - Mantém apenas cookies necessários
- **Gerenciar preferências** - Abre o modal para escolha individual

### 2. Modal de Preferências

O modal permite que o usuário escolha individualmente quais categorias de cookies aceitar:
- **Cookies Necessários** - Sempre ativos (não podem ser desativados)
- **Cookies de Analytics** - Opcional (requer consentimento)
- **Cookies de Marketing** - Opcional (requer consentimento)

### 3. Armazenamento de Consentimento

O consentimento é armazenado em um cookie chamado `cookie_consent` com a seguinte estrutura:

```json
{
  "version": "1.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "necessary": true,
  "analytics": false,
  "marketing": false
}
```

O consentimento expira após 365 dias ou quando a versão é atualizada.

## Como Adicionar Scripts de Analytics/Marketing

### Método 1: Usando Event Listeners (Recomendado)

O sistema dispara eventos customizados quando o usuário consente com categorias específicas. Você pode escutar esses eventos para carregar scripts dinamicamente:

```html
<script>
// Escutar evento de consentimento de Analytics
window.addEventListener('cookieConsent:analytics', function(event) {
    // Carregar Google Analytics apenas se o usuário consentiu
    if (event.detail.analytics) {
        // Exemplo: Google Analytics
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
        
        ga('create', 'UA-XXXXXXXXX-X', 'auto');
        ga('send', 'pageview');
    }
});

// Escutar evento de consentimento de Marketing
window.addEventListener('cookieConsent:marketing', function(event) {
    // Carregar scripts de marketing apenas se o usuário consentiu
    if (event.detail.marketing) {
        // Exemplo: Facebook Pixel
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', 'SEU_PIXEL_ID');
        fbq('track', 'PageView');
    }
});
</script>
```

### Método 2: Verificando Consentimento Antes de Carregar

Você também pode verificar o consentimento antes de carregar scripts:

```html
<script>
// Verificar se Analytics está permitido antes de carregar
if (window.CookieConsent && window.CookieConsent.isCategoryAllowed('analytics')) {
    // Carregar script de Analytics
    var script = document.createElement('script');
    script.src = 'https://www.google-analytics.com/analytics.js';
    script.async = true;
    document.head.appendChild(script);
}

// Verificar se Marketing está permitido antes de carregar
if (window.CookieConsent && window.CookieConsent.isCategoryAllowed('marketing')) {
    // Carregar script de Marketing
    var script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.async = true;
    document.head.appendChild(script);
}
</script>
```

### Método 3: Bloquear Scripts Existentes

Se você já tem scripts de analytics/marketing no HTML, você pode envolvê-los em uma verificação:

```html
<!-- ANTES (NÃO FAÇA ISSO) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>

<!-- DEPOIS (CORRETO) -->
<script>
window.addEventListener('cookieConsent:analytics', function(event) {
    if (event.detail.analytics) {
        // Carregar Google Tag Manager apenas após consentimento
        var script1 = document.createElement('script');
        script1.async = true;
        script1.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
        document.head.appendChild(script1);
        
        var script2 = document.createElement('script');
        script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
        `;
        document.head.appendChild(script2);
    }
});
</script>
```

## API Pública

O sistema expõe uma API global `window.CookieConsent` com os seguintes métodos:

### `hasConsent()`
Retorna `true` se o usuário já deu consentimento (aceitou ou rejeitou).

```javascript
if (window.CookieConsent.hasConsent()) {
    console.log('Usuário já deu consentimento');
}
```

### `isCategoryAllowed(category)`
Verifica se uma categoria específica está permitida.

```javascript
if (window.CookieConsent.isCategoryAllowed('analytics')) {
    // Carregar analytics
}
```

Categorias disponíveis:
- `'necessary'` - Sempre retorna `true`
- `'analytics'` - Retorna `true` se o usuário consentiu
- `'marketing'` - Retorna `true` se o usuário consentiu

### `getConsent()`
Retorna o objeto de consentimento completo ou `null` se não houver consentimento.

```javascript
const consent = window.CookieConsent.getConsent();
if (consent) {
    console.log('Analytics:', consent.analytics);
    console.log('Marketing:', consent.marketing);
}
```

### `showBanner()`
Força a exibição do banner de cookies (útil para testes ou reset).

```javascript
window.CookieConsent.showBanner();
```

### `showModal()`
Abre o modal de preferências.

```javascript
window.CookieConsent.showModal();
```

### `reset()`
Remove o consentimento salvo e mostra o banner novamente.

```javascript
window.CookieConsent.reset();
```

## Eventos Customizados

O sistema dispara os seguintes eventos quando scripts devem ser carregados:

### `cookieConsent:necessary`
Disparado quando cookies necessários estão ativos (sempre).

### `cookieConsent:analytics`
Disparado quando o usuário consente com cookies de analytics.

### `cookieConsent:marketing`
Disparado quando o usuário consente com cookies de marketing.

## Exemplo Completo: Google Analytics

```html
<!DOCTYPE html>
<html>
<head>
    <!-- NÃO adicione o script do GA aqui diretamente -->
</head>
<body>
    <!-- Seu conteúdo -->
    
    <!-- Sistema de cookies -->
    <script src="cookie-consent.js"></script>
    
    <!-- Carregar GA apenas após consentimento -->
    <script>
    window.addEventListener('cookieConsent:analytics', function(event) {
        if (event.detail.analytics) {
            // Google Analytics
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
            
            ga('create', 'UA-XXXXXXXXX-X', 'auto');
            ga('send', 'pageview');
        }
    });
    
    // Se o usuário já tinha consentido antes, carregar imediatamente
    if (window.CookieConsent && window.CookieConsent.isCategoryAllowed('analytics')) {
        window.dispatchEvent(new CustomEvent('cookieConsent:analytics', {
            detail: window.CookieConsent.getConsent()
        }));
    }
    </script>
</body>
</html>
```

## Personalização

### Alterar Duração do Consentimento

No arquivo `cookie-consent.js`, altere a constante:

```javascript
const CONSENT_EXPIRY_DAYS = 365; // Altere para o número de dias desejado
```

### Alterar Versão do Consentimento

Para forçar todos os usuários a revisarem o consentimento (útil após mudanças na política), altere:

```javascript
const CONSENT_VERSION = '1.0'; // Altere para '2.0', '3.0', etc.
```

### Personalizar Cores

Os estilos estão no arquivo `styles.css`. Procure por `/* Cookie Consent System Styles */` e ajuste as cores usando as variáveis CSS:

```css
:root {
    --brand-primary: #3156BE;
    --brand-primary-dark: #2545A0;
}
```

## Testando

### Testar o Banner

1. Abra o DevTools do navegador
2. Vá para Application > Cookies
3. Delete o cookie `cookie_consent`
4. Recarregue a página
5. O banner deve aparecer

### Testar Reset

No console do navegador:

```javascript
window.CookieConsent.reset();
```

### Verificar Consentimento

```javascript
console.log(window.CookieConsent.getConsent());
```

## Compatibilidade

- ✅ Chrome/Edge (últimas versões)
- ✅ Firefox (últimas versões)
- ✅ Safari (últimas versões)
- ✅ Mobile browsers
- ✅ Acessibilidade (ARIA labels, focus trap, keyboard navigation)
- ✅ Dark mode (suportado)

## Suporte

Para dúvidas ou problemas, entre em contato: info@digitalbusinessresolutions.com
