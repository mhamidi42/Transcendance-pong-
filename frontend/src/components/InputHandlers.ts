// src/components/InputHandlers.ts

export class RangeSliderHandler {
    private slider: HTMLInputElement;
    private valueDisplay: HTMLElement;

    constructor(sliderId: string, valueId: string) {
        this.slider = document.getElementById(sliderId) as HTMLInputElement;
        this.valueDisplay = document.getElementById(valueId) as HTMLElement;
        
        if (this.slider && this.valueDisplay) {
            this.init();
        }
    }

    private init() {
        // Mettre à jour la valeur affichée en temps réel
        this.slider.addEventListener('input', () => {
            this.valueDisplay.textContent = this.slider.value;
        });
        
        // Initialiser la valeur
        this.valueDisplay.textContent = this.slider.value;
    }

    public setValue(value: number) {
        this.slider.value = value.toString();
        this.valueDisplay.textContent = value.toString();
    }

    public getValue(): number {
        return parseInt(this.slider.value);
    }
}

export class KeyCaptureHandler {
    private currentKeyInput: HTMLButtonElement | null = null;
    private keyInputs: NodeListOf<HTMLButtonElement>;

    private readonly KEY_NAMES: { [key: string]: string } = {
        'ArrowUp': '↑',
        'ArrowDown': '↓',
        'ArrowLeft': '←',
        'ArrowRight': '→',
        ' ': 'Space',
        'Enter': '⏎',
        'Escape': 'Esc',
        'Tab': '⇥',
        'Shift': '⇧',
        'Control': 'Ctrl',
        'Alt': 'Alt'
    };

    constructor() {
        this.keyInputs = document.querySelectorAll('.btn-key') as NodeListOf<HTMLButtonElement>;
        this.init();
    }

    private init() {
        this.setupKeyButtons();
        this.setupKeyboardListener();
        this.setupEscapeListener();
    }

    private setupKeyButtons() {
        this.keyInputs.forEach(button => {
            button.addEventListener('click', () => {
                this.activateButton(button);
            });
        });
    }

    private activateButton(button: HTMLButtonElement) {
        // Désactiver l'ancien bouton
        if (this.currentKeyInput && this.currentKeyInput !== button) {
            this.deactivateButton(this.currentKeyInput);
        }
        
        // Activer le nouveau
        this.currentKeyInput = button;
        button.classList.add('ring-4', 'ring-yellow-400', 'animate-pulse');
        button.textContent = 'Press a key...';
        document.body.focus();
    }

    private deactivateButton(button: HTMLButtonElement) {
        button.classList.remove('ring-4', 'ring-yellow-400', 'animate-pulse');
        const originalKey = button.dataset.key || '';
        button.textContent = this.getDisplayKey(originalKey);
    }

    private setupKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            if (!this.currentKeyInput) return;
            
            e.preventDefault();
            
            const key = e.key;
            const displayKey = this.getDisplayKey(key);
            
            // Mettre à jour le bouton
            this.currentKeyInput.textContent = displayKey;
            this.currentKeyInput.dataset.key = key;
            
            // Retirer l'animation
            this.currentKeyInput.classList.remove('ring-4', 'ring-yellow-400', 'animate-pulse');
            
            console.log(`✅ Key set to: ${displayKey}`);
            
            this.currentKeyInput = null;
        });
    }

    private setupEscapeListener() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentKeyInput) {
                this.deactivateButton(this.currentKeyInput);
                this.currentKeyInput = null;
                console.log('❌ Key capture cancelled');
            }
        });
    }

    private getDisplayKey(key: string): string {
        return this.KEY_NAMES[key] || key.toUpperCase();
    }

    public setKey(buttonId: string, key: string) {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
        if (button) {
            button.dataset.key = key;
            button.textContent = this.getDisplayKey(key);
        }
    }

    public getKey(buttonId: string): string {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
        return button?.dataset.key || '';
    }
}