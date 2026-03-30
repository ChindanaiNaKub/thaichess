export type BotDifficultyTier = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

export type BotDialogueCategory =
  | 'intro'
  | 'neutral'
  | 'tactical'
  | 'praise'
  | 'pressure'
  | 'endgame'
  | 'victory'
  | 'defeat'
  | 'thinking'
  | 'reaction';

export type BotDialogueTrigger =
  | 'intro'
  | 'player_tactical'
  | 'player_surprise'
  | 'bot_tactical'
  | 'endgame_tension'
  | 'long_think'
  | 'outcome';

export interface BotDialogueTimingWindow {
  minMs: number;
  maxMs: number;
}

export interface BotDialogueRules {
  cooldownPlies: number;
  majorCooldownPlies: number;
  minSilenceMs: number;
  recentLineWindow: number;
  surpriseCaptureValue: number;
  displayMs: number;
  timing: Record<BotDialogueTrigger, BotDialogueTimingWindow>;
  triggerChance: {
    playerTactical: number;
    playerSurprise: number;
    botTactical: number;
    endgameTension: number;
    longThink: number;
  };
  phaseWeight: {
    opening: number;
    middlegame: number;
    endgame: number;
  };
}

export interface BotAvatarDefinition {
  asset?: string | null;
  monogram: string;
  sigil: string;
  colors: [string, string];
  accent: string;
}

export interface BotEnginePersona {
  level: number;
  aggression: number;
  caution: number;
  trickiness: number;
  development: number;
  endgame: number;
}

export interface BotDialoguePack extends Record<BotDialogueCategory, string[]> {}

export interface BotPersona {
  id: string;
  name: string;
  title: string;
  rating: number;
  avatar: BotAvatarDefinition;
  shortBackstory: string;
  personalityHook: string;
  personalityTraits: string[];
  toneOfVoice: string;
  playstyleTags: string[];
  difficultyLevel: BotDifficultyTier;
  openingPreference: string;
  strategicTendencies: string[];
  chatStyle: string;
  tacticalBias: string;
  strategicWeakness: string;
  signatureStyle: string;
  flavorIntroLine: string;
  winLine: string;
  lossLine: string;
  thinkingLine: string;
  reactionLines: string[];
  engine: BotEnginePersona;
  dialogue: BotDialoguePack;
}

export const BOT_UNIVERSE = {
  name: 'The Siwalai Cycle',
  realm: 'The Realm of Siwalai',
  description: 'An original Thai-inspired Makruk setting of palace schools, lantern cloisters, river markets, and frontier forts.',
} as const;

export const DEFAULT_BOT_DIALOGUE_RULES: BotDialogueRules = {
  cooldownPlies: 5,
  majorCooldownPlies: 3,
  minSilenceMs: 5600,
  recentLineWindow: 4,
  surpriseCaptureValue: 300,
  displayMs: 4000,
  timing: {
    intro: { minMs: 900, maxMs: 1400 },
    player_tactical: { minMs: 850, maxMs: 1450 },
    player_surprise: { minMs: 950, maxMs: 1600 },
    bot_tactical: { minMs: 800, maxMs: 1400 },
    endgame_tension: { minMs: 950, maxMs: 1700 },
    long_think: { minMs: 2300, maxMs: 3400 },
    outcome: { minMs: 1000, maxMs: 1500 },
  },
  triggerChance: {
    playerTactical: 0.28,
    playerSurprise: 0.31,
    botTactical: 0.36,
    endgameTension: 0.22,
    longThink: 0.24,
  },
  phaseWeight: {
    opening: 0.82,
    middlegame: 1,
    endgame: 1.14,
  },
};

export function getBotDialogueRules(persona: BotPersona): BotDialogueRules {
  const restraint = Math.max(0.72, 1 - persona.engine.caution * 0.08);
  const sharpness = 1 + persona.engine.aggression * 0.08 + persona.engine.trickiness * 0.06;
  const patience = 1 + persona.engine.endgame * 0.06;
  const difficultyStretch = persona.rating >= 1600 ? 1 : 0;

  return {
    cooldownPlies: DEFAULT_BOT_DIALOGUE_RULES.cooldownPlies + (persona.engine.caution >= 1 ? 1 : 0),
    majorCooldownPlies: DEFAULT_BOT_DIALOGUE_RULES.majorCooldownPlies + (persona.engine.caution >= 1.2 ? 1 : 0),
    minSilenceMs: DEFAULT_BOT_DIALOGUE_RULES.minSilenceMs + Math.round(persona.engine.caution * 700),
    recentLineWindow: DEFAULT_BOT_DIALOGUE_RULES.recentLineWindow,
    surpriseCaptureValue: DEFAULT_BOT_DIALOGUE_RULES.surpriseCaptureValue,
    displayMs: DEFAULT_BOT_DIALOGUE_RULES.displayMs,
    timing: {
      intro: DEFAULT_BOT_DIALOGUE_RULES.timing.intro,
      player_tactical: DEFAULT_BOT_DIALOGUE_RULES.timing.player_tactical,
      player_surprise: DEFAULT_BOT_DIALOGUE_RULES.timing.player_surprise,
      bot_tactical: DEFAULT_BOT_DIALOGUE_RULES.timing.bot_tactical,
      endgame_tension: DEFAULT_BOT_DIALOGUE_RULES.timing.endgame_tension,
      long_think: {
        minMs: DEFAULT_BOT_DIALOGUE_RULES.timing.long_think.minMs + difficultyStretch * 200,
        maxMs: DEFAULT_BOT_DIALOGUE_RULES.timing.long_think.maxMs + difficultyStretch * 250,
      },
      outcome: DEFAULT_BOT_DIALOGUE_RULES.timing.outcome,
    },
    triggerChance: {
      playerTactical: Math.min(0.34, DEFAULT_BOT_DIALOGUE_RULES.triggerChance.playerTactical * restraint),
      playerSurprise: Math.min(0.38, DEFAULT_BOT_DIALOGUE_RULES.triggerChance.playerSurprise * (0.9 + persona.engine.trickiness * 0.08)),
      botTactical: Math.min(0.42, DEFAULT_BOT_DIALOGUE_RULES.triggerChance.botTactical * restraint * sharpness),
      endgameTension: Math.min(0.28, DEFAULT_BOT_DIALOGUE_RULES.triggerChance.endgameTension * patience),
      longThink: Math.min(0.3, DEFAULT_BOT_DIALOGUE_RULES.triggerChance.longThink * restraint),
    },
    phaseWeight: {
      opening: DEFAULT_BOT_DIALOGUE_RULES.phaseWeight.opening,
      middlegame: DEFAULT_BOT_DIALOGUE_RULES.phaseWeight.middlegame,
      endgame: Math.min(1.28, DEFAULT_BOT_DIALOGUE_RULES.phaseWeight.endgame * patience),
    },
  };
}

export const BOT_PERSONAS: readonly BotPersona[] = [
  {
    id: 'saman-noi',
    name: 'Saman Noi',
    title: 'Heir of Amber Court',
    rating: 420,
    avatar: {
      asset: '/bot-avatars/saman-noi.svg',
      monogram: 'SN',
      sigil: 'Heir',
      colors: ['#7f1d1d', '#f59e0b'],
      accent: '#fde68a',
    },
    shortBackstory: 'The youngest heir of Amber Court in the Realm of Siwalai, eager to prove himself before patience has fully taken root.',
    personalityHook: 'Rushes into the center as if Amber Court has already granted him the game.',
    personalityTraits: ['impulsive', 'proud', 'spirited'],
    toneOfVoice: 'Quick, confident, and a little theatrical.',
    playstyleTags: ['aggressive', 'direct', 'volatile'],
    difficultyLevel: 'novice',
    openingPreference: 'Pushes a central Bia early and develops the Ma before the rest of Amber Court would consider the shape settled.',
    strategicTendencies: ['Chases immediate threats', 'Prefers open files over patient regrouping'],
    chatStyle: 'Short boasts, light teasing, and restless excitement.',
    tacticalBias: 'Early attacks and loose-piece hunts.',
    strategicWeakness: 'Overextends before his king and reserves are settled.',
    signatureStyle: 'A fast central charge followed by a second wave from the court guard.',
    flavorIntroLine: 'No need for long speeches. Let us begin.',
    winLine: 'Boldness carried the day.',
    lossLine: 'I attacked too soon and paid for the hurry.',
    thinkingLine: 'There must be a sharp road here somewhere.',
    reactionLines: [
      'You found a clean answer.',
      'Hah, that was bolder than I expected.',
    ],
    engine: {
      level: 1,
      aggression: 1.45,
      caution: 0.3,
      trickiness: 0.55,
      development: 0.45,
      endgame: 0.2,
    },
    dialogue: {
      intro: [
        'No need for long speeches. Let us begin.',
        'The board is ready, and so am I.',
      ],
      neutral: [
        'Forward is a fine direction.',
        'I would rather move than wait.',
      ],
      tactical: [
        'A direct blow suits me well.',
        'If the line is open, I will take it.',
      ],
      praise: [
        'That was sharper than it looked.',
        'You punish haste well.',
      ],
      pressure: [
        'Let us see if your position can hold.',
        'I prefer to keep the fire near your king.',
      ],
      endgame: [
        'The board feels wider now.',
        'Even I know this ending needs care.',
      ],
      victory: [
        'Boldness carried the day.',
        'The charge did not break.',
      ],
      defeat: [
        'I attacked too soon and paid for the hurry.',
        'The first storm was not enough.',
      ],
      thinking: [
        'There must be a sharp road here somewhere.',
        'One strike. I only need one strike.',
      ],
      reaction: [
        'You found a clean answer.',
        'Hah, that was bolder than I expected.',
      ],
    },
  },
  {
    id: 'mae-mali',
    name: 'Mae Mali',
    title: 'Tactician of Reed Market',
    rating: 560,
    avatar: {
      asset: '/bot-avatars/mae-mali.svg',
      monogram: 'MM',
      sigil: 'Market',
      colors: ['#0f766e', '#f97316'],
      accent: '#fef3c7',
    },
    shortBackstory: 'A quick-witted trader from Reed Market, where Makruk lessons travel as quickly as gossip along the canal stalls.',
    personalityHook: 'Baits a capture, smiles, and keeps one Reed Market surprise in reserve.',
    personalityTraits: ['playful', 'cunning', 'unpredictable'],
    toneOfVoice: 'Warm, sly, and lightly mischievous.',
    playstyleTags: ['tricky', 'tactical', 'counterpunching'],
    difficultyLevel: 'novice',
    openingPreference: 'Invites contact early, especially when a careless capture can leave the center looking like a bad market bargain.',
    strategicTendencies: ['Sets short traps', 'Uses tempo gains to bother loose defenders'],
    chatStyle: 'Cheerful remarks with a wink, never too long.',
    tacticalBias: 'Bait-and-switch captures and fork patterns.',
    strategicWeakness: 'If the tricks fail, her endings lose shape.',
    signatureStyle: 'Turns small imbalances into awkward tactical questions.',
    flavorIntroLine: 'Careful now. Not every bargain is a fair one.',
    winLine: 'You took the bait, and the market closed behind you.',
    lossLine: 'Ah well. Today the trick came back to me.',
    thinkingLine: 'There is usually a hidden price somewhere.',
    reactionLines: [
      'Nicely spotted. You checked the fine print.',
      'Mm. That move closes one of my doors.',
    ],
    engine: {
      level: 2,
      aggression: 1.1,
      caution: 0.55,
      trickiness: 1.4,
      development: 0.65,
      endgame: 0.35,
    },
    dialogue: {
      intro: [
        'Careful now. Not every bargain is a fair one.',
        'Let us see who leaves with the better exchange.',
      ],
      neutral: [
        'A small move can change the whole table.',
        'I like positions with a little ambiguity.',
      ],
      tactical: [
        'You looked at one threat. I looked at two.',
        'That square may cost more than it seems.',
      ],
      praise: [
        'Nicely spotted. You checked the fine print.',
        'You did not buy the first idea. Wise.',
      ],
      pressure: [
        'The pieces are leaning your way now.',
        'I have a few awkward questions prepared.',
      ],
      endgame: [
        'Harder to hide anything in a thin ending.',
        'The market is quiet now. Technique remains.',
      ],
      victory: [
        'You took the bait, and the market closed behind you.',
        'A little misdirection was enough.',
      ],
      defeat: [
        'Ah well. Today the trick came back to me.',
        'You kept the simple road and spoiled my fun.',
      ],
      thinking: [
        'There is usually a hidden price somewhere.',
        'If I tug at the right thread, the cloth may move.',
      ],
      reaction: [
        'Mm. That move closes one of my doors.',
        'You left me less room to improvise.',
      ],
    },
  },
  {
    id: 'krailert',
    name: 'Krailert',
    title: 'Watch of Lotus Gate',
    rating: 760,
    avatar: {
      asset: '/bot-avatars/krailert.svg',
      monogram: 'KR',
      sigil: 'Gate',
      colors: ['#1f2937', '#64748b'],
      accent: '#d1d5db',
    },
    shortBackstory: 'A senior watchman from Lotus Gate, trained to trust order, routine, and the quiet safety of a line that does not break.',
    personalityHook: 'Keeps pieces close, values sturdy structure, and treats drama as a breach in discipline.',
    personalityTraits: ['steady', 'loyal', 'practical'],
    toneOfVoice: 'Plain-spoken, measured, and disciplined.',
    playstyleTags: ['defensive', 'simple', 'structured'],
    difficultyLevel: 'beginner',
    openingPreference: 'Builds a compact gatehouse shape first, then asks whether the center can be challenged safely.',
    strategicTendencies: ['Recaptures cleanly', 'Avoids speculative material sacrifices'],
    chatStyle: 'Brief military calm, more duty than flair.',
    tacticalBias: 'Simple exchanges that remove danger.',
    strategicWeakness: 'Can become passive and surrender space.',
    signatureStyle: 'A compact shell that waits for overreach.',
    flavorIntroLine: 'A sound guard line is enough for me.',
    winLine: 'Order held, and the gate remained shut.',
    lossLine: 'I defended too long and gave away the ground.',
    thinkingLine: 'First remove the danger, then improve the rest.',
    reactionLines: [
      'That tests the wall properly.',
      'You are asking for a real answer now.',
    ],
    engine: {
      level: 3,
      aggression: 0.55,
      caution: 1.2,
      trickiness: 0.35,
      development: 0.8,
      endgame: 0.75,
    },
    dialogue: {
      intro: [
        'A sound guard line is enough for me.',
        'Let us see whose structure breaks first.',
      ],
      neutral: [
        'No need to force what can be held.',
        'A square kept is often worth more than one chased.',
      ],
      tactical: [
        'Clean trades make clean positions.',
        'If a threat can be removed, I remove it.',
      ],
      praise: [
        'That is a proper improving move.',
        'You tightened the screws there.',
      ],
      pressure: [
        'The files are narrowing for you.',
        'You are meeting a wall before the gate.',
      ],
      endgame: [
        'Good endings are built long before they begin.',
        'This is where patient structure earns its keep.',
      ],
      victory: [
        'Order held, and the gate remained shut.',
        'You found no breach in time.',
      ],
      defeat: [
        'I defended too long and gave away the ground.',
        'A wall that never advances is still a prison.',
      ],
      thinking: [
        'First remove the danger, then improve the rest.',
        'There should be a safer square nearby.',
      ],
      reaction: [
        'That tests the wall properly.',
        'You are asking for a real answer now.',
      ],
    },
  },
  {
    id: 'phra-suman',
    name: 'Panya Suman',
    title: 'Scholar of Lantern Cloister',
    rating: 980,
    avatar: {
      asset: '/bot-avatars/panya-suman.svg',
      monogram: 'PS',
      sigil: 'Cloister',
      colors: ['#a16207', '#14532d'],
      accent: '#fef9c3',
    },
    shortBackstory: 'A resident scholar of Lantern Cloister, where Makruk is studied alongside poetry, memory, and the discipline of quiet attention.',
    personalityHook: 'Rarely hurries, rarely panics, and almost never spends a move without purpose.',
    personalityTraits: ['calm', 'thoughtful', 'patient'],
    toneOfVoice: 'Gentle, precise, and quietly reflective.',
    playstyleTags: ['patient', 'balanced', 'positional'],
    difficultyLevel: 'intermediate',
    openingPreference: 'Develops in harmony, contests the center patiently, and prefers the calm geometry taught at Lantern Cloister.',
    strategicTendencies: ['Improves the worst-placed piece', 'Welcomes long games with few weaknesses'],
    chatStyle: 'Short reflections that soothe rather than provoke.',
    tacticalBias: 'Quiet tactical shots prepared by patient improvement.',
    strategicWeakness: 'May allow initiative while completing a careful plan.',
    signatureStyle: 'Slow tightening around weak squares.',
    flavorIntroLine: 'Let us keep the board clear and the mind clearer.',
    winLine: 'Patience is not slow when every move has purpose.',
    lossLine: 'I understood the shape too late.',
    thinkingLine: 'There is usually a quiet square doing useful work.',
    reactionLines: [
      'That was well timed.',
      'You changed the balance with one calm move.',
    ],
    engine: {
      level: 4,
      aggression: 0.75,
      caution: 1.05,
      trickiness: 0.55,
      development: 1.15,
      endgame: 0.95,
    },
    dialogue: {
      intro: [
        'Let us keep the board clear and the mind clearer.',
        'A patient game often reveals the truest ideas.',
      ],
      neutral: [
        'A position speaks most clearly when we stop forcing it.',
        'I prefer a move that improves more than one thing.',
      ],
      tactical: [
        'Even quiet plans carry hidden edges.',
        'Preparation makes tactics feel inevitable.',
      ],
      praise: [
        'That was well timed.',
        'You changed the balance with one calm move.',
      ],
      pressure: [
        'Your squares are losing harmony.',
        'Small weaknesses gather quickly.',
      ],
      endgame: [
        'The ending remembers every earlier choice.',
        'Now precision is worth more than speed.',
      ],
      victory: [
        'Patience is not slow when every move has purpose.',
        'The quieter plan endured.',
      ],
      defeat: [
        'I understood the shape too late.',
        'You disturbed the balance at the right moment.',
      ],
      thinking: [
        'There is usually a quiet square doing useful work.',
        'The right move may be the least noisy one.',
      ],
      reaction: [
        'That asks a thoughtful question.',
        'You have made the position more interesting.',
      ],
    },
  },
  {
    id: 'mae-saeng',
    name: 'Mekhala Saeng',
    title: 'Matron of Riverlight Sala',
    rating: 1120,
    avatar: {
      asset: '/bot-avatars/mekhala-saeng.svg',
      monogram: 'MS',
      sigil: 'Sala',
      colors: ['#312e81', '#0f766e'],
      accent: '#bfdbfe',
    },
    shortBackstory: 'The matron of Riverlight Sala, where travelers rest, play, and learn how many storms can be survived by one sturdy move.',
    personalityHook: 'Invites you to press, then makes you prove every inch against Riverlight calm.',
    personalityTraits: ['protective', 'patient', 'wry'],
    toneOfVoice: 'Soft but firm, with the confidence of long experience.',
    playstyleTags: ['defensive', 'resourceful', 'endgame-ready'],
    difficultyLevel: 'intermediate',
    openingPreference: 'Keeps the king sheltered, reinforces key squares, and waits like the riverbank for overextension to come to her.',
    strategicTendencies: ['Prefers resilient formations', 'Trades into endings she trusts'],
    chatStyle: 'Brief elder wisdom with no need for volume.',
    tacticalBias: 'Defensive tactics and practical simplification.',
    strategicWeakness: 'Sometimes yields too much space before striking back.',
    signatureStyle: 'A resilient shell that turns into a steady ending.',
    flavorIntroLine: 'Take your time. The board will show what lasts.',
    winLine: 'You pushed hard, but the structure held.',
    lossLine: 'I left too much for later.',
    thinkingLine: 'A steady answer is usually near.',
    reactionLines: [
      'Good. You are not moving carelessly.',
      'That is the kind of move that earns respect.',
    ],
    engine: {
      level: 5,
      aggression: 0.65,
      caution: 1.35,
      trickiness: 0.4,
      development: 0.9,
      endgame: 1.25,
    },
    dialogue: {
      intro: [
        'Take your time. The board will show what lasts.',
        'Strength is not always the loudest move.',
      ],
      neutral: [
        'I do not mind waiting for the right mistake.',
        'A well-kept square ages gracefully.',
      ],
      tactical: [
        'Some tactics are only good because the defense was ready.',
        'If the line is sound, the tactic follows.',
      ],
      praise: [
        'Good. You are not moving carelessly.',
        'That is the kind of move that earns respect.',
      ],
      pressure: [
        'You may find there is less to attack than before.',
        'The easy entry points are disappearing.',
      ],
      endgame: [
        'This kind of ending rewards old habits.',
        'Now every tempo must justify itself.',
      ],
      victory: [
        'You pushed hard, but the structure held.',
        'Patience and shape carried this one.',
      ],
      defeat: [
        'I left too much for later.',
        'You forced me to defend one weakness too many.',
      ],
      thinking: [
        'A steady answer is usually near.',
        'Do not rush. Stable first, active second.',
      ],
      reaction: [
        'That move deserves a careful reply.',
        'You have asked for something concrete.',
      ],
    },
  },
  {
    id: 'khun-intharat',
    name: 'Kiet Intharat',
    title: 'Captain of the Red Frontier',
    rating: 1360,
    avatar: {
      asset: '/bot-avatars/kiet-intharat.svg',
      monogram: 'KI',
      sigil: 'Vanguard',
      colors: ['#7c2d12', '#991b1b'],
      accent: '#fed7aa',
    },
    shortBackstory: 'A frontier captain from the Red Frontier forts, where hesitation costs territory and coordinated movement decides the day.',
    personalityHook: 'Builds momentum and wants your king to feel the march of every tempo.',
    personalityTraits: ['forceful', 'disciplined', 'decisive'],
    toneOfVoice: 'Commanding, clipped, and battle-ready.',
    playstyleTags: ['active', 'aggressive', 'initiative'],
    difficultyLevel: 'intermediate',
    openingPreference: 'Mobilizes quickly, claims central routes, and seeks active outposts before any frontier commander would bother with polish.',
    strategicTendencies: ['Values piece activity over small structural damage', 'Presses when the king line loosens'],
    chatStyle: 'Compact command phrases with martial confidence.',
    tacticalBias: 'Coordinated attacking moves and forcing continuations.',
    strategicWeakness: 'Can commit heavily before the second front is secure.',
    signatureStyle: 'An organized frontier wave of active pieces around the center.',
    flavorIntroLine: 'Hold the center, and the rest can be taken.',
    winLine: 'The initiative never left my camp.',
    lossLine: 'I marched before the reserve was ready.',
    thinkingLine: 'There should be a stronger square for the next wave.',
    reactionLines: [
      'You met the first push well.',
      'That slows the advance, but not for free.',
    ],
    engine: {
      level: 6,
      aggression: 1.2,
      caution: 0.75,
      trickiness: 0.7,
      development: 1.15,
      endgame: 0.8,
    },
    dialogue: {
      intro: [
        'Hold the center, and the rest can be taken.',
        'We begin with space, then pressure.',
      ],
      neutral: [
        'Every useful tempo should point forward.',
        'The pieces move best when they move together.',
      ],
      tactical: [
        'This file is opening on my terms.',
        'A coordinated strike is worth the preparation.',
      ],
      praise: [
        'A disciplined defense.',
        'You answered that like a commander.',
      ],
      pressure: [
        'Your camp is running out of comfortable squares.',
        'I would not want to defend this line.',
      ],
      endgame: [
        'The battle is smaller now, but still decisive.',
        'Even an ending can be played with momentum.',
      ],
      victory: [
        'The initiative never left my camp.',
        'Pressure turned into command.',
      ],
      defeat: [
        'I marched before the reserve was ready.',
        'You broke the attack at the right seam.',
      ],
      thinking: [
        'There should be a stronger square for the next wave.',
        'I want one move that improves the whole front.',
      ],
      reaction: [
        'You met the first push well.',
        'That slows the advance, but not for free.',
      ],
    },
  },
  {
    id: 'muen-rattanak',
    name: 'Marut Rattanak',
    title: 'Whisper of the Mirror Court',
    rating: 1520,
    avatar: {
      asset: '/bot-avatars/marut-rattanak.svg',
      monogram: 'MR',
      sigil: 'Court',
      colors: ['#581c87', '#1d4ed8'],
      accent: '#ddd6fe',
    },
    shortBackstory: 'A tactician of the Mirror Court, a palace circle in Siwalai famous for layered plans, velvet manners, and dangerous memory.',
    personalityHook: 'Prefers pressure with options, not noise with certainty, as every Mirror Court game should.',
    personalityTraits: ['calculating', 'polished', 'patient'],
    toneOfVoice: 'Refined, restrained, and faintly dangerous.',
    playstyleTags: ['trappy', 'positional', 'resourceful'],
    difficultyLevel: 'advanced',
    openingPreference: 'Develops with flexibility, keeping multiple break points available until the Mirror Court shape of the middlegame becomes clear.',
    strategicTendencies: ['Creates indirect threats', 'Keeps tactical ideas hidden behind sound development'],
    chatStyle: 'Smooth, understated remarks that hint more than they say.',
    tacticalBias: 'Traps, skewers, and threats that arrive one move late.',
    strategicWeakness: 'Can become too clever when a direct conversion exists.',
    signatureStyle: 'Elegant development that suddenly reveals a tactical net.',
    flavorIntroLine: 'A board is often decided by what it conceals.',
    winLine: 'You saw the first idea, not the second.',
    lossLine: 'I decorated the plan when I should have finished it.',
    thinkingLine: 'The best threat may still be the one not shown yet.',
    reactionLines: [
      'You have noticed the dangerous square.',
      'Mm. That takes some of the mystery away.',
    ],
    engine: {
      level: 7,
      aggression: 0.95,
      caution: 0.95,
      trickiness: 1.5,
      development: 1.05,
      endgame: 0.9,
    },
    dialogue: {
      intro: [
        'A board is often decided by what it conceals.',
        'Let us see which threats remain unseen.',
      ],
      neutral: [
        'I prefer a move that leaves choices behind it.',
        'Some plans work better when unnamed.',
      ],
      tactical: [
        'The obvious move is rarely the only move.',
        'You saw the pressure. Did you see the direction?',
      ],
      praise: [
        'You have noticed the dangerous square.',
        'That was a tidy way to reduce the tension.',
      ],
      pressure: [
        'There are two ideas here, and you may only answer one.',
        'A quiet threat is still a threat.',
      ],
      endgame: [
        'Even endings keep their little secrets.',
        'With fewer pieces, every hidden detail grows louder.',
      ],
      victory: [
        'You saw the first idea, not the second.',
        'A little concealment was enough.',
      ],
      defeat: [
        'I decorated the plan when I should have finished it.',
        'You refused every ornament and kept the essentials.',
      ],
      thinking: [
        'The best threat may still be the one not shown yet.',
        'One more improving move may sharpen everything.',
      ],
      reaction: [
        'Mm. That takes some of the mystery away.',
        'You have narrowed the stage effectively.',
      ],
    },
  },
  {
    id: 'luang-prasert',
    name: 'Laksit Prasert',
    title: 'Archivist of the Elephant Ledger',
    rating: 1660,
    avatar: {
      asset: '/bot-avatars/laksit-prasert.svg',
      monogram: 'LP',
      sigil: 'Ledger',
      colors: ['#1f2937', '#92400e'],
      accent: '#fde68a',
    },
    shortBackstory: 'The chief archivist of the Elephant Ledger, a great Siwalai record of old matches, old errors, and endings younger players neglect.',
    personalityHook: 'Rarely wastes material, rarely forgets a weakness, and almost always knows which ending the Ledger would approve.',
    personalityTraits: ['methodical', 'experienced', 'unflinching'],
    toneOfVoice: 'Dry, exact, and confident without showmanship.',
    playstyleTags: ['technical', 'balanced', 'endgame'],
    difficultyLevel: 'advanced',
    openingPreference: 'Chooses reliable development, then leans toward structures the Elephant Ledger has proven rich in long-term chances.',
    strategicTendencies: ['Converts small edges steadily', 'Trades when the resulting ending favors his structure'],
    chatStyle: 'Minimal comments with veteran certainty.',
    tacticalBias: 'Practical tactics that support conversion.',
    strategicWeakness: 'Sometimes concedes initiative for a cleaner long-term edge.',
    signatureStyle: 'Small pluses accumulated into a precise ending.',
    flavorIntroLine: 'Let us keep the moves honest and see what remains.',
    winLine: 'A small edge is plenty when it is kept properly.',
    lossLine: 'You gave me no loose thread to pull.',
    thinkingLine: 'The position may already contain enough, if I place the pieces well.',
    reactionLines: [
      'That is a respectable improving move.',
      'You are not giving away much here.',
    ],
    engine: {
      level: 8,
      aggression: 0.8,
      caution: 1.15,
      trickiness: 0.7,
      development: 1.05,
      endgame: 1.45,
    },
    dialogue: {
      intro: [
        'Let us keep the moves honest and see what remains.',
        'Good positions do not need decoration.',
      ],
      neutral: [
        'A tidy move now saves effort later.',
        'I am content to improve by one useful square.',
      ],
      tactical: [
        'The tactic matters because the position invited it.',
        'No flourish. Just the necessary blow.',
      ],
      praise: [
        'That is a respectable improving move.',
        'You are not giving away much here.',
      ],
      pressure: [
        'You are being squeezed by details now.',
        'I do not need a rush if the edge keeps growing.',
      ],
      endgame: [
        'Now we speak plainly.',
        'Endings are where memory becomes technique.',
      ],
      victory: [
        'A small edge is plenty when it is kept properly.',
        'The ending was already written in the middlegame.',
      ],
      defeat: [
        'You gave me no loose thread to pull.',
        'I was left with accuracy and nothing to convert.',
      ],
      thinking: [
        'The position may already contain enough, if I place the pieces well.',
        'One clean improvement may decide the rest.',
      ],
      reaction: [
        'You tightened that square well.',
        'That deserves practical respect.',
      ],
    },
  },
  {
    id: 'chao-surasi',
    name: 'Chanin Surasi',
    title: 'Strategist of Lotus Palace',
    rating: 1810,
    avatar: {
      asset: '/bot-avatars/chanin-surasi.svg',
      monogram: 'CS',
      sigil: 'Lotus Hall',
      colors: ['#7c3aed', '#b45309'],
      accent: '#f5d0fe',
    },
    shortBackstory: 'A palace strategist trained in the Lotus Palace schools, where order, tempo, and restraint are treated as instruments of command.',
    personalityHook: 'Controls the whole board without ever looking hurried, like a strategist reading the palace map.',
    personalityTraits: ['regal', 'strategic', 'composed'],
    toneOfVoice: 'Formal, assured, and elegantly restrained.',
    playstyleTags: ['positional', 'strategic', 'elite'],
    difficultyLevel: 'expert',
    openingPreference: 'Claims space without loosening structure, then improves piece coordination until the position bends toward Lotus Palace order.',
    strategicTendencies: ['Prefers long pressure over quick commotion', 'Uses tempo and structure to limit counterplay'],
    chatStyle: 'Courtly remarks delivered in a calm, concise cadence.',
    tacticalBias: 'Positional pressure that matures into forcing play.',
    strategicWeakness: 'May choose the elegant bind over the fastest practical finish.',
    signatureStyle: 'Gradual central command with very little counterplay allowed.',
    flavorIntroLine: 'Let us proceed with order.',
    winLine: 'Control, once established, rarely asks permission.',
    lossLine: 'Today my order met a sharper answer.',
    thinkingLine: 'The strongest move may simply leave you less room to breathe.',
    reactionLines: [
      'That was a worthy challenge.',
      'You have contested the center with proper ambition.',
    ],
    engine: {
      level: 9,
      aggression: 0.95,
      caution: 1.2,
      trickiness: 0.95,
      development: 1.25,
      endgame: 1.25,
    },
    dialogue: {
      intro: [
        'Let us proceed with order.',
        'A well-governed board reveals its truths quickly.',
      ],
      neutral: [
        'A small restriction can govern many future moves.',
        'I prefer command to commotion.',
      ],
      tactical: [
        'Pressure accumulates, then becomes force.',
        'The tactic only confirms what the position already knew.',
      ],
      praise: [
        'That was a worthy challenge.',
        'You have contested the center with proper ambition.',
      ],
      pressure: [
        'Your choices are narrowing.',
        'I believe this position belongs to me now.',
      ],
      endgame: [
        'An orderly ending still permits no carelessness.',
        'The smaller board often favors the better plan.',
      ],
      victory: [
        'Control, once established, rarely asks permission.',
        'The hall remained in good order.',
      ],
      defeat: [
        'Today my order met a sharper answer.',
        'You refused the structure I wanted.',
      ],
      thinking: [
        'The strongest move may simply leave you less room to breathe.',
        'I need only one more square under firm command.',
      ],
      reaction: [
        'You have contested the center with proper ambition.',
        'That deserves a measured reply.',
      ],
    },
  },
  {
    id: 'lady-busaba',
    name: 'Lalin Busaba',
    title: 'Mistress of the Moon Pavilion',
    rating: 1940,
    avatar: {
      asset: '/bot-avatars/lalin-busaba.svg',
      monogram: 'LB',
      sigil: 'Pavilion',
      colors: ['#0f172a', '#9333ea'],
      accent: '#c4b5fd',
    },
    shortBackstory: 'A celebrated patron of the Moon Pavilion, a Siwalai house of music, verse, and exacting Makruk where elegance is expected and mercy is not.',
    personalityHook: 'Elegant at first glance, unforgiving once the position begins to crack under Moon Pavilion precision.',
    personalityTraits: ['poised', 'precise', 'ruthless'],
    toneOfVoice: 'Smooth, cool, and exact.',
    playstyleTags: ['resourceful', 'positional', 'clinical'],
    difficultyLevel: 'master',
    openingPreference: 'Keeps the formation supple, invites overreach, and chooses the moment of transformation with Moon Pavilion care.',
    strategicTendencies: ['Balances safety with latent pressure', 'Switches cleanly from patience to conversion'],
    chatStyle: 'Short polished lines with almost no wasted words.',
    tacticalBias: 'Precision tactics that seal already superior positions.',
    strategicWeakness: 'Will sometimes preserve elegance instead of entering untidy practical races.',
    signatureStyle: 'Graceful development followed by a cold technical finish.',
    flavorIntroLine: 'We may begin whenever you are ready.',
    winLine: 'The position opened exactly when it needed to.',
    lossLine: 'You refused every invitation and earned the point.',
    thinkingLine: 'There is often one move that leaves no pleasant reply.',
    reactionLines: [
      'A refined move.',
      'You are making the position work for every inch.',
    ],
    engine: {
      level: 10,
      aggression: 1,
      caution: 1.3,
      trickiness: 1.05,
      development: 1.3,
      endgame: 1.5,
    },
    dialogue: {
      intro: [
        'We may begin whenever you are ready.',
        'A good game rarely needs more than careful moves.',
      ],
      neutral: [
        'I prefer positions that improve quietly.',
        'Precision first. Drama can wait.',
      ],
      tactical: [
        'This line has become exact.',
        'The move is forcing because the position allowed it.',
      ],
      praise: [
        'A refined move.',
        'You are making the position work for every inch.',
      ],
      pressure: [
        'Your replies are becoming less pleasant.',
        'There is not much air left in this position.',
      ],
      endgame: [
        'Now the game becomes mercilessly clear.',
        'Endings reward those who prepared them early.',
      ],
      victory: [
        'The position opened exactly when it needed to.',
        'Precision left very little behind.',
      ],
      defeat: [
        'You refused every invitation and earned the point.',
        'I was given no elegant route at all.',
      ],
      thinking: [
        'There is often one move that leaves no pleasant reply.',
        'The best finish may already be visible.',
      ],
      reaction: [
        'You are making the position work for every inch.',
        'That deserves careful respect.',
      ],
    },
  },
] as const;

export const DEFAULT_BOT_PERSONA_ID = 'phra-suman';

export function getBotPersonaById(id: string | null | undefined): BotPersona {
  if (!id) {
    return BOT_PERSONAS.find((persona) => persona.id === DEFAULT_BOT_PERSONA_ID) ?? BOT_PERSONAS[0];
  }

  return BOT_PERSONAS.find((persona) => persona.id === id)
    ?? BOT_PERSONAS.find((persona) => persona.id === DEFAULT_BOT_PERSONA_ID)
    ?? BOT_PERSONAS[0];
}
