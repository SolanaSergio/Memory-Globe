import { Mesh, PlaneGeometry, MeshBasicMaterial, Vector3, FrontSide } from 'three';
import { ImageCollection } from './imageLoader';

export interface TextureManagerOptions {
  maxTextureSize?: number;
  position?: Vector3;
  scale?: number;
  displayDuration?: number;
  fadeOutDuration?: number;
}

export class TextureManager {
  private imagePlane: Mesh | null = null;
  private imageCollection: ImageCollection;
  private options: Required<TextureManagerOptions>;
  private displayTimeout: number | null = null;
  private fadeStartTime: number | null = null;
  private isVisible: boolean = false;

  constructor(options: TextureManagerOptions = {}) {
    this.imageCollection = new ImageCollection();
    this.options = {
      maxTextureSize: options.maxTextureSize || 2048,
      position: options.position || new Vector3(0, 0, -0.8),
      scale: options.scale || 1.5,
      displayDuration: options.displayDuration || 5000, // 5 seconds
      fadeOutDuration: options.fadeOutDuration || 2000 // 2 second fade
    };
  }

  async loadImages(paths: string[]): Promise<void> {
    try {
      for (const path of paths) {
        await this.imageCollection.addImage(path);
      }
      this.updateTexture();
      // Start with the image visible
      if (this.imagePlane) {
        const material = this.imagePlane.material as MeshBasicMaterial;
        material.opacity = 1;
        material.needsUpdate = true;
        this.isVisible = true;
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      throw new Error('Failed to load one or more images');
    }
  }


  private updateTexture(): void {
    const texture = this.imageCollection.getCurrentTexture();
    if (!texture) return;

    if (!this.imagePlane) {
      // Create a plane to display the image
      const geometry = new PlaneGeometry(1, 1);
      const material = new MeshBasicMaterial({
        map: texture,
        side: FrontSide,
        transparent: true,
        opacity: 0, // Start fully transparent
        depthTest: false, // Ensure image is always visible
        depthWrite: false, // Don't write to depth buffer
        alphaTest: 0.01 // Help with transparency
      });
      this.imagePlane = new Mesh(geometry, material);
      this.imagePlane.position.copy(this.options.position);
      this.imagePlane.scale.set(this.options.scale, this.options.scale, 1);
      this.imagePlane.renderOrder = 999; // Ensure it renders last
    } else {
      // Update existing plane
      const material = this.imagePlane.material as MeshBasicMaterial;
      material.map = texture;
      material.needsUpdate = true;
    }

    // Update aspect ratio and scale
    if (texture.image) {
      const aspectRatio = texture.image.width / texture.image.height;
      const baseScale = this.options.scale;
      
      // Adjust scale based on aspect ratio while maintaining overall size
      if (aspectRatio > 1) {
        // Landscape image
        this.imagePlane.scale.set(baseScale * aspectRatio, baseScale, 1);
      } else {
        // Portrait image
        this.imagePlane.scale.set(baseScale, baseScale / aspectRatio, 1);
      }
    }

    // Ensure the image is fully visible
    if (this.imagePlane) {
      const material = this.imagePlane.material as MeshBasicMaterial;
      material.opacity = 1;
      material.needsUpdate = true;
      this.isVisible = true;
    }
  }

  showNextImage(): void {
    console.log('Showing next image');
    // Clear any existing timeouts
    if (this.displayTimeout) {
      clearTimeout(this.displayTimeout);
      this.displayTimeout = null;
    }

    // Move to next image
    this.imageCollection.nextImage();
    this.updateTexture();

    // Show the image
    if (this.imagePlane) {
      console.log('Setting image plane opacity to 1');
      const material = this.imagePlane.material as MeshBasicMaterial;
      material.opacity = 1;
      material.needsUpdate = true;
      this.isVisible = true;
      this.fadeStartTime = null;
    } else {
      console.warn('No image plane available');
    }

    // Set timeout to start hiding
    this.displayTimeout = setTimeout(() => {
      this.fadeStartTime = Date.now();
    }, this.options.displayDuration);
  }

  private hideImage(): void {
    if (this.imagePlane) {
      const material = this.imagePlane.material as MeshBasicMaterial;
      material.opacity = 0;
      material.needsUpdate = true;
      this.isVisible = false;
      this.fadeStartTime = null;
    }
  }

  update(): void {
    if (!this.isVisible || !this.fadeStartTime || !this.imagePlane) return;

    const elapsedFadeTime = Date.now() - this.fadeStartTime;
    if (elapsedFadeTime >= this.options.fadeOutDuration) {
      this.hideImage();
      return;
    }

    // Calculate fade opacity with smooth easing
    const progress = elapsedFadeTime / this.options.fadeOutDuration;
    const easeOutProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out for smoother fade
    const material = this.imagePlane.material as MeshBasicMaterial;
    material.opacity = 1 - easeOutProgress;
    material.needsUpdate = true;
  }

  setPosition(position: Vector3): void {
    this.options.position = position;
    if (this.imagePlane) {
      this.imagePlane.position.copy(position);
    }
  }

  setScale(scale: number): void {
    this.options.scale = scale;
    this.updateTexture();
  }

  getImagePlane(): Mesh | null {
    return this.imagePlane;
  }

  dispose(): void {
    if (this.displayTimeout) {
      clearTimeout(this.displayTimeout);
    }
    if (this.imagePlane) {
      this.imagePlane.geometry.dispose();
      (this.imagePlane.material as MeshBasicMaterial).dispose();
      this.imagePlane = null;
    }
    this.imageCollection.dispose();
  }
} 