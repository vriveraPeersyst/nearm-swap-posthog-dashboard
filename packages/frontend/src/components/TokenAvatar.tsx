import React from 'react';

interface TokenAvatarProps {
  imageUrl?: string;
  symbol: string;
  /** Avatar diameter in px. Default 44 per design spec. */
  size?: number;
  /** Chain type — determines badge icon. 'near' shows NEAR badge, 'intents' shows intents badge, false/undefined hides badge. */
  chain?: 'near' | 'intents' | false;
  className?: string;
}

const NEAR_LOGO =
  'https://peersyst-public-production.s3.eu-west-1.amazonaws.com/3cb3deb2-74a7-4fbb-aeb3-705cdc1712f9.png';

// Local intents protocol badge
const INTENTS_LOGO = '/intents.png';

/**
 * Token avatar following NEARMobile design system.
 * Round token image with optional chain badge in bottom-right.
 * Falls back to a letter badge when no image is available.
 */
const TokenAvatar: React.FC<TokenAvatarProps> = ({
  imageUrl,
  symbol,
  size = 44,
  chain,
  className = '',
}) => {
  const badgeSize = Math.round(size * 0.45);
  const showBadge = !!chain;
  const badgeSrc = chain === 'intents' ? INTENTS_LOGO : NEAR_LOGO;

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={symbol}
          width={size}
          height={size}
          className="rounded-full object-cover bg-nm-borderLight"
          style={{ width: size, height: size }}
          loading="lazy"
        />
      ) : (
        <div
          className="rounded-full bg-nm-borderLight flex items-center justify-center text-nm-muted font-sf-mono font-semibold text-[10px] uppercase"
          style={{ width: size, height: size }}
        >
          {symbol.slice(0, 3)}
        </div>
      )}
      {showBadge && (
        <img
          src={badgeSrc}
          alt={chain === 'intents' ? 'Intents' : 'NEAR'}
          width={badgeSize}
          height={badgeSize}
          className="absolute rounded border-2 border-white object-cover"
          style={{
            width: badgeSize,
            height: badgeSize,
            right: -2,
            bottom: -2,
          }}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default TokenAvatar;
