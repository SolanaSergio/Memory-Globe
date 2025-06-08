import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    SphereGeometry,
    CylinderGeometry,
    Mesh,
    Group,
    Vector3,
    Clock,
    Object3D,
    PCFSoftShadowMap,
    ACESFilmicToneMapping,
    SRGBColorSpace,
    LoadingManager
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createGlassMaterial, createBaseMaterial, loadEnvironmentMap, disposeMaterials } from './utils/materials';
import { setupLights, disposeLights } from './utils/lights';
import { TextureManager, TextureManagerOptions } from './utils/textureManager';

// Constants for snow globe dimensions
const BASE_GLOBE_RADIUS = 4.5;
const BASE_BASE_RADIUS = 2.7;
const BASE_HEIGHT = 1.8;
const BASE_CAMERA_DISTANCE = 13.5;
const MAX_TEXTURE_SIZE = 2048;

// Mobile adjustments
const MOBILE_BREAKPOINT = 768;
const MOBILE_SCALE_FACTOR = 0.5; // More aggressive scaling for mobile

export interface SnowGlobeOptions {
    textureOptions?: Partial<TextureManagerOptions>;
    autoRotate?: boolean;
    rotationSpeed?: number;
}

export interface LoadingStatus {
    isLoading: boolean;
    progress: number;
    currentItem?: string;
}

export class SnowGlobe {
    private scene: Scene;
    private camera!: PerspectiveCamera;
    private renderer!: WebGLRenderer;
    private controls!: OrbitControls;
    private container: HTMLElement;
    private clock: Clock;
    private lights: ReturnType<typeof setupLights> = {} as ReturnType<typeof setupLights>;
    private globeGroup: Group;
    private materials: Array<any>;
    private isDisposed: boolean;
    private initPromise: Promise<void>;
    private textureManager: TextureManager;
    private loadingManager: LoadingManager;
    private options: Required<SnowGlobeOptions>;
    private onLoadingStatusChange?: (status: LoadingStatus) => void;
    private isShaking: boolean = false;
    private shakeStartTime: number = 0;
    private shakeDuration: number = 1000; // 1 second shake
    private shakeIntensity: number = 0.2;

    constructor(container: HTMLElement, options: SnowGlobeOptions = {}) {
        this.container = container;
        this.options = {
            textureOptions: {
                maxTextureSize: MAX_TEXTURE_SIZE,
                position: new Vector3(0, 0, 0), // Center of the globe
                scale: BASE_GLOBE_RADIUS * 0.6, // 60% of globe radius for better fit
                displayDuration: 5000, // 5 seconds
                fadeOutDuration: 2000, // 2 second fade
                ...options.textureOptions
            },
            autoRotate: false,
            rotationSpeed: 0
        };

        this.materials = [];
        this.isDisposed = false;
        this.clock = new Clock();
        this.scene = new Scene();
        this.globeGroup = new Group();
        
        // Set up loading manager
        this.loadingManager = new LoadingManager();
        this.setupLoadingManager();
        
        this.textureManager = new TextureManager(this.options.textureOptions);
        this.initPromise = this.init();
    }

    private setupLoadingManager() {
        this.loadingManager.onProgress = (url, loaded, total) => {
            if (this.onLoadingStatusChange) {
                this.onLoadingStatusChange({
                    isLoading: true,
                    progress: (loaded / total) * 100,
                    currentItem: url
                });
            }
        };

        this.loadingManager.onLoad = () => {
            if (this.onLoadingStatusChange) {
                this.onLoadingStatusChange({
                    isLoading: false,
                    progress: 100
                });
            }
        };

        this.loadingManager.onError = (url) => {
            console.error(`Error loading: ${url}`);
            if (this.onLoadingStatusChange) {
                this.onLoadingStatusChange({
                    isLoading: false,
                    progress: 0,
                    currentItem: `Error loading: ${url}`
                });
            }
        };
    }

    public setLoadingCallback(callback: (status: LoadingStatus) => void) {
        this.onLoadingStatusChange = callback;
    }

    public async loadImages(paths: string[]): Promise<void> {
        await this.initPromise;
        console.log('Starting to load images:', paths);
        try {
            await this.textureManager.loadImages(paths);
            console.log('Successfully loaded images');
            
            // Get the image plane and add it to the scene if not already added
            const imagePlane = this.textureManager.getImagePlane();
            if (imagePlane) {
                // Remove any existing image plane first
                const existingPlane = this.globeGroup.children.find(child => child === imagePlane);
                if (!existingPlane) {
                    console.log('Adding image plane to globe group');
                    this.globeGroup.add(imagePlane);
                }
            } else {
                console.error('No image plane returned from texture manager');
            }
        } catch (error) {
            console.error('Failed to load images:', error);
            throw error;
        }
    }

    public setImagePosition(position: Vector3): void {
        this.textureManager.setPosition(position);
    }

    public setImageScale(scale: number): void {
        this.textureManager.setScale(scale);
    }

    public setAutoRotate(enabled: boolean): void {
        this.options.autoRotate = enabled;
    }

    public setRotationSpeed(speed: number): void {
        this.options.rotationSpeed = speed;
    }

    // Getter for testing purposes
    public async getTestProperties() {
        await this.initPromise;
        return {
            scene: this.scene,
            camera: this.camera,
            renderer: this.renderer,
            materials: this.materials,
            globeGroup: this.globeGroup,
            textureManager: this.textureManager
        };
    }

    private getScaledDimensions() {
        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
        const scaleFactor = isMobile ? MOBILE_SCALE_FACTOR : 1;
        return {
            globeRadius: BASE_GLOBE_RADIUS * scaleFactor,
            baseRadius: BASE_BASE_RADIUS * scaleFactor,
            baseHeight: BASE_HEIGHT * scaleFactor,
            cameraDistance: BASE_CAMERA_DISTANCE * scaleFactor
        };
    }

    private async init() {
        const dimensions = this.getScaledDimensions();
        // Set up camera with responsive adjustments
        const aspect = this.container.clientWidth / this.container.clientHeight;
        
        this.camera = new PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(
            0,
            dimensions.cameraDistance * 0.7,
            dimensions.cameraDistance
        );
        this.camera.lookAt(new Vector3(0, 0, 0));

        // Set up renderer with improved settings
        this.renderer = new WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
        (this.renderer as any).outputColorSpace = SRGBColorSpace;
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.container.appendChild(this.renderer.domElement);

        // Set up controls with limited interaction
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableRotate = false;
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.minDistance = dimensions.cameraDistance * 0.5;
        this.controls.maxDistance = dimensions.cameraDistance * 2;

        // Set up lights
        this.lights = setupLights(this.scene);

        // Create snow globe
        await this.createSnowGlobe();

        // Set initial globe rotation
        this.globeGroup.rotation.set(0, 0, 0);

        // Set up event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Start animation loop
        this.animate();
    }

    private async createSnowGlobe() {
        try {
            const dimensions = this.getScaledDimensions();
            // Create glass sphere
            const sphereGeometry = new SphereGeometry(dimensions.globeRadius, 64, 64);
            const glassMaterial = createGlassMaterial();
            const sphere = new Mesh(sphereGeometry, glassMaterial);
            sphere.castShadow = true;
            sphere.receiveShadow = true;
            this.materials.push(glassMaterial);

            // Create base
            const baseGeometry = new CylinderGeometry(
                dimensions.baseRadius,
                dimensions.baseRadius * 1.2,
                dimensions.baseHeight,
                64
            );
            const baseMaterial = createBaseMaterial();
            const base = new Mesh(baseGeometry, baseMaterial);
            base.position.y = -(dimensions.globeRadius + dimensions.baseHeight / 2);
            base.castShadow = true;
            base.receiveShadow = true;
            this.materials.push(baseMaterial);

            // Add meshes to group
            this.globeGroup.add(sphere);
            this.globeGroup.add(base);

            // Add group to scene
            this.scene.add(this.globeGroup);

            // Try to load environment map but don't fail if it doesn't work
            try {
                const envMap = await loadEnvironmentMap();
                if (envMap) {
                    this.materials.forEach(material => {
                        material.envMap = envMap;
                        material.needsUpdate = true;
                    });
                }
            } catch (error) {
                console.warn('Environment map loading failed, continuing without reflections:', error);
            }
        } catch (error) {
            console.error('Error creating snow globe:', error);
            throw error;
        }
    }

    private onWindowResize() {
        if (this.isDisposed) return;

        const dimensions = this.getScaledDimensions();
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.position.set(
            0,
            dimensions.cameraDistance * 0.7,
            dimensions.cameraDistance
        );
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    private animate() {
        if (this.isDisposed) return;

        requestAnimationFrame(this.animate.bind(this));

        this.clock.getDelta();

        // Update controls
        this.controls.update();

        // Update shake effect
        this.updateShake();

        // Update image fade effect
        this.textureManager.update();

        // Make sure image plane faces camera
        const imagePlane = this.textureManager.getImagePlane();
        if (imagePlane) {
            imagePlane.lookAt(this.camera.position);
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    public async shake(): Promise<void> {
        if (this.isShaking) return;
        
        this.isShaking = true;
        this.shakeStartTime = Date.now();
        
        // Show next image after a slight delay to match the shake animation
        setTimeout(() => {
            this.textureManager.showNextImage();
        }, 200); // Small delay to make it feel more natural
    }

    private updateShake(): void {
        if (!this.isShaking) return;

        const elapsedTime = Date.now() - this.shakeStartTime;
        if (elapsedTime >= this.shakeDuration) {
            this.isShaking = false;
            this.globeGroup.position.set(0, 0, 0);
            this.globeGroup.rotation.set(0, 0, 0);
            return;
        }

        // Calculate shake intensity based on elapsed time (ease out)
        const progress = elapsedTime / this.shakeDuration;
        const currentIntensity = this.shakeIntensity * (1 - progress);

        // Apply random position offset
        this.globeGroup.position.x = (Math.random() - 0.5) * currentIntensity;
        this.globeGroup.position.y = (Math.random() - 0.5) * currentIntensity;

        // Apply minimal rotation to keep image visible
        this.globeGroup.rotation.x = (Math.random() - 0.5) * currentIntensity * 0.02;
        this.globeGroup.rotation.z = (Math.random() - 0.5) * currentIntensity * 0.02;
    }

    /**
     * Clean up Three.js objects and event listeners
     */
    public dispose() {
        if (this.isDisposed) return;
        this.isDisposed = true;

        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize.bind(this));

        // Dispose of materials
        disposeMaterials(this.materials);

        // Dispose of lights
        disposeLights(this.lights, this.scene);

        // Dispose of texture manager
        this.textureManager.dispose();

        // Dispose of geometries
        this.scene.traverse((object: Object3D) => {
            if (object instanceof Mesh) {
                object.geometry.dispose();
            }
        });

        // Dispose of controls if initialized
        if (this.controls) {
            this.controls.dispose();
        }

        // Dispose of renderer if initialized
        if (this.renderer) {
            this.renderer.dispose();

            // Remove canvas from DOM
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
} 