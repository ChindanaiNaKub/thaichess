import AccountPage from '../components/AccountPage';
import { PuzzleProgressProvider } from '../lib/puzzleProgress';

export default function AccountRoute() {
  return (
    <PuzzleProgressProvider>
      <AccountPage />
    </PuzzleProgressProvider>
  );
}
