"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiFileSearchQueryTool = void 0;
const genai_1 = require("@google/genai");
class GeminiFileSearchQueryTool {
    constructor() {
        // Extend description to include usableAsTool while maintaining compatibility with current typings
        this.description = ({
            displayName: 'Gemini File Search: Query (Tool)',
            name: 'geminiFileSearchQueryTool',
            icon: 'file:gemini.svg',
            group: ['transform'],
            version: 1,
            description: 'Query a Gemini File Search store as a Tool for AI Agents',
            defaults: { name: 'Gemini File Search Query (Tool)' },
            inputs: ['main'],
            outputs: ['main'],
            // Mark node as usable by AI Agent Tools
            // @ts-ignore - property is supported at runtime but not in current typings
            usableAsTool: true,
            credentials: [{ name: 'geminiApi', required: true }],
            properties: [
                {
                    displayName: 'Store Name',
                    name: 'queryStoreName',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Full resource name of the store to query',
                },
                {
                    displayName: 'Question',
                    name: 'question',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Your question to answer using the File Search store',
                },
                {
                    displayName: 'Model',
                    name: 'model',
                    type: 'options',
                    options: [
                        { name: 'gemini-2.5-flash', value: 'gemini-2.5-flash' },
                        { name: 'gemini-2.5-pro', value: 'gemini-2.5-pro' },
                    ],
                    default: 'gemini-2.5-flash',
                    description: 'Model used to answer your question',
                },
                {
                    displayName: 'Include Citations',
                    name: 'includeCitations',
                    type: 'boolean',
                    default: true,
                },
            ],
        });
    }
    async execute() {
        var _a;
        const items = this.getInputData();
        const returnData = [];
        const credentials = (await this.getCredentials('geminiApi'));
        const apiKey = credentials.apiKey || '';
        const ai = new genai_1.GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
        for (let i = 0; i < items.length; i++) {
            const queryStoreName = this.getNodeParameter('queryStoreName', i);
            const question = this.getNodeParameter('question', i);
            const model = this.getNodeParameter('model', i);
            const includeCitations = this.getNodeParameter('includeCitations', i);
            const response = await ai.models.generateContent({
                model,
                contents: question,
                config: { tools: [{ fileSearch: { fileSearchStoreNames: [queryStoreName] } }] },
            });
            const out = { text: response.text };
            if (includeCitations) {
                const candidates = response.candidates || [];
                const gm = (_a = candidates[0]) === null || _a === void 0 ? void 0 : _a.groundingMetadata;
                if (gm)
                    out.groundingMetadata = gm;
            }
            returnData.push(out);
        }
        return [this.helpers.returnJsonArray(returnData)];
    }
}
exports.GeminiFileSearchQueryTool = GeminiFileSearchQueryTool;
