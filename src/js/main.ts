import { SnowGlobe, LoadingStatus } from './snowglobe';

// Check WebGL support
function checkWebGLSupport(): boolean {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

// List of memory images to display
const MEMORY_IMAGES = [
    '/images/IMG_4126.jpeg',
    '/images/IMG_4129.jpeg',
    '/images/IMG_4130.jpeg',
    '/images/IMG_4132.jpeg',
    '/images/IMG_4133.jpeg',
    '/images/IMG_4179.jpeg',
    '/images/IMG_4261.jpeg',
    '/images/IMG_4315.jpeg'
];

function createLoadingIndicator(): HTMLDivElement {
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        font-family: Arial, sans-serif;
    `;
    return loadingDiv;
}

function createShakeButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = 'Shake Globe';
    button.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        font-size: 16px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s;
        z-index: 100;
    `;
    button.addEventListener('mouseenter', () => {
        button.style.background = '#45a049';
    });
    button.addEventListener('mouseleave', () => {
        button.style.background = '#4CAF50';
    });
    return button;
}

async function init() {
    if (!checkWebGLSupport()) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'WebGL is not supported in your browser.';
        errorDiv.style.color = 'red';
        document.body.appendChild(errorDiv);
        return;
    }

    // Get the existing container
    const container = document.getElementById('snow-globe-container');
    if (!container) {
        console.error('Could not find snow globe container element');
        return;
    }

    // Create loading indicator
    const loadingDiv = createLoadingIndicator();
    container.appendChild(loadingDiv);

    // Create snow globe
    const snowGlobe = new SnowGlobe(container, {
        textureOptions: {
            displayDuration: 3000, // 3 seconds display
            fadeOutDuration: 1000 // 1 second fade
        }
    });

    // Create shake button
    const shakeButton = createShakeButton();
    container.appendChild(shakeButton);

    // Add shake functionality
    shakeButton.addEventListener('click', () => {
        snowGlobe.shake();
    });

    // Add keyboard controls
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            snowGlobe.shake();
        }
    });

    // Handle loading status
    snowGlobe.setLoadingCallback((status: LoadingStatus) => {
        if (status.isLoading) {
            loadingDiv.style.display = 'block';
            loadingDiv.innerHTML = `
                Loading...<br>
                ${Math.round(status.progress)}%
                ${status.currentItem ? `<br>${status.currentItem}` : ''}
            `;
        } else {
            loadingDiv.style.display = 'none';
        }
    });

    // Load images
    try {
        await snowGlobe.loadImages(MEMORY_IMAGES);
    } catch (error) {
        console.error('Failed to load images:', error);
        loadingDiv.innerHTML = 'Error loading images. Please try again.';
    }
}

// Initialize when the page loads
window.addEventListener('load', init); 