import { DOMCollector } from "./domCollector.js";
import { DOMApplier } from "./domApplier.js";
import type { PongSettings } from "../types/types.js";
import { RangeSliderHandler, KeyCaptureHandler } from "../components/InputHandlers.js";
import { getBackend, postBackend } from "../communication/fetch.js";
import type { User } from "../store/userStore.js";

let globalAppSettings: PongSettings | null = null;

// ============================================
// 2. CLASSE (SettingsManager.ts)
// ============================================

export class SettingsManager {
	// private settings : PongSettings;
	private popupElement: HTMLElement | null;
	private closeButton: HTMLElement | null;
	private applyButton: HTMLElement | null;
	private resetButton: HTMLElement | null;
	private saveButton: HTMLElement | null;
	private loadButton: HTMLElement | null;

	private ballSpeedSlider: RangeSliderHandler;
	private paddleSpeedSlider: RangeSliderHandler;
	private maxScoreSlider: RangeSliderHandler;
	private keyCapture: KeyCaptureHandler;
	
	private currentUserId: number | null = null;
	private onApplyCallback: ((settings: PongSettings) => void) | null = null;
	
	constructor(userId?: User | null) {
		this.popupElement = document.getElementById('popup-settings');
		this.closeButton = document.getElementById('closeSettingsBtn');
		this.applyButton = document.getElementById('applyBtn');
		this.resetButton = document.getElementById('resetBtn');
		this.saveButton = document.getElementById('saveBtn');
		this.loadButton = document.getElementById('loadBtn');

		this.ballSpeedSlider = new RangeSliderHandler('ballSpeed', 'ballSpeed-value');
		this.paddleSpeedSlider = new RangeSliderHandler('paddleSpeed', 'paddleSpeed-value');
		this.maxScoreSlider = new RangeSliderHandler('maxScore', 'maxScore-value');
		this.keyCapture = new KeyCaptureHandler();

		// Initialiser l'userId si fourni
		this.currentUserId = userId?.id || null;

		this.init();
		
		// Charger les settings globaux si disponibles
		if (globalAppSettings) {
			console.log('Loading global settings:', globalAppSettings);
			this.loadSettings(globalAppSettings);
		}
	}

    private init() {
        this.closeButton?.addEventListener('click', () => this.close());
        this.popupElement?.addEventListener('click', (e) => {
            if (e.target === this.popupElement) {
                this.close();
            }
        });
        this.resetButton?.addEventListener('click', () => this.onReset());
        this.applyButton?.addEventListener('click', () => {
            const settings = this.onApply();
            this.close();
            // Appeler le callback si défini
            if (this.onApplyCallback) {
                this.onApplyCallback(settings);
            }
        });
        this.saveButton?.addEventListener('click', () => this.onSave());
        this.loadButton?.addEventListener('click', () => this.onLoad());

    }

    public async open() { this.popupElement?.classList.remove('hidden');}    
    public close() { this.popupElement?.classList.add('hidden'); }

    public onApply(): PongSettings {
        const settings = this.getSettings();
		// Sauvegarder dans la variable globale
		globalAppSettings = settings;
        return settings;
    }

    public setOnApplyCallback(callback: (settings: PongSettings) => void) {
        this.onApplyCallback = callback;
    }

    public onReset() {
        const defaults = this.getDefaultSettings();
        this.loadSettings(defaults);
    }

    public async onSave() {
        if (this.currentUserId) {
            try {
                // Collecte des paramètres depuis le DOM avant sauvegarde
                const settings = this.getSettings();
                // POST vers le backend
                const response = await postBackend<{ok : boolean}>(`/users/${this.currentUserId}/settings`, settings);
                if (response.ok == true) {
                    console.log('💾 Settings saved successfully!', settings);
                } else {
                    console.error('Failed to save settings');
                }
            } catch (error) {
                console.error('Error saving settings:', error);
            }
        } else {
            console.error('Error saving settings: No user ID available.');
        }
    }

    public async onLoad() {
        if (this.currentUserId) {
            try {
                const settings = await getBackend<PongSettings>(`/users/${this.currentUserId}/settings`);
                if (settings) {
                    this.loadSettings(settings);
                    // Ensure powerUp defaults to false if missing from backend response (e.g. old data)
                    if (settings.powerUp === undefined) settings.powerUp = false; 
                    
                    console.log('✅ Settings loaded successfully!', settings);
                } else {
                    console.log('❌ No saved settings found.');
                }
            } catch (error) {
                console.log('Error loading settings:', error);
            }
        } else {
            console.log('❌ Create account to load settings.');
        }
    }

    public loadSettings(settings: PongSettings) {
        DOMApplier.applySettings(settings);
    }

    public getSettings(): PongSettings {
        let settings: PongSettings = this.getDefaultSettings();
        
		if (globalAppSettings) {
			settings = { ...settings, ...globalAppSettings };
		}

        DOMCollector.collectSettings(settings);
        return settings;
    }

    public getDefaultSettings(): PongSettings {
        return {
            difficulty: 'medium',
            ballSpeed: 5,
            paddleSpeed: 7,
            backgroundColor: '#000000',
            ballColor: '#ffffff',
            paddleColor: '#ffffff',
            player1Up: 'w',
            player1Down: 's',
            player2Up: 'ArrowUp',
            player2Down: 'ArrowDown',
            maxScore: 2,
            powerUp: false,
        };
    }
}