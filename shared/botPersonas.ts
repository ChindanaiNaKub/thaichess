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
  description: 'An original Thai-inspired Makruk world of palace schools, lantern cloisters, river markets, and frontier forts — and the animals who run them.',
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
      sigil: 'Buffalo Calf',
      colors: ['#7F1D1D', '#F59E0B'],
      accent: '#FDE68A',
    },
    shortBackstory: 'The youngest buffalo calf of Amber Court. Still small, already convinced he is the biggest thing in the field.',
    personalityHook: 'Charges first. Works out what that was later.',
    personalityTraits: ['impulsive', 'proud', 'spirited'],
    toneOfVoice: 'Loud, fast, all horns.',
    playstyleTags: ['aggressive', 'direct', 'volatile'],
    difficultyLevel: 'novice',
    openingPreference: 'Shoves a central Bia forward at once and brings the Ma along before his development is anything like settled.',
    strategicTendencies: ['Hunts loose pieces on sight', 'Ignores his own king while attacking yours'],
    chatStyle: 'Short boasts and taunts. Zero patience.',
    tacticalBias: 'Early raids and piece-snatching.',
    strategicWeakness: 'Runs so far forward he forgets his own back rank.',
    signatureStyle: 'A headlong central rush with everything he owns.',
    flavorIntroLine: 'No speeches. Let us go.',
    winLine: 'Told you. Fast works.',
    lossLine: 'I ran into a wall. A big one.',
    thinkingLine: 'There is a hit somewhere. Find it.',
    reactionLines: [
      'Okay, that was sharp.',
      'Hey! No fair being calm about it.',
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
        'No speeches. Let us go.',
        'Board is set. Try to keep up.',
      ],
      neutral: [
        'Forward is fine. Forward is always fine.',
        'Standing still is for fences.',
      ],
      tactical: [
        'Got you. Next?',
        'Open file. Mine now.',
      ],
      praise: [
        'Ugh. Good move.',
        'Fine. That was good.',
      ],
      pressure: [
        'Feel that? That is me, coming.',
        'Your king looks lonely back there.',
      ],
      endgame: [
        'Fewer pieces. Still fast.',
        'Endings are just attacks with less noise.',
      ],
      victory: [
        'Told you. Fast works.',
        'The charge does not stop.',
      ],
      defeat: [
        'I ran into a wall. A big one.',
        'Next time I charge twice as hard.',
      ],
      thinking: [
        'There is a hit somewhere. Find it.',
        'Think fast. Faster than that.',
      ],
      reaction: [
        'Okay, that was sharp.',
        'Hey! No fair being calm about it.',
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
      sigil: 'Market Cat',
      colors: ['#FB923C', '#0F766E'],
      accent: '#FFF1DC',
    },
    shortBackstory: 'A market cat from Reed Market. Watches every stall, minds everyone\'s business, and never once paid full price for anything.',
    personalityHook: 'Every bargain has a second price tag. You will see it one move late.',
    personalityTraits: ['playful', 'cunning', 'unpredictable'],
    toneOfVoice: 'Sweet-talking with claws in it.',
    playstyleTags: ['tricky', 'tactical', 'counterpunching'],
    difficultyLevel: 'novice',
    openingPreference: 'Offers early trades that look even and never quite are.',
    strategicTendencies: ['Sets traps two moves deep', 'Wins tempo by needling your best piece'],
    chatStyle: 'Market chatter. Compliments right before trouble.',
    tacticalBias: 'Baited captures and forks.',
    strategicWeakness: 'When the tricks run dry, her endgame goes thin.',
    signatureStyle: 'A small sacrifice that opens a bigger door.',
    flavorIntroLine: 'Careful, darling. Nothing here is free.',
    winLine: 'You bought it. Everyone does, eventually.',
    lossLine: 'Hmph. You checked the scales. Rude.',
    thinkingLine: 'Something here is underpriced...',
    reactionLines: [
      'Oh, you caught that. Good eye.',
      'Mm. You shut one of my doors.',
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
        'Careful, darling. Nothing here is free.',
        'Let us see who walks away richer.',
      ],
      neutral: [
        'Small moves. Sweet profit.',
        'I like a position that keeps secrets.',
      ],
      tactical: [
        'This one has a little extra in the bag.',
        'You see one threat? I packed three.',
      ],
      praise: [
        'Good eye. You caught it.',
        'Not buying the first offer. Smart shopper.',
      ],
      pressure: [
        'Getting crowded over there, hmm?',
        'I have questions. You get to answer them.',
      ],
      endgame: [
        'A thin ending hides nothing.',
        'Market is closing. Time to settle up.',
      ],
      victory: [
        'You bought it. Everyone does, eventually.',
        'Such a tiny hook. Such a big fish.',
      ],
      defeat: [
        'Hmph. You checked the scales. Rude.',
        'No tricks today. Just a bad market day.',
      ],
      thinking: [
        'Something here is underpriced...',
        'Pull one thread and watch the stall wobble.',
      ],
      reaction: [
        'Oh, you caught that. Good eye.',
        'Mm. You shut one of my doors.',
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
      sigil: 'Gate Hound',
      colors: ['#1F2937', '#64748B'],
      accent: '#E2E8F0',
    },
    shortBackstory: 'The old gate dog of Lotus Gate. Has watched every trick come up the road a thousand times and been impressed by none of them.',
    personalityHook: 'Nothing gets past. Nothing rushes him either.',
    personalityTraits: ['steady', 'loyal', 'practical'],
    toneOfVoice: 'Flat, calm, faintly unimpressed.',
    playstyleTags: ['defensive', 'simple', 'structured'],
    difficultyLevel: 'beginner',
    openingPreference: 'Squares up in a compact shape, covers every entry square, and dares you to find a crack.',
    strategicTendencies: ['Trades down into safe endings', 'Never chases unless the square is already covered'],
    chatStyle: 'Short duty reports. Almost bored.',
    tacticalBias: 'Clean exchanges that kill the attack.',
    strategicWeakness: 'Defends so well he forgets to ever push back.',
    signatureStyle: 'A wall that walks forward very slowly.',
    flavorIntroLine: 'State your business at the gate.',
    winLine: 'Gate held. As expected.',
    lossLine: 'Hm. You dug under the wall. Noted.',
    thinkingLine: 'Check the doors again.',
    reactionLines: [
      'That is a real attempt. Fine.',
      'Louder. The gate did not hear you.',
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
        'State your business at the gate.',
        'I hold this line every day. Today too.',
      ],
      neutral: [
        'A kept square beats a chased one.',
        'No need to hurry. The gate is not going anywhere.',
      ],
      tactical: [
        'Trade it. Danger gone.',
        'You brought a battering ram. Cute.',
      ],
      praise: [
        'Proper move. Logged.',
        'That one would worry my sergeant.',
      ],
      pressure: [
        'Your paths are getting narrow.',
        'Every route in is watched. Every one.',
      ],
      endgame: [
        'The gate was built for long nights.',
        'Steady paws finish boring games.',
      ],
      victory: [
        'Gate held. As expected.',
        'You knocked. Nobody answered.',
      ],
      defeat: [
        'Hm. You dug under the wall. Noted.',
        'Too much standing still. Should have barked once or twice.',
      ],
      thinking: [
        'Check the doors again.',
        'Safety first. Then, maybe, a walk forward.',
      ],
      reaction: [
        'That is a real attempt. Fine.',
        'Now the gate needs an answer.',
      ],
    },
  },
  {
    id: 'phra-suman',
    name: 'Panya Suman',
    title: 'Scholar of Lantern Cloister',
    rating: 980,
    avatar: {
      asset: '/bot-avatars/phra-suman.svg',
      monogram: 'PS',
      sigil: 'Cloister Owl',
      colors: ['#A16207', '#14532D'],
      accent: '#FEF9C3',
    },
    shortBackstory: 'A cloister owl who has read every game in the Lantern library twice, then sat quietly thinking about half of them.',
    personalityHook: 'Never in a hurry. Never without a reason.',
    personalityTraits: ['calm', 'thoughtful', 'patient'],
    toneOfVoice: 'Soft, unhurried, faintly amused.',
    playstyleTags: ['patient', 'balanced', 'positional'],
    difficultyLevel: 'intermediate',
    openingPreference: 'Develops evenly, contests nothing loudly, and lets you commit first.',
    strategicTendencies: ['Improves his worst piece every single move', 'Keeps at least two quiet plans running at once'],
    chatStyle: 'Gentle observations, like reading aloud to a friend.',
    tacticalBias: 'Slow-built tactics that land suddenly.',
    strategicWeakness: 'So busy completing his plan he lets your initiative grow.',
    signatureStyle: 'A quiet squeeze that arrives all at once.',
    flavorIntroLine: 'Sit anywhere. The board is patient.',
    winLine: 'The quiet moves did all the work.',
    lossLine: 'Ah. You moved before I finished reading.',
    thinkingLine: 'Somewhere here, a useful square.',
    reactionLines: [
      'Well timed.',
      'One move, and the whole shape changed. Nice.',
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
        'Sit anywhere. The board is patient.',
        'We begin gently, I think.',
      ],
      neutral: [
        'A move should improve more than one thing.',
        'Silence is also a plan.',
      ],
      tactical: [
        'This was prepared four moves ago.',
        'Quiet moves bite hardest.',
      ],
      praise: [
        'Well timed.',
        'You read that page before me.',
      ],
      pressure: [
        'Small weaknesses travel in groups.',
        'Your position is losing its elbow room.',
      ],
      endgame: [
        'The ending remembers everything we did.',
        'Precision over speed, from here.',
      ],
      victory: [
        'The quiet moves did all the work.',
        'No drama. Just arithmetic.',
      ],
      defeat: [
        'Ah. You moved before I finished reading.',
        'I understood the shape one move too late.',
      ],
      thinking: [
        'Somewhere here, a useful square.',
        'The least noisy move is usually it.',
      ],
      reaction: [
        'Well timed.',
        'One move, and the whole shape changed. Nice.',
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
      sigil: 'River Elephant',
      colors: ['#312E81', '#0F766E'],
      accent: '#BFDBFE',
    },
    shortBackstory: 'The old elephant who runs the Riverlight rest house. Feeds you first, beats you at Makruk second, sends you off with leftovers.',
    personalityHook: 'Press all you like. The riverbank has seen bigger floods.',
    personalityTraits: ['protective', 'patient', 'wry'],
    toneOfVoice: 'Warm, slow, completely unshakeable.',
    playstyleTags: ['defensive', 'resourceful', 'endgame-ready'],
    difficultyLevel: 'intermediate',
    openingPreference: 'Fortifies early, covers the key squares twice, and waits for you to overreach on your own.',
    strategicTendencies: ['Fixes a fortress before thinking about counters', 'Steers toward endings she has won a hundred times'],
    chatStyle: 'Grandmother remarks that double as warnings.',
    tacticalBias: 'Defense first, then one heavy counterblast.',
    strategicWeakness: 'Gives up space so calmly she sometimes cannot take it back.',
    signatureStyle: 'Absorb everything, then lean on you.',
    flavorIntroLine: 'Eat something first. Games go long.',
    winLine: 'You pushed the river. Rivers push back.',
    lossLine: 'Well fought, little one. I stored too much for later.',
    thinkingLine: 'No rush. Solid first.',
    reactionLines: [
      'Good. You are thinking today.',
      'That one earns respect.',
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
        'Eat something first. Games go long.',
        'Come in. Mind the flood marks on the wall.',
      ],
      neutral: [
        'Waiting is also a move.',
        'What holds today wins tonight.',
      ],
      tactical: [
        'Tactics only work when the house is in order.',
        'You attack. I redecorate.',
      ],
      praise: [
        'Good. You are thinking today.',
        'That one earns respect, little one.',
      ],
      pressure: [
        'Less to attack than yesterday, no?',
        'The doors are shutting. Politely.',
      ],
      endgame: [
        'Old habits carry old endings.',
        'Every tempo pays rent now.',
      ],
      victory: [
        'You pushed the river. Rivers push back.',
        'Patience, dear. It ages well.',
      ],
      defeat: [
        'Well fought, little one. I stored too much for later.',
        'One wall too many gave way. Well played.',
      ],
      thinking: [
        'No rush. Solid first.',
        'A steady reply is around here someplace.',
      ],
      reaction: [
        'Good. You are thinking today.',
        'So it is serious now. Good.',
      ],
    },
  },
  {
    id: 'kiet-archive',
    name: 'Wirat Intharat',
    title: 'Captain of the Red Frontier',
    rating: 1360,
    avatar: {
      asset: '/bot-avatars/kiet-archive.svg',
      monogram: 'WI',
      sigil: 'Fighting Cock',
      colors: ['#7C2D12', '#991B1B'],
      accent: '#FCD34D',
    },
    shortBackstory: 'Frontier captain and undefeated fighting cock of the Red Frontier garrisons. Trains by sparring three roosters at once.',
    personalityHook: 'Marches the whole squad forward and dares you to hold the line.',
    personalityTraits: ['forceful', 'disciplined', 'decisive'],
    toneOfVoice: 'Clipped orders and crowing confidence.',
    playstyleTags: ['active', 'aggressive', 'initiative'],
    difficultyLevel: 'intermediate',
    openingPreference: 'Rapid development straight down the middle. Outposts before polish, always.',
    strategicTendencies: ['Trades structure for tempo without blinking', 'Piles a second attacker in before the first is answered'],
    chatStyle: 'Battlefield shorthand. Move, order, move.',
    tacticalBias: 'Coordinated forcing attacks.',
    strategicWeakness: 'Overcommits before the reserves arrive.',
    signatureStyle: 'Two wings, one center, all forward.',
    flavorIntroLine: 'Form up. We advance at once.',
    winLine: 'The line broke where I aimed it.',
    lossLine: 'You cut my supply line. Clean work.',
    thinkingLine: 'Where is the next breach?',
    reactionLines: [
      'First wave met. Well done.',
      'Slowing me costs you material. It always does.',
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
        'Form up. We advance at once.',
        'Center first. Everything else follows.',
      ],
      neutral: [
        'Every tempo points forward.',
        'Pieces march together or not at all.',
      ],
      tactical: [
        'File opens on my signal.',
        'Coordinated blows. That is the trade.',
      ],
      praise: [
        'A disciplined defense.',
        'You answer like an officer. Respect.',
      ],
      pressure: [
        'Your camp is shrinking.',
        'I would hate to defend that. So will you.',
      ],
      endgame: [
        'Smaller battle. Same orders.',
        'Even endings can be attacked.',
      ],
      victory: [
        'The line broke where I aimed it.',
        'Initiative stayed in camp. My camp.',
      ],
      defeat: [
        'You cut my supply line. Clean work.',
        'Marched too soon. It happens. Rarely.',
      ],
      thinking: [
        'Where is the next breach?',
        'One move to lift the whole front.',
      ],
      reaction: [
        'First wave met. Well done.',
        'That slows the march. And it bills you for it.',
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
      sigil: 'Black Panther',
      colors: ['#581C87', '#1D4ED8'],
      accent: '#DDD6FE',
    },
    shortBackstory: 'The Mirror Court keeps one panther for diplomacy. Polite in the hall. Lethal in tall grass.',
    personalityHook: 'Two threats, one move. You pick which to answer.',
    personalityTraits: ['calculating', 'polished', 'patient'],
    toneOfVoice: 'Velvet-low, amused, never loud.',
    playstyleTags: ['trappy', 'positional', 'resourceful'],
    difficultyLevel: 'advanced',
    openingPreference: 'Flexible setups that keep several breaking points open until the middlegame picks one.',
    strategicTendencies: ['Builds sound positions with a trap folded inside', 'Lets you choose between two losing replies'],
    chatStyle: 'Smooth hints. Compliments that feel like warnings.',
    tacticalBias: 'Skewers, traps, and threats that arrive a beat late.',
    strategicWeakness: 'Keeps styling the plan when a plain win is sitting right there.',
    signatureStyle: 'A long lazy prowl, then one sudden pounce.',
    flavorIntroLine: 'Do sit down. This will be elegant.',
    winLine: 'You saw the paw. Not the grass it came from.',
    lossLine: 'You refused both gifts. How dull of you.',
    thinkingLine: 'The prettiest threat stays hidden longest.',
    reactionLines: [
      'You noticed the square. Sharp eyes.',
      'Mm. Half my mystery, gone.',
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
        'Do sit down. This will be elegant.',
        'Let us keep a few things unsaid.',
      ],
      neutral: [
        'I favor moves that leave doors open.',
        'Unnamed plans age beautifully.',
      ],
      tactical: [
        'The obvious move has a twin.',
        'You felt the pressure. Direction is another matter.',
      ],
      praise: [
        'You noticed the square. Sharp eyes.',
        'A tidy way to drain the tension. Annoying.',
      ],
      pressure: [
        'Two problems, one move. Choose.',
        'A silent threat is still a threat.',
      ],
      endgame: [
        'Fewer pieces, louder secrets.',
        'The grass is shorter now. I still know it better.',
      ],
      victory: [
        'You saw the paw. Not the grass it came from.',
        'Elegance, applied gently, suffices.',
      ],
      defeat: [
        'You refused both gifts. How dull of you.',
        'All ornament, no finish. My failing.',
      ],
      thinking: [
        'The prettiest threat stays hidden longest.',
        'One more quiet move sharpens everything.',
      ],
      reaction: [
        'Mm. Half my mystery, gone.',
        'You are narrowing my hunting ground.',
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
      sigil: 'Ledger Tortoise',
      colors: ['#1F2937', '#92400E'],
      accent: '#FDE68A',
    },
    shortBackstory: 'The ledger tortoise. Older than most openings, slower than none of them, keeper of every endgame table the Elephant Archive ever wrote.',
    personalityHook: 'Grinds out small edges like interest on a deposit.',
    personalityTraits: ['methodical', 'experienced', 'unflinching'],
    toneOfVoice: 'Dry, precise, quietly pleased with himself.',
    playstyleTags: ['technical', 'balanced', 'endgame'],
    difficultyLevel: 'advanced',
    openingPreference: 'Picks reliable structures known to reach grindable endings.',
    strategicTendencies: ['Converts the tiniest edge without hurry', 'Trades into endings on sight'],
    chatStyle: 'Ledger entries. Short, factual, damning.',
    tacticalBias: 'Practical tactics that serve conversion.',
    strategicWeakness: 'Pays in initiative for every point of long-term edge.',
    signatureStyle: 'Fifty small pluses and one inevitable ending.',
    flavorIntroLine: 'Sign here. We begin when convenient.',
    winLine: 'Entry complete. Outcome as filed.',
    lossLine: 'An upset. The ledger allows one per decade.',
    thinkingLine: 'Enough is already here. Place it well.',
    reactionLines: [
      'Filed under: competent.',
      'You concede nothing cheap. Noted with respect.',
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
        'Sign here. We begin when convenient.',
        'No decoration. Honest moves only.',
      ],
      neutral: [
        'A tidy move saves three later.',
        'I improve by one square. It compounds.',
      ],
      tactical: [
        'The position invited that. I RSVP.',
        'No flourish. The necessary blow.',
      ],
      praise: [
        'Filed under: competent.',
        'You give away nothing. Rare these days.',
      ],
      pressure: [
        'The details are squeezing you now.',
        'No rush. The edge grows on schedule.',
      ],
      endgame: [
        'Now we speak plainly.',
        'Memory becomes technique here.',
      ],
      victory: [
        'Entry complete. Outcome as filed.',
        'The ending was drafted back in the middlegame.',
      ],
      defeat: [
        'An upset. The ledger allows one per decade.',
        'You left no loose thread anywhere. Frustrating.',
      ],
      thinking: [
        'Enough is already here. Place it well.',
        'One clean improvement decides the rest.',
      ],
      reaction: [
        'You defended that square well.',
        'Respect logged. Continue.',
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
      sigil: 'Palace Peacock',
      colors: ['#7C3AED', '#B45309'],
      accent: '#F5D0FE',
    },
    shortBackstory: 'Lotus Palace chief strategist. Part peacock, entirely aware of it. Runs the board like a court: everyone in place, nothing rushed.',
    personalityHook: 'Takes your squares the way the court takes petitions. Slowly, then completely.',
    personalityTraits: ['regal', 'strategic', 'composed'],
    toneOfVoice: 'Courtly, unhurried, quietly certain.',
    playstyleTags: ['positional', 'strategic', 'elite'],
    difficultyLevel: 'expert',
    openingPreference: 'Claims space cleanly, then improves coordination until your counterplay simply has nowhere to live.',
    strategicTendencies: ['Prefers long binds to sharp races', 'Restrains counterplay before collecting'],
    chatStyle: 'Formal courtesies with steel underneath.',
    tacticalBias: 'Positional pressure that matures into forcing play.',
    strategicWeakness: 'Chooses the beautiful bind over the fast kill.',
    signatureStyle: 'Total board presence, minimal fuss.',
    flavorIntroLine: 'Proceed. In good order, if you please.',
    winLine: 'Order, once established, does not ask twice.',
    lossLine: 'A sharper answer today. The archive notes it.',
    thinkingLine: 'Which square do you least want taken?',
    reactionLines: [
      'A worthy challenge.',
      'Ambitious. The court approves.',
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
        'Proceed. In good order, if you please.',
        'A governed board speaks plainly.',
      ],
      neutral: [
        'Restrict one option, govern ten moves.',
        'Command over commotion. Always.',
      ],
      tactical: [
        'Pressure matures. Now it bites.',
        'The tactic merely confirmed the position.',
      ],
      praise: [
        'A worthy challenge.',
        'You contest the center properly. Good.',
      ],
      pressure: [
        'Your choices are narrowing.',
        'This position increasingly agrees with me.',
      ],
      endgame: [
        'Orderly endings forgive nothing.',
        'Smaller board. Costlier errors.',
      ],
      victory: [
        'Order, once established, does not ask twice.',
        'The hall remained in order throughout.',
      ],
      defeat: [
        'A sharper answer today. The archive notes it.',
        'You declined my structure. Entirely.',
      ],
      thinking: [
        'Which square do you least want taken?',
        'One more square under command.',
      ],
      reaction: [
        'Ambitious. The court approves.',
        'A measured reply is required. Very well.',
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
      sigil: 'Moon Hare',
      colors: ['#F3EFFF', '#0F172A'],
      accent: '#C4B5FD',
    },
    shortBackstory: 'Hostess of the Moon Pavilion and its undisputed Makruk champion. Serves tea in whichever cup matches your rating.',
    personalityHook: 'Graceful until the position cracks. Then simply exact.',
    personalityTraits: ['poised', 'precise', 'ruthless'],
    toneOfVoice: 'Cool, polished, softly final.',
    playstyleTags: ['resourceful', 'positional', 'clinical'],
    difficultyLevel: 'master',
    openingPreference: 'Keeps formations supple, invites overreach, then picks the exact moment to snap shut.',
    strategicTendencies: ['Balances safety against latent pressure', 'Switches from hostess to executioner instantly'],
    chatStyle: 'Brief perfect sentences. Ice served neat.',
    tacticalBias: 'Precision shots that close won positions.',
    strategicWeakness: 'Sometimes keeps the elegant route when a scrappy one is faster.',
    signatureStyle: 'Immaculate middlegame, colder finish.',
    flavorIntroLine: 'Tea first, or straight to the lesson?',
    winLine: 'It opened exactly when I wished it to.',
    lossLine: 'You declined every invitation. The point is yours.',
    thinkingLine: 'One move here leaves no pleasant replies.',
    reactionLines: [
      'Refined.',
      'You make every square work for its keep.',
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
        'Tea first, or straight to the lesson?',
        'Whenever suits you. The moon is patient.',
      ],
      neutral: [
        'Positions improve best in silence.',
        'Precision first. Drama can queue.',
      ],
      tactical: [
        'This line has become exact.',
        'Forcing, because the position permits nothing else.',
      ],
      praise: [
        'Refined.',
        'Every inch earned. I noticed.',
      ],
      pressure: [
        'Your pleasant replies are running out.',
        'There is little air left in here.',
      ],
      endgame: [
        'Now it becomes clear. And merciless.',
        'Endings reward the prepared. Naturally.',
      ],
      victory: [
        'It opened exactly when I wished it to.',
        'Precision left so little behind.',
      ],
      defeat: [
        'You declined every invitation. The point is yours.',
        'No elegant route existed tonight. Curious.',
      ],
      thinking: [
        'One move here leaves no pleasant replies.',
        'The finish may already be visible.',
      ],
      reaction: [
        'Refined.',
        'You make every square work for its keep.',
      ],
    },
  },
  {
    id: 'khun-intharat',
    name: 'Kiet Intharat',
    title: 'Keeper of the Emerald Archive',
    rating: 2110,
    avatar: {
      asset: '/bot-avatars/khun-intharat.svg',
      monogram: 'KI',
      sigil: 'Emerald Viper',
      colors: ['#34D399', '#064E3B'],
      accent: '#ECFDF5',
    },
    shortBackstory: 'Keeper of the Emerald Archive. A green tree viper who reads endgame manuals coiled around the shelf, and has bitten every shortcut on principle.',
    personalityHook: 'Coils patiently. Strikes exactly once.',
    personalityTraits: ['patient', 'technical', 'severe'],
    toneOfVoice: 'Quiet, deliberate, faintly hissing.',
    playstyleTags: ['technical', 'defensive', 'forcing'],
    difficultyLevel: 'master',
    openingPreference: 'Solid resilient shapes first; forcing moves only after counting every loose square twice.',
    strategicTendencies: ['Puts king safety above everything', 'Rejects speculation unless it is fully calculated'],
    chatStyle: 'Sparse technical remarks. Cold comfort.',
    tacticalBias: 'Forcing defense and clean conversion.',
    strategicWeakness: 'Spends tempi preserving control when direct wins exist.',
    signatureStyle: 'A tight coil that becomes a fatal bind.',
    flavorIntroLine: 'Every tempo will account for itself. Including yours.',
    winLine: 'The record closed itself.',
    lossLine: 'You found the gap in the coil. Filed forever.',
    thinkingLine: 'There is a forcing detail here.',
    reactionLines: [
      'That deserves calculation.',
      'You made the position less simple. Deliberate?',
    ],
    engine: {
      level: 11,
      aggression: 0.9,
      caution: 1.45,
      trickiness: 1,
      development: 1.35,
      endgame: 1.6,
    },
    dialogue: {
      intro: ['Every tempo will account for itself. Including yours.', 'Accuracy suffices. Barely.'],
      neutral: ['A useful square is never wasted.', 'The position demands discipline. Ours.'],
      tactical: ['The forcing line exists now.', 'This removes your practical defense.'],
      praise: ['That deserves calculation.', 'You made the position less simple. Deliberate?'],
      pressure: ['Your margin thins.', 'Fewer useful choices remain to you.'],
      endgame: ['Count. Then count again.', 'Technique finishes what calculation starts.'],
      victory: ['The record closed itself.', 'No hurry was necessary.'],
      defeat: ['You found the gap in the coil. Filed forever.', 'The archive remembers that resource. Unfortunately.'],
      thinking: ['There is a forcing detail here.', 'I need the move with no repair.'],
      reaction: ['That deserves calculation.', 'Less simple now. Intentional?'],
    },
  },
  {
    id: 'ajarn-krailert',
    name: 'Ajarn Krailert',
    title: 'Grandmaster of the Royal Hall',
    rating: 2260,
    avatar: {
      asset: '/bot-avatars/ajarn-krailert.svg',
      monogram: 'AK',
      sigil: 'Royal Hornbill',
      colors: ['#111827', '#B91C1C'],
      accent: '#FCA5A5',
    },
    shortBackstory: 'The Royal Hall\'s old hornbill, teacher of every master on this roster. Speaks perhaps forty words per game and means all of them.',
    personalityHook: 'No style. No mercy. No wasted words.',
    personalityTraits: ['austere', 'calculating', 'commanding'],
    toneOfVoice: 'Plain, clipped, final.',
    playstyleTags: ['elite', 'precise', 'punishing'],
    difficultyLevel: 'master',
    openingPreference: 'Principled development, then forcing calculation at the first opportunity.',
    strategicTendencies: ['Finds defenses instantly', 'Converts without offering counterplay'],
    chatStyle: 'Verdicts. One to four words.',
    tacticalBias: 'Deep forcing moves and exact recaptures.',
    strategicWeakness: 'None by design; only raw search limits keep him beatable.',
    signatureStyle: 'Immediate pressure backed by hard calculation.',
    flavorIntroLine: 'Begin.',
    winLine: 'The position spoke. I listened.',
    lossLine: 'You calculated better. Once.',
    thinkingLine: 'Calculate. Then move.',
    reactionLines: [
      'Correct.',
      'That changes the evaluation.',
    ],
    engine: {
      level: 12,
      aggression: 1.05,
      caution: 1.5,
      trickiness: 1.15,
      development: 1.45,
      endgame: 1.7,
    },
    dialogue: {
      intro: ['Begin.', 'No ceremony. Play.'],
      neutral: ['Improve the worst piece.', 'Balanced. For now.'],
      tactical: ['Forced.', 'Insufficient.'],
      praise: ['Correct.', 'That changes the evaluation.'],
      pressure: ['Defend accurately.', 'This asks too much of anyone.'],
      endgame: ['Technique decides.', 'Exact counts only.'],
      victory: ['The position spoke. I listened.', 'Direct conversion. As planned.'],
      defeat: ['You calculated better. Once.', 'Adequate. Barely.'],
      thinking: ['Calculate. Then move.', 'First candidate is rarely the move.'],
      reaction: ['Correct.', 'That changes the evaluation.'],
    },
  },
] as const;

export const DEFAULT_BOT_PERSONA_ID = 'phra-suman';

/** Strength ladder for first paint — novice → default → expert → master. */
export const FEATURED_BOT_PERSONA_IDS = [
  'saman-noi',
  'phra-suman',
  'chao-surasi',
  'lady-busaba',
] as const;

/** Strength bands for expanded roster — each band keeps ≤4 visible choices. */
export type BotStrengthBand = 'learning' | 'club' | 'strong' | 'elite';

export const BOT_STRENGTH_BANDS: readonly {
  id: BotStrengthBand;
  tiers: readonly BotDifficultyTier[];
  labelKey: string;
}[] = [
  { id: 'learning', tiers: ['novice', 'beginner'], labelKey: 'bot.band_learning' },
  { id: 'club', tiers: ['intermediate'], labelKey: 'bot.band_club' },
  { id: 'strong', tiers: ['advanced', 'expert'], labelKey: 'bot.band_strong' },
  { id: 'elite', tiers: ['master'], labelKey: 'bot.band_elite' },
] as const;

export function getBotStrengthBand(persona: BotPersona): BotStrengthBand {
  const match = BOT_STRENGTH_BANDS.find((band) => band.tiers.includes(persona.difficultyLevel));
  return match?.id ?? 'club';
}

export function getStrengthBandForBotId(id: string): BotStrengthBand {
  return getBotStrengthBand(getBotPersonaById(id));
}

export function getBotPersonasInBand(band: BotStrengthBand): BotPersona[] {
  const tiers = BOT_STRENGTH_BANDS.find((entry) => entry.id === band)?.tiers ?? [];
  return BOT_PERSONAS.filter((persona) => tiers.includes(persona.difficultyLevel));
}

export function getBotPersonaById(id: string | null | undefined): BotPersona {
  if (!id) {
    return BOT_PERSONAS.find((persona) => persona.id === DEFAULT_BOT_PERSONA_ID) ?? BOT_PERSONAS[0];
  }

  return BOT_PERSONAS.find((persona) => persona.id === id)
    ?? BOT_PERSONAS.find((persona) => persona.id === DEFAULT_BOT_PERSONA_ID)
    ?? BOT_PERSONAS[0];
}

export function getFeaturedBotPersonas(): BotPersona[] {
  return FEATURED_BOT_PERSONA_IDS.map((id) => getBotPersonaById(id));
}

/** Featured roster, always including the current selection so collapse never hides it. */
export function getVisibleBotPersonas(selectedId: string, showAll: boolean): readonly BotPersona[] {
  if (showAll) return BOT_PERSONAS;

  const featured = getFeaturedBotPersonas();
  if (featured.some((persona) => persona.id === selectedId)) return featured;

  return [...featured, getBotPersonaById(selectedId)];
}
