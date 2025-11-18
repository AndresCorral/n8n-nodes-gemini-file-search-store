import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

export class GeminiFileSearchQueryTool implements INodeType {
	// Extend description to include usableAsTool while maintaining compatibility with current typings
	description: INodeTypeDescription = ({
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
		credentials: [ { name: 'geminiApi', required: true } ],
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
	}) as unknown as INodeTypeDescription;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		for (let i = 0; i < items.length; i++) {
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
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}