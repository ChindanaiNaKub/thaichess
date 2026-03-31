import { useEffect, useState, type CSSProperties } from 'react';
import type { BotAvatarDefinition } from '@shared/botPersonas';

interface BotAvatarProps {
  avatar: BotAvatarDefinition;
  size?: number;
  className?: string;
}

export default function BotAvatar({ avatar, size = 72, className = '' }: BotAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatar.asset]);

  const frameStyle: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `linear-gradient(145deg, ${avatar.colors[0]}, ${avatar.colors[1]})`,
    boxShadow: `0 12px 28px color-mix(in srgb, ${avatar.colors[0]} 28%, transparent)`,
  };
  const showImage = Boolean(avatar.asset) && !imageFailed;

  return (
    <div
      className={`relative inline-flex shrink-0 overflow-hidden rounded-2xl border border-white/10 ${className}`.trim()}
      style={frameStyle}
      aria-hidden="true"
    >
      {showImage && (
        <img
          src={avatar.asset ?? undefined}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
      <div
        className={`absolute inset-x-0 top-0 h-8 opacity-80 ${showImage ? 'mix-blend-screen' : ''}`}
        style={{ background: `linear-gradient(180deg, ${avatar.accent}, transparent)` }}
      />
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26),transparent_32%)] ${showImage ? 'bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%)]' : ''}`} />
      {!showImage && (
        <div className="absolute inset-0">
          <div
            className="absolute left-1/2 top-[22%] h-[28%] w-[28%] -translate-x-1/2 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
            style={{ backgroundColor: 'rgba(252,238,214,0.92)' }}
          />
          <div
            className="absolute left-1/2 top-[44%] h-[38%] w-[52%] -translate-x-1/2 rounded-[42%_42%_24%_24%/44%_44%_18%_18%] shadow-[0_12px_20px_rgba(0,0,0,0.14)]"
            style={{ backgroundColor: avatar.accent }}
          />
          <div
            className="absolute left-1/2 top-[16%] h-[24%] w-[34%] -translate-x-1/2 rounded-[48%_48%_38%_38%/60%_60%_32%_32%] opacity-90"
            style={{ backgroundColor: 'rgba(45,27,16,0.28)' }}
          />
          <div className="absolute inset-x-[14%] bottom-[12%] h-[16%] rounded-full bg-black/10 blur-md" />
        </div>
      )}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/8" />
    </div>
  );
}
