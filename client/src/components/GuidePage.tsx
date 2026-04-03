import { routes } from '../lib/routes';
import { useTranslation, type Language } from '../lib/i18n';
import Header from './Header';

type GuideSlug = 'what-is-makruk' | 'how-to-play-makruk' | 'play-makruk-online';

interface GuideSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

interface GuideFaq {
  question: string;
  answer: string;
}

interface GuideAction {
  href: string;
  label: string;
  style: 'primary' | 'secondary';
}

interface GuideLink {
  href: string;
  title: string;
  description: string;
}

interface GuideContent {
  eyebrow: string;
  title: string;
  intro: string;
  kicker: string;
  sections: GuideSection[];
  faqTitle: string;
  faqs: GuideFaq[];
  actions: GuideAction[];
  relatedTitle: string;
  related: GuideLink[];
}

const GUIDE_CONTENT: Record<Language, Record<GuideSlug, GuideContent>> = {
  en: {
    'what-is-makruk': {
      eyebrow: 'Learn Makruk',
      title: 'What Is Makruk?',
      intro: 'Makruk is the traditional chess of Thailand. It uses an 8x8 board, but the pace, piece values, and endgames feel different from western chess almost immediately.',
      kicker: 'If western chess often explodes early, Makruk usually asks for patience. Small advantages matter. Piece coordination matters. Endgames matter a lot.',
      sections: [
        {
          title: 'A chess cousin, not a chess clone',
          paragraphs: [
            'Makruk belongs to the same broad family as chess, but it has its own personality. The queen is weaker, pawns begin closer to the center, and positions often stay tense without turning chaotic.',
            'That changes the whole rhythm of the game. You still fight for development, king safety, and tactics, but you do it in a slower, more positional environment.',
          ],
        },
        {
          title: 'Why players find it interesting',
          paragraphs: [
            'Makruk rewards accuracy over flash. You do not get many cheap attacks, so you have to improve your pieces, understand the structure, and convert endings cleanly.',
          ],
          bullets: [
            'The Met is much weaker than the western queen, so attacks take more work.',
            'Pawns start on the third rank, so central contact happens earlier.',
            'Endgames are richer because small material edges often stay playable for longer.',
          ],
        },
        {
          title: 'How it feels in practice',
          paragraphs: [
            'The first thing most new players notice is that Makruk feels calmer. The second thing they notice is that the calm is deceptive. One loose move can still leave you with a bad endgame that lasts forever.',
            'That balance is part of the appeal. The game gives you room to think, but it still punishes lazy decisions.',
          ],
        },
        {
          title: 'Who should try it',
          paragraphs: [
            'Makruk is great for players who enjoy classical chess, quiet positions, technical endings, or learning a traditional game with real competitive depth.',
            'It is also a good entry point for Thai players who know the name but have never had an easy way to practice online.',
          ],
        },
      ],
      faqTitle: 'Quick Answers',
      faqs: [
        {
          question: 'Is Makruk the same as western chess?',
          answer: 'No. It is related to chess, but the pieces and strategy are different enough that you should treat it as its own game.',
        },
        {
          question: 'Is Makruk hard to learn?',
          answer: 'The basics are approachable. The deeper strategy takes time, but most players can start playing after learning the piece movement and promotion rules.',
        },
        {
          question: 'Can I play Makruk online for free?',
          answer: 'Yes. You can practice here against the bot, solve puzzles, or jump into an online game in the browser.',
        },
      ],
      actions: [
        { href: routes.howToPlayMakruk, label: 'Learn the Rules', style: 'primary' },
        { href: routes.bot, label: 'Practice vs Bot', style: 'secondary' },
      ],
      relatedTitle: 'Keep Going',
      related: [
        {
          href: routes.howToPlayMakruk,
          title: 'How to Play Makruk',
          description: 'Start with setup, movement, promotion, and the counting rule.',
        },
        {
          href: routes.playMakrukOnline,
          title: 'Play Makruk Online',
          description: 'See the fastest ways to start playing in your browser.',
        },
      ],
    },
    'how-to-play-makruk': {
      eyebrow: 'Beginner Guide',
      title: 'How to Play Makruk',
      intro: 'You can learn the basics of Makruk faster than most people expect. The board is familiar. What changes is the movement of a few key pieces and the kind of positions they create.',
      kicker: 'If you only want the short version: learn how the Met, Khon, and pawn promotion work, then play a few bot games. That gets you moving quickly.',
      sections: [
        {
          title: 'Board and starting setup',
          paragraphs: [
            'Makruk uses an 8x8 board. The pieces begin in a fixed starting arrangement, and the game alternates moves just like chess.',
            'Pawns start on the third rank instead of the second. That one change already makes the opening feel more direct.',
          ],
        },
        {
          title: 'How the pieces move',
          paragraphs: [
            'The king and rook behave as you would expect. The knight also keeps its L-shaped move. The biggest adjustment is the Met, which moves only one square diagonally, and the Khon, which moves one square diagonally or one square forward.',
          ],
          bullets: [
            'Khun (king): one square in any direction',
            'Rua (rook): any number of squares horizontally or vertically',
            'Ma (knight): same L-shape as chess',
            'Met: one square diagonally',
            'Khon: one square diagonally or one square forward',
            'Bia (pawn): one square forward, captures diagonally',
          ],
        },
        {
          title: 'Promotion and winning',
          paragraphs: [
            'When a pawn reaches the sixth rank, it promotes to a promoted Met. That matters because promotion is more modest than in western chess. You improve the piece, but you do not suddenly get a full queen.',
            'You still win by checkmate. Draws can also happen through stalemate, agreement, insufficient material, or the counting rule in certain endgames.',
          ],
        },
        {
          title: 'The counting rule',
          paragraphs: [
            'This is the part that confuses most new players. In some late endgames, the stronger side has a limited number of moves to force progress. If that side fails, the game can be drawn.',
            'You do not need to master every detail on day one. Just remember that Makruk cares about technical conversion, not only material advantage.',
          ],
        },
        {
          title: 'Best way to learn',
          paragraphs: [
            'Do not wait until you feel ready. Learn the movement, play a few games against the bot, then try puzzles. That is usually enough to make the rules stick.',
          ],
          bullets: [
            'Play one bot game to understand the rhythm.',
            'Use local play if you want to test moves without pressure.',
            'Solve a few beginner puzzles to see common mating patterns.',
          ],
        },
      ],
      faqTitle: 'Common Questions',
      faqs: [
        {
          question: 'What is the hardest rule for beginners?',
          answer: 'Usually the counting rule. Piece movement is easier to learn than the endgame draw mechanics.',
        },
        {
          question: 'Does Makruk have castling or en passant?',
          answer: 'No. There is no castling, no en passant, and no two-square pawn jump.',
        },
        {
          question: 'What should I do after learning the rules?',
          answer: 'Play the bot first, then move to puzzles or casual online games once the movement feels natural.',
        },
      ],
      actions: [
        { href: routes.bot, label: 'Play the Bot', style: 'primary' },
        { href: routes.puzzles, label: 'Try Puzzles', style: 'secondary' },
      ],
      relatedTitle: 'Related Pages',
      related: [
        {
          href: routes.whatIsMakruk,
          title: 'What Is Makruk?',
          description: 'Get the broad picture before diving deeper into rules and strategy.',
        },
        {
          href: routes.playMakrukOnline,
          title: 'Play Makruk Online',
          description: 'Jump straight into practice once the rules are clear.',
        },
      ],
    },
    'play-makruk-online': {
      eyebrow: 'Play Online',
      title: 'Play Makruk Online',
      intro: 'The easiest way to learn Makruk is to play it. You do not need to install anything, and you do not need to wait until you understand every rule perfectly.',
      kicker: 'If the live pool is quiet, start with the bot or puzzles. The goal is not to wait around for activity. The goal is to keep getting better while the player base grows.',
      sections: [
        {
          title: 'The fastest ways to start',
          paragraphs: [
            'There are three good entry points. Quick play if you want another person. Bot games if you want instant practice. Puzzles if you want short tactical training.',
          ],
          bullets: [
            'Quick Play: jump into matchmaking when other players are around',
            'Play vs Bot: learn piece movement and opening shape without pressure',
            'Puzzles: train tactics in short sessions',
          ],
        },
        {
          title: 'Why browser play matters',
          paragraphs: [
            'A small niche game grows when the barrier to entry is low. Browser-based play helps because people can open a link and start immediately instead of installing software, hunting for opponents, or learning a complicated interface first.',
          ],
        },
        {
          title: 'Best mode for beginners',
          paragraphs: [
            'If you are brand new, bot games are the safest start. You can take your time, test ideas, and get used to the pace of Makruk. Once the piece movement feels natural, puzzles sharpen calculation. Then online games start making more sense.',
          ],
        },
        {
          title: 'What to expect from real games',
          paragraphs: [
            'Makruk games are usually more technical than flashy. You will see fewer wild queen attacks and more slow pressure, awkward piece placement, and long endings that punish impatience.',
            'That is exactly why many players stick with it. The game feels honest.',
          ],
        },
      ],
      faqTitle: 'Before You Start',
      faqs: [
        {
          question: 'Do I need an account to play?',
          answer: 'No. You can start core play modes without registering, though an account helps if you want rated play and a persistent identity.',
        },
        {
          question: 'What if there are not many live players online?',
          answer: 'Use the bot and puzzles instead of waiting. Those modes keep the site useful even when concurrency is low.',
        },
        {
          question: 'Can I invite a friend directly?',
          answer: 'Yes. You can create a private game and share the link.',
        },
      ],
      actions: [
        { href: routes.quickPlay, label: 'Find an Opponent', style: 'primary' },
        { href: routes.bot, label: 'Start with the Bot', style: 'secondary' },
      ],
      relatedTitle: 'More Ways In',
      related: [
        {
          href: routes.howToPlayMakruk,
          title: 'How to Play Makruk',
          description: 'Learn the rules first if you want a cleaner first session.',
        },
        {
          href: routes.puzzles,
          title: 'Makruk Puzzles',
          description: 'Train in short bursts with tactical positions and mating ideas.',
        },
      ],
    },
  },
  th: {
    'what-is-makruk': {
      eyebrow: 'เรียนรู้หมากรุกไทย',
      title: 'หมากรุกไทยคืออะไร',
      intro: 'หมากรุกไทย หรือ Makruk คือหมากรุกแบบดั้งเดิมของไทย ใช้กระดาน 8x8 เหมือนหมากรุกสากล แต่จังหวะเกม การให้ค่าน้ำหนักตัวหมาก และรูปแบบเอ็นด์เกมต่างกันชัดเจน',
      kicker: 'ถ้าหมากรุกสากลมักเปิดเกมแรงเร็ว หมากรุกไทยมักให้ความสำคัญกับความนิ่ง การเดินละเอียด และการเปลี่ยนความได้เปรียบเล็ก ๆ ให้กลายเป็นชัยชนะจริง',
      sections: [
        {
          title: 'เป็นญาติของหมากรุก แต่ไม่ใช่เกมเดียวกัน',
          paragraphs: [
            'หมากรุกไทยอยู่ในตระกูลเดียวกับหมากรุก แต่มีบุคลิกของตัวเอง เม็ดอ่อนกว่าควีน เบี้ยเริ่มสูงกว่า และหลายตำแหน่งจะค่อย ๆ รัดกันมากกว่าปะทะกันทันที',
            'เพราะแบบนั้นรูปเกมจึงต่างออกไป คุณยังต้องคิดเรื่องการพัฒนาหมาก ความปลอดภัยของขุน และแท็กติกเหมือนเดิม แต่ทุกอย่างเกิดในเกมที่นิ่งกว่าและละเอียดกว่า',
          ],
        },
        {
          title: 'ทำไมหลายคนถึงชอบ',
          paragraphs: [
            'หมากรุกไทยให้รางวัลกับความแม่นมากกว่าความหวือหวา คุณจะหาทางโจมตีแบบง่าย ๆ ได้น้อยลง จึงต้องจัดหมากให้ดี เข้าใจโครงสร้าง และเล่นเอ็นด์เกมให้คม',
          ],
          bullets: [
            'เม็ดอ่อนกว่าควีน ทำให้การบุกต้องอาศัยการประสานงานมากขึ้น',
            'เบี้ยเริ่มที่ตาที่สาม ทำให้การปะทะกลางกระดานเกิดเร็วขึ้น',
            'เอ็นด์เกมเข้มข้น เพราะความได้เปรียบเล็กน้อยยังเล่นต่อได้อีกนาน',
          ],
        },
        {
          title: 'ความรู้สึกเวลาเล่นจริง',
          paragraphs: [
            'สิ่งแรกที่ผู้เล่นใหม่มักรู้สึกคือเกมดูนิ่งกว่าเดิม สิ่งถัดมาคือความนิ่งนั้นหลอกตา เดินพลาดครั้งเดียวอาจต้องรับเอ็นด์เกมเสียเปรียบยาว ๆ',
            'เสน่ห์ของเกมอยู่ตรงนั้นเอง มันให้เวลาคุณคิด แต่ก็ลงโทษความเผลอได้ชัดมาก',
          ],
        },
        {
          title: 'เหมาะกับใคร',
          paragraphs: [
            'ถ้าคุณชอบหมากรุกคลาสสิก ชอบเกมตำแหน่ง ชอบเอ็นด์เกม หรืออยากเรียนเกมกระดานดั้งเดิมที่ยังมีความลึกเชิงแข่งขัน หมากรุกไทยเหมาะมาก',
            'มันยังเหมาะกับคนไทยที่รู้จักชื่อเกมนี้อยู่แล้ว แต่ไม่เคยมีพื้นที่ออนไลน์ที่เริ่มเล่นได้ง่ายจริง ๆ',
          ],
        },
      ],
      faqTitle: 'คำถามสั้น ๆ',
      faqs: [
        {
          question: 'หมากรุกไทยเหมือนหมากรุกสากลไหม',
          answer: 'ไม่เหมือนกัน แม้จะอยู่ในตระกูลเดียวกัน แต่ตัวหมากและแนวคิดเชิงกลยุทธ์ต่างกันพอสมควร',
        },
        {
          question: 'เรียนยากไหม',
          answer: 'พื้นฐานไม่ได้ยากมาก เรียนการเดินหมากกับกติกาการหงายก่อน แล้วค่อยเก็บรายละเอียดเชิงลึกเพิ่มได้',
        },
        {
          question: 'เล่นออนไลน์ฟรีได้ไหม',
          answer: 'ได้ คุณสามารถเล่นกับบอท แก้โจทย์ หรือเล่นผ่านเบราว์เซอร์ได้เลย',
        },
      ],
      actions: [
        { href: routes.howToPlayMakruk, label: 'ดูกติกา', style: 'primary' },
        { href: routes.bot, label: 'ลองเล่นกับบอท', style: 'secondary' },
      ],
      relatedTitle: 'อ่านต่อ',
      related: [
        {
          href: routes.howToPlayMakruk,
          title: 'วิธีเล่นหมากรุกไทย',
          description: 'เริ่มจากการจัดหมาก การเดิน และกฎการนับ',
        },
        {
          href: routes.playMakrukOnline,
          title: 'เล่นหมากรุกไทยออนไลน์',
          description: 'ดูวิธีเริ่มเล่นในเบราว์เซอร์แบบง่ายที่สุด',
        },
      ],
    },
    'how-to-play-makruk': {
      eyebrow: 'คู่มือเริ่มต้น',
      title: 'วิธีเล่นหมากรุกไทย',
      intro: 'พื้นฐานของหมากรุกไทยเรียนได้เร็วกว่าที่หลายคนคิด กระดานยังคุ้นตาอยู่ ความต่างจริง ๆ อยู่ที่การเดินของบางตัวและรูปเกมที่ออกมา',
      kicker: 'ถ้าอยากได้เวอร์ชันสั้นที่สุด ให้จำการเดินของเม็ด โคน และกติกาการหงายก่อน แล้วไปลองเล่นกับบอทไม่กี่เกม ภาพรวมจะเริ่มชัดทันที',
      sections: [
        {
          title: 'กระดานและการจัดหมาก',
          paragraphs: [
            'หมากรุกไทยใช้กระดาน 8x8 เหมือนหมากรุกสากล และสลับเดินกันตามปกติ',
            'ความต่างสำคัญคือเบี้ยเริ่มที่ตาที่สาม ไม่ใช่ตาที่สอง ทำให้การปะทะกันในช่วงต้นเกมเกิดเร็วขึ้น',
          ],
        },
        {
          title: 'ตัวหมากเดินอย่างไร',
          paragraphs: [
            'ขุนและเรือเดินใกล้เคียงกับที่หลายคนคุ้นเคย ม้าก็ยังเป็นรูปตัว L เหมือนเดิม จุดที่ต้องจำให้ขึ้นใจคือ เม็ดเดินทแยงทีละ 1 ช่อง และโคนเดินทแยงทีละ 1 ช่องหรือเดินหน้าตรงทีละ 1 ช่อง',
          ],
          bullets: [
            'ขุน: เดินได้ 1 ช่องทุกทิศ',
            'เรือ: เดินตรงแนวตั้งหรือแนวนอนได้ไกล',
            'ม้า: เดินแบบตัว L',
            'เม็ด: เดินทแยง 1 ช่อง',
            'โคน: เดินทแยง 1 ช่อง หรือเดินหน้าตรง 1 ช่อง',
            'เบี้ย: เดินหน้าตรง 1 ช่อง กินเฉียง',
          ],
        },
        {
          title: 'การหงายและการชนะ',
          paragraphs: [
            'เมื่อเบี้ยเดินถึงตาที่หก จะหงายเป็นเบี้ยหงาย ซึ่งเดินแบบเม็ด การหงายในหมากรุกไทยจึงไม่รุนแรงเท่าการโปรโมตเป็นควีนในหมากรุกสากล',
            'เกมยังชนะด้วยการรุกจนได้เหมือนเดิม และยังมีผลเสมอจากอับ ตกลงเสมอ ตัวหมากไม่พอ หรือกฎการนับในบางเอ็นด์เกม',
          ],
        },
        {
          title: 'กฎการนับ',
          paragraphs: [
            'นี่คือส่วนที่ผู้เล่นใหม่มักงงที่สุด ในบางเอ็นด์เกม ฝ่ายที่ได้เปรียบจะมีจำนวนตาเดินจำกัดเพื่อบีบให้ชนะ หากทำไม่ได้ เกมอาจเสมอ',
            'วันแรกยังไม่ต้องจำทุกกรณี แค่เข้าใจก่อนว่าหมากรุกไทยให้ความสำคัญกับการเปลี่ยนความได้เปรียบให้สำเร็จ ไม่ใช่แค่มีตัวมากกว่าแล้วจบ',
          ],
        },
        {
          title: 'วิธีฝึกที่ดีที่สุด',
          paragraphs: [
            'อย่ารอให้พร้อมค่อยเล่น เรียนการเดินหมากก่อน แล้วไปเล่นกับบอท ต่อด้วยโจทย์ไม่กี่ข้อ กติกาจะติดมือเร็วมาก',
          ],
          bullets: [
            'เล่นกับบอท 1 เกมเพื่อจับจังหวะของเกม',
            'ใช้โหมดเล่นในเครื่องถ้าอยากลองเดินแบบไม่กดดัน',
            'ทำโจทย์เริ่มต้นเพื่อดูรูปแบบการรุกจนที่พบบ่อย',
          ],
        },
      ],
      faqTitle: 'คำถามที่พบบ่อย',
      faqs: [
        {
          question: 'กติกาไหนยากที่สุดสำหรับมือใหม่',
          answer: 'ส่วนใหญ่คือกฎการนับ เพราะการเดินหมากพื้นฐานเรียนง่ายกว่าเรื่องการเสมอในเอ็นด์เกม',
        },
        {
          question: 'มีการเข้าป้อมหรือกินผ่านไหม',
          answer: 'ไม่มี ไม่มีการเข้าป้อม ไม่มี en passant และไม่มีการเดินเบี้ย 2 ช่องในครั้งแรก',
        },
        {
          question: 'เรียนกติกาเสร็จแล้วควรทำอะไรต่อ',
          answer: 'เริ่มจากเล่นกับบอท แล้วค่อยไปโจทย์หรือเกมออนไลน์เมื่อเริ่มคุ้นกับตัวหมาก',
        },
      ],
      actions: [
        { href: routes.bot, label: 'เริ่มเล่นกับบอท', style: 'primary' },
        { href: routes.puzzles, label: 'ลองโจทย์', style: 'secondary' },
      ],
      relatedTitle: 'อ่านต่อ',
      related: [
        {
          href: routes.whatIsMakruk,
          title: 'หมากรุกไทยคืออะไร',
          description: 'ดูภาพรวมของเกมก่อนลงรายละเอียดเรื่องกติกา',
        },
        {
          href: routes.playMakrukOnline,
          title: 'เล่นหมากรุกไทยออนไลน์',
          description: 'พร้อมแล้วก็ไปเริ่มเล่นในเบราว์เซอร์ได้เลย',
        },
      ],
    },
    'play-makruk-online': {
      eyebrow: 'เล่นออนไลน์',
      title: 'เล่นหมากรุกไทยออนไลน์',
      intro: 'วิธีที่ง่ายที่สุดในการเรียนหมากรุกไทยคือการลงมือเล่น คุณไม่ต้องติดตั้งโปรแกรม และไม่ต้องรอให้เข้าใจกติกาทุกข้อแบบเป๊ะก่อน',
      kicker: 'ถ้าช่วงไหนคนออนไลน์ยังไม่เยอะ ให้เริ่มจากบอทหรือโจทย์ก่อน จุดสำคัญคือทำให้ไซต์ยังมีประโยชน์แม้จำนวนผู้เล่นสดจะยังน้อย',
      sections: [
        {
          title: 'เริ่มจากโหมดไหนดี',
          paragraphs: [
            'มี 3 ทางที่เริ่มได้ง่าย Quick Play ถ้าอยากเจอคนจริง บอทถ้าอยากฝึกทันที และโจทย์ถ้าอยากซ้อมสั้น ๆ แบบมีเป้าหมาย',
          ],
          bullets: [
            'Quick Play: เข้าแถวเจอคู่แข่งเมื่อมีคนออนไลน์',
            'เล่นกับบอท: เรียนการเดินหมากและจังหวะเกมแบบไม่กดดัน',
            'โจทย์: ฝึกแท็กติกและรูปแบบการรุกจนในช่วงสั้น ๆ',
          ],
        },
        {
          title: 'ทำไมการเล่นผ่านเบราว์เซอร์ถึงสำคัญ',
          paragraphs: [
            'เกมเฉพาะทางจะโตได้ง่ายขึ้นถ้าคนเริ่มเล่นได้ทันที การเปิดลิงก์แล้วเล่นเลยช่วยลดแรงเสียดทาน ไม่ต้องติดตั้ง ไม่ต้องหาเซิร์ฟเวอร์ ไม่ต้องเรียนหน้าตาซับซ้อนก่อน',
          ],
        },
        {
          title: 'โหมดที่เหมาะกับมือใหม่',
          paragraphs: [
            'ถ้าเพิ่งเริ่ม บอทคือทางเลือกที่ปลอดภัยที่สุด คุณจะได้ลองไอเดียต่าง ๆ แบบไม่รีบ พอเริ่มคุ้นแล้วค่อยไปโจทย์ และเมื่อการเดินหมากเริ่มธรรมชาติขึ้น เกมออนไลน์จะสนุกขึ้นมาก',
          ],
        },
        {
          title: 'เกมจริงจะให้อารมณ์แบบไหน',
          paragraphs: [
            'หมากรุกไทยมักเป็นเกมที่ใช้เทคนิคมากกว่าความหวือหวา คุณจะเห็นการบีบทีละนิด หมากยืนผิดจังหวะ และเอ็นด์เกมยาว ๆ ที่ลงโทษความใจร้อน',
            'หลายคนชอบเกมนี้เพราะตรงนั้นเอง มันเป็นเกมที่ตรงไปตรงมา',
          ],
        },
      ],
      faqTitle: 'ก่อนเริ่มเล่น',
      faqs: [
        {
          question: 'ต้องมีบัญชีไหม',
          answer: 'ไม่จำเป็น คุณเริ่มเล่นโหมดหลักได้เลย แต่การมีบัญชีจะช่วยเรื่องเรตและตัวตนถาวร',
        },
        {
          question: 'ถ้าคนออนไลน์ยังน้อยควรทำอย่างไร',
          answer: 'ใช้บอทและโจทย์แทนการรอ โหมดเหล่านี้ควรทำให้ไซต์ยังมีประโยชน์แม้ช่วงนั้นคนยังไม่เยอะ',
        },
        {
          question: 'ชวนเพื่อนมาเล่นตรง ๆ ได้ไหม',
          answer: 'ได้ คุณสามารถสร้างห้องส่วนตัวแล้วส่งลิงก์ให้เพื่อนได้',
        },
      ],
      actions: [
        { href: routes.quickPlay, label: 'หาคู่เล่น', style: 'primary' },
        { href: routes.bot, label: 'เริ่มจากบอท', style: 'secondary' },
      ],
      relatedTitle: 'ไปต่อทางไหนดี',
      related: [
        {
          href: routes.howToPlayMakruk,
          title: 'วิธีเล่นหมากรุกไทย',
          description: 'ถ้าอยากเริ่มอย่างมั่นใจ ลองอ่านกติกาก่อน',
        },
        {
          href: routes.puzzles,
          title: 'โจทย์หมากรุกไทย',
          description: 'ซ้อมเป็นช่วงสั้น ๆ ด้วยแท็กติกและรูปแบบการรุกจน',
        },
      ],
    },
  },
};

const GUIDE_ORDER: GuideSlug[] = ['what-is-makruk', 'how-to-play-makruk', 'play-makruk-online'];

export default function GuidePage({ slug }: { slug: GuideSlug }) {
  const { lang, t } = useTranslation();
  const content = GUIDE_CONTENT[lang][slug];
  const nextHref = content.related[0]?.href ?? routes.home;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="about" subtitle={content.eyebrow} />

      <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <section className="rounded-[2rem] border border-surface-hover/80 bg-[radial-gradient(circle_at_top_left,rgba(173,130,53,0.12),transparent_35%),linear-gradient(180deg,rgba(41,34,28,0.92),rgba(21,19,17,0.98))] px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">{content.eyebrow}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold text-text-bright sm:text-4xl lg:text-[3.2rem]">{content.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-text sm:text-lg">{content.intro}</p>
            <div className="mt-5 rounded-2xl border border-accent/20 bg-surface/50 px-4 py-4 text-sm leading-7 text-text sm:text-base">
              {content.kicker}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {content.actions.map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className={action.style === 'primary'
                    ? 'inline-flex items-center rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent/85'
                    : 'inline-flex items-center rounded-xl border border-surface-hover bg-surface/55 px-5 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover'}
                >
                  {action.label}
                </a>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              {content.sections.map((section) => (
                <article key={section.title} className="rounded-2xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6">
                  <h2 className="text-xl font-bold text-text-bright sm:text-2xl">{section.title}</h2>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-text sm:text-base">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-text sm:text-base">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="rounded-xl border border-surface-hover bg-surface/55 px-4 py-3">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-surface-hover bg-surface-alt/85 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-dim">{content.relatedTitle}</div>
                <div className="mt-4 space-y-3">
                  {content.related.map((item) => (
                    <a key={item.href} href={item.href} className="block rounded-xl border border-surface-hover bg-surface/55 px-4 py-4 transition-colors hover:bg-surface-hover">
                      <div className="font-semibold text-text-bright">{item.title}</div>
                      <div className="mt-1 text-sm leading-6 text-text-dim">{item.description}</div>
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-light">{t('nav.play')}</div>
                <div className="mt-3 text-lg font-bold text-text-bright">{t('guide.cta_title')}</div>
                <p className="mt-2 text-sm leading-6 text-text">{t('guide.cta_desc')}</p>
                <a
                  href={nextHref}
                  className="mt-4 inline-flex items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent/85"
                >
                  {t('guide.cta_next')}
                </a>
              </div>
            </aside>
          </section>

          <section className="rounded-2xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-text-bright sm:text-2xl">{content.faqTitle}</h2>
            <div className="mt-5 space-y-3">
              {content.faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-surface-hover bg-surface/55 px-4 py-4">
                  <h3 className="text-base font-semibold text-text-bright">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-text sm:text-base">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export function getGuideOrder(): GuideSlug[] {
  return GUIDE_ORDER;
}
