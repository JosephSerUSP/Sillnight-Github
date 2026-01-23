import { Data } from '../../assets/data/data.js';
import { modifyMaterialWithFog } from './FogMaterial.js';
import { modifyMaterialPearlescent } from './PearlescentMaterial.js';

export class MaterialFactory {
    /**
     * Creates a material based on a key from Data.materials or a config object.
     * @param {string|Object} keyOrConfig
     * @param {boolean} [applyFog=true]
     * @param {boolean} [fogDisplace=false]
     * @returns {THREE.Material}
     */
    static create(keyOrConfig, applyFog = true, fogDisplace = false) {
        let config = keyOrConfig;

        if (typeof keyOrConfig === 'string') {
            config = Data.materials[keyOrConfig];
            if (!config) {
                console.warn(`MaterialFactory: Key '${keyOrConfig}' not found. Using default.`);
                config = Data.materials['default'] || { type: 'Lambert', color: 0x333333 };
            }
        }

        let material;
        const params = { ...config };
        // Remove non-standard params
        delete params.type;
        delete params.customEffect;

        switch (config.type) {
            case 'Phong':
                material = new THREE.MeshPhongMaterial(params);
                break;
            case 'Standard':
                material = new THREE.MeshStandardMaterial(params);
                break;
            case 'Basic':
                material = new THREE.MeshBasicMaterial(params);
                break;
            case 'Lambert':
            default:
                material = new THREE.MeshLambertMaterial(params);
                break;
        }

        // Apply Custom Effects
        if (config.customEffect === 'pearlescent') {
            modifyMaterialPearlescent(material);
        }

        // Apply Fog
        if (applyFog) {
            modifyMaterialWithFog(material, fogDisplace);
        }

        return material;
    }
}
