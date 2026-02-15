export interface PuzzleboxClientConfig {
  baseUrl: string;
  tenant: string;
  apiKey?: string;
  jwt?: string;
}

export interface RequestOptions {
  jwt?: string;
  apiKey?: string;
}
