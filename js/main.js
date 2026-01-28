import { Viewer } from './viewer.js';

// Grid Renderer
const viewerRegistry = {};
const gridContainer = document.getElementById('model-grid');
let allModels = []; // Store for filtering

async function initPortfolio() {
    try {
        const response = await fetch('assets/gallery.json');
        if (!response.ok) {
            throw new Error('Failed to load gallery data');
        }
        allModels = await response.json();
        renderGrid(allModels);
        setupFilters();
    } catch (error) {
        console.error('Error loading portfolio:', error);
        if (gridContainer) {
            gridContainer.innerHTML = `<p style="text-align:center; padding: 2rem;">No models found. Please run the generation script (node scripts/generate_index.js).</p>`;
        }
    }
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter logic
            const category = btn.dataset.filter;
            if (category === 'all') {
                renderGrid(allModels);
            } else {
                const filtered = allModels.filter(m => m.category === category);
                renderGrid(filtered);
            }
        });
    });
}

function renderGrid(data) {
    if (!gridContainer) return;

    gridContainer.innerHTML = data.map(model => `
        <article class="model-card">
            <div class="card-viewer-container" id="viewer-${model.id}" data-model-id="${model.id}" data-model-url="${model.modelUrl}">
                <div class="card-viewer-placeholder skeleton">
                    <!-- Placeholder Icon -->
                    <i class="ph-duotone ph-cube" style="font-size: 48px; opacity: 0.5; z-index: 2; position: relative;"></i>
                    <!-- Optional: Real thumbnail if available -->
                     ${model.thumbnail ? `<img src="${model.thumbnail}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:1; opacity:0; transition:opacity 0.3s;" onload="this.style.opacity=1; this.parentElement.classList.remove('skeleton');" onerror="this.parentElement.classList.remove('skeleton');" alt="${model.title}">` : ''}
                </div>
            </div>
            <div class="card-info">
                <span class="model-category">${model.category || 'Uncategorized'}</span>
                <h3 class="model-title">${model.title}</h3>
                
                <div class="model-meta">
                    <span><i class="ph-bold ph-polygon"></i> ${model.polyCount || '?'}</span>
                    <span class="view-btn">View Details <i class="ph-bold ph-arrow-right"></i></span>
                </div>
            </div>
            <a href="model.html?id=${model.id}" class="card-link" style="position:absolute; inset:0; z-index:10;" aria-label="View ${model.title}"></a>
        </article>
    `).join('');

    setupLazyLoad();
}

function setupLazyLoad() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target;
                const modelId = container.dataset.modelId;

                // Avoid re-initializing
                if (!viewerRegistry[modelId]) {
                    const viewer = new Viewer(container.id);
                    // Check if we have a valid model URL (and not just the default text)
                    // For now, still load placeholder as default unless we have real 3D assets on disk
                    viewer.loadPlaceholder();

                    viewerRegistry[modelId] = viewer;
                }

                // Stop observing once loaded
                observer.unobserve(container);
            }
        });
    }, { threshold: 0.1, rootMargin: '50px' });

    document.querySelectorAll('.card-viewer-container').forEach(el => observer.observe(el));
}

// Scroll Handler
const scrollBtn = document.getElementById('scroll-to-grid');
if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
        gridContainer.scrollIntoView({ behavior: 'smooth' });
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    initPortfolio();
});
