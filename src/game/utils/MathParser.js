/**
 * A safe mathematical expression parser and evaluator.
 * Replaces the unsafe usage of eval() for damage formulas.
 */
export class MathParser {
    /**
     * Evaluates a mathematical formula with a given context.
     * @param {string} formula - The formula string (e.g., "4 + 2 * a.level").
     * @param {Object} context - The context containing variables (e.g., { a: subject, b: target }).
     * @returns {number} The result of the evaluation.
     */
    static evaluate(formula, context = {}) {
        if (!formula) return 0;

        // 1. Sanitize the formula
        // We whitelist the allowed characters first to filter out obvious garbage.
        // Allowed characters:
        // - Alphanumeric: a-z, A-Z, 0-9
        // - Whitespace: \s
        // - Operators/Punctuation: + - * / % . ( ) , ? : _ > < = ! | &
        // Added > < = ! | & for logic operations (conditions)
        if (/[^a-zA-Z0-9\s\+\-\*\/\%\.\(\)\,\?\:\_\>\<\=\!\|\&]/g.test(formula)) {
            console.warn(`[MathParser] Invalid characters in formula: "${formula}". Defaulting to 0.`);
            return 0;
        }

        // 2. Validate Identifiers
        // We find all words that look like identifiers.
        // Allowed root identifiers: 'a', 'b', 'Math'
        const allowedIdentifiers = ['a', 'b', 'Math'];

        // Match all identifiers: words starting with letter or underscore
        const identifiers = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];

        // Find all tokens that are NOT in the whitelist
        const invalidTokens = identifiers.filter(token => !allowedIdentifiers.includes(token));

        if (invalidTokens.length > 0) {
            // Check that EVERY invalid token is used as a property access (preceded by a dot).
            // We need to ensure there is no usage of the token that is NOT preceded by a dot.

            // We use a regex that looks for the token NOT preceded by a dot.
            // Using lookbehind: (?<!\.)\bTOKEN\b
            // We must escape the token just in case, though identifiers are alphanumeric.

            for (const token of invalidTokens) {
                // If the token appears anywhere WITHOUT a preceding dot, it's a violation.
                const re = new RegExp(`(?<!\\.)\\b${token}\\b`);

                if (re.test(formula)) {
                    console.warn(`[MathParser] Unauthorized identifier "${token}" in formula: "${formula}".`);
                    return 0;
                }
            }
        }

        try {
            // Create a function that takes 'a', 'b', and 'Math' (optional) as arguments.
            // effectively: (a, b) => 4 + 2 * a.level
            const func = new Function('a', 'b', `return ${formula};`);
            return func(context.a, context.b);
        } catch (e) {
            console.error(`[MathParser] Error evaluating formula: "${formula}"`, e);
            return 0;
        }
    }
}
