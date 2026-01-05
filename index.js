import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import Highlight from 'reveal.js/plugin/highlight/highlight.esm.js';
import Zoom from 'reveal.js/plugin/zoom/zoom.esm.js';

// Import reveal.js styles
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';
import './dracula.css';

// Import Mermaid for diagrams
import mermaid from 'mermaid';

// Initialize Mermaid with configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

// Initialize Reveal.js
const deck = new Reveal({
  plugins: [Markdown, Highlight, Zoom],
  hash: true,
  slideNumber: true,
  transition: 'slide',
  width: 1280,
  height: 720,
  margin: 0.1,
  minScale: 0.2,
  maxScale: 2.0,
});

// Function to render Mermaid diagrams
async function renderMermaid() {
  const mermaidDivs = document.querySelectorAll('.mermaid:not([data-processed])');

  for (const element of mermaidDivs) {
    try {
      element.setAttribute('data-processed', 'true');
      const { svg } = await mermaid.render('mermaid-' + Math.random().toString(36).substring(2, 11), element.textContent);
      element.innerHTML = svg;
    } catch (error) {
      console.error('Error rendering Mermaid diagram:', error);
      element.innerHTML = `<p style="color: red;">Error rendering diagram: ${error.message}</p>`;
    }
  }
}

deck.initialize().then(() => {
  // Wait a bit for Markdown plugin to load external content
  setTimeout(() => {
    renderMermaid();
  }, 500);
});

// Re-render on slide change to catch lazy-loaded content
deck.on('slidechanged', () => {
  setTimeout(() => {
    renderMermaid();
  }, 100);
});

// Add keyboard shortcut to toggle help
deck.addKeyBinding({ keyCode: 72, key: 'H' }, () => {
  console.log('Keyboard shortcuts:');
  console.log('- Arrow keys: Navigate slides');
  console.log('- F: Fullscreen');
  console.log('- O/ESC: Overview mode');
  console.log('- Alt+Click: Zoom');
});
