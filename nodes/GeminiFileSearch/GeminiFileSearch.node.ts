import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

export class GeminiFileSearch implements INodeType {
	description: INodeTypeDescription = {
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		const credentials = (await this.getCredentials('geminiApi')) as IDataObject;
		const apiKey = (credentials.apiKey as string) || '';
		const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			if (resource === 'fileSearch') {
				if (operation === 'createStore') {
					const storeDisplayName = this.getNodeParameter('storeDisplayName', i) as string;
					if (!ai.fileSearchStores || typeof (ai as any).fileSearchStores.create !== 'function') {
						throw new Error('Gemini SDK does not expose fileSearchStores.create. Ensure @google/genai is installed and up to date in ~/.n8n/custom (>=1.25).');
					}
					const store = await ai.fileSearchStores.create({ config: { displayName: storeDisplayName } });
					returnData.push(store as unknown as IDataObject);
				}
				else if (operation === 'listStores') {
					if (!ai.fileSearchStores || typeof (ai as any).fileSearchStores.list !== 'function') {
						throw new Error('Gemini SDK does not expose fileSearchStores.list. Ensure @google/genai is installed properly.');
					}
					const pageSize = this.getNodeParameter('listPageSize', i, 0) as number;
					const pageToken = this.getNodeParameter('listPageToken', i, '') as string;
					const filterDisplayName = this.getNodeParameter('filterDisplayName', i, '') as string;
					const req: any = {};
					if (pageSize && pageSize > 0) req.pageSize = pageSize;
					if (pageToken) req.pageToken = pageToken;
					const resp: any = await ai.fileSearchStores.list(req);
					let storesArr: any[] = [];
					try {
						const isIterable = resp && typeof resp?.[Symbol.asyncIterator] === 'function';
						if (Array.isArray(resp)) storesArr = resp;
						else if (Array.isArray(resp?.fileSearchStores)) storesArr = resp.fileSearchStores;
						else if (Array.isArray(resp?.stores)) storesArr = resp.stores;
						else if (isIterable) {
							for await (const s of resp) storesArr.push(s);
						}
						else if (Array.isArray(resp?.data)) storesArr = resp.data;
					} catch {}
					// Fallback normalization for SDK responses that return arrays like [resources, request, response]
					if (storesArr.length === 0 && Array.isArray(resp)) {
					  const candidates: any[] = [];
					  for (const part of resp) {
					    if (Array.isArray(part)) {
					      for (const s of part) candidates.push(s);
					    } else if (Array.isArray(part?.fileSearchStores)) {
					      candidates.push(...part.fileSearchStores);
					    } else if (Array.isArray(part?.stores)) {
					      candidates.push(...part.stores);
					    } else if (Array.isArray(part?.data)) {
					      candidates.push(...part.data);
					    } else if (part && typeof part?.[Symbol.asyncIterator] === 'function') {
					      for await (const s of part as any) candidates.push(s);
					    }
					  }
					  storesArr = candidates.filter((s: any) => typeof s === 'object' && (String(s?.name || '').includes('fileSearchStores/') || s?.displayName));
					}
					// Try helper toArray() if present
					if (storesArr.length === 0 && resp && typeof resp?.toArray === 'function') {
					  try {
					    const arr = await resp.toArray();
					    if (Array.isArray(arr)) storesArr = arr;
					  } catch {}
					}
					if (filterDisplayName) {
						storesArr = storesArr.filter((s: any) => String(s.displayName || '').toLowerCase().includes(filterDisplayName.toLowerCase()));
					}
					if (storesArr.length === 0) {
						let rawSummary: any = undefined;
						try {
							rawSummary = resp && typeof resp === 'object' ? Object.keys(resp) : String(resp);
							if (Array.isArray(resp)) rawSummary = { isArray: true, length: resp.length, firstElementType: typeof resp[0] };
						} catch {}
						returnData.push({ stores: [], nextPageToken: resp?.nextPageToken, debug: { type: typeof resp, summary: rawSummary } } as unknown as IDataObject);
					} else {
						for (const s of storesArr) returnData.push(s as unknown as IDataObject);
					}
				}
				else if (operation === 'deleteStore') {
					const deleteStoreName = this.getNodeParameter('deleteStoreName', i) as string;
					if (!ai.fileSearchStores || typeof (ai as any).fileSearchStores.delete !== 'function') {
						throw new Error('Gemini SDK does not expose fileSearchStores.delete. Ensure @google/genai is installed properly.');
					}
					const resp = await ai.fileSearchStores.delete({ name: deleteStoreName });
					returnData.push(resp as unknown as IDataObject);
				}
				else if (operation === 'upload') {
					const storeName = this.getNodeParameter('storeName', i) as string;
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const fileDisplayName = this.getNodeParameter('fileDisplayName', i) as string;
					const maxTokensPerChunk = this.getNodeParameter('maxTokensPerChunk', i) as number;
					const maxOverlapTokens = this.getNodeParameter('maxOverlapTokens', i) as number;
					const metadata = this.getNodeParameter('metadata', i, {}) as IDataObject;
					const mimeTypeParam = this.getNodeParameter('mimeType', i, '') as string;
					const mimeTypePreset = this.getNodeParameter('mimeTypePreset', i, 'infer') as string;
					// Try to read mimeType from the binary metadata if parameter/preset indicate infer
					const binaryMeta: any = (items[i] as any)?.binary?.[binaryPropertyName];
					let inferredMime: string | undefined;
					if (mimeTypePreset && mimeTypePreset !== 'infer') {
						inferredMime = mimeTypePreset;
					} else if (mimeTypeParam) {
						inferredMime = mimeTypeParam;
					} else {
						inferredMime = binaryMeta?.mimeType || undefined;
					}
					const binaryData = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
					const tempDir = path.join(process.cwd(), '.tmp_uploads');
					if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
					const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${i}`);
					fs.writeFileSync(tempFilePath, binaryData);

					// Clamp chunking values to API limits (maxTokensPerChunk <= 512)
					const safeMaxTokens = (typeof maxTokensPerChunk === 'number' && maxTokensPerChunk > 0) ? Math.min(maxTokensPerChunk, 512) : 0;
					const safeOverlap = (typeof maxOverlapTokens === 'number' && maxOverlapTokens > 0) ? Math.min(maxOverlapTokens, 512) : 0;

					const config: any = {};
					if (fileDisplayName) config.displayName = fileDisplayName;
					if (metadata && metadata.key && metadata.value) {
						config.customMetadata = [{ key: String(metadata.key), stringValue: String(metadata.value) }];
					}
					if (safeMaxTokens && safeMaxTokens > 0) {
						config.chunkingConfig = { whiteSpaceConfig: { maxTokensPerChunk: safeMaxTokens, maxOverlapTokens: safeOverlap || 0 } };
					}
					if (inferredMime) config.mimeType = inferredMime; else config.mimeType = 'application/octet-stream';
					let operation = await ai.fileSearchStores.uploadToFileSearchStore({
						file: tempFilePath,
						fileSearchStoreName: storeName,
						config,
					});

					// Wait until import is complete
					while (!(operation as any).done) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
						operation = await ai.operations.get({ operation });
					}

					// cleanup temp file
					try { fs.unlinkSync(tempFilePath); } catch {}

					// Return enriched summary including requested display name and effective settings
					const summary: IDataObject = {
						operationName: (operation as any)?.name,
						done: (operation as any)?.done,
						documentName: (operation as any)?.response?.documentName,
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
					const storeName = this.getNodeParameter('listDocsStoreName', i) as string;
					if (!ai.fileSearchStores || typeof (ai as any).fileSearchStores.documents?.list !== 'function') {
						throw new Error('Gemini SDK does not expose fileSearchStores.documents.list.');
					}
					const pageSize = this.getNodeParameter('listDocsPageSize', i, 0) as number;
					const pageToken = this.getNodeParameter('listDocsPageToken', i, '') as string;
					const req: any = { parent: storeName };
					if (pageSize && pageSize > 0) req.pageSize = pageSize;
					if (pageToken) req.pageToken = pageToken;
					const resp = await (ai as any).fileSearchStores.documents.list(req);
					returnData.push(resp as unknown as IDataObject);
				}
				else if (operation === 'deleteDocument') {
					const docName = this.getNodeParameter('deleteDocumentName', i) as string;
					if (!ai.fileSearchStores || typeof (ai as any).fileSearchStores.documents?.delete !== 'function') {
						throw new Error('Gemini SDK does not expose fileSearchStores.documents.delete.');
					}
					const resp = await (ai as any).fileSearchStores.documents.delete({ name: docName });
					returnData.push(resp as unknown as IDataObject);
				}
				else if (operation === 'updateDocumentMetadata') {
					const docName = this.getNodeParameter('updateDocumentName', i) as string;
					const updateDisplayName = this.getNodeParameter('updateDisplayName', i, '') as string;
					const updateCustomMetadata = this.getNodeParameter('updateCustomMetadata', i, {}) as IDataObject;
					const hasUpdate = Boolean(updateDisplayName) || Boolean(updateCustomMetadata && updateCustomMetadata.key);
					if (!hasUpdate) {
						returnData.push({ warning: 'No update fields provided' } as unknown as IDataObject);
					} else {
						// If SDK does not support patch/update, return guidance.
						returnData.push({ error: 'Update operation not supported by SDK for File Search documents. Consider re-uploading the file with desired metadata.' } as unknown as IDataObject);
					}
				}
				else if (operation === 'query') {
					const queryStoreName = this.getNodeParameter('queryStoreName', i) as string;
					const question = this.getNodeParameter('question', i) as string;
					const model = this.getNodeParameter('model', i) as string;
					const includeCitations = this.getNodeParameter('includeCitations', i) as boolean;

					const response = await ai.models.generateContent({
						model,
						contents: question,
						config: {
							tools: [ { fileSearch: { fileSearchStoreNames: [queryStoreName] } } ],
						},
					});

					const out: IDataObject = { text: (response as any).text };
					if (includeCitations) {
						const candidates = (response as any).candidates || [];
						const gm = candidates[0]?.groundingMetadata;
						if (gm) out.groundingMetadata = gm;
					}
					returnData.push(out);
				}
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}