// config.js — shared constants for Midnight Archive: canvas size, palette,
// movement speeds and detection tuning. One job: hold the numbers every
// other module reads, so tuning never means hunting through game logic.
export const VIEW_W = 960;
export const VIEW_H = 640;
export const HUD_H = 64;
export const PLAY_H = VIEW_H - HUD_H;

export const PALETTE = {
  floor: '#232c3d',
  floorAlt: '#273244',
  carpet: '#3a2f4d',
  wall: '#5b6b85',
  wallTop: '#8fa0bd',
  wallEdge: '#39445c',
  crate: '#b07a2e',
  crateDark: '#7d5418',
  crateEdge: '#f0c25e',
  shadowZone: '#141b2c',
  cone: 'rgba(255, 196, 0, 0.34)',
  coneEdge: 'rgba(255, 214, 64, 0.9)',
  coneAlert: 'rgba(255, 64, 48, 0.42)',
  coneAlertEdge: 'rgba(255, 80, 64, 0.95)',
  coneSuspicious: 'rgba(255, 140, 0, 0.4)',
  player: '#2ee6a8',
  playerDark: '#0e7a55',
  guard: '#ff5252',
  guardDark: '#8e1f1f',
  guardHat: '#ffd54f',
  key: '#ffd54f',
  exit: '#39ff7a',
  exitDark: '#0d7a38',
  text: '#f4f7ff',
  muted: '#aab6cc',
  danger: '#ff5252',
  calm: '#2ee6a8',
};

export const PLAYER_R = 16;
export const GUARD_R = 18;
export const PLAYER_WALK = 150;
export const PLAYER_SNEAK = 82;
export const PLAYER_SPRINT = 215;
export const GUARD_PATROL = 62;
export const GUARD_CHASE = 128;
export const GUARD_RETURN = 92;

export const CONE_RANGE = 190;
export const CONE_HALF_ANGLE = 0.52; // ~30 degrees each side
export const SNEAK_RANGE = 120;

// Detection fill per second at point-blank range, scaled by distance.
export const SPOT_RATE = 95;
export const DRAIN_RATE = 34;
export const SHADOW_DRAIN = 62;
export const ALARM_SECONDS = 4.0;
export const GRACE_SECONDS = 1.1; // brief warning before a chase can catch you

export const GAME_TITLE = 'MIDNIGHT ARCHIVE';
export const GAME_SUBTITLE = 'A quiet heist in three wings';
