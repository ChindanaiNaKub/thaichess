import { IMPORTED_PUZZLE_CANDIDATES } from '../../../shared/puzzleImportQueue';
import { auditPuzzles } from '../../../shared/puzzleAudit';

const rows = auditPuzzles(IMPORTED_PUZZLE_CANDIDATES)
  .sort((left, right) => left.qualityScore - right.qualityScore || left.puzzleId - right.puzzleId);

for (const row of rows) {
  const flags = row.flags.length > 0 ? ` | ${row.flags.join('; ')}` : '';
  console.log(
    `#${row.puzzleId} [${row.reviewStatus}] score=${row.qualityScore} family=${row.family} motif=${row.motif} verify=${row.verificationStatus} gap=${row.multiPvGap ?? 'n/a'} key=${row.positionKey}${flags}`,
  );
}

console.log(`\nAudited ${rows.length} imported candidate puzzle(s).`);
