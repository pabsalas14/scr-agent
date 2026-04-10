# SCR Agent Presentation - Modernizations Guide

## Quick Start

### 1. Start the Presentation Server

```bash
cd /Users/pablosalas/scr-agent/presentation
node server.js
```

The server will start on `http://localhost:3000`

### 2. Open in Browser

```
http://localhost:3000
```

### 3. Explore the Modern Features

Scroll through the presentation and interact with:
- **Scroll Progress Indicator** - Top progress bar shows your position
- **Hamburger Menu** - Responsive navigation (resize to <768px)
- **Architecture Layers** - Click the 4 layers to see details
- **3D Cards** - Hover over agent cards and tech stack items
- **Flow Diagrams** - Animated data flow visualization
- **CVSS Bars** - Animated progress bars for risk scores

---

## Feature Guide

### 🎯 Navigation
- **Desktop:** Horizontal nav links at top
- **Mobile:** Hamburger menu (activated at <768px width)
- **Smooth Scroll:** All nav links scroll smoothly to sections

### 📊 Scroll Indicator
- **Location:** Top of page (3px height)
- **Color:** Orange gradient (#F97316 → #EA6B1B)
- **Visibility:** Visible as you scroll down
- **Speed:** Real-time tracking of scroll position

### 🏗️ Architecture Section
- **Interactive Layers:** 4 clickable architecture boxes
- **Details Popup:** Click any layer to see description
- **Hover Effect:** 3D rotation and scale on hover
- **Information:** Client, API, Engine, Database details

### 🤖 AI Agents Section
- **3D Flip Cards:** Hover to see 3D perspective effect
- **Orbit Animation:** Background rotates on hover
- **Content:** Detector, Remediation, Forensic, Response agents
- **Details:** Features and exploitation methods

### 📚 Tech Stack
- **Shine Effect:** Hover to see gradient shine animation
- **Staggered Text:** List items fade in sequentially
- **4 Categories:** Frontend, Backend, Analysis & IA, Search & Forensic
- **Interactive:** Hover for enhanced visual effects

### 📈 Flow Diagram
- **Animated Arrows:** → symbols bounce continuously
- **Stage Animation:** Flow stages scale up on hover
- **Data Particles:** Flow animation shows data movement
- **Steps:** Ingesta → Parsing → Detection → Scoring → Storage → Visualization

### 💪 CVSS Risk Visualization
- **Animated Bars:** Progress bars fill from 0 to value
- **Color Gradient:** Green (LOW) → Yellow (MEDIUM) → Orange (HIGH) → Red (CRITICAL)
- **Number Counters:** Values animate to final numbers
- **Scroll Trigger:** Animation starts when element comes into view

---

## Customization Guide

### Modify Colors

Edit `/css/modernizations.css` CSS variables:

```css
:root {
    --primary: #F97316;        /* Orange */
    --critical: #EF4444;       /* Red */
    --success: #22C55E;        /* Green */
    --warning: #F97316;        /* Orange */
    --medium: #EAB308;         /* Yellow */
}
```

### Adjust Animation Speed

Find animation definitions in `/css/modernizations.css`:

```css
/* Example: Change data-flow duration */
@keyframes data-flow {
    /* Currently 3s - change to 2s or 4s */
}
```

### Add New Sections

1. Add HTML to `index.html`
2. Add CSS to `css/main.css` or `css/modernizations.css`
3. Add JavaScript to `js/modernizations.js` if needed
4. Use `.staggered-item` class for automatic animations

### Modify Responsive Breakpoint

Currently at `768px` for hamburger menu:

```css
@media (max-width: 768px) {
    /* Adjust breakpoint here */
}
```

---

## Performance Tips

### Optimize Animations

1. **Use GPU Acceleration:**
   ```css
   will-change: transform;
   transform: translateZ(0);
   ```

2. **Reduce Motion (Accessibility):**
   ```css
   @media (prefers-reduced-motion: reduce) {
       animation-duration: 0.01ms !important;
   }
   ```

3. **Lazy Load Heavy Assets:**
   - Charts only load on intersection
   - Images optimized for web

### Monitor Performance

Open DevTools Performance tab:
1. Record → Scroll through presentation
2. Stop recording
3. Check FPS (should stay 60fps)
4. Identify slow animations

---

## Browser DevTools Tips

### Chrome/Edge
1. Press `F12` to open DevTools
2. **Performance Tab:** Record animations, check FPS
3. **Console Tab:** See modernization logs
4. **Network Tab:** Verify all resources load
5. **Responsive Mode:** Test mobile (Ctrl+Shift+M)

### Firefox
1. Press `F12` to open DevTools
2. **Console:** Check for errors
3. **Inspector:** Inspect animated elements
4. **Responsive Design Mode:** Test mobile (Ctrl+Shift+M)

---

## Troubleshooting

### Hamburger Menu Not Showing
- **Issue:** Menu button not visible on mobile
- **Solution:** Check viewport width, resize to <768px
- **Debug:** Open DevTools → Responsive → Mobile (375px)

### Animations Not Smooth
- **Issue:** FPS drops below 60
- **Solution:** Check GPU acceleration in DevTools
- **Fix:** Reduce number of simultaneous animations

### Elements Not Animating
- **Issue:** Scroll animations don't trigger
- **Solution:** Intersection Observer might not be working
- **Debug:** Check console for JS errors

### Chart.js Not Loading
- **Issue:** Charts don't appear
- **Solution:** Check CDN link in HTML
- **Fix:** Verify Chart.js script tag is present

---

## Advanced Features

### Custom Layer Details

Edit `js/modernizations.js`:

```javascript
window.showLayerDetails = function(layerName) {
    const details = {
        custom: {
            title: '🎯 Custom Layer',
            description: 'Your custom description here'
        }
    };
    // Update HTML with details
};
```

### Add Chart.js Dashboard

```javascript
const ctx = document.querySelector('[data-chart="risk"]');
if (ctx) {
    new Chart(ctx, {
        type: 'doughnut',
        data: { /* ... */ },
        options: { /* ... */ }
    });
}
```

### Create Custom Animations

```css
@keyframes custom-animation {
    0% { /* Start state */ }
    50% { /* Middle state */ }
    100% { /* End state */ }
}

.element {
    animation: custom-animation 2s ease infinite;
}
```

---

## Deployment Options

### Local Development
```bash
node server.js
# http://localhost:3000
```

### Docker
```bash
docker-compose up
# Runs on port 3000
```

### ngrok Tunnel (Share Online)
```bash
ngrok http 3000
# Public URL generated
```

### Production Hosting
- Deploy to Vercel, Netlify, or AWS S3 + CloudFront
- Static files serve directly
- No backend processing needed

---

## File Structure

```
presentation/
├── index.html                 # Main presentation
├── server.js                  # Express server
├── css/
│   ├── main.css              # Original styles
│   ├── diagrams.css          # Diagram styles
│   └── modernizations.css    # NEW: Modern animations & effects
├── js/
│   ├── main.js               # Original interactions
│   ├── diagrams.js           # Diagram logic
│   └── modernizations.js     # NEW: Modern features & interactivity
├── assets/
│   └── data/
│       └── stats.json        # Mock data
└── package.json              # Dependencies
```

---

## Console Logs

When presentation loads, you'll see:

```
✅ SCR Agent Presentation - Modernizations Loaded
Features: Scroll Progress, Hamburger Menu, 3D Effects, Animations
```

This confirms all modernizations are active.

---

## Contact & Support

For questions or enhancements:
1. Check `/PRESENTATION_MODERNIZATION_SUMMARY.md` for technical details
2. Review `css/modernizations.css` comments for CSS explanations
3. Review `js/modernizations.js` comments for JavaScript explanations

---

**Last Updated:** April 10, 2026  
**Version:** 2.0 - Modern & Dynamic  
**Status:** ✅ Ready for Presentation
