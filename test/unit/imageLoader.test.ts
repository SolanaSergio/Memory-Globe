import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ImageCollection } from '../../src/js/utils/imageLoader';
import { Texture, TextureLoader } from 'three';
import { mockTexture, createMockLoader, mockLoadingManager } from '../mocks/three';

// Mock Three.js before any tests
vi.mock('three', () => ({
    TextureLoader: vi.fn(),
    Texture: vi.fn()
}));

describe('ImageCollection', () => {
    let imageCollection: ImageCollection;
    let mockDispose: ReturnType<typeof vi.fn>;
    let mockTextureWithDispose: typeof mockTexture & { dispose: ReturnType<typeof vi.fn> };
    let mockSuccessLoader: TextureLoader;
    let mockErrorLoader: TextureLoader;

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

        // Create error loader with proper load function
        mockErrorLoader = {
            load: vi.fn().mockImplementation((_: string, __?: (texture: Texture) => void, ___?: (event: ProgressEvent<EventTarget>) => void, onError?: (err: unknown) => void) => {
                if (onError) {
                    setTimeout(() => onError(new Error('Failed to load texture')), 0);
                }
                return mockTextureWithDispose as unknown as Texture;
            }),
            loadAsync: vi.fn().mockRejectedValue(new Error('Failed to load texture'))
        } as unknown as TextureLoader;

        // Set up the TextureLoader mock to return success loader by default
        const TextureLoader = vi.fn() as Mock;
        TextureLoader.mockImplementation(() => mockSuccessLoader);
        (vi.mocked(TextureLoader) as Mock).mockImplementation(() => mockSuccessLoader);

        imageCollection = new ImageCollection();
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (imageCollection) {
            imageCollection.dispose();
        }
        vi.clearAllMocks();
    });

    describe('Image Loading', () => {
        it('should load an image successfully', async () => {
            await imageCollection.addImage('test.jpg');
            const texture = imageCollection.getCurrentTexture();
            expect(texture).toBeDefined();
            expect(texture?.image.width).toBe(800);
            expect(texture?.image.height).toBe(600);
        });

        it('should handle multiple images', async () => {
            await imageCollection.addImage('test1.jpg');
            await imageCollection.addImage('test2.jpg');
            const texture = imageCollection.getCurrentTexture();
            expect(texture).toBeDefined();
        });

        it('should cycle through images correctly', async () => {
            await imageCollection.addImage('test1.jpg');
            await imageCollection.addImage('test2.jpg');
            const initialTexture = imageCollection.getCurrentTexture();
            imageCollection.nextImage();
            imageCollection.nextImage();
            const cycledTexture = imageCollection.getCurrentTexture();
            expect(cycledTexture).toBe(initialTexture);
        });
    });

    describe('Error Handling', () => {
        it('should handle loading errors gracefully', async () => {
            // Set up error loader for this test
            const TextureLoader = vi.fn() as Mock;
            TextureLoader.mockImplementation(() => mockErrorLoader);
            (vi.mocked(TextureLoader) as Mock).mockImplementation(() => mockErrorLoader);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            await expect(imageCollection.addImage('invalid.jpg')).rejects.toThrow('Failed to load texture');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Memory Management', () => {
        it('should dispose textures properly', async () => {
            await imageCollection.addImage('test.jpg');
            const texture = imageCollection.getCurrentTexture();
            expect(texture).toBeDefined();
            imageCollection.dispose();
            expect(mockDispose).toHaveBeenCalled();
        });
    });
}); 