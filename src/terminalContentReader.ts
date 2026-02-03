import * as vscode from 'vscode';

/**
 * Enhanced terminal content reader using shell integration
 * This uses VSCode's shell integration API to capture terminal output
 */
export class TerminalContentReader {
    private terminalDataMap: Map<string, string[]> = new Map();
    private terminalIdMap: WeakMap<vscode.Terminal, string> = new WeakMap();
    private terminalIdCounter: number = 0;
    private readonly maxBufferLines = 1000; // Keep last 1000 lines per terminal

    constructor(context: vscode.ExtensionContext) {
        // Register shell integration for terminals
        this.setupShellIntegration(context);
    }

    private setupShellIntegration(context: vscode.ExtensionContext) {
        // Listen to terminal shell integration
        context.subscriptions.push(
            vscode.window.onDidStartTerminalShellExecution((e) => {
                this.onShellExecutionStart(e);
            })
        );

        context.subscriptions.push(
            vscode.window.onDidEndTerminalShellExecution((e) => {
                this.onShellExecutionEnd(e);
            })
        );
    }

    private onShellExecutionStart(event: vscode.TerminalShellExecutionStartEvent) {
        const terminalId = this.getTerminalId(event.terminal);
        const command = event.execution.commandLine.value;
        
        this.appendToBuffer(terminalId, `[COMMAND] ${command}`);
    }

    private onShellExecutionEnd(event: vscode.TerminalShellExecutionEndEvent) {
        const terminalId = this.getTerminalId(event.terminal);
        const command = event.execution.commandLine.value;
        const exitCode = event.exitCode;
        
        this.appendToBuffer(terminalId, `[COMPLETED] ${command} (exit code: ${exitCode})`);
        
        // Read output stream - always try to read
        this.readExecutionOutput(event.execution, terminalId);
    }

    private async readExecutionOutput(execution: vscode.TerminalShellExecution, terminalId: string) {
        try {
            const stream = execution.read();
            for await (const data of stream) {
                this.appendToBuffer(terminalId, data);
            }
        } catch (error) {
            // Silently ignore if stream reading is not supported
            console.debug('Terminal output stream not available:', error);
        }
    }

    private appendToBuffer(terminalId: string, content: string) {
        let buffer = this.terminalDataMap.get(terminalId) || [];
        
        // Split by lines and add to buffer
        const lines = content.split('\n');
        buffer.push(...lines);
        
        // Keep only the last N lines
        if (buffer.length > this.maxBufferLines) {
            buffer = buffer.slice(-this.maxBufferLines);
        }
        
        this.terminalDataMap.set(terminalId, buffer);
    }

    getTerminalContent(terminal: vscode.Terminal, lastNLines: number = 50): string {
        const terminalId = this.getTerminalId(terminal);
        const buffer = this.terminalDataMap.get(terminalId) || [];
        
        // Return last N lines
        const lines = buffer.slice(-lastNLines);
        return lines.join('\n');
    }

    getLastNLines(terminal: vscode.Terminal, lastNLines: number = 50): string {
        // Get the last N lines from the terminal buffer
        const terminalId = this.getTerminalId(terminal);
        const buffer = this.terminalDataMap.get(terminalId) || [];
        
        // Return last N lines
        const lines = buffer.slice(-lastNLines);
        return lines.join('\n');
    }

    clearBuffer(terminal: vscode.Terminal) {
        const terminalId = this.getTerminalId(terminal);
        this.terminalDataMap.delete(terminalId);
    }

    clearAllBuffers() {
        this.terminalDataMap.clear();
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

    dispose() {
        this.terminalDataMap.clear();
    }
}
