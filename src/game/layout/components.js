import { Component } from './Component.js';

export class TextComponent extends Component {
    constructor(text = '', className = '') {
        super('div', className);
        this.setText(text);
    }
}

export class ButtonComponent extends Component {
    constructor(label = '', onClick = null, className = '') {
        // Default button styling: border, hover effect, cursor
        const defaultStyle = 'border border-white px-2 py-1 cursor-pointer hover:bg-white hover:text-black';
        const finalClass = className ? `${defaultStyle} ${className}` : defaultStyle;
        super('button', finalClass);

        this.setText(label);
        if (onClick) {
            this.on('click', (event) => {
                return onClick(event);
            });
        }
    }
}

export class WindowFrameComponent extends Component {
    constructor(className = '') {
        // Standard window styling: absolute, black bg, white border, padding
        const baseClass = 'absolute bg-black/80 border border-white p-2 rounded';
        super('div', className ? `${baseClass} ${className}` : baseClass);
    }
}
