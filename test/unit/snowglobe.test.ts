import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { SnowGlobe } from '../../src/js/snowglobe';
import { Scene, PerspectiveCamera, WebGLRenderer, Color, Mesh, TextureLoader, Texture, Clock, Vector3 } from 'three';
import { mockScene, mockCamera, mockRenderer, mockMesh, mockTexture, createMockLoader, MockClock, mockLoadingManager } from '../mocks/three';

// Mock Three.js before any tests
vi.mock('three', () => ({
    Scene: vi.fn().mockImplementation(() => mockScene),
    PerspectiveCamera: vi.fn().mockImplementation(() => mockCamera),
    WebGLRenderer: vi.fn().mockImplementation(() => mockRenderer),
    Color: vi.fn().mockImplementation(() => ({ r: 0, g: 0, b: 0 })),
    Mesh: vi.fn().mockImplementation(() => mockMesh),
    TextureLoader: vi.fn(),
    Texture: vi.fn().mockImplementation(() => mockTexture),
    Clock: vi.fn().mockImplementation(() => new MockClock()),
    Group: vi.fn().mockImplementation(() => ({ add: vi.fn(), remove: vi.fn() })),
    DoubleSide: 2,
    LoadingManager: vi.fn().mockImplementation(() => mockLoadingManager),
    PCFSoftShadowMap: 2,
    ACESFilmicToneMapping: 1,
    SRGBColorSpace: 'srgb',
    Vector3: vi.fn().mockImplementation(() => ({ x: 0, y: 0, z: 0 }))
}));

// Mock OrbitControls
vi.mock('three/addons/controls/OrbitControls.js', () => ({
    OrbitControls: vi.fn().mockImplementation(() => ({
        enableDamping: false,
        dampingFactor: 0,
        maxPolarAngle: 0,
        minDistance: 0,
        maxDistance: 0,
        update: vi.fn(),
        dispose: vi.fn()
    }))
}));

// Mock environment map loading
vi.mock('../../src/js/utils/materials', async () => ({
    createGlassMaterial: vi.fn().mockImplementation(() => ({
        transparent: true,
        transmission: 0.98,
        roughness: 0.05,
        dispose: vi.fn()
    })),
    createBaseMaterial: vi.fn().mockImplementation(() => ({
        metalness: 0.8,
        roughness: 0.2,
        dispose: vi.fn()
    })),
    loadEnvironmentMap: vi.fn().mockResolvedValue({}),
    disposeMaterials: vi.fn()
}));

// Mock lights setup
vi.mock('../../src/js/utils/lights', async () => ({
    setupLights: vi.fn().mockReturnValue({}),
    disposeLights: vi.fn()
}));

describe('SnowGlobe', () => {
    let snowGlobe: SnowGlobe;
    let container: HTMLElement;
    let mockSuccessLoader: TextureLoader;

    beforeEach(async () => {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);

        // Create success loader with proper load function
        mockSuccessLoader = {
            load: vi.fn().mockImplementation((path: string, onLoad?: (texture: Texture) => void) => {
                if (onLoad) {
                    setTimeout(() => onLoad(mockTexture as unknown as Texture), 0);
                }
                return mockTexture as unknown as Texture;
            }),
            loadAsync: vi.fn().mockResolvedValue(mockTexture as unknown as Texture)
        } as unknown as TextureLoader;

        // Set up the TextureLoader mock to return success loader by default
        const TextureLoader = vi.fn() as Mock;
        TextureLoader.mockImplementation(() => mockSuccessLoader);
        (vi.mocked(TextureLoader) as Mock).mockImplementation(() => mockSuccessLoader);

        // Reset camera mock before each test
        mockCamera.position.set.mockClear();
        mockCamera.lookAt.mockClear();

        snowGlobe = new SnowGlobe(container);
        await snowGlobe.getTestProperties(); // Wait for initialization
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (snowGlobe) {
            snowGlobe.dispose();
        }
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should create scene, camera, and renderer', async () => {
            const props = await snowGlobe.getTestProperties();
            expect(Scene).toHaveBeenCalled();
            expect(PerspectiveCamera).toHaveBeenCalled();
            expect(WebGLRenderer).toHaveBeenCalled();
        });

        it('should set up renderer with correct size', async () => {
            const props = await snowGlobe.getTestProperties();
            const { setSize, setPixelRatio } = mockRenderer;
            expect(setSize).toHaveBeenCalledWith(800, 600);
            expect(setPixelRatio).toHaveBeenCalledWith(window.devicePixelRatio);
        });

        it('should add renderer to container', () => {
            expect(container.contains(mockRenderer.domElement)).toBe(true);
        });
    });

    describe('Image Loading', () => {
        it('should load images successfully', async () => {
            await snowGlobe.loadImages(['test.jpg']);
            const { add } = mockScene;
            expect(add).toHaveBeenCalled();
        });

        it('should handle loading errors gracefully', async () => {
            const errorMessage = 'Failed to load';
            vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const mockErrorLoader = {
                load: vi.fn().mockImplementation((_: string, __?: (texture: Texture) => void, ___?: (event: ProgressEvent<EventTarget>) => void, onError?: (err: unknown) => void) => {
                    if (onError) setTimeout(() => onError(new Error(errorMessage)), 0);
                    return mockTexture as unknown as Texture;
                }),
                loadAsync: vi.fn().mockRejectedValue(new Error(errorMessage))
            } as unknown as TextureLoader;

            const TextureLoader = vi.fn() as Mock;
            TextureLoader.mockImplementation(() => mockErrorLoader);
            (vi.mocked(TextureLoader) as Mock).mockImplementation(() => mockErrorLoader);

            await expect(snowGlobe.loadImages(['invalid.jpg'])).rejects.toThrow(errorMessage);
        });
    });

    describe('Image Navigation', () => {
        it('should cycle through images', async () => {
            await snowGlobe.loadImages(['test1.jpg', 'test2.jpg']);
            const props = await snowGlobe.getTestProperties();
            const initialPlane = props.textureManager.getImagePlane();
            snowGlobe.nextImage();
            snowGlobe.previousImage();
            const cycledPlane = props.textureManager.getImagePlane();
            expect(cycledPlane).toBe(initialPlane);
        });
    });

    describe('Resource Management', () => {
        it('should dispose resources properly', async () => {
            const props = await snowGlobe.getTestProperties();
            const disposeSpy = vi.spyOn(mockRenderer, 'dispose');
            snowGlobe.dispose();
            expect(disposeSpy).toHaveBeenCalled();
        });

        it('should remove renderer from container', () => {
            snowGlobe.dispose();
            expect(container.contains(mockRenderer.domElement)).toBe(false);
        });
    });
}); 