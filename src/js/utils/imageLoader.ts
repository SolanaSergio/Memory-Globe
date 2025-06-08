import { TextureLoader, Texture } from 'three';

export interface ImageInfo {
  path: string;
  texture?: Texture;
  isLoading: boolean;
  error?: string;
  timestamp: number;
}

export interface LoadingProgress {
  loaded: number;
  total: number;
  path: string;
}

export class ImageCollection {
  private images: Map<string, ImageInfo> = new Map();
  private textureLoader: TextureLoader;
  private currentIndex: number = 0;
  private imagePaths: string[] = [];
  private textures: Texture[] = [];
  private maxCachedImages: number;

  constructor(maxCachedImages: number = 10) {
    this.textureLoader = new TextureLoader();
    this.maxCachedImages = maxCachedImages;
  }

  async addImage(path: string, onProgress?: (progress: LoadingProgress) => void): Promise<void> {
    console.log(`Attempting to load image: ${path}`);
    
    if (this.images.has(path)) {
      console.log(`Image ${path} already loaded, updating timestamp`);
      // Update timestamp for existing image
      const info = this.images.get(path)!;
      info.timestamp = Date.now();
      return;
    }

    this.images.set(path, {
      path,
      isLoading: true,
      timestamp: Date.now()
    });

    try {
      console.log(`Starting texture load for: ${path}`);
      const texture = await new Promise<Texture>((resolve, reject) => {
        this.textureLoader.load(
          path,
          (texture) => {
            console.log(`Successfully loaded texture for: ${path}`);
            resolve(texture);
          },
          (progressEvent) => {
            if (onProgress && progressEvent.lengthComputable) {
              console.log(`Loading progress for ${path}: ${progressEvent.loaded}/${progressEvent.total}`);
              onProgress({
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                path
              });
            }
          },
          (error) => {
            console.error(`Error in TextureLoader for ${path}:`, error);
            reject(error);
          }
        );
      });

      // Check if we need to clear cache before adding new texture
      if (this.textures.length >= this.maxCachedImages) {
        console.log(`Cache full, clearing oldest texture`);
        this.clearOldestTexture();
      }

      this.images.set(path, {
        path,
        texture,
        isLoading: false,
        timestamp: Date.now()
      });

      if (!this.imagePaths.includes(path)) {
        this.imagePaths.push(path);
        console.log(`Added new path to imagePaths: ${path}`);
      }

      this.textures.push(texture);
      console.log(`Added texture to cache, total textures: ${this.textures.length}`);
      
      if (this.textures.length === 1) {
        this.currentIndex = 0;
        console.log(`Set current index to 0 for first texture`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Detailed error loading texture ${path}:`, error);
      this.images.set(path, {
        path,
        isLoading: false,
        error: errorMessage,
        timestamp: Date.now()
      });
      throw new Error(`Failed to load image ${path}: ${errorMessage}`);
    }
  }

  private clearOldestTexture(): void {
    let oldestTimestamp = Date.now();
    let oldestPath: string | null = null;

    // Find the oldest texture
    this.images.forEach((info, path) => {
      if (info.timestamp < oldestTimestamp && info.texture) {
        oldestTimestamp = info.timestamp;
        oldestPath = path;
      }
    });

    if (oldestPath) {
      const info = this.images.get(oldestPath)!;
      if (info.texture) {
        info.texture.dispose();
        info.texture = undefined;
      }
      
      // Remove from textures array
      const textureIndex = this.textures.findIndex(t => 
        t === info.texture
      );
      if (textureIndex !== -1) {
        this.textures.splice(textureIndex, 1);
        // Adjust currentIndex if needed
        if (this.currentIndex >= textureIndex) {
          this.currentIndex = Math.max(0, this.currentIndex - 1);
        }
      }
    }
  }

  getCurrentTexture(): Texture | null {
    const texture = this.textures[this.currentIndex];
    if (texture) {
      // Update timestamp for currently used texture
      const path = this.imagePaths[this.currentIndex];
      const info = this.images.get(path);
      if (info) {
        info.timestamp = Date.now();
      }
    }
    return texture || null;
  }

  nextImage(): void {
    if (this.textures.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.textures.length;
    }
  }

  previousImage(): void {
    if (this.textures.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.textures.length) % this.textures.length;
    }
  }

  getLoadingStatus(): { loading: number; total: number } {
    let loading = 0;
    let total = this.images.size;
    this.images.forEach(info => {
      if (info.isLoading) loading++;
    });
    return { loading, total };
  }

  getErrors(): { path: string; error: string }[] {
    const errors: { path: string; error: string }[] = [];
    this.images.forEach((info) => {
      if (info.error) {
        errors.push({ path: info.path, error: info.error });
      }
    });
    return errors;
  }

  dispose(): void {
    this.images.forEach((info) => {
      info.texture?.dispose();
    });
    this.images.clear();
    this.imagePaths = [];
    this.currentIndex = 0;
    this.textures = [];
  }
} 