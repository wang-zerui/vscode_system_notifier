import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

export class AIService {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async shouldNotify(terminalContent: string, terminalName: string): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('terminalNotifier');
        const apiEndpoint = config.get<string>('apiEndpoint', '');
        const apiKey = config.get<string>('apiKey', '');
        const apiProvider = config.get<string>('apiProvider', 'openai');
        const modelName = config.get<string>('modelName', '');

        if (!apiEndpoint || !apiKey) {
            console.warn('AI API not configured');
            return false;
        }

        // Sanitize terminal content - warn about potential sensitive data
        if (this.containsPotentiallySensitiveData(terminalContent)) {
            console.warn('Terminal content may contain sensitive information. Consider excluding this terminal from monitoring.');
        }

        try {
            const prompt = this.buildPrompt(terminalContent, terminalName);
            const response = await this.callAIAPI(apiEndpoint, apiKey, apiProvider, modelName, prompt);
            return this.parseResponse(response);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error calling AI API:', errorMessage);
            
            // Provide user feedback on API errors
            if (errorMessage.includes('401') || errorMessage.includes('403')) {
                vscode.window.showErrorMessage('Terminal Notifier: API authentication failed. Please check your API key.');
            } else if (errorMessage.includes('timeout')) {
                console.warn('Terminal Notifier: API request timeout.');
            } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
                vscode.window.showErrorMessage('Terminal Notifier: Cannot connect to API endpoint. Please check your network and endpoint URL.');
            }
            
            return false;
        }
    }

    private containsPotentiallySensitiveData(content: string): boolean {
        // Basic check for common sensitive patterns
        const sensitivePatterns = [
            /password[=:\s]/i,
            /api[_-]?key[=:\s]/i,
            /token[=:\s]/i,
            /secret[=:\s]/i,
            /authorization[=:\s]/i
        ];
        
        return sensitivePatterns.some(pattern => pattern.test(content));
    }

    private buildPrompt(terminalContent: string, terminalName: string): string {
        return `You are a terminal activity monitor. Analyze the following terminal output and determine if the user needs to be notified.

Terminal Name: ${terminalName}

Terminal Content (last output):
${terminalContent}

Determine if any of these conditions are met:
1. A long-running task has completed (e.g., build finished, tests completed, deployment done)
2. An error occurred that requires user attention
3. The terminal is waiting for user input
4. A significant process has ended or requires action

Respond with ONLY "YES" if notification is needed, or "NO" if not needed.
Do not provide any additional explanation.`;
    }

    private async callAIAPI(
        endpoint: string,
        apiKey: string,
        provider: string,
        modelName: string,
        prompt: string
    ): Promise<string> {
        switch (provider) {
            case 'openai':
                return this.callOpenAI(endpoint, apiKey, modelName, prompt);
            case 'claude':
                return this.callClaude(endpoint, apiKey, modelName, prompt);
            case 'custom':
                return this.callCustomAPI(endpoint, apiKey, prompt);
            default:
                throw new Error(`Unknown API provider: ${provider}`);
        }
    }

    private async callOpenAI(endpoint: string, apiKey: string, modelName: string, prompt: string): Promise<string> {
        const url = endpoint || 'https://api.openai.com/v1/chat/completions';
        const model = modelName || 'gpt-3.5-turbo';
        
        const response = await this.axiosInstance.post(
            url,
            {
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that analyzes terminal output.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 10,
                temperature: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        // Add null safety checks
        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            throw new Error('Invalid response format from OpenAI API');
        }

        const message = response.data.choices[0]?.message?.content;
        if (typeof message !== 'string') {
            throw new Error('Invalid message content in OpenAI response');
        }

        return message.trim();
    }

    private async callClaude(endpoint: string, apiKey: string, modelName: string, prompt: string): Promise<string> {
        const url = endpoint || 'https://api.anthropic.com/v1/messages';
        const model = modelName || 'claude-3-haiku-20240307';
        
        const response = await this.axiosInstance.post(
            url,
            {
                model,
                max_tokens: 10,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                }
            }
        );

        // Add null safety checks
        if (!response.data || !response.data.content || response.data.content.length === 0) {
            throw new Error('Invalid response format from Claude API');
        }

        const text = response.data.content[0]?.text;
        if (typeof text !== 'string') {
            throw new Error('Invalid text content in Claude response');
        }

        return text.trim();
    }

    private async callCustomAPI(endpoint: string, apiKey: string, prompt: string): Promise<string> {
        // For custom API, expect a simple JSON format
        const response = await this.axiosInstance.post(
            endpoint,
            {
                prompt: prompt
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        // Add validation for response format
        if (!response.data) {
            throw new Error('Empty response from custom API');
        }

        // Expect response format: { "response": "YES" | "NO" } or { "text": "YES" | "NO" }
        const result = response.data.response || response.data.text;
        if (typeof result !== 'string') {
            throw new Error('Invalid response format from custom API. Expected { "response": "YES"|"NO" } or { "text": "YES"|"NO" }');
        }

        return result;
    }

    private parseResponse(response: string): boolean {
        const normalized = response.toUpperCase().trim();
        // Use strict matching to avoid false positives
        return normalized === 'YES' || normalized === 'Y';
    }
}
