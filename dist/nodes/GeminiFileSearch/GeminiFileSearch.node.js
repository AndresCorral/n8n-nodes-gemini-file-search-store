"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiFileSearch = void 0;
const genai_1 = require("@google/genai");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class GeminiFileSearch {
    constructor() {
        this.description = {
            displayName: 'Gemini File Search',
            name: 'geminiFileSearch',
            icon: 'file:gemini.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Create stores, upload files, and query with RAG using Gemini File Search',
            defaults: {
                name: 'Gemini File Search',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'geminiApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        { name: 'File Search', value: 'fileSearch' },
                    ],
                    default: 'fileSearch',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    displayOptions: { show: { resource: ['fileSearch'] } },
                    options: [
                        { name: 'Create Store', value: 'createStore', description: 'Create a new FileSearchStore' },
                        { name: 'List Stores', value: 'listStores', description: 'List FileSearchStores (optional filter and pagination)' },
                        { name: 'Delete Store', value: 'deleteStore', description: 'Delete a FileSearchStore by name' },
                        { name: 'Upload', value: 'upload', description: 'Upload a file to a FileSearchStore' },
                        { name: 'List Documents', value: 'listDocuments', description: 'List documents in a FileSearchStore' },
                        { name: 'Delete Document', value: 'deleteDocument', description: 'Delete a document by name' },
                        { name: 'Update Document Metadata', value: 'updateDocumentMetadata', description: 'Update document metadata (if supported)' },
                        { name: 'Query', value: 'query', description: 'Query a FileSearchStore with RAG' },
                    ],
                    default: 'createStore',
                },
                // Create Store fields
                {
                    displayName: 'Store Display Name',
                    name: 'storeDisplayName',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Human-readable name of the store',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['createStore'] } },
                },
                // List Stores fields
                {
                    displayName: 'Filter by Display Name',
                    name: 'filterDisplayName',
                    type: 'string',
                    default: '',
                    description: 'Optional client-side filter to return only stores whose displayName contains this text',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['listStores'] } },
                },
                {
                    displayName: 'Page Size',
                    name: 'listPageSize',
                    type: 'number',
                    default: 0,
                    description: 'Optional page size for listing stores (if supported by API). 0 uses API default',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['listStores'] } },
                },
                {
                    displayName: 'Page Token',
                    name: 'listPageToken',
                    type: 'string',
                    default: '',
                    description: 'Optional page token to continue listing from a previous response',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['listStores'] } },
                },
                // Delete Store fields
                {
                    displayName: 'Store Name',
                    name: 'deleteStoreName',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Full resource name of the store to delete (e.g., fileSearchStores/xxxx)',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['deleteStore'] } },
                },
                // Upload fields
                {
                    displayName: 'Store Name',
                    name: 'storeName',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Full resource name of the store (e.g., fileSearchStores/xxxx)',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
                },
                {
                    displayName: 'Binary Property',
                    name: 'binaryPropertyName',
                    type: 'string',
                    required: true,
                    default: 'data',
                    description: 'Name of the binary property that contains the file to upload',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
                },
                {
                    displayName: 'File Display Name',
                    name: 'fileDisplayName',
                    type: 'string',
                    default: '',
                    description: 'Optional display name for the uploaded document',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
                },
                {
                    displayName: 'MIME Type',
                    name: 'mimeType',
                    type: 'string',
                    default: '',
                    description: 'Optional MIME type for the file (e.g., application/pdf). If empty, the node will use the binary mimeType.',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
                },
                {
                    displayName: 'MIME Type Preset',
                    name: 'mimeTypePreset',
                    type: 'options',
                    options: [
                        { name: 'Infer from binary (default)', value: 'infer' },
                        { name: 'PDF', value: 'application/pdf' },
                        { name: 'Plain Text', value: 'text/plain' },
                        { name: 'Markdown', value: 'text/markdown' },
                        { name: 'JSON', value: 'application/json' },
                        { name: 'CSV', value: 'text/csv' },
                        { name: 'Word (DOCX)', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
                        { name: 'Excel (XLSX)', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                        { name: 'PowerPoint (PPTX)', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
                    ],
                    default: 'infer',
                    description: 'Preset common MIME types to avoid mistakes. If set to Infer, the node will use the binary mimeType or fallback to application/octet-stream.',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
                },
                {
                    displayName: 'Chunking: Max Tokens per Chunk',
                    name: 'maxTokensPerChunk',
                    type: 'number',
                    default: 0,
                    description: 'Optional. If set > 0, configures chunking size',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
                },
                {
                    displayName: 'Chunking: Max Overlap Tokens',
                    name: 'maxOverlapTokens',
                    type: 'number',
                    default: 0,
                    description: 'Optional. If set > 0, configures chunk overlap',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
                },
                {
                    displayName: 'Metadata',
                    name: 'metadata',
                    type: 'collection',
                    placeholder: 'Add Field',
                    default: {},
                    options: [
                        { displayName: 'Key', name: 'key', type: 'string', default: '' },
                        { displayName: 'Value', name: 'value', type: 'string', default: '' },
                    ],
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
                },
                // List Documents fields
                {
                    displayName: 'Store Name',
                    name: 'listDocsStoreName',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Full resource name of the store to list documents from',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['listDocuments'] } },
                },
                {
                    displayName: 'Page Size',
                    name: 'listDocsPageSize',
                    type: 'number',
                    default: 0,
                    description: 'Optional page size for listing documents (if supported). 0 uses API default',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['listDocuments'] } },
                },
                {
                    displayName: 'Page Token',
                    name: 'listDocsPageToken',
                    type: 'string',
                    default: '',
                    description: 'Optional page token to continue listing documents from a previous response',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['listDocuments'] } },
                },
                // Delete Document fields
                {
                    displayName: 'Document Name',
                    name: 'deleteDocumentName',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Full resource name of the document to delete (e.g., fileSearchStores/xxx/documents/yyy)',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['deleteDocument'] } },
                },
                // Update Document Metadata fields
                {
                    displayName: 'Document Name',
                    name: 'updateDocumentName',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Full resource name of the document to update',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['updateDocumentMetadata'] } },
                },
                {
                    displayName: 'Display Name',
                    name: 'updateDisplayName',
                    type: 'string',
                    default: '',
                    description: 'New display name for the document (if supported)',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['updateDocumentMetadata'] } },
                },
                {
                    displayName: 'Custom Metadata',
                    name: 'updateCustomMetadata',
                    type: 'collection',
                    placeholder: 'Add Field',
                    default: {},
                    options: [
                        { displayName: 'Key', name: 'key', type: 'string', default: '' },
                        { displayName: 'Value', name: 'value', type: 'string', default: '' },
                    ],
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['updateDocumentMetadata'] } },
                },
                // Upload Many fields
                // (Removed parameters for uploadManyStoreName and uploadManyBinaryProperties)
                {
                    displayName: 'Store Name',
                    name: 'uploadManyStoreName',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'Full resource name of the store to upload files to',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['uploadMany'] } },
                },
                {
                    displayName: 'Binary Properties',
                    name: 'uploadManyBinaryProperties',
                    type: 'string',
                    required: true,
                    default: 'data1,data2',
                    description: 'Comma-separated list of binary property names to upload in parallel',
                    displayOptions: { show: { resource: ['fileSearch'], operation: ['uploadMany'] } },
                },
                // Query fields
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
        var _a, _b, _c, _d, _e, _f;
        const items = this.getInputData();
        const returnData = [];
        const credentials = (await this.getCredentials('geminiApi'));
        const apiKey = credentials.apiKey || '';
        const ai = new genai_1.GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
        for (let i = 0; i < items.length; i++) {
            const resource = this.getNodeParameter('resource', i);
            const operation = this.getNodeParameter('operation', i);
            if (resource === 'fileSearch') {
                if (operation === 'createStore') {
                    const storeDisplayName = this.getNodeParameter('storeDisplayName', i);
                    if (!ai.fileSearchStores || typeof ai.fileSearchStores.create !== 'function') {
                        throw new Error('Gemini SDK does not expose fileSearchStores.create. Ensure @google/genai is installed and up to date in ~/.n8n/custom (>=1.25).');
                    }
                    const store = await ai.fileSearchStores.create({ config: { displayName: storeDisplayName } });
                    returnData.push(store);
                }
                else if (operation === 'listStores') {
                    if (!ai.fileSearchStores || typeof ai.fileSearchStores.list !== 'function') {
                        throw new Error('Gemini SDK does not expose fileSearchStores.list. Ensure @google/genai is installed properly.');
                    }
                    const pageSize = this.getNodeParameter('listPageSize', i, 0);
                    const pageToken = this.getNodeParameter('listPageToken', i, '');
                    const filterDisplayName = this.getNodeParameter('filterDisplayName', i, '');
                    const req = {};
                    if (pageSize && pageSize > 0)
                        req.pageSize = pageSize;
                    if (pageToken)
                        req.pageToken = pageToken;
                    const resp = await ai.fileSearchStores.list(req);
                    let storesArr = [];
                    try {
                        const isIterable = resp && typeof (resp === null || resp === void 0 ? void 0 : resp[Symbol.asyncIterator]) === 'function';
                        if (Array.isArray(resp))
                            storesArr = resp;
                        else if (Array.isArray(resp === null || resp === void 0 ? void 0 : resp.fileSearchStores))
                            storesArr = resp.fileSearchStores;
                        else if (Array.isArray(resp === null || resp === void 0 ? void 0 : resp.stores))
                            storesArr = resp.stores;
                        else if (isIterable) {
                            for await (const s of resp)
                                storesArr.push(s);
                        }
                        else if (Array.isArray(resp === null || resp === void 0 ? void 0 : resp.data))
                            storesArr = resp.data;
                    }
                    catch { }
                    // Fallback normalization for SDK responses that return arrays like [resources, request, response]
                    if (storesArr.length === 0 && Array.isArray(resp)) {
                        const candidates = [];
                        for (const part of resp) {
                            if (Array.isArray(part)) {
                                for (const s of part)
                                    candidates.push(s);
                            }
                            else if (Array.isArray(part === null || part === void 0 ? void 0 : part.fileSearchStores)) {
                                candidates.push(...part.fileSearchStores);
                            }
                            else if (Array.isArray(part === null || part === void 0 ? void 0 : part.stores)) {
                                candidates.push(...part.stores);
                            }
                            else if (Array.isArray(part === null || part === void 0 ? void 0 : part.data)) {
                                candidates.push(...part.data);
                            }
                            else if (part && typeof (part === null || part === void 0 ? void 0 : part[Symbol.asyncIterator]) === 'function') {
                                for await (const s of part)
                                    candidates.push(s);
                            }
                        }
                        storesArr = candidates.filter((s) => typeof s === 'object' && (String((s === null || s === void 0 ? void 0 : s.name) || '').includes('fileSearchStores/') || (s === null || s === void 0 ? void 0 : s.displayName)));
                    }
                    // Try helper toArray() if present
                    if (storesArr.length === 0 && resp && typeof (resp === null || resp === void 0 ? void 0 : resp.toArray) === 'function') {
                        try {
                            const arr = await resp.toArray();
                            if (Array.isArray(arr))
                                storesArr = arr;
                        }
                        catch { }
                    }
                    if (filterDisplayName) {
                        storesArr = storesArr.filter((s) => String(s.displayName || '').toLowerCase().includes(filterDisplayName.toLowerCase()));
                    }
                    if (storesArr.length === 0) {
                        let rawSummary = undefined;
                        try {
                            rawSummary = resp && typeof resp === 'object' ? Object.keys(resp) : String(resp);
                            if (Array.isArray(resp))
                                rawSummary = { isArray: true, length: resp.length, firstElementType: typeof resp[0] };
                        }
                        catch { }
                        returnData.push({ stores: [], nextPageToken: resp === null || resp === void 0 ? void 0 : resp.nextPageToken, debug: { type: typeof resp, summary: rawSummary } });
                    }
                    else {
                        for (const s of storesArr)
                            returnData.push(s);
                    }
                }
                else if (operation === 'deleteStore') {
                    const deleteStoreName = this.getNodeParameter('deleteStoreName', i);
                    if (!ai.fileSearchStores || typeof ai.fileSearchStores.delete !== 'function') {
                        throw new Error('Gemini SDK does not expose fileSearchStores.delete. Ensure @google/genai is installed properly.');
                    }
                    const resp = await ai.fileSearchStores.delete({ name: deleteStoreName });
                    returnData.push(resp);
                }
                else if (operation === 'upload') {
                    const storeName = this.getNodeParameter('storeName', i);
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
                    const fileDisplayName = this.getNodeParameter('fileDisplayName', i);
                    const maxTokensPerChunk = this.getNodeParameter('maxTokensPerChunk', i);
                    const maxOverlapTokens = this.getNodeParameter('maxOverlapTokens', i);
                    const metadata = this.getNodeParameter('metadata', i, {});
                    const mimeTypeParam = this.getNodeParameter('mimeType', i, '');
                    const mimeTypePreset = this.getNodeParameter('mimeTypePreset', i, 'infer');
                    // Try to read mimeType from the binary metadata if parameter/preset indicate infer
                    const binaryMeta = (_b = (_a = items[i]) === null || _a === void 0 ? void 0 : _a.binary) === null || _b === void 0 ? void 0 : _b[binaryPropertyName];
                    let inferredMime;
                    if (mimeTypePreset && mimeTypePreset !== 'infer') {
                        inferredMime = mimeTypePreset;
                    }
                    else if (mimeTypeParam) {
                        inferredMime = mimeTypeParam;
                    }
                    else {
                        inferredMime = (binaryMeta === null || binaryMeta === void 0 ? void 0 : binaryMeta.mimeType) || undefined;
                    }
                    const binaryData = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    const tempDir = path.join(process.cwd(), '.tmp_uploads');
                    if (!fs.existsSync(tempDir))
                        fs.mkdirSync(tempDir, { recursive: true });
                    const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${i}`);
                    fs.writeFileSync(tempFilePath, binaryData);
                    // Clamp chunking values to API limits (maxTokensPerChunk <= 512)
                    const safeMaxTokens = (typeof maxTokensPerChunk === 'number' && maxTokensPerChunk > 0) ? Math.min(maxTokensPerChunk, 512) : 0;
                    const safeOverlap = (typeof maxOverlapTokens === 'number' && maxOverlapTokens > 0) ? Math.min(maxOverlapTokens, 512) : 0;
                    const config = {};
                    if (fileDisplayName)
                        config.displayName = fileDisplayName;
                    if (metadata && metadata.key && metadata.value) {
                        config.customMetadata = [{ key: String(metadata.key), stringValue: String(metadata.value) }];
                    }
                    if (safeMaxTokens && safeMaxTokens > 0) {
                        config.chunkingConfig = { whiteSpaceConfig: { maxTokensPerChunk: safeMaxTokens, maxOverlapTokens: safeOverlap || 0 } };
                    }
                    if (inferredMime)
                        config.mimeType = inferredMime;
                    else
                        config.mimeType = 'application/octet-stream';
                    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
                        file: tempFilePath,
                        fileSearchStoreName: storeName,
                        config,
                    });
                    // Wait until import is complete
                    while (!operation.done) {
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        operation = await ai.operations.get({ operation });
                    }
                    // cleanup temp file
                    try {
                        fs.unlinkSync(tempFilePath);
                    }
                    catch { }
                    // Return enriched summary including requested display name and effective settings
                    const summary = {
                        operationName: operation === null || operation === void 0 ? void 0 : operation.name,
                        done: operation === null || operation === void 0 ? void 0 : operation.done,
                        documentName: (_c = operation === null || operation === void 0 ? void 0 : operation.response) === null || _c === void 0 ? void 0 : _c.documentName,
                        storeName,
                        requestedDisplayName: fileDisplayName || undefined,
                        effectiveMimeType: config.mimeType,
                        effectiveChunkingConfig: config.chunkingConfig || undefined,
                    };
                    returnData.push(summary);
                }
                else if (operation === 'uploadMany') {
                    // Removed Upload Many implementation
                    throw new Error('Upload Many has been removed from this version.');
                }
                else if (operation === 'listDocuments') {
                    const storeName = this.getNodeParameter('listDocsStoreName', i);
                    if (!ai.fileSearchStores || typeof ((_d = ai.fileSearchStores.documents) === null || _d === void 0 ? void 0 : _d.list) !== 'function') {
                        throw new Error('Gemini SDK does not expose fileSearchStores.documents.list.');
                    }
                    const pageSize = this.getNodeParameter('listDocsPageSize', i, 0);
                    const pageToken = this.getNodeParameter('listDocsPageToken', i, '');
                    const req = { parent: storeName };
                    if (pageSize && pageSize > 0)
                        req.pageSize = pageSize;
                    if (pageToken)
                        req.pageToken = pageToken;
                    const resp = await ai.fileSearchStores.documents.list(req);
                    returnData.push(resp);
                }
                else if (operation === 'deleteDocument') {
                    const docName = this.getNodeParameter('deleteDocumentName', i);
                    if (!ai.fileSearchStores || typeof ((_e = ai.fileSearchStores.documents) === null || _e === void 0 ? void 0 : _e.delete) !== 'function') {
                        throw new Error('Gemini SDK does not expose fileSearchStores.documents.delete.');
                    }
                    const resp = await ai.fileSearchStores.documents.delete({ name: docName });
                    returnData.push(resp);
                }
                else if (operation === 'updateDocumentMetadata') {
                    const docName = this.getNodeParameter('updateDocumentName', i);
                    const updateDisplayName = this.getNodeParameter('updateDisplayName', i, '');
                    const updateCustomMetadata = this.getNodeParameter('updateCustomMetadata', i, {});
                    const hasUpdate = Boolean(updateDisplayName) || Boolean(updateCustomMetadata && updateCustomMetadata.key);
                    if (!hasUpdate) {
                        returnData.push({ warning: 'No update fields provided' });
                    }
                    else {
                        // If SDK does not support patch/update, return guidance.
                        returnData.push({ error: 'Update operation not supported by SDK for File Search documents. Consider re-uploading the file with desired metadata.' });
                    }
                }
                else if (operation === 'query') {
                    const queryStoreName = this.getNodeParameter('queryStoreName', i);
                    const question = this.getNodeParameter('question', i);
                    const model = this.getNodeParameter('model', i);
                    const includeCitations = this.getNodeParameter('includeCitations', i);
                    const response = await ai.models.generateContent({
                        model,
                        contents: question,
                        config: {
                            tools: [{ fileSearch: { fileSearchStoreNames: [queryStoreName] } }],
                        },
                    });
                    const out = { text: response.text };
                    if (includeCitations) {
                        const candidates = response.candidates || [];
                        const gm = (_f = candidates[0]) === null || _f === void 0 ? void 0 : _f.groundingMetadata;
                        if (gm)
                            out.groundingMetadata = gm;
                    }
                    returnData.push(out);
                }
            }
        }
        return [this.helpers.returnJsonArray(returnData)];
    }
}
exports.GeminiFileSearch = GeminiFileSearch;
