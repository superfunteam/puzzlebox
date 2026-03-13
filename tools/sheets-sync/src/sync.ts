import { readFileSync } from 'node:fs';
import { PuzzleboxClient, type CreateEditionRequest } from '@puzzlebox/sdk';
import {
  orderedRowsToEditionPayload,
  pickOneRowsToEditionPayload,
  surveyRowsToEditionPayload,
  type OrderedRow,
  type PickOneRow,
  type SurveyRow
} from './schemas';

interface SyncConfig {
  baseUrl: string;
  tenant: string;
  apiKey: string;
  slug: string;
  mode: 'pick_one' | 'ordered_sequence' | 'survey';
  rowsFile: string;
}

function readRows(filePath: string): Array<Record<string, string>> {
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as Array<Record<string, string>>;
}

function asPickOneRows(rows: Array<Record<string, string>>): PickOneRow[] {
  return rows as unknown as PickOneRow[];
}

function asOrderedRows(rows: Array<Record<string, string>>): OrderedRow[] {
  return rows as unknown as OrderedRow[];
}

function asSurveyRows(rows: Array<Record<string, string>>): SurveyRow[] {
  return rows as unknown as SurveyRow[];
}

async function main() {
  const [baseUrl, tenant, apiKey, slug, mode, rowsFile] = process.argv.slice(2);

  if (!baseUrl || !tenant || !apiKey || !slug || !mode || !rowsFile) {
    console.error('Usage: npm run sync -- <baseUrl> <tenant> <apiKey> <slug> <mode> <rowsFile.json>');
    process.exit(1);
  }

  const config: SyncConfig = {
    baseUrl,
    tenant,
    apiKey,
    slug,
    mode: mode as SyncConfig['mode'],
    rowsFile
  };

  const client = new PuzzleboxClient({
    baseUrl: config.baseUrl,
    tenant: config.tenant,
    apiKey: config.apiKey
  });

  const rows = readRows(config.rowsFile);

  let payload: CreateEditionRequest;
  if (config.mode === 'pick_one') {
    payload = pickOneRowsToEditionPayload(asPickOneRows(rows));
  } else if (config.mode === 'ordered_sequence') {
    payload = orderedRowsToEditionPayload(asOrderedRows(rows));
  } else {
    payload = surveyRowsToEditionPayload(asSurveyRows(rows));
  }

  const result = await client.createEdition(config.slug, payload);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
