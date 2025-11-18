"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiFileSearch = void 0;
class GeminiFileSearch {
    constructor() {
        this.description = {
            displayName: 'Gemini File Search',
            name: 'geminiFileSearch',
            icon: 'file:gemini.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Query with RAG using Gemini File Search (cloud-safe)',
            defaults: { name: 'Gemini File Search' },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [{ name: 'geminiApi', required: true }],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [{ name: 'File Search', value: 'fileSearch' }],
                    default: 'fileSearch',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    displayOptions: { show: { resource: ['fileSearch'] } },
                    options: [{ name: 'Query', value: 'query', description: 'Query a FileSearchStore with RAG' }],
                    default: 'query',
                },
                {
                    displayName: 'Store Name',
                    name: 'queryStoreName',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Full resource name of the store to query',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['query'] } },
                },
                {
                    displayName: 'Question',
                    name: 'question',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Your question to answer using the File Search store',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['query'] } },
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
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['query'] } },
                },
                {
                    displayName: 'Include Citations',
                    name: 'includeCitations',
                    type: 'boolean',
                    default: true,
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['query'] } },
                },
            ],
        };
    }
    async execute() {
        var _a, _b, _c;
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const resource = this.getNodeParameter('resource', i);
            const operation = this.getNodeParameter('operation', i);
            if (resource !== 'fileSearch' || operation !== 'query') {
                throw new Error('Only the Query operation is supported in this cloud-safe version of the node.');
            }
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
            // Use credential-based auth to inject x-goog-api-key header from GeminiApi credentials
            const response = await this.helpers.requestWithAuthentication.call(this, 'geminiApi', options);
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
exports.GeminiFileSearch = GeminiFileSearch;
