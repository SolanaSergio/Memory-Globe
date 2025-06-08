import { TextureLoader, Texture, Clock } from 'three';
import { vi } from 'vitest';

export const mockDispose = vi.fn();
export const mockClear = vi.fn();
export const mockRender = vi.fn();
export const mockSetSize = vi.fn();
export const mockSetPixelRatio = vi.fn();

export const mockTexture = {
    dispose: mockDispose,
    needsUpdate: false,
    image: { width: 800, height: 600 }
};

export const mockLoadingManager = {
    onStart: vi.fn(),
    onLoad: vi.fn(),
    onProgress: vi.fn(),
    onError: vi.fn(),
    itemStart: vi.fn(),
    itemEnd: vi.fn(),
    itemError: vi.fn()
};

export const mockCamera = {
    position: {
        set: vi.fn(),
        x: 0,
        y: 0,
        z: 0
    },
    lookAt: vi.fn(),
    aspect: 1,
    updateProjectionMatrix: vi.fn()
};

export const mockScene = {
    add: vi.fn(),
    remove: vi.fn(),
    children: [],
    traverse: vi.fn()
};

export const mockRenderer = {
    domElement: document.createElement('canvas'),
    setSize: mockSetSize,
    setPixelRatio: mockSetPixelRatio,
    render: mockRender,
    dispose: mockDispose,
    clear: mockClear,
    shadowMap: {
        enabled: false,
        type: 2 // PCFSoftShadowMap
    },
    toneMapping: 1, // ACESFilmicToneMapping
    outputColorSpace: 'srgb'
};

export class MockClock {
    private running: boolean = false;
    
    getDelta = vi.fn().mockReturnValue(0.016);
    start = vi.fn().mockImplementation(() => { this.running = true; });
    stop = vi.fn().mockImplementation(() => { this.running = false; });
    getElapsedTime = vi.fn().mockReturnValue(0);
}

export const mockMesh = {
    position: { z: 0 },
    scale: { set: vi.fn() },
    geometry: { dispose: mockDispose },
    material: { dispose: mockDispose, map: null, needsUpdate: false },
    isMesh: true
};

export const mockMeshClass = vi.fn().mockImplementation(() => mockMesh);
Object.defineProperty(mockMeshClass, Symbol.hasInstance, {
    value: (obj: any) => obj?.isMesh === true
});

export const createMockLoader = () => ({
    load: vi.fn().mockImplementation((path: string, onLoad?: (texture: Texture) => void) => {
        if (onLoad) {
            setTimeout(() => onLoad(mockTexture as unknown as Texture), 0);
        }
        return mockTexture as unknown as Texture;
    }),
    loadAsync: vi.fn().mockResolvedValue(mockTexture as unknown as Texture),
    manager: mockLoadingManager
});

// Create a mock module for Three.js
const mockThree = {
    Scene: vi.fn().mockImplementation(() => mockScene),
    PerspectiveCamera: vi.fn().mockImplementation(() => mockCamera),
    WebGLRenderer: vi.fn().mockImplementation(() => mockRenderer),
    Color: vi.fn().mockImplementation(() => ({ r: 0, g: 0, b: 0 })),
    Mesh: mockMeshClass,
    TextureLoader: vi.fn().mockImplementation(() => createMockLoader()),
    Texture: vi.fn().mockImplementation(() => mockTexture),
    Clock: vi.fn().mockImplementation(() => new MockClock()),
    Group: vi.fn().mockImplementation(() => ({ add: vi.fn(), remove: vi.fn() })),
    DoubleSide: 2,
    LoadingManager: vi.fn().mockImplementation(() => mockLoadingManager),
    PCFSoftShadowMap: 2,
    ACESFilmicToneMapping: 1,
    SRGBColorSpace: 'srgb'
};

// Mock the entire three module
vi.mock('three', () => mockThree); 