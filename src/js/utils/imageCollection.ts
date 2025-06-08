import { TextureLoader, Texture } from 'three';

export class ImageCollection {
    private textures: Map<string, Texture> = new Map();
    private imagePaths: string[] = [];
    private currentIndex: number = -1;
    private textureLoader: TextureLoader;

    constructor() {
        this.textureLoader = new TextureLoader();
    }

    public async loadImages(paths: string[]): Promise<void> {
        this.imagePaths = paths;
        
        for (const path of paths) {
            if (!this.textures.has(path)) {
                try {
                    const texture = await this.loadTexture(path);
                    this.textures.set(path, texture);
                    
                    // Set the first texture as current if we haven't set one yet
                    if (this.currentIndex === -1) {
                        this.currentIndex = 0;
                    }
                } catch (error) {
                    console.error(`Failed to load texture: ${path}`, error);
                }
            }
        }
    }

    private loadTexture(path: string): Promise<Texture> {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                path,
                (texture) => {
                    console.log(`Successfully loaded texture for: ${path}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error(`Error loading texture: ${path}`, error);
                    reject(error);
                }
            );
        });
    }

    public getCurrentTexture(): Texture | null {
        if (this.currentIndex === -1 || this.imagePaths.length === 0) {
            return null;
        }
        const currentPath = this.imagePaths[this.currentIndex];
        return this.textures.get(currentPath) || null;
    }

    public nextImage(): void {
        if (this.imagePaths.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.imagePaths.length;
    }

    public dispose(): void {
        this.textures.forEach(texture => texture.dispose());
        this.textures.clear();
        this.imagePaths = [];
        this.currentIndex = -1;
    }
} 