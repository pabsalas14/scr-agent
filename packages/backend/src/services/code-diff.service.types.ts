export interface CodeDiff {
  file: string;
  additions: number;
  deletions: number;
  changes: number;
  riskLevel: string;
  severity: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber?: number;
  highlighted?: boolean;
}
