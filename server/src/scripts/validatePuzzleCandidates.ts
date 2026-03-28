import { IMPORTED_PUZZLE_CANDIDATES } from '../../../shared/puzzleImportQueue';
import { validatePuzzles } from '../../../shared/puzzleValidation';

const results = validatePuzzles(IMPORTED_PUZZLE_CANDIDATES);
const invalid = results.filter(result => result.errors.length > 0);
const warned = results.filter(result => result.warnings.length > 0);

for (const result of results) {
  const status = result.errors.length > 0 ? 'FAIL' : result.warnings.length > 0 ? 'WARN' : 'OK';
  console.log(`${status} candidate puzzle #${result.puzzleId} ${result.title}`);

  for (const error of result.errors) {
    console.log(`  error: ${error}`);
  }

  for (const warning of result.warnings) {
    console.log(`  warning: ${warning}`);
  }
}

if (invalid.length > 0) {
  console.error(`\n${invalid.length} imported candidate puzzle(s) failed validation.`);
  process.exit(1);
}

console.log(
  `\nValidated ${results.length} imported candidate puzzle(s) successfully.${warned.length > 0 ? ` ${warned.length} warning set(s).` : ''}`,
);
