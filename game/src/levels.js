// levels.js — the three wings of the archive. Each level is plain data:
// walls that block sight and movement, crates that block sight only when
// you crouch behind them, shadow rugs where suspicion drains fast, guard
// patrol loops, seal-keys to collect, and the glowing exit door.
// Coordinates are canvas pixels; the play floor starts below the HUD.
import { HUD_H } from './config.js';

const TOP = HUD_H + 8;

export function buildLevels() {
  return [
    {
      name: 'WING 1 — READING ROOM',
      hint: 'Learn the patrol. Crouch (hold mouse / C) behind crates.',
      start: { x: 70, y: TOP + 470 },
      exit: { x: 868, y: TOP + 40, w: 64, h: 76 },
      walls: [
        { x: 0, y: TOP - 8, w: 960, h: 8 },
        { x: 0, y: TOP + 568, w: 960, h: 8 },
        { x: 0, y: TOP, w: 8, h: 568 },
        { x: 952, y: TOP, w: 8, h: 568 },
        { x: 250, y: TOP + 60, w: 26, h: 250 },
        { x: 250, y: TOP + 380, w: 26, h: 130 },
        { x: 560, y: TOP + 130, w: 26, h: 240 },
        { x: 560, y: TOP + 440, w: 26, h: 70 },
        { x: 700, y: TOP + 60, w: 180, h: 26 },
      ],
      crates: [
        { x: 130, y: TOP + 130, w: 62, h: 62 },
        { x: 330, y: TOP + 240, w: 62, h: 62 },
        { x: 450, y: TOP + 430, w: 62, h: 62 },
        { x: 660, y: TOP + 250, w: 62, h: 62 },
        { x: 790, y: TOP + 430, w: 62, h: 62 },
      ],
      shadows: [
        { x: 90, y: TOP + 260, w: 130, h: 110 },
        { x: 620, y: TOP + 400, w: 140, h: 100 },
        { x: 820, y: TOP + 180, w: 110, h: 110 },
      ],
      keys: [
        { x: 180, y: TOP + 60 },
        { x: 880, y: TOP + 480 },
      ],
      guards: [
        {
          name: 'Bram',
          waypoints: [
            { x: 360, y: TOP + 120 },
            { x: 360, y: TOP + 420 },
            { x: 520, y: TOP + 420 },
            { x: 520, y: TOP + 120 },
          ],
          pause: 1.4,
        },
        {
          name: 'Odile',
          waypoints: [
            { x: 700, y: TOP + 480 },
            { x: 880, y: TOP + 480 },
            { x: 880, y: TOP + 300 },
            { x: 700, y: TOP + 300 },
          ],
          pause: 1.0,
        },
      ],
    },
    {
      name: 'WING 2 — MAP WING',
      hint: 'Three guards, tighter loops. Wait for the turn, then move.',
      start: { x: 70, y: TOP + 80 },
      exit: { x: 868, y: TOP + 452, w: 64, h: 76 },
      walls: [
        { x: 0, y: TOP - 8, w: 960, h: 8 },
        { x: 0, y: TOP + 568, w: 960, h: 8 },
        { x: 0, y: TOP, w: 8, h: 568 },
        { x: 952, y: TOP, w: 8, h: 568 },
        { x: 200, y: TOP + 40, w: 26, h: 200 },
        { x: 200, y: TOP + 310, w: 26, h: 200 },
        { x: 470, y: TOP + 160, w: 26, h: 250 },
        { x: 700, y: TOP + 40, w: 26, h: 200 },
        { x: 700, y: TOP + 310, w: 26, h: 200 },
        { x: 330, y: TOP + 460, w: 220, h: 26 },
      ],
      crates: [
        { x: 110, y: TOP + 250, w: 62, h: 62 },
        { x: 300, y: TOP + 110, w: 62, h: 62 },
        { x: 540, y: TOP + 260, w: 62, h: 62 },
        { x: 620, y: TOP + 470, w: 62, h: 62 },
        { x: 790, y: TOP + 130, w: 62, h: 62 },
        { x: 380, y: TOP + 380, w: 62, h: 62 },
      ],
      shadows: [
        { x: 90, y: TOP + 400, w: 130, h: 110 },
        { x: 530, y: TOP + 60, w: 140, h: 100 },
        { x: 760, y: TOP + 300, w: 130, h: 110 },
      ],
      keys: [
        { x: 130, y: TOP + 480 },
        { x: 610, y: TOP + 150 },
        { x: 900, y: TOP + 90 },
      ],
      guards: [
        {
          name: 'Bram',
          waypoints: [
            { x: 320, y: TOP + 90 },
            { x: 320, y: TOP + 480 },
            { x: 420, y: TOP + 480 },
            { x: 420, y: TOP + 90 },
          ],
          pause: 1.1,
        },
        {
          name: 'Odile',
          waypoints: [
            { x: 580, y: TOP + 90 },
            { x: 580, y: TOP + 480 },
            { x: 660, y: TOP + 480 },
            { x: 660, y: TOP + 90 },
          ],
          pause: 0.9,
        },
        {
          name: 'Petra',
          waypoints: [
            { x: 780, y: TOP + 260 },
            { x: 900, y: TOP + 260 },
            { x: 900, y: TOP + 420 },
            { x: 780, y: TOP + 420 },
          ],
          pause: 1.2,
        },
      ],
    },
    {
      name: 'WING 3 — STAR VAULT',
      hint: 'Four guards. Sprinting is loud. Shadow is your friend.',
      start: { x: 70, y: TOP + 470 },
      exit: { x: 448, y: TOP + 20, w: 64, h: 70 },
      walls: [
        { x: 0, y: TOP - 8, w: 960, h: 8 },
        { x: 0, y: TOP + 568, w: 960, h: 8 },
        { x: 0, y: TOP, w: 8, h: 568 },
        { x: 952, y: TOP, w: 8, h: 568 },
        { x: 180, y: TOP + 80, w: 26, h: 220 },
        { x: 180, y: TOP + 370, w: 26, h: 140 },
        { x: 430, y: TOP + 130, w: 26, h: 180 },
        { x: 430, y: TOP + 380, w: 26, h: 130 },
        { x: 680, y: TOP + 80, w: 26, h: 220 },
        { x: 680, y: TOP + 370, w: 26, h: 140 },
        { x: 300, y: TOP + 250, w: 180, h: 26 },
        { x: 620, y: TOP + 250, w: 180, h: 26 },
      ],
      crates: [
        { x: 100, y: TOP + 200, w: 62, h: 62 },
        { x: 260, y: TOP + 90, w: 62, h: 62 },
        { x: 260, y: TOP + 440, w: 62, h: 62 },
        { x: 520, y: TOP + 330, w: 62, h: 62 },
        { x: 590, y: TOP + 90, w: 62, h: 62 },
        { x: 760, y: TOP + 200, w: 62, h: 62 },
        { x: 760, y: TOP + 440, w: 62, h: 62 },
      ],
      shadows: [
        { x: 90, y: TOP + 330, w: 130, h: 110 },
        { x: 520, y: TOP + 440, w: 130, h: 90 },
        { x: 800, y: TOP + 90, w: 120, h: 110 },
      ],
      keys: [
        { x: 110, y: TOP + 70 },
        { x: 850, y: TOP + 480 },
        { x: 480, y: TOP + 470 },
      ],
      guards: [
        {
          name: 'Bram',
          waypoints: [
            { x: 120, y: TOP + 120 },
            { x: 120, y: TOP + 460 },
            { x: 160, y: TOP + 460 },
            { x: 160, y: TOP + 120 },
          ],
          pause: 0.8,
        },
        {
          name: 'Odile',
          waypoints: [
            { x: 340, y: TOP + 120 },
            { x: 340, y: TOP + 200 },
            { x: 600, y: TOP + 200 },
            { x: 600, y: TOP + 120 },
          ],
          pause: 0.9,
        },
        {
          name: 'Petra',
          waypoints: [
            { x: 740, y: TOP + 120 },
            { x: 740, y: TOP + 460 },
            { x: 800, y: TOP + 460 },
            { x: 800, y: TOP + 120 },
          ],
          pause: 0.8,
        },
        {
          name: 'Silas',
          waypoints: [
            { x: 300, y: TOP + 330 },
            { x: 620, y: TOP + 330 },
            { x: 620, y: TOP + 500 },
            { x: 300, y: TOP + 500 },
          ],
          pause: 1.0,
        },
      ],
    },
  ];
}

// End of level definitions. Staged screenshot poses live in shots.js,
// which places Mara and the guards at fixed, readable spots per shot.
