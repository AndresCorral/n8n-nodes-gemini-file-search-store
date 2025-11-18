import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from 'n8n-workflow';

export class GeminiFileSearch implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Gemini File Search',
    name: 'geminiFileSearch',
    icon: 'file:gemini.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Manage and query Gemini File Search Stores (cloud-safe)',
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
        options: [
          { name: 'Create Store', value: 'createStore', description: 'Create a FileSearchStore' },
          { name: 'Delete Store', value: 'deleteStore', description: 'Delete a FileSearchStore' },
          { name: 'Upload', value: 'upload', description: 'Upload a file to a FileSearchStore' },
          { name: 'List Documents', value: 'listDocuments', description: 'List Documents in a FileSearchStore' },
          { name: 'Delete Document', value: 'deleteDocument', description: 'Delete a Document from a FileSearchStore' },
          { name: 'Query', value: 'query', description: 'Query a FileSearchStore with RAG' },
        ],
        default: 'query',
      },

      // Create Store
      {
        displayName: 'Store Display Name',
        name: 'storeDisplayName',
        type: 'string',
        required: true,
        default: '',
        description: 'Human-readable display name for the FileSearchStore',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['createStore'] } },
      },

      // Delete Store
      {
        displayName: 'Store Name',
        name: 'storeName',
        type: 'string',
        required: true,
        default: '',
        description: 'Full resource name of the FileSearchStore to delete (e.g., fileSearchStores/STORE_ID)',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['deleteStore'] } },
      },

      // Upload
      {
        displayName: 'Store Name',
        name: 'uploadStoreName',
        type: 'string',
        required: true,
        default: '',
        description: 'Full resource name of the FileSearchStore to upload into',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
      },
      {
        displayName: 'Binary Property',
        name: 'binaryProperty',
        type: 'string',
        required: true,
        default: 'data',
        description: 'Name of the binary property that contains the file to upload',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
      },
      {
        displayName: 'File Display Name',
        name: 'uploadDisplayName',
        type: 'string',
        required: false,
        default: '',
        description: 'Optional display name for the created document (visible in citations)',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
      },
      {
        displayName: 'MIME Type',
        name: 'uploadMimeType',
        type: 'string',
        required: false,
        default: 'application/octet-stream',
        description: 'Optional MIME type of the uploaded file',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['upload'] } },
      },

      // List Documents
      {
        displayName: 'Store Name',
        name: 'listStoreName',
        type: 'string',
        required: true,
        default: '',
        description: 'Full resource name of the FileSearchStore to list documents from',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['listDocuments'] } },
      },
      {
        displayName: 'Page Size',
        name: 'pageSize',
        type: 'number',
        required: false,
        default: 10,
        description: 'Maximum number of documents per page (max 20)',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['listDocuments'] } },
      },
      {
        displayName: 'Page Token',
        name: 'pageToken',
        type: 'string',
        required: false,
        default: '',
        description: 'Page token from a previous list call to paginate results',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['listDocuments'] } },
      },

      // Delete Document
      {
        displayName: 'Document Name',
        name: 'documentName',
        type: 'string',
        required: true,
        default: '',
        description: 'Full resource name of the Document to delete (e.g., fileSearchStores/STORE_ID/documents/DOC_ID)',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['deleteDocument'] } },
      },
      {
        displayName: 'Force',
        name: 'force',
        type: 'boolean',
        default: false,
        description: 'If true, also delete related chunks and objects',
        displayOptions: { show: { resource: ['fileSearch'], operation: ['deleteDocument'] } },
      },

      // Query
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

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;

      if (resource !== 'fileSearch') {
        throw new Error('Only the File Search resource is supported.');
      }

      if (operation === 'createStore') {
        const storeDisplayName = this.getNodeParameter('storeDisplayName', i) as string;

        const options: any = {
          method: 'POST',
          url: `https://generativelanguage.googleapis.com/v1beta/fileSearchStores`,
          json: true,
          body: { displayName: storeDisplayName },
        };

        const response: any = await this.helpers.httpRequestWithAuthentication.call(this, 'geminiApi', options);
        returnData.push(response as IDataObject);
        continue;
      }

      if (operation === 'deleteStore') {
        const storeName = this.getNodeParameter('storeName', i) as string;

        const options: any = {
          method: 'DELETE',
          url: `https://generativelanguage.googleapis.com/v1beta/${encodeURI(storeName)}`,
          json: true,
        };
        const response: any = await this.helpers.httpRequestWithAuthentication.call(this, 'geminiApi', options);
        returnData.push(response as IDataObject);
        continue;
      }

      if (operation === 'upload') {
        const storeName = this.getNodeParameter('uploadStoreName', i) as string;
        const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
        const displayName = this.getNodeParameter('uploadDisplayName', i) as string;
        const mimeTypeParam = this.getNodeParameter('uploadMimeType', i) as string;

        const buffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);
        if (!buffer) {
          throw new Error(`Binary property '${binaryProperty}' not found or empty.`);
        }
        const numBytes = buffer.length;
        const mimeType = mimeTypeParam || 'application/octet-stream';

        // Start resumable upload to the FileSearchStore
        const startOptions: any = {
          method: 'POST',
          url: `https://generativelanguage.googleapis.com/upload/v1beta/${encodeURI(storeName)}:uploadToFileSearchStore`,
          json: true,
          body: {
            ...(displayName ? { displayName } : {}),
            ...(mimeType ? { mimeType } : {}),
          },
          headers: {
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': `${numBytes}`,
            'X-Goog-Upload-Header-Content-Type': mimeType,
            'Content-Type': 'application/json',
          },
          // Ensure we get headers to extract the upload URL
          returnFullResponse: true,
        };

        const startResp: any = await this.helpers.httpRequestWithAuthentication.call(this, 'geminiApi', startOptions);
        const headers = startResp?.headers || {};
        const uploadUrl = headers['x-goog-upload-url'] || headers['X-Goog-Upload-Url'];
        if (!uploadUrl) {
          throw new Error('Upload URL not returned by upload start response.');
        }

        // Finalize upload with file bytes
        const finalizeOptions: any = {
          method: 'POST',
          url: uploadUrl,
          json: false,
          body: buffer,
          headers: {
            'Content-Length': `${numBytes}`,
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize',
          },
        };
        const finalizeResp: any = await this.helpers.httpRequestWithAuthentication.call(this, 'geminiApi', finalizeOptions);
        // The finalize response is typically the long-running Operation for upload/import
        returnData.push(finalizeResp as IDataObject);
        continue;
      }

      if (operation === 'listDocuments') {
        const listStoreName = this.getNodeParameter('listStoreName', i) as string;
        const pageSize = this.getNodeParameter('pageSize', i, 10) as number;
        const pageToken = this.getNodeParameter('pageToken', i, '') as string;

        const options: any = {
          method: 'GET',
          url: `https://generativelanguage.googleapis.com/v1beta/${encodeURI(listStoreName)}/documents`,
          json: true,
          qs: {
            ...(pageSize ? { pageSize } : {}),
            ...(pageToken ? { pageToken } : {}),
          },
        };
        const response: any = await this.helpers.httpRequestWithAuthentication.call(this, 'geminiApi', options);
        returnData.push(response as IDataObject);
        continue;
      }

      if (operation === 'deleteDocument') {
        const documentName = this.getNodeParameter('documentName', i) as string;
        const force = this.getNodeParameter('force', i) as boolean;

        const options: any = {
          method: 'DELETE',
          url: `https://generativelanguage.googleapis.com/v1beta/${encodeURI(documentName)}`,
          json: true,
          qs: {
            ...(force ? { force } : {}),
          },
        };
        const response: any = await this.helpers.httpRequestWithAuthentication.call(this, 'geminiApi', options);
        returnData.push(response as IDataObject);
        continue;
      }

      if (operation === 'query') {
        const queryStoreName = this.getNodeParameter('queryStoreName', i) as string;
        const question = this.getNodeParameter('question', i) as string;
        const model = this.getNodeParameter('model', i) as string;
        const includeCitations = this.getNodeParameter('includeCitations', i) as boolean;

        const options: any = {
          method: 'POST',
          url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          json: true,
          body: {
            contents: [{ role: 'user', parts: [{ text: question }] }],
            tools: [{ fileSearch: { fileSearchStoreNames: [queryStoreName] } }],
          },
        };

        const response: any = await this.helpers.httpRequestWithAuthentication.call(this, 'geminiApi', options);

        const candidates = response?.candidates || [];
        let text = '';
        try {
          const parts = candidates[0]?.content?.parts || [];
          text = parts.map((p: any) => p?.text).filter(Boolean).join('\n');
        } catch {}
        const gm = candidates[0]?.groundingMetadata;

        const out: IDataObject = { text };
        if (includeCitations && gm) out.groundingMetadata = gm;
        returnData.push(out);
        continue;
      }

      throw new Error('Unsupported operation for File Search resource.');
    }

    return [this.helpers.returnJsonArray(returnData)];
  }
}