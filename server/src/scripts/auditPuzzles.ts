import { ALL_PUZZLES } from '../../../shared/puzzles';
import { auditPuzzles } from '../../../shared/puzzleAudit';

const rows = auditPuzzles(ALL_PUZZLES)
  .sort((left, right) => left.qualityScore - right.qualityScore || left.puzzleId - right.puzzleId);

for (const row of rows) {
  const flags = row.flags.length > 0 ? ` | ${row.flags.join('; ')}` : '';
  console.log(
    `#${row.puzzleId} [${row.reviewStatus}] score=${row.qualityScore} family=${row.family} motif=${row.motif} verify=${row.verificationStatus} gap=${row.multiPvGap ?? 'n/a'} key=${row.positionKey}${flags}`,
  );
}

const weak = rows.filter(row => row.flags.includes('weak candidate'));
const quarantined = rows.filter(row => row.reviewStatus === 'quarantine');

console.log(`\nAudited ${rows.length} puzzle(s). ${quarantined.length} quarantined, ${weak.length} weak candidate(s).`);
