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

        if (!apiEndpoint || !apiKey) {
            console.warn('AI API not configured');
            return false;
        }

        try {
            const prompt = this.buildPrompt(terminalContent, terminalName);
            const response = await this.callAIAPI(apiEndpoint, apiKey, apiProvider, prompt);
            return this.parseResponse(response);
        } catch (error) {
            console.error('Error calling AI API:', error);
            return false;
        }
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
        prompt: string
    ): Promise<string> {
        switch (provider) {
            case 'openai':
                return this.callOpenAI(endpoint, apiKey, prompt);
            case 'claude':
                return this.callClaude(endpoint, apiKey, prompt);
            case 'custom':
                return this.callCustomAPI(endpoint, apiKey, prompt);
            default:
                throw new Error(`Unknown API provider: ${provider}`);
        }
    }

    private async callOpenAI(endpoint: string, apiKey: string, prompt: string): Promise<string> {
        const url = endpoint || 'https://api.openai.com/v1/chat/completions';
        
        const response = await this.axiosInstance.post(
            url,
            {
                model: 'gpt-3.5-turbo',
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

        return response.data.choices[0].message.content.trim();
    }

    private async callClaude(endpoint: string, apiKey: string, prompt: string): Promise<string> {
        const url = endpoint || 'https://api.anthropic.com/v1/messages';
        
        const response = await this.axiosInstance.post(
            url,
            {
                model: 'claude-3-haiku-20240307',
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

        return response.data.content[0].text.trim();
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

        // Expect response format: { "response": "YES" | "NO" }
        return response.data.response || response.data.text || '';
    }

    private parseResponse(response: string): boolean {
        const normalized = response.toUpperCase().trim();
        return normalized.includes('YES') || normalized === 'Y';
    }
}
