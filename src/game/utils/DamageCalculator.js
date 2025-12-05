/**
 * A safe expression parser for damage formulas.
 * Replaces the unsafe usage of eval().
 */
export class DamageCalculator {
    /**
     * Parses and evaluates a formula string safely.
     * Supports basic math: +, -, *, /, (, ), and property access on 'a' (subject) and 'b' (target).
     * @param {string} formula - The formula string (e.g., "4 + 2 * a.level").
     * @param {Object} a - The subject battler.
     * @param {Object} b - The target battler.
     * @returns {number} The evaluated result.
     */
    static evaluate(formula, a, b) {
        if (!formula) return 0;

        // Pre-parse: Replace a.prop and b.prop with actual values.
        // We handle simple properties like a.level, a.atk, b.def, etc.
        // This regex looks for 'a.' or 'b.' followed by word characters.
        const parsedFormula = formula.replace(/\b([ab])\.(\w+)\b/g, (match, subject, prop) => {
            const obj = subject === 'a' ? a : b;
            const val = obj[prop];
            // If the property is a function (unlikely in data but possible in code), call it?
            // For safety, we assume properties are numbers.
            // If undefined, default to 0 to prevent NaN.
            return (typeof val === 'number') ? val : 0;
        });

        // Now we have a string like "4 + 2 * 10".
        // We can use a Function constructor with 'use strict' which is safer than eval,
        // but still not 100% ideal if we want to avoid all execution of strings.
        // However, for this phase and the complexity of parsing math, a Function returning the result
        // of a rigorously cleaned string is the standard step up from direct eval.

        // Validation: Ensure the string only contains numbers, operators, parens, and spaces.
        if (/[^0-9+\-*/().\s]/.test(parsedFormula)) {
            console.error(`Unsafe or invalid characters in formula: "${formula}" -> "${parsedFormula}"`);
            return 0;
        }

        try {
            // Function constructor is safer than eval because it doesn't access local scope,
            // but we've already resolved variables so it's just math.
            const func = new Function(`return ${parsedFormula}`);
            return func();
        } catch (e) {
            console.error(`Error evaluating formula: "${formula}"`, e);
            return 0;
        }
    }
}
