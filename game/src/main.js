// main.js — Midnight Archive: the game loop and the rules that join the
// modules. Loads a wing, moves Mara, updates guards and detection,
// handles keys, the exit, being caught, and the menu states, and draws
// one frame per animation tick. Shot mode freezes the simulation for
// deterministic screenshots.
import { makeAudio } from './audio.js';
import {
  HUD_H,
  PLAYER_R,
  PLAYER_SNEAK,
  PLAYER_SPRINT,
  PLAYER_WALK,
  VIEW_H,
  VIEW_W,
} from './config.js';
import { makeDetection, playerInShadow, updateDetection } from './detection.js';
import { makeGuard, updateGuard } from './guards.js';
import { makeInput } from './input.js';
import { buildLevels } from './levels.js';
import { renderGame } from './render.js';
import { parseShotParams, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const levels = buildLevels();
const input = makeInput(canvas);
const audio = makeAudio();

const BUTTON = { x: 350, y: 398, w: 260, h: 52 };

function makeGame(levelIndex) {
  const level = levels[levelIndex];
  return {
    levelIndex,
    level,
    player: { x: level.start.x, y: level.start.y, faceAngle: -Math.PI / 2, movingFast: false },
    guards: level.guards.map((def, i) => makeGuard(def, i)),
    keysTaken: level.keys.map(() => false),
    detection: makeDetection(),
    state: 'title',
    elapsed: 0,
    score: 0,
    sneaking: false,
    exitUnlocked: false,
    nearKey: -1,
    buttons: { start: BUTTON, restart: BUTTON, next: BUTTON },
  };
}

let game = makeGame(0);
let frozen = false;
let frozenTime = 1.2;

function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - cx, y - cy) < r;
}

function movePlayer(dt) {
  const vec = input.moveVector();
  const sneaking = input.isSneaking();
  const sprinting = input.isSprinting() && !sneaking;
  game.sneaking = sneaking;
  const speed = sneaking ? PLAYER_SNEAK : sprinting ? PLAYER_SPRINT : PLAYER_WALK;
  const moving = vec.x !== 0 || vec.y !== 0;
  game.player.movingFast = moving && sprinting;
  if (!moving) return;
  game.player.faceAngle = Math.atan2(vec.y, vec.x);
  const solids = [...game.level.walls, ...game.level.crates];
  const stepX = vec.x * speed * dt;
  const stepY = vec.y * speed * dt;
  const tryMove = (nx, ny) => {
    const hit = solids.some((rect) => circleHitsRect(nx, ny, PLAYER_R, rect));
    const inBounds = nx > PLAYER_R && nx < VIEW_W - PLAYER_R && ny > HUD_H + PLAYER_R && ny < VIEW_H - PLAYER_R;
    return !hit && inBounds;
  };
  if (tryMove(game.player.x + stepX, game.player.y)) game.player.x += stepX;
  if (tryMove(game.player.x, game.player.y + stepY)) game.player.y += stepY;
  if (Math.random() < dt * 2.2) audio.playerStep(sprinting);
}

function nearestGuardDistance() {
  let best = Infinity;
  for (const guard of game.guards) {
    best = Math.min(best, Math.hypot(guard.x - game.player.x, guard.y - game.player.y));
  }
  return best;
}

function updatePlaying(dt, time) {
  game.elapsed += dt;
  movePlayer(dt);
  const wasAlarmed = game.detection.alarmed;
  updateDetection(game.detection, game.guards, game.player, game.level, dt, game.sneaking);
  if (game.detection.alarmed && !wasAlarmed) audio.alertSting();
  for (const guard of game.guards) updateGuard(guard, dt, game.level.walls, time);
  audio.tickGuardSteps(dt, game.guards, game.player);

  // Pick up a seal-key with E when standing close to one.
  game.nearKey = -1;
  game.level.keys.forEach((key, i) => {
    if (!game.keysTaken[i] && Math.hypot(key.x - game.player.x, key.y - game.player.y) < 42) {
      game.nearKey = i;
    }
  });
  if (game.nearKey >= 0 && input.wasPressed('e')) {
    game.keysTaken[game.nearKey] = true;
    game.score += 250;
    audio.pickup();
    if (game.keysTaken.every(Boolean)) {
      game.exitUnlocked = true;
      audio.unlock();
    }
    game.nearKey = -1;
  }

  // Caught: an alarmed guard reaches Mara after the grace second.
  if (game.detection.alarmed && game.detection.graceLeft <= 0 && nearestGuardDistance() < 32) {
    game.state = 'caught';
    audio.lose();
    return;
  }

  // Exit: only open with every seal-key, then the wing is cleared.
  if (game.exitUnlocked) {
    const e = game.level.exit;
    if (game.player.x > e.x - 6 && game.player.x < e.x + e.w + 6 && game.player.y > e.y - 6 && game.player.y < e.y + e.h + 6) {
      game.score += 500 + Math.max(0, 300 - Math.floor(game.elapsed));
      if (game.levelIndex + 1 >= levels.length) {
        game.state = 'won';
        audio.win();
      } else {
        game.state = 'levelClear';
        audio.win();
      }
    }
  }
}

function startLevel(index, state) {
  const keptScore = state === 'next' ? game.score : 0;
  const keptElapsed = state === 'next' ? game.elapsed : 0;
  game = makeGame(index);
  game.score = keptScore;
  game.elapsed = keptElapsed;
  game.state = state === 'next' ? 'playing' : 'playing';
  if (state === 'fresh') game.state = 'playing';
}

function handleMenus() {
  const click = input.clicked;
  if (input.wasPressed('r')) {
    if (game.state === 'won') {
      game = makeGame(0);
      game.state = 'playing';
    } else {
      startLevel(game.levelIndex, 'retry');
    }
    return;
  }
  if (input.wasPressed('p') && (game.state === 'playing' || game.state === 'paused')) {
    game.state = game.state === 'playing' ? 'paused' : 'playing';
    return;
  }
  if (input.wasPressed('Enter') || input.wasPressed(' ')) {
    audio.ensure();
    if (game.state === 'title') game.state = 'playing';
    else if (game.state === 'levelClear') startLevel(game.levelIndex + 1, 'next');
    else if (game.state === 'caught') startLevel(game.levelIndex, 'retry');
    else if (game.state === 'won') {
      game = makeGame(0);
      game.state = 'playing';
    }
    return;
  }
  if (click) {
    audio.ensure();
    if (game.state === 'title' && input.pointIn(BUTTON, click)) game.state = 'playing';
    else if (game.state === 'paused' && input.pointIn(BUTTON, click)) game.state = 'playing';
    else if (game.state === 'caught' && input.pointIn(BUTTON, click)) startLevel(game.levelIndex, 'retry');
    else if (game.state === 'levelClear' && input.pointIn(BUTTON, click)) startLevel(game.levelIndex + 1, 'next');
    else if (game.state === 'won' && input.pointIn(BUTTON, click)) {
      game = makeGame(0);
      game.state = 'playing';
    }
  }
  if (input.mouseDown || input.wasPressed('e')) audio.ensure();
}

// Screenshot staging: freeze the world and pose one readable frame.
const shot = parseShotParams(window.location.search);
if (shot) {
  if (shot.shot === 'end') {
    game = makeGame(levels.length - 1);
  }
  stageShot(game, shot.shot, shot.seed);
  frozen = true;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const time = frozen ? frozenTime : now / 1000;
  if (!frozen) {
    handleMenus();
    if (game.state === 'playing') updatePlaying(dt, time);
    // Keep the exit state honest if keys were taken before a shot pose.
    game.exitUnlocked = game.exitUnlocked || game.keysTaken.every(Boolean);
  }
  // Shadow status feeds the cone math through detection; expose it for
  // the prompt line drawn under the player when a key is in reach.
  game.inShadow = playerInShadow(game.player, game.level);
  renderGame(ctx, game, time);
  if (game.nearKey >= 0 && game.state === 'playing') {
    ctx.fillStyle = '#ffe082';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeText('Press E — take seal-key', game.player.x, game.player.y - 34);
    ctx.fillText('Press E — take seal-key', game.player.x, game.player.y - 34);
  }
  input.endFrame();
  requestAnimationFrame(frame);
}

canvas.focus();
renderGame(ctx, game, frozenTime);
requestAnimationFrame(frame);
