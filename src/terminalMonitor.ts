import * as vscode from 'vscode';
import { AIService } from './aiService';
import { TerminalContentReader } from './terminalContentReader';

interface TerminalState {
    terminalId: string;
    lastContent: string;
    lastNotificationTime: number;
    contentHash: string;
    isRunning: boolean;
    hasBeenNotified: boolean;
}

export class TerminalMonitor {
    private intervalId: NodeJS.Timeout | undefined;
    private terminalStates: Map<string, TerminalState> = new Map();
    private terminalIdMap: WeakMap<vscode.Terminal, string> = new WeakMap();
    private terminalIdCounter: number = 0;
    private aiService: AIService;
    private contentReader: TerminalContentReader;
    private isEnabled: boolean = false;

    constructor(private context: vscode.ExtensionContext) {
        this.aiService = new AIService();
        this.contentReader = new TerminalContentReader(context);
        
        // Listen to terminal lifecycle events
        context.subscriptions.push(
            vscode.window.onDidOpenTerminal((terminal) => {
                this.onTerminalOpened(terminal);
            })
        );

        context.subscriptions.push(
            vscode.window.onDidCloseTerminal((terminal) => {
                this.onTerminalClosed(terminal);
            })
        );

        // Initialize existing terminals
        vscode.window.terminals.forEach(terminal => {
            this.onTerminalOpened(terminal);
        });
    }

    enable() {
        if (this.isEnabled) {
            return;
        }

        this.isEnabled = true;
        const config = vscode.workspace.getConfiguration('terminalNotifier');
        const checkInterval = config.get<number>('checkInterval', 5000);

        // Validate configuration
        if (checkInterval < 1000) {
            vscode.window.showWarningMessage('Terminal Notifier: Check interval must be at least 1000ms. Using default value.');
            this.startMonitoring(5000);
        } else {
            this.startMonitoring(checkInterval);
        }

        console.log('Terminal monitoring enabled');
    }

    private startMonitoring(checkInterval: number) {
        this.intervalId = setInterval(() => {
            this.checkAllTerminals();
        }, checkInterval);
    }

    disable() {
        if (!this.isEnabled) {
            return;
        }

        this.isEnabled = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }

        console.log('Terminal monitoring disabled');
    }

    async checkAllTerminalsNow() {
        await this.checkAllTerminals();
    }

    clearState() {
        this.terminalStates.clear();
        console.log('Terminal states cleared');
    }

    private onTerminalOpened(terminal: vscode.Terminal) {
        const terminalId = this.getTerminalId(terminal);
        
        if (!this.terminalStates.has(terminalId)) {
            this.terminalStates.set(terminalId, {
                terminalId,
                lastContent: '',
                lastNotificationTime: 0,
                contentHash: '',
                isRunning: false,
                hasBeenNotified: false
            });
            console.log(`Terminal opened: ${terminalId}`);
        }
    }

    private onTerminalClosed(terminal: vscode.Terminal) {
        const terminalId = this.getTerminalId(terminal);
        this.terminalStates.delete(terminalId);
        console.log(`Terminal closed: ${terminalId}`);
    }

    private getTerminalId(terminal: vscode.Terminal): string {
        // Use WeakMap to maintain stable IDs for terminals
        let id = this.terminalIdMap.get(terminal);
        if (!id) {
            id = `terminal_${this.terminalIdCounter++}_${Date.now()}`;
            this.terminalIdMap.set(terminal, id);
        }
        return id;
    }

    private async checkAllTerminals() {
        if (!this.isEnabled) {
            return;
        }

        const config = vscode.workspace.getConfiguration('terminalNotifier');
        const apiEndpoint = config.get<string>('apiEndpoint', '');
        const apiKey = config.get<string>('apiKey', '');

        if (!apiEndpoint || !apiKey) {
            // Skip checking if API is not configured
            console.debug('Terminal Notifier: API not configured. Skipping checks.');
            return;
        }

        // Validate cooldown
        const cooldown = config.get<number>('notificationCooldown', 300000);
        if (cooldown < 0) {
            console.warn('Terminal Notifier: Invalid cooldown value. Using default.');
        }

        for (const terminal of vscode.window.terminals) {
            try {
                await this.checkTerminal(terminal);
            } catch (error) {
                console.error(`Error checking terminal ${terminal.name}:`, error);
            }
        }
    }

    private async checkTerminal(terminal: vscode.Terminal) {
        const terminalId = this.getTerminalId(terminal);
        let state = this.terminalStates.get(terminalId);

        if (!state) {
            this.onTerminalOpened(terminal);
            state = this.terminalStates.get(terminalId);
            if (!state) {
                return;
            }
        }

        // Get terminal content
        const content = await this.getTerminalContent(terminal);
        
        if (!content) {
            return;
        }

        const config = vscode.workspace.getConfiguration('terminalNotifier');
        const minContentLength = config.get<number>('minContentLength', 50);

        // Skip if content is too short
        if (content.length < minContentLength) {
            return;
        }

        // Calculate content hash to detect changes
        const contentHash = this.hashString(content);

        // Skip if content hasn't changed
        if (contentHash === state.contentHash) {
            return;
        }

        // Update state
        state.lastContent = content;
        state.contentHash = contentHash;

        // Check cooldown period
        const cooldown = config.get<number>('notificationCooldown', 300000);
        const now = Date.now();
        
        if (state.lastNotificationTime > 0 && (now - state.lastNotificationTime) < cooldown) {
            // Still in cooldown period
            return;
        }

        // Ask AI if notification is needed
        const shouldNotify = await this.aiService.shouldNotify(content, terminal.name);

        if (shouldNotify) {
            this.sendNotification(terminal, content);
            state.lastNotificationTime = now;
            state.hasBeenNotified = true;
        }

        this.terminalStates.set(terminalId, state);
    }

    private async getTerminalContent(terminal: vscode.Terminal): Promise<string> {
        // Use the TerminalContentReader to get recent terminal output
        const content = this.contentReader.getTerminalContent(terminal, 100);
        return content;
    }

    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    private sendNotification(terminal: vscode.Terminal, _content: string) {
        const message = `Terminal "${terminal.name}" needs your attention!`;
        
        vscode.window.showWarningMessage(
            message,
            'Show Terminal',
            'Dismiss'
        ).then(selection => {
            if (selection === 'Show Terminal') {
                terminal.show();
            }
        });

        console.log(`Notification sent for terminal: ${terminal.name}`);
    }

    dispose() {
        this.disable();
        this.terminalStates.clear();
        this.contentReader.dispose();
    }
}
