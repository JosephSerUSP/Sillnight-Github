/**
 * Represents a dynamic action performed by a Skill or Item.
 * Can deal damage, heal, apply states, or trigger other events.
 */
export class Effect {
    /**
     * @param {string} code - The effect code (e.g., 'DAMAGE_HP', 'ADD_STATE').
     * @param {string} dataId - The ID of the state or other data associated with the effect.
     * @param {number} value1 - Primary value (e.g., formula multiplier or chance).
     * @param {number} value2 - Secondary value.
     */
    constructor(code, dataId = 0, value1 = 0, value2 = 0) {
        this.code = code;
        this.dataId = dataId;
        this.value1 = value1;
        this.value2 = value2;
    }
}
