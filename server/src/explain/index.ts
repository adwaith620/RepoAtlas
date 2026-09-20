import { getProvider } from './providers.js';
import { AnalysisResult } from 'shared';

export async function explainRepo(analysis: AnalysisResult): Promise<string> {
  const provider = getProvider();
  
  const topFiles = analysis.graph.nodes
    .filter(n => n.data.type === 'file')
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, 15)
    .map(n => n.id)
    .join('\n');

  const prompt = `REPO EXPLANATION
Description: ${analysis.meta?.description || 'N/A'}
Tech Stack: ${JSON.stringify(analysis.techStack)}
Top Files:
${topFiles}
External Deps: ${analysis.externalDeps.join(', ')}

Please provide:
1. A 3-4 sentence project summary.
2. An architecture overview of how main parts fit together.
3. A suggested onboarding reading order for the top 8 files, with a one-line reason for each.

Format clearly with headings.`;

  return await provider.complete(prompt);
}

export function truncateContent(content: string, maxChars = 8000) {
  if (content.length > maxChars) return content.slice(0, maxChars) + '\n...[TRUNCATED]';
  return content;
}

export async function explainFile(path: string, content: string, neighbors: {in: string[], out: string[]}): Promise<string> {
  const provider = getProvider();
  
  const prompt = `FILE EXPLANATION
File: ${path}
Imports from: ${neighbors.out.join(', ') || 'None'}
Imported by: ${neighbors.in.join(', ') || 'None'}

Content:
${truncateContent(content)}

Explain in 2-3 sentences what this file does and how it relates to its imports/importers.`;

  return await provider.complete(prompt);
}
