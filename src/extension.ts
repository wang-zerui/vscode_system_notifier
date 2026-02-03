import * as vscode from 'vscode';
import { TerminalMonitor } from './terminalMonitor';

let terminalMonitor: TerminalMonitor | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Terminal System Notifier is now active');

    // Initialize terminal monitor
    terminalMonitor = new TerminalMonitor(context);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('terminalNotifier.enable', () => {
            terminalMonitor?.enable();
            vscode.window.showInformationMessage('Terminal Notifier: Monitoring enabled');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('terminalNotifier.disable', () => {
            terminalMonitor?.disable();
            vscode.window.showInformationMessage('Terminal Notifier: Monitoring disabled');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('terminalNotifier.checkNow', async () => {
            await terminalMonitor?.checkAllTerminalsNow();
            vscode.window.showInformationMessage('Terminal Notifier: Check completed');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('terminalNotifier.clearState', () => {
            terminalMonitor?.clearState();
            vscode.window.showInformationMessage('Terminal Notifier: State cleared');
        })
    );

    // Start monitoring if enabled
    const config = vscode.workspace.getConfiguration('terminalNotifier');
    if (config.get<boolean>('enabled', true)) {
        terminalMonitor.enable();
    }
}

export function deactivate() {
    terminalMonitor?.dispose();
}
