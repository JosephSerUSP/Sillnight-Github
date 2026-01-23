/**
 * Represents a static modifier on a game entity (Unit, Class, Equipment, State).
 * Used to modify parameters, resistances, and other properties.
 */
export class Trait {
    /**
     * Trait codes for identifying the type of modification.
     */
    static get codes() {
        return {
            PARAM_PLUS: 'PARAM_PLUS',
            PARAM_RATE: 'PARAM_RATE',
            ELEMENT_RATE: 'ELEMENT_RATE',
            STATE_RATE: 'STATE_RATE',
            STATE_RESIST: 'STATE_RESIST',
            ATTACK_ELEMENT: 'ATTACK_ELEMENT',
            ATTACK_STATE: 'ATTACK_STATE',
            ATTACK_SPEED: 'ATTACK_SPEED',
            ATTACK_TIMES: 'ATTACK_TIMES',
            STYPE_ADD: 'STYPE_ADD',
            STYPE_SEAL: 'STYPE_SEAL',
            SKILL_ADD: 'SKILL_ADD',
            SKILL_SEAL: 'SKILL_SEAL',
            EQUIP_WTYPE: 'EQUIP_WTYPE',
            EQUIP_ATYPE: 'EQUIP_ATYPE',
            EQUIP_LOCK: 'EQUIP_LOCK',
            EQUIP_SEAL: 'EQUIP_SEAL',
            SLOT_TYPE: 'SLOT_TYPE',
            ACTION_PLUS: 'ACTION_PLUS',
            SPECIAL_FLAG: 'SPECIAL_FLAG',
            COLLAPSE_TYPE: 'COLLAPSE_TYPE',
            PARTY_ABILITY: 'PARTY_ABILITY'
        };
    }

    /**
     * @param {string} code - The trait code (e.g., 'PARAM_PLUS', 'ELEMENT_RATE').
     * @param {number|string} dataId - The ID of the parameter or element being modified.
     * @param {number} value - The value of the trait (e.g., 1.5 for 150%).
     */
    constructor(code, dataId, value) {
        this.code = code;
        this.dataId = dataId;
        this.value = value;
    }
}
