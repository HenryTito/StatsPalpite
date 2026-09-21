import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

export type IconName =
  | 'bell'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'close'
  | 'calendar'
  | 'calendar-days'
  | 'search'
  | 'eye'
  | 'check'
  | 'check-circle'
  | 'star'
  | 'settings'
  | 'trophy'
  | 'trophy-cup'
  | 'shield'
  | 'home'
  | 'ticket'
  | 'user'
  | 'lock'
  | 'target'
  | 'flame'
  | 'logo'
  | 'ball'
  | 'card'
  | 'substitution'
  | 'play'
  | 'alert'
  | 'list';

type Props = {
  name: IconName;
  size?: number;
  /** Cor do traco. Ignorada pelos icones preenchidos, que usam `fill`. */
  color?: string;
  /** Cor de preenchimento, para os icones solidos do design. */
  fill?: string;
  strokeWidth?: number;
};

/**
 * Icones do design StatsPalpite. Os paths sao os mesmos do protótipo Figma,
 * todos sobre viewBox 24x24.
 */
export function Icon({
  name,
  size = 24,
  color = colors.ink,
  fill = 'none',
  strokeWidth = 1.6,
}: Props) {
  const stroke = color;
  const common = { width: size, height: size, viewBox: '0 0 24 24' };

  switch (name) {
    case 'bell':
      return (
        <Svg {...common} fill="none">
          <Path d="M6 9a6 6 0 1112 0v5l2 2H4l2-2z" stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M10 20a2 2 0 004 0" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'chevron-left':
      return (
        <Svg {...common} fill="none">
          <Path d="M15 6l-6 6 6 6" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg {...common} fill="none">
          <Path d="M9 6l6 6-6 6" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg {...common} fill="none">
          <Path d="M6 9l6 6 6-6" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...common} fill="none">
          <Path d="M18 6L6 18M6 6l12 12" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...common} fill="none">
          <Rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <Path d="M3 10h18" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'calendar-days':
      return (
        <Svg {...common} fill="none">
          <Rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <Path d="M3 10h18M8 3v4M16 3v4" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...common} fill="none">
          <Circle cx="11" cy="11" r="7" stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M20 20l-3.5-3.5" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'eye':
      return (
        <Svg {...common} fill="none">
          <Path
            d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <Circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common} fill="none">
          <Path d="M4 12.5l5 5L20 7" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'check-circle':
      return (
        <Svg {...common} fill="none">
          <Circle cx="12" cy="12" r="10" fill={fill === 'none' ? colors.acc : fill} />
          <Path d="M7 12.5l3.2 3.2L17 9" stroke={stroke} strokeWidth={2} fill="none" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...common}>
          <Path
            d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"
            fill={fill === 'none' ? colors.warn : fill}
            stroke={stroke}
            strokeWidth={1.4}
          />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...common} fill="none">
          <Circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth={strokeWidth} />
          <Path
            d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'trophy':
      return (
        <Svg {...common} fill="none">
          <Path
            d="M7 4h10v4a5 5 0 01-10 0zM9 20h6M12 13v7"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'trophy-cup':
      return (
        <Svg {...common} fill="none">
          <Path d="M7 4h10v4a5 5 0 01-10 0z" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'shield':
      return (
        <Svg {...common} fill="none">
          <Path
            d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'home':
      return (
        <Svg {...common} fill="none">
          <Path d="M3 10.5L12 3l9 7.5V21H3z" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'ticket':
      return (
        <Svg {...common} fill="none">
          <Path
            d="M4 7h16v4a2 2 0 000 4v4H4v-4a2 2 0 000-4z"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...common} fill="none">
          <Circle cx="12" cy="8" r="4" stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M4 20a8 8 0 0116 0" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...common} fill="none">
          <Rect
            x="5"
            y="11"
            width="14"
            height="10"
            rx="2"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <Path d="M8 11V8a4 4 0 018 0v3" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'target':
      return (
        <Svg {...common} fill="none">
          <Circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={strokeWidth} />
          <Circle cx="12" cy="12" r="4" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'flame':
      return (
        <Svg {...common} fill="none">
          <Path
            d="M12 3c3 4 6 5 6 9a6 6 0 01-12 0c0-2 1-3 2-4 1 2 2 2 2 0 0-2 1-4 2-5z"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'logo':
      return (
        <Svg {...common} fill="none">
          <Circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M12 3v18M3 12h18" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'ball':
      return (
        <Svg {...common} fill="none">
          <Circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M12 7l3 4-1.5 4.5h-3L9 11z" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'card':
      return (
        <Svg {...common}>
          <Rect
            x="7"
            y="4"
            width="10"
            height="16"
            rx="2"
            fill={fill === 'none' ? colors.warn : fill}
          />
        </Svg>
      );
    case 'substitution':
      return (
        <Svg {...common} fill="none">
          <Path d="M4 8h12l-3-3M20 16H8l3 3" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'play':
      return (
        <Svg {...common} fill="none">
          <Path d="M7 5l12 7-12 7z" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'alert':
      return (
        <Svg {...common} fill="none">
          <Path d="M12 3l9 17H3z" stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M12 10v4M12 17h.01" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'list':
      return (
        <Svg {...common} fill="none">
          <Path d="M4 6h16M4 12h16M4 18h10" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
  }
}
