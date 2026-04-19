# Debug Script para la Consola del Navegador

Copia y pega esto en la consola del navegador (F12 > Console) para debuggear:

```javascript
// Check 1: Verify API calls
console.log('=== Checking API Endpoints ===');
fetch('http://localhost:3001/api/v1/analytics/summary', {
  credentials: 'include',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
})
.then(r => r.json())
.then(d => console.log('Analytics Summary:', d))
.catch(e => console.error('Analytics Error:', e));

fetch('http://localhost:3001/api/v1/projects', {
  credentials: 'include',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
})
.then(r => r.json())
.then(d => console.log('Projects:', d))
.catch(e => console.error('Projects Error:', e));

// Check 2: Verify WebSocket Connection
console.log('\n=== Checking WebSocket ===');
setTimeout(() => {
  console.log('WebSocket Connected:', window.socketClientService?.isConnected());
  console.log('User ID:', window.socketClientService?.getUserId());
}, 1000);

// Check 3: Verify Auth Token
console.log('\n=== Checking Auth ===');
console.log('Auth Token exists:', !!localStorage.getItem('auth_token'));
console.log('Auth User:', localStorage.getItem('auth_user'));

// Check 4: Look for React errors
console.log('\n=== Checking for Console Errors ===');
console.log('(Check above for any red error messages)');
```

## Pasos:

1. Abre tu navegador en: `https://worst-negate-brussels.ngrok-free.dev`
2. Presiona F12 para abrir DevTools
3. Ve a la pestaña **Console**
4. **Copia y pega el script arriba** y presiona Enter
5. **Toma un screenshot de los resultados**
6. Pégame los errores que ves

Esto me dirá exactamente qué está fallando.
