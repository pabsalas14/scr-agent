import re

with open('/Users/pablosalas/scr-agent/presentation/centinela-ia.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Title updates
html = html.replace('Inteligencia: 6 Patrones y 6 Funcionalidades', 'Inteligencia: Patrones y Funcionalidades')
html = html.replace('🛡️ Top 6 Patrones Detectados', '🛡️ Patrones Detectados')
html = html.replace('⚡ Top 6 Capacidades Analíticas', '⚡ Capacidades Analíticas')
html = html.replace('Privacidad Perimetral (Zero-Trust)', 'Aislamiento Contextual (Zero-Knowledge)')

# 2. CTA removal
cta_pattern = re.compile(r'<div class="cta-buttons"[^>]*>.*?</div>\s*', re.DOTALL)
html = cta_pattern.sub('', html)

# 3. Update CSS
html = html.replace('.agent-card:hover .agent-hover-modal {', '.agent-card:hover .agent-hover-modal,\n        .card:hover .agent-hover-modal,\n        .glass:hover .agent-hover-modal {')
html = html.replace('cursor: pointer;', 'cursor: pointer;\n            position: relative;')

# Also add position: relative to glass if it doesn't have it
html = html.replace('class="glass" style="padding: 2rem;', 'class="glass" style="position: relative; cursor: pointer; padding: 2rem;')

# 4. Inject agent-hover-modal in .card
def replace_card(m):
    card_content = m.group(1)
    # Extract title
    title_search = re.search(r'<h3>(.*?)</h3>', card_content)
    title = title_search.group(1) if title_search else "Detalle Analítico"
    
    # We will generate generic professional bullet points
    modal_html = f"""
                    <div class="agent-hover-modal">
                        <h4>{title}</h4>
                        <ul>
                            <li><strong>Inspección Autónoma:</strong> Análisis del 100% de la topología sin intervención.</li>
                            <li><strong>Triangulación Lógica:</strong> Caza de heurísticas irregulares no reportadas.</li>
                            <li><strong>Acción Forense:</strong> Retención de hallazgos para escalación y remediación.</li>
                        </ul>
                    </div>
                </div>"""
    return '<div class="card">' + card_content + modal_html

# We match everything inside <div class="card"> until the closing </div>
# The [^{]* implies we only go until the next closing div. We need a careful regex or better: string splitting.
