import re
import codecs

with codecs.open('/Users/pablosalas/scr-agent/presentation/centinela-ia.html', 'r', 'utf-8') as f:
    html = f.read()

# 1. Text Replacements
html = html.replace('Inteligencia: 6 Patrones y 6 Funcionalidades', 'Inteligencia: Patrones y Funcionalidades')
html = html.replace('🛡️ Top 6 Patrones Detectados', '🛡️ Patrones Detectados')
html = html.replace('⚡ Top 6 Capacidades Analíticas', '⚡ Capacidades Analíticas')
html = html.replace('Privacidad Perimetral (Zero-Trust)', 'Privacidad y Aislamiento Matemático')

# 2. Hero buttons removal
# Specifically on lines around 762:
html = re.sub(r'<div class="cta-buttons" style="margin-top: 2rem;">.*?</div>', '', html, flags=re.DOTALL)

# 3. CSS for Hovers
html = html.replace('.agent-card:hover .agent-hover-modal {', '.agent-card:hover .agent-hover-modal,\n        .card:hover .agent-hover-modal,\n        .glass:hover .agent-hover-modal {')
html = html.replace('.card {\n            background: rgba(31, 41, 55, 0.5);', '.card {\n            position: relative;\n            background: rgba(31, 41, 55, 0.5);')
html = html.replace('class="glass" style="padding: 2rem;', 'class="glass" style="position: relative; padding: 2rem;')

# 4. Inject `.agent-hover-modal` into `.card`
def inject_modal(match):
    # Match contains the inner HTML of the card or glass
    content = match.group(1)
    
    # Don't inject if it already has one
    if 'agent-hover-modal' in content:
        return match.group(0)

    # Extract title from <h3>
    title_match = re.search(r'<h3>(.*?)</h3>', content)
    title = title_match.group(1) if title_match else "Inspección Profunda"
    
    # Build generic bullets
    modal = f"""
                    <div class="agent-hover-modal">
                        <h4>{title}</h4>
                        <ul>
                            <li><strong>Triangulación Lógica:</strong> Caza paralela de heurísticas y funciones anómalas.</li>
                            <li><strong>Consenso Táctico:</strong> Determinación sin firmas previas usando Inteligencia Artificial.</li>
                            <li><strong>Contención Directa:</strong> Escalación de incidentes listos para mitigación inmediata.</li>
                        </ul>
                    </div>"""
    return match.group(0).rstrip() + modal + "\n                "

# We can match `.card` start, then match until the closing div. 
# Better: just split by `<div class="card">` and `</div>` using a state machine.
new_html = ""
parts = html.split('<div class="card">')
new_html += parts[0]
for part in parts[1:]:
    subparts = part.split('</div>')
    # The first subpart is the content of the card.
    
    # We reconstruct the card content
    card_content = subparts[0]
    
    title_match = re.search(r'<h3>(.*?)</h3>', card_content)
    title = title_match.group(1) if title_match else "Inspección de Ciberseguridad"
    
    modal = f"""
                    <div class="agent-hover-modal">
                        <h4>{title}</h4>
                        <ul>
                            <li><strong>Triangulación Lógica:</strong> Identificación paralela de heurísticas anómalas.</li>
                            <li><strong>Consenso Táctico:</strong> Auditoría libre de firmas estáticas vía IA.</li>
                            <li><strong>Contención Inmediata:</strong> Escalabilidad directa a mitigación forense.</li>
                        </ul>
                    </div>"""
    
    # Replace the card content with injected modal right before the closing div
    new_card = '<div class="card">' + card_content + modal + '\n                </div>'
    new_html += new_card + '</div>'.join(subparts[1:])

html = new_html

# 5. Inject `.agent-hover-modal` into `.glass` inside Architecture
new_html = ""
parts = html.split('<div class="glass" style="position: relative;')
new_html += parts[0]
for part in parts[1:]:
    subparts = part.split('</div>\n                <div')
    
    # Let's split securely by looking for the last </div> before the next glass or something.
    pass

# We will just write a regex for .glass since they are very well formatted!
def repl_glass(m):
    return m.group(0) + f"""
                    <div class="agent-hover-modal">
                        <h4>Arquitectura de Ecosistema</h4>
                        <ul>
                            <li><strong>Aislamiento Seguro:</strong> Ejecución encapsulada sin red externa.</li>
                            <li><strong>Rendimiento Crítico:</strong> Escalado asíncrono para repositorios gigantes.</li>
                            <li><strong>Resiliencia:</strong> Alta disponibilidad interconectada.</li>
                        </ul>
                    </div>"""

html = re.sub(r'(<div class="glass"[^>]*>.*?)</p>\n                ', repl_glass, html, flags=re.DOTALL)

with codecs.open('/Users/pablosalas/scr-agent/presentation/centinela-ia.html', 'w', 'utf-8') as f:
    f.write(html)
