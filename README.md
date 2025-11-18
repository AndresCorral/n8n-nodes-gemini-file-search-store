# n8n Community Node: Gemini File Search Store

A user-friendly node package that brings Google Gemini File Search into your n8n workflows. It lets you create and manage a File Search Store, upload documents, and ask questions with grounded answers and citations. It also ships a dedicated Tool for AI Agents to call the Query operation automatically.

## What this package does
- Connects n8n with Google Gemini File Search so you can store documents and query them with LLMs.
- Provides an easy UI to create the store, upload files, list/delete documents, and run queries.
- Exposes a Tool (usable by Agents) for the Query operation, so the agent can pick it when needed.

## Why you might want this
- Get reliable, grounded answers with citations: Gemini File Search can return supporting metadata for traceability.
- Scale your knowledge workflows: upload multiple documents (single-file operation here), organize stores, and query on demand.
- Seamless n8n integration: use it like any other node, or let an Agent call the Query Tool.
- Fast iteration: no backend to build—just drag, drop, and configure.

## What’s included
- Node: "Gemini File Search" (programmatic style)
- Tool: "Gemini File Search: Query (Tool)" (usable by Agents)
- Credentials: "Gemini API"

## Operations in the Gemini File Search node
- Create Store: Create a File Search Store by name.
- Delete Store: Delete a File Search Store by name.
- Upload: Upload a single file (binary property) to a File Search Store.
- List Documents: List documents available in a File Search Store.
- Delete Document: Delete a document from a File Search Store.
- Query: Ask a question using a Gemini model with File Search as the retrieval tool.

## The Tool for AI Agents
- Name: "Gemini File Search: Query (Tool)"
- Purpose: Allow AI Agents (e.g., n8n Tools Agent) to call the Query operation automatically.
- Parameters:
  - Store Name: Full resource path of the File Search Store.
  - Question: The user query.
  - Model: e.g., `gemini-2.5-flash` (default) or `gemini-2.5-pro`.
  - Include Citations: Return grounding metadata for traceable answers.
- Output:
  - `text`: the model’s answer
  - `groundingMetadata` (when citations are enabled)

## Requirements
- A Google Gemini API key with access to File Search.
- The full File Search Store name (for example: `projects/.../locations/.../fileSearchStores/STORE_ID`).
- n8n installed (self-hosted or local dev) and the ability to load community nodes or custom extensions.

## Installation
You can use this package as a community node or copy its compiled files into your custom extensions folder.

- Install from npm:
  - `npm install n8n-nodes-gemini-file-search-store`
  - Restart n8n so it detects the package (in environments that support community nodes).

- Manual (custom extensions):
  - Build the project: `npm run build`
  - Copy `dist/*` into your n8n custom extensions folder (e.g., `~/.n8n/custom/`).
  - Restart n8n.

## Quick start (Node)
1. Add the "Gemini File Search" node to a workflow.
2. Configure credentials: "Gemini API" (your API key).
3. Choose an operation:
   - Create Store: set the store name.
   - Upload: set store name, binary property (e.g., `data`), optional mime type, and display name.
   - Query: set store name, your question, model, and whether to include citations.
4. Execute and see the results.

## Quick start (Agent Tool)
1. Add a "Tools Agent" (or compatible Agent) to your workflow.
2. In its tools list, add "Gemini File Search: Query (Tool)".
3. Configure:
   - Store Name
   - Model (e.g., `gemini-2.5-flash`)
   - Include Citations (optional)
4. Run your agent. When the user asks a question, the agent can decide to call the Query Tool and return grounded answers.

## Parameters overview
- Store Name: Full path of your File Search Store.
- Binary Property (Upload): The binary field (e.g., `data`) where your file resides.
- File Display Name (Upload): Optional display name for the file.
- MIME Type (Upload): Optional MIME type; defaults to `application/octet-stream` if not provided.
- Model (Query): A Gemini model like `gemini-2.5-flash` or `gemini-2.5-pro`.
- Include Citations (Query): Enable to return `groundingMetadata`.

## Outputs
- Query (node and tool):
  - `text`: Answer from the model.
  - `groundingMetadata`: Citations and support info when enabled.
- Upload: Returns the operation result for the uploaded file.
- List Documents: Array of documents in the store.
- Delete Document / Delete Store: Operation status.

## Troubleshooting
- I can’t see the node/tool in n8n:
  - Restart n8n after installing.
  - If using custom extensions, ensure files are in `~/.n8n/custom` and readable.
- Query returns no citations:
  - Make sure "Include Citations" is enabled.
  - Verify your store name and that documents exist.
- Upload fails:
  - Confirm the binary property name matches your input (e.g., `data`).
  - Check MIME type and file size.

## Notes
- This is a community node package intended to simplify Gemini File Search workflows in n8n.
- The Query Tool is marked `usableAsTool` and designed for agent tool-calling scenarios.

## Contributing
Issues and improvements are welcome. Feel free to open discussions or contribute enhancements that help others use Gemini File Search in n8n more easily.