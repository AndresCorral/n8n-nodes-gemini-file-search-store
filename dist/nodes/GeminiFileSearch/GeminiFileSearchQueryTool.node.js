"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiFileSearchQueryTool = void 0;
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
        var _a, _b, _c;
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const queryStoreName = this.getNodeParameter('queryStoreName', i);
            const question = this.getNodeParameter('question', i);
            const model = this.getNodeParameter('model', i);
            const includeCitations = this.getNodeParameter('includeCitations', i);
            const options = {
                method: 'POST',
                url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                json: true,
                body: {
                    contents: [{ role: 'user', parts: [{ text: question }] }],
                    tools: [{ fileSearch: { fileSearchStoreNames: [queryStoreName] } }],
                },
            };
            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'geminiApi', options);
            const candidates = (response === null || response === void 0 ? void 0 : response.candidates) || [];
            let text = '';
            try {
                const parts = ((_b = (_a = candidates[0]) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.parts) || [];
                text = parts.map((p) => p === null || p === void 0 ? void 0 : p.text).filter(Boolean).join('\n');
            }
            catch { }
            const gm = (_c = candidates[0]) === null || _c === void 0 ? void 0 : _c.groundingMetadata;
            const out = { text };
            if (includeCitations && gm)
                out.groundingMetadata = gm;
            returnData.push(out);
        }
        return [this.helpers.returnJsonArray(returnData)];
    }
}
exports.GeminiFileSearchQueryTool = GeminiFileSearchQueryTool;
