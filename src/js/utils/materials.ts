import {
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    Color
} from 'three';

// Constants for material properties
const GLASS_DEFAULTS = {
    transmission: 0.95,
    thickness: 0.5,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    ior: 1.5,
    envMapIntensity: 1.0
};

const BASE_DEFAULTS = {
    metalness: 0.8,
    roughness: 0.2,
    color: new Color(0x3a3a3a),
    envMapIntensity: 1.0
};

/**
 * Creates a realistic glass material for the snow globe
 */
export function createGlassMaterial() {
    const material = new MeshPhysicalMaterial({
        ...GLASS_DEFAULTS,
        transparent: true,
        opacity: 0.9,
        side: 2, // DoubleSide for proper transparency
        color: new Color(0xffffff)
    });

    return material;
}

/**
 * Creates a metallic material for the snow globe base
 */
export function createBaseMaterial() {
    const material = new MeshStandardMaterial({
        ...BASE_DEFAULTS
    });

    return material;
}

/**
 * Loads environment map textures for reflections
 * @returns Promise that resolves with the processed environment map
 */
export async function loadEnvironmentMap() {
    // For now, we'll skip environment map loading
    return null;
}

/**
 * Disposes of materials and their textures
 * @param materials Array of materials to dispose
 */
export function disposeMaterials(materials: Array<MeshPhysicalMaterial | MeshStandardMaterial>) {
    materials.forEach(material => {
        if (material.map) material.map.dispose();
        if (material.normalMap) material.normalMap.dispose();
        if (material.roughnessMap) material.roughnessMap.dispose();
        if (material.metalnessMap) material.metalnessMap.dispose();
        if (material.envMap) material.envMap.dispose();
        material.dispose();
    });
} 