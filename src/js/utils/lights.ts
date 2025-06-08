import {
    AmbientLight,
    DirectionalLight,
    HemisphereLight,
    Object3D,
    Scene,
    PointLight
} from 'three';

// Constants for light settings
const LIGHT_DEFAULTS = {
    ambient: {
        color: 0xffffff,
        intensity: 0.3
    },
    directional: {
        color: 0xffffff,
        intensity: 0.6,
        position: { x: 5, y: 5, z: 5 },
        castShadow: true,
        shadowMapSize: 1024
    },
    hemisphere: {
        skyColor: 0xffffff,
        groundColor: 0x444444,
        intensity: 0.4
    },
    point: {
        color: 0xffffff,
        intensity: 0.5,
        distance: 20,
        position: { x: -5, y: 3, z: -5 }
    }
};

/**
 * Sets up basic lighting for the scene
 * @param scene The Three.js scene to add lights to
 * @returns Object containing the created lights
 */
export function setupLights(scene: Scene) {
    // Create ambient light for base illumination
    const ambient = new AmbientLight(
        LIGHT_DEFAULTS.ambient.color,
        LIGHT_DEFAULTS.ambient.intensity
    );
    scene.add(ambient);

    // Create directional light for shadows and highlights
    const directional = new DirectionalLight(
        LIGHT_DEFAULTS.directional.color,
        LIGHT_DEFAULTS.directional.intensity
    );
    directional.position.set(
        LIGHT_DEFAULTS.directional.position.x,
        LIGHT_DEFAULTS.directional.position.y,
        LIGHT_DEFAULTS.directional.position.z
    );
    directional.castShadow = LIGHT_DEFAULTS.directional.castShadow;
    directional.shadow.mapSize.width = LIGHT_DEFAULTS.directional.shadowMapSize;
    directional.shadow.mapSize.height = LIGHT_DEFAULTS.directional.shadowMapSize;
    scene.add(directional);

    // Create hemisphere light for natural environment lighting
    const hemisphere = new HemisphereLight(
        LIGHT_DEFAULTS.hemisphere.skyColor,
        LIGHT_DEFAULTS.hemisphere.groundColor,
        LIGHT_DEFAULTS.hemisphere.intensity
    );
    scene.add(hemisphere);

    // Add point light for additional glass highlights
    const point = new PointLight(
        LIGHT_DEFAULTS.point.color,
        LIGHT_DEFAULTS.point.intensity,
        LIGHT_DEFAULTS.point.distance
    );
    point.position.set(
        LIGHT_DEFAULTS.point.position.x,
        LIGHT_DEFAULTS.point.position.y,
        LIGHT_DEFAULTS.point.position.z
    );
    scene.add(point);

    return {
        ambient,
        directional,
        hemisphere,
        point
    };
}

/**
 * Disposes of lights and removes them from the scene
 * @param lights Object containing lights to dispose
 * @param scene Scene to remove lights from
 */
export function disposeLights(
    lights: { [key: string]: Object3D },
    scene: Scene
) {
    Object.values(lights).forEach(light => {
        if (light instanceof DirectionalLight) {
            if (light.shadow.map) {
                light.shadow.map.dispose();
            }
        }
        scene.remove(light);
    });
} 