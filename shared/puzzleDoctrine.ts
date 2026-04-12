export type PuzzleDoctrineLabel =
  | 'forcing'
  | 'quiet-but-forcing'
  | 'mate-preparation'
  | 'restriction'
  | 'trap-conversion'
  | 'count-pressure'
  | 'structural-win';

export type PuzzleMaterialGainClass = 'critical' | 'structural' | 'incidental';

export function classifyMaterialGain(input: {
  capturedPiece: 'R' | 'N' | 'S' | 'M' | 'PM' | 'P' | null;
  leadsToMate: boolean;
  leadsToPromotion: boolean;
  countCritical: boolean;
  finalMaterialSwing: number;
}): PuzzleMaterialGainClass {
  if (input.capturedPiece === 'R' || input.finalMaterialSwing >= 300) {
    return 'critical';
  }

  if (
    input.capturedPiece === 'P' &&
    (input.leadsToMate || input.leadsToPromotion || input.countCritical)
  ) {
    return 'structural';
  }

  if (input.capturedPiece !== null && input.finalMaterialSwing >= 200) {
    return 'structural';
  }

  return 'incidental';
}

export function isMeaningfulPreparatoryCandidate(input: {
  firstMoveIsCheck: boolean;
  firstMoveIsCapture: boolean;
  defenderReplyCount: number;
  nearOnlyMove: boolean;
  createsTrap: boolean;
  createsMateThreat: boolean;
  countPressure: boolean;
}): boolean {
  if (input.firstMoveIsCheck || input.firstMoveIsCapture) {
    return true;
  }

  if (input.createsTrap || input.createsMateThreat || input.countPressure) {
    return true;
  }

  return input.nearOnlyMove || input.defenderReplyCount <= 2;
}
