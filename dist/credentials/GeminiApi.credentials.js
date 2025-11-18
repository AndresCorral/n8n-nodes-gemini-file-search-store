"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiApi = void 0;
class GeminiApi {
    constructor() {
        this.name = 'geminiApi';
        this.displayName = 'Gemini API';
        this.documentationUrl = 'https://ai.google.dev/gemini-api/docs/api-key';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                default: '',
                typeOptions: { password: true },
                description: 'Your Gemini API key from Google AI Studio',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'x-goog-api-key': '={{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: 'https://generativelanguage.googleapis.com',
                url: '/v1beta/models',
                method: 'GET',
            },
        };
    }
}
exports.GeminiApi = GeminiApi;
