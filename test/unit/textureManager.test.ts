import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { TextureManager } from '../../src/js/utils/textureManager';
import { Texture, TextureLoader, MeshBasicMaterial, BufferGeometry } from 'three';
import { mockTexture, createMockLoader, mockLoadingManager } from '../mocks/three';

// Mock Three.js before any tests
vi.mock('three', () => ({
    TextureLoader: vi.fn(),
    Texture: vi.fn(),
    PlaneGeometry: vi.fn(),
    MeshBasicMaterial: vi.fn(),
    Mesh: vi.fn(),
    DoubleSide: 2
}));

describe('TextureManager', () => {
    let textureManager: TextureManager;
    let mockDispose: ReturnType<typeof vi.fn>;
    let mockTextureWithDispose: typeof mockTexture & { dispose: ReturnType<typeof vi.fn> };
    let mockSuccessLoader: TextureLoader;

    beforeEach(() => {
        mockDispose = vi.fn();
        mockTextureWithDispose = {
            ...mockTexture,
            dispose: mockDispose
        };

        // Create success loader with proper load function
        mockSuccessLoader = {
            load: vi.fn().mockImplementation((path: string, onLoad?: (texture: Texture) => void) => {
                if (onLoad) {
                    setTimeout(() => onLoad(mockTextureWithDispose as unknown as Texture), 0);
                }
                return mockTextureWithDispose as unknown as Texture;
            }),
            loadAsync: vi.fn().mockResolvedValue(mockTextureWithDispose as unknown as Texture)
        } as unknown as TextureLoader;

        // Set up the TextureLoader mock to return success loader by default
        const TextureLoader = vi.fn() as Mock;
        TextureLoader.mockImplementation(() => mockSuccessLoader);
        (vi.mocked(TextureLoader) as Mock).mockImplementation(() => mockSuccessLoader);

        // Set up other Three.js mocks
        const Texture = vi.fn() as Mock;
        Texture.mockImplementation(() => mockTextureWithDispose);
        (vi.mocked(Texture) as Mock).mockImplementation(() => mockTextureWithDispose);

        const PlaneGeometry = vi.fn() as Mock;
        PlaneGeometry.mockImplementation(() => ({ dispose: mockDispose }));
        (vi.mocked(PlaneGeometry) as Mock).mockImplementation(() => ({ dispose: mockDispose }));

        const MeshBasicMaterial = vi.fn() as Mock;
        MeshBasicMaterial.mockImplementation(() => ({ 
            dispose: mockDispose,
            map: null,
            needsUpdate: false,
            side: 2,
            transparent: true
        }));
        (vi.mocked(MeshBasicMaterial) as Mock).mockImplementation(() => ({ 
            dispose: mockDispose,
            map: null,
            needsUpdate: false,
            side: 2,
            transparent: true
        }));

        const Mesh = vi.fn() as Mock;
        Mesh.mockImplementation(() => ({
            position: { z: -1 },
            scale: { set: vi.fn() },
            geometry: { dispose: mockDispose },
            material: { 
                dispose: mockDispose,
                map: null,
                needsUpdate: false,
                side: 2,
                transparent: true
            }
        }));
        (vi.mocked(Mesh) as Mock).mockImplementation(() => ({
            position: { z: -1 },
            scale: { set: vi.fn() },
            geometry: { dispose: mockDispose },
            material: { 
                dispose: mockDispose,
                map: null,
                needsUpdate: false,
                side: 2,
                transparent: true
            }
        }));

        textureManager = new TextureManager();
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (textureManager) {
            textureManager.dispose();
        }
        vi.clearAllMocks();
    });

    describe('Image Display', () => {
        it('should create image plane when loading first image', async () => {
            await textureManager.loadImages(['test.jpg']);
            const imagePlane = textureManager.getImagePlane();
            expect(imagePlane).toBeDefined();
            if (imagePlane) {
                const material = imagePlane.material as MeshBasicMaterial;
                expect(material.map).toBeDefined();
                expect(material.map?.image.width).toBe(800);
                expect(material.map?.image.height).toBe(600);
            }
        });

        it('should update existing plane when loading new images', async () => {
            await textureManager.loadImages(['test1.jpg', 'test2.jpg']);
            const imagePlane = textureManager.getImagePlane();
            expect(imagePlane).toBeDefined();
            if (imagePlane) {
                const material = imagePlane.material as MeshBasicMaterial;
                expect(material.needsUpdate).toBe(true);
            }
        });

        it('should handle image aspect ratio', async () => {
            await textureManager.loadImages(['test.jpg']);
            const imagePlane = textureManager.getImagePlane();
            expect(imagePlane).toBeDefined();
            if (imagePlane) {
                const scaleSpy = vi.spyOn(imagePlane.scale, 'set');
                expect(scaleSpy).toHaveBeenCalledWith(800/600, 1, 1);
            }
        });
    });

    describe('Image Navigation', () => {
        it('should cycle through images correctly', async () => {
            await textureManager.loadImages(['test1.jpg', 'test2.jpg']);
            const initialPlane = textureManager.getImagePlane();
            expect(initialPlane).toBeDefined();
            textureManager.nextImage();
            textureManager.nextImage();
            const cycledPlane = textureManager.getImagePlane();
            expect(cycledPlane).toBe(initialPlane);
        });
    });

    describe('Resource Management', () => {
        it('should dispose resources properly', async () => {
            await textureManager.loadImages(['test.jpg']);
            const imagePlane = textureManager.getImagePlane();
            expect(imagePlane).toBeDefined();
            if (imagePlane) {
                const geometry = imagePlane.geometry as BufferGeometry;
                const material = imagePlane.material as MeshBasicMaterial;
                const geometryDisposeSpy = vi.spyOn(geometry, 'dispose');
                const materialDisposeSpy = vi.spyOn(material, 'dispose');
                
                textureManager.dispose();
                
                expect(geometryDisposeSpy).toHaveBeenCalled();
                expect(materialDisposeSpy).toHaveBeenCalled();
            }
        });
    });
}); 