import {
    Vector3,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh,
    FrontSide,
    Texture
} from 'three';
import { ImageCollection } from './imageCollection';

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
    private hasBeenShaken: boolean = false;

    constructor(options: TextureManagerOptions = {}) {
        this.imageCollection = new ImageCollection();
        this.options = {
            maxTextureSize: options.maxTextureSize || 2048,
            position: options.position || new Vector3(0, 0, -0.8),
            scale: options.scale || 1.5,
            displayDuration: options.displayDuration || 5000,
            fadeOutDuration: options.fadeOutDuration || 2000
        };
    }

    public async loadImages(paths: string[]): Promise<void> {
        await this.imageCollection.loadImages(paths);
        // Create initial image plane with first texture
        const texture = this.imageCollection.getCurrentTexture();
        if (texture) {
            this.createImagePlane(texture);
        }
    }

    private createImagePlane(texture: Texture): void {
        // Create a plane to display the image
        const geometry = new PlaneGeometry(1, 1);
        const material = new MeshBasicMaterial({
            map: texture,
            side: FrontSide,
            transparent: true,
            opacity: 0,
            depthTest: false,
            depthWrite: false,
            alphaTest: 0.01
        });

        this.imagePlane = new Mesh(geometry, material);
        this.imagePlane.position.copy(this.options.position);
        this.imagePlane.scale.set(this.options.scale, this.options.scale, 1);
        this.imagePlane.renderOrder = 999;
        this.imagePlane.visible = false;

        // Update aspect ratio and scale
        if (texture.image) {
            const aspectRatio = texture.image.width / texture.image.height;
            const baseScale = this.options.scale;
            
            if (aspectRatio > 1) {
                this.imagePlane.scale.set(baseScale * aspectRatio, baseScale, 1);
            } else {
                this.imagePlane.scale.set(baseScale, baseScale / aspectRatio, 1);
            }
        }
    }

    private updateTexture(): void {
        const texture = this.imageCollection.getCurrentTexture();
        if (!texture) return;

        if (!this.imagePlane) {
            this.createImagePlane(texture);
        } else {
            // Update existing plane
            const material = this.imagePlane.material as MeshBasicMaterial;
            material.map = texture;
            material.needsUpdate = true;

            // Update aspect ratio and scale
            if (texture.image) {
                const aspectRatio = texture.image.width / texture.image.height;
                const baseScale = this.options.scale;
                
                if (aspectRatio > 1) {
                    this.imagePlane.scale.set(baseScale * aspectRatio, baseScale, 1);
                } else {
                    this.imagePlane.scale.set(baseScale, baseScale / aspectRatio, 1);
                }
            }
        }

        // Show the image if we've been shaken
        if (this.imagePlane && this.hasBeenShaken) {
            this.imagePlane.visible = true;
            const material = this.imagePlane.material as MeshBasicMaterial;
            material.opacity = 1;
            material.needsUpdate = true;
        }
    }

    public showNextImage(): void {
        this.hasBeenShaken = true;
        this.imageCollection.nextImage();
        this.updateTexture();
        
        // Set up display timeout
        if (this.displayTimeout) {
            clearTimeout(this.displayTimeout);
        }
        this.displayTimeout = window.setTimeout(() => {
            this.fadeStartTime = Date.now();
        }, this.options.displayDuration);
    }

    public update(): void {
        if (!this.imagePlane || !this.fadeStartTime) return;

        const material = this.imagePlane.material as MeshBasicMaterial;
        const elapsedTime = Date.now() - this.fadeStartTime;
        
        if (elapsedTime >= this.options.fadeOutDuration) {
            material.opacity = 0;
            this.imagePlane.visible = false;
            this.fadeStartTime = null;
        } else {
            const progress = elapsedTime / this.options.fadeOutDuration;
            material.opacity = 1 - progress;
        }
        material.needsUpdate = true;
    }

    public getImagePlane(): Mesh | null {
        return this.imagePlane;
    }

    public setPosition(position: Vector3): void {
        this.options.position = position;
        if (this.imagePlane) {
            this.imagePlane.position.copy(position);
        }
    }

    public setScale(scale: number): void {
        this.options.scale = scale;
        this.updateTexture();
    }

    public dispose(): void {
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