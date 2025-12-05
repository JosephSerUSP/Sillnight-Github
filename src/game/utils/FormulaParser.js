/**
 * specific utility for parsing and evaluating mathematical formulas safely.
 * Removes the need for 'eval()' in damage calculations.
 */
export class FormulaParser {
    /**
     * Evaluates a formula string with the given context.
     * @param {string} formula - The formula string (e.g., "a.atk * 4 - b.def * 2").
     * @param {Object} context - The context object containing variables (e.g., { a: attacker, b: target, v: variables }).
     * @returns {number} The result of the evaluation.
     */
    static evaluate(formula, context = {}) {
        if (!formula) return 0;
        try {
            return this.parseExpression(formula, context);
        } catch (e) {
            console.error(`Error parsing formula "${formula}":`, e);
            return 0;
        }
    }

    static parseExpression(expression, context) {
        const tokens = this.tokenize(expression);
        const rpn = this.toRPN(tokens);
        return this.evaluateRPN(rpn, context);
    }

    static tokenize(str) {
        // Updated regex to properly capture parens
        const regex = /([a-zA-Z_][a-zA-Z0-9_.]*|\d+(?:\.\d+)?|[\+\-\*\/\(\)])/g;
        return str.match(regex) || [];
    }

    static toRPN(tokens) {
        const output = [];
        const stack = [];
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

        for (let token of tokens) {
            if (!isNaN(parseFloat(token))) {
                output.push(parseFloat(token)); // Number
            } else if (precedence[token]) { // Operator
                while (stack.length > 0 &&
                       stack[stack.length - 1] !== '(' &&
                       precedence[stack[stack.length - 1]] >= precedence[token]) {
                    output.push(stack.pop());
                }
                stack.push(token);
            } else if (token === '(') {
                stack.push(token);
            } else if (token === ')') {
                while (stack.length > 0 && stack[stack.length - 1] !== '(') {
                    output.push(stack.pop());
                }
                stack.pop(); // Pop '('
            } else {
                // Variable / Property path
                output.push(token);
            }
        }
        while (stack.length > 0) {
            output.push(stack.pop());
        }
        return output;
    }

    static evaluateRPN(rpn, context) {
        const stack = [];

        for (let token of rpn) {
            if (typeof token === 'number') {
                stack.push(token);
            } else if (['+', '-', '*', '/'].includes(token)) {
                const b = stack.pop();
                const a = stack.pop();
                if (token === '+') stack.push(a + b);
                else if (token === '-') stack.push(a - b);
                else if (token === '*') stack.push(a * b);
                else if (token === '/') stack.push(a / b);
            } else {
                // Variable lookup
                const val = this.resolveVariable(token, context);
                stack.push(val);
            }
        }
        return stack.length > 0 ? stack[0] : 0;
    }

    static resolveVariable(path, context) {
        if (!path) return 0;
        const parts = path.split('.');
        let val = context[parts[0]];
        for (let i = 1; i < parts.length; i++) {
            if (val === undefined || val === null) return 0;
            val = val[parts[i]];
        }
        return (typeof val === 'number') ? val : 0;
    }
}
