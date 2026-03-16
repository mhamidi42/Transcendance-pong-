// src/components/PopupSettings.ts

export function getSettingsPopupHTML(): string {
    return `
        <!-- Popup Settings -->
        <div id="popup-settings" class="popup-overlay popup-top hidden">
            <div class="glass-panel p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="title-elegant !mb-0">Settings</h2>
                    <button id="closeSettingsBtn" class="text-white/50 hover:text-white transition">✕</button>
                </div>
                
                <div class="space-y-6">
                    <!-- Difficulty -->
                    <div class="setting-item">
                        <span class="text-slate-300 font-medium tracking-wide">AI Difficulty</span>
                        <select id="aiDifficulty" class="bg-slate-800/50 text-slate-200 px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-white/30 transition">
                            <option value="easy">Easy</option>
                            <option value="medium" selected>Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    <!-- Ball Speed -->
                    <div class="setting-item">
                        <span class="text-slate-300 font-medium tracking-wide">Ball Speed</span>
                        <div class="flex items-center gap-4">
                            <input type="range" id="ballSpeed" min="1" max="10" value="5" class="w-48 accent-white cursor-pointer">
                            <span id="ballSpeed-value" class="text-white font-light text-xl min-w-[2rem] text-center">5</span>
                        </div>
                    </div>

                    <!-- Paddle Speed -->
                    <div class="setting-item">
                        <span class="text-slate-300 font-medium tracking-wide">Paddle Speed</span>
                        <div class="flex items-center gap-4">
                            <input type="range" id="paddleSpeed" min="1" max="10" value="7" class="w-48 accent-white cursor-pointer">
                            <span id="paddleSpeed-value" class="text-white font-light text-xl min-w-[2rem] text-center">7</span>
                        </div>
                    </div>

                    <!-- Colors -->
                    <div class="setting-item">
                        <span class="text-slate-300 font-medium tracking-wide">PowerUp (10touches=2points)</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="powerUp" class="sr-only peer">
                            <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    <div class="grid grid-cols-3 gap-4">
                        <div class="setting-group-grid group">
                            <span class="text-slate-400 text-sm uppercase tracking-wider group-hover:text-white transition">Ball</span>
                            <input type="color" id="ballColor" value="#ffffff" class="setting-input-color">
                        </div>
                        <div class="setting-group-grid group">
                            <span class="text-slate-400 text-sm uppercase tracking-wider group-hover:text-white transition">Paddle</span>
                            <input type="color" id="paddleColor" value="#ffffff" class="setting-input-color">
                        </div>
                        <div class="setting-group-grid group">
                            <span class="text-slate-400 text-sm uppercase tracking-wider group-hover:text-white transition">Background</span>
                            <input type="color" id="backgroundColor" value="#000000" class="setting-input-color">
                        </div>
                    </div>

                    <!-- Max Score -->
                    <div class="setting-item">
                        <span class="text-slate-300 font-medium tracking-wide">Max Score</span>
                        <div class="flex items-center gap-4">
                            <input type="range" id="maxScore" min="1" max="21" value="5" class="w-48 accent-white cursor-pointer">
                            <span id="maxScore-value" class="text-white font-light text-xl min-w-[2rem] text-center">5</span>
                        </div>
                    </div>

                     <!-- Controls P1 -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="setting-item">
                            <span class="text-slate-300 font-medium">Player 1 [UP]</span>
                            <button id="player1Up" data-key="w" class="btn-key">W</button>
                        </div>
                        <div class="setting-item">
                            <span class="text-slate-300 font-medium">Player 1 [DOWN]</span>
                             <button id="player1Down" data-key="s" class="btn-key">S</button>
                        </div>
                    </div>

                    <!-- Controls P2 -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="setting-item">
                            <span class="text-slate-300 font-medium">Player 2 [UP]</span>
                            <button id="player2Up" data-key="ArrowUp" class="btn-key">↑</button>
                        </div>
                        <div class="setting-item">
                            <span class="text-slate-300 font-medium">Player 2 [DOWN]</span>
                            <button id="player2Down" data-key="ArrowDown" class="btn-key">↓</button>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
                    <button id="resetBtn" class="btn btn-ghost">Reset</button>
                    <!-- <button id="applyBtn" class="btn btn-secondary">Apply</button> -->
                    <button id="loadBtn" class="btn btn-secondary">Load</button> 
                    <button id="saveBtn" class="btn btn-primary">Save Changes</button> 
                    <button id="applyBtn" class="btn btn-primary">Apply</button> 
                </div>
            </div>
        </div>
    `;
}