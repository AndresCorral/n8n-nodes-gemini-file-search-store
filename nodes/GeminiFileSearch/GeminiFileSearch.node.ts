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
    description: 'Query with RAG using Gemini File Search (cloud-safe)',
    defaults: { name: 'Gemini File Search' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [ { name: 'geminiApi', required: true } ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [ { name: 'File Search', value: 'fileSearch' } ],
        default: 'fileSearch',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        displayOptions: { show: { resource: ['fileSearch'] } },
        options: [ { name: 'Query', value: 'query', description: 'Query a FileSearchStore with RAG' } ],
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: IDataObject[] = [];

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;

      if (resource !== 'fileSearch' || operation !== 'query') {
        throw new Error('Only the Query operation is supported in this cloud-safe version of the node.');
      }

      const queryStoreName = this.getNodeParameter('queryStoreName', i) as string;
      const question = this.getNodeParameter('question', i) as string;
      const model = this.getNodeParameter('model', i) as string;
      const includeCitations = this.getNodeParameter('includeCitations', i) as boolean;

      const options: any = {
        method: 'POST',
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        json: true,
        body: {
          contents: [ { role: 'user', parts: [ { text: question } ] } ],
          tools: [ { fileSearch: { fileSearchStoreNames: [queryStoreName] } } ],
        },
      };

      // Use credential-based auth to inject x-goog-api-key header from GeminiApi credentials
      const response: any = await (this.helpers as any).requestWithAuthentication.call(this, 'geminiApi', options);

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
    }

    return [this.helpers.returnJsonArray(returnData)];
  }
}