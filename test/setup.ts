import { vi } from 'vitest';

// Mock requestAnimationFrame
let rafId = 0;
(window as any).requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    // Only call the callback once to prevent infinite recursion
    if (rafId === 0) {
        rafId = 1;
        callback(0);
    }
    return rafId;
});

// Mock window properties
Object.defineProperty(window, 'devicePixelRatio', {
    value: 1,
    writable: true
});

// Mock WebGL context
const mockWebGLContext = {
    canvas: document.createElement('canvas'),
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    viewport: vi.fn(),
    clear: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    getExtension: vi.fn(() => null),
    getParameter: vi.fn(() => 1),
    clearColor: vi.fn(),
    clearDepth: vi.fn(),
    clearStencil: vi.fn(),
    pixelStorei: vi.fn(),
    getContextAttributes: vi.fn(() => ({
        alpha: true,
        antialias: true,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'default',
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: false,
        desynchronized: false
    }))
};

// Type assertion to handle the complex WebGL context type
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(contextId: string, options?: any) {
    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
        return mockWebGLContext as unknown as WebGLRenderingContext;
    }
    return originalGetContext.call(this, contextId, options);
};