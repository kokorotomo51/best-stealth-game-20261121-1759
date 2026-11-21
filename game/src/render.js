// render.js — every pixel of Midnight Archive, drawn on one canvas with
// no images: floor, walls, crates, shadow rugs, vision cones, the
// archivist, the guards, keys, the exit, the HUD and the menu overlays.
// Draw order matters: cones go under walls so a wall visibly cuts a cone.
import {
  CONE_HALF_ANGLE,
  CONE_RANGE,
  HUD_H,
  PALETTE,
  VIEW_H,
  VIEW_W,
} from './config.js';
import { detectionLabel } from './detection.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, level, time) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW_W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, HUD_H);
    ctx.lineTo(x, VIEW_H);
    ctx.stroke();
  }
  for (let y = HUD_H; y <= VIEW_H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }
  // A worn carpet runner down the middle of each wing.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(40, HUD_H + 20, VIEW_W - 80, 54);
  ctx.strokeStyle = 'rgba(240,194,94,0.35)';
  ctx.strokeRect(40, HUD_H + 20, VIEW_W - 80, 54);
  // Shadow rugs: dark safe zones, labelled so they read at a glance.
  for (const zone of level.shadows) {
    ctx.fillStyle = PALETTE.shadowZone;
    roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,160,255,0.4)';
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(170,190,230,0.85)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW', zone.x + zone.w / 2, zone.y + zone.h / 2 + 4);
  }
}

function drawPatrolPaths(ctx, level) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,213,79,0.30)';
  ctx.lineWidth = 3;
  ctx.setLineDash([2, 10]);
  ctx.lineCap = 'round';
  for (const guard of level.guards) {
    const pts = guard.waypoints;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function rayHitDistance(ox, oy, dx, dy, rect) {
  // Slab test: distance along the ray to the rectangle, or Infinity.
  let tmin = 0;
  let tmax = Infinity;
  const axes = [
    { origin: ox, dir: dx, min: rect.x, max: rect.x + rect.w },
    { origin: oy, dir: dy, min: rect.y, max: rect.y + rect.h },
  ];
  for (const axis of axes) {
    if (Math.abs(axis.dir) < 1e-9) {
      if (axis.origin < axis.min || axis.origin > axis.max) return Infinity;
    } else {
      let t1 = (axis.min - axis.origin) / axis.dir;
      let t2 = (axis.max - axis.origin) / axis.dir;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return Infinity;
    }
  }
  return tmin > 0 ? tmin : Infinity;
}

function drawVisionCone(ctx, guard, alarmed, suspicious, blockers) {
  const range = CONE_RANGE;
  // Raycast the cone so walls and crates visibly cut it: one ray per
  // few degrees, each stopping at the first blocker it meets.
  const rays = 26;
  const points = [];
  for (let i = 0; i <= rays; i += 1) {
    const a = guard.angle - CONE_HALF_ANGLE + ((CONE_HALF_ANGLE * 2 * i) / rays);
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let dist = range;
    for (const rect of blockers) {
      const hit = rayHitDistance(guard.x, guard.y, dx, dy, rect);
      if (hit < dist) dist = hit;
    }
    points.push({ x: guard.x + dx * dist, y: guard.y + dy * dist });
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (const point of points) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.fillStyle = alarmed ? PALETTE.coneAlert : suspicious ? PALETTE.coneSuspicious : PALETTE.cone;
  ctx.fill();
  ctx.strokeStyle = alarmed ? PALETTE.coneAlertEdge : PALETTE.coneEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawWallsAndCrates(ctx, level) {
  for (const wall of level.walls) {
    ctx.fillStyle = PALETTE.wallEdge;
    ctx.fillRect(wall.x, wall.y + 4, wall.w, wall.h);
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 5);
  }
  for (const crate of level.crates) {
    ctx.fillStyle = PALETTE.crateDark;
    ctx.fillRect(crate.x + 3, crate.y + 4, crate.w, crate.h);
    ctx.fillStyle = PALETTE.crate;
    roundRect(ctx, crate.x, crate.y, crate.w, crate.h, 6);
    ctx.fill();
    ctx.strokeStyle = PALETTE.crateEdge;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(80,50,10,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(crate.x + 6, crate.y + 6);
    ctx.lineTo(crate.x + crate.w - 6, crate.y + crate.h - 6);
    ctx.moveTo(crate.x + crate.w - 6, crate.y + 6);
    ctx.lineTo(crate.x + 6, crate.y + crate.h - 6);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COVER', crate.x + crate.w / 2, crate.y + crate.h / 2 + 4);
  }
}

function drawExit(ctx, level, time, unlocked) {
  const e = level.exit;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.save();
  ctx.shadowColor = unlocked ? '#39ff7a' : '#888888';
  ctx.shadowBlur = unlocked ? 18 + pulse * 14 : 6;
  ctx.fillStyle = unlocked ? PALETTE.exit : '#3f6b4d';
  roundRect(ctx, e.x, e.y, e.w, e.h, 8);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = unlocked ? '#d6ffe2' : '#9fb8a8';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#06230f';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + 34);
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(unlocked ? 'OPEN' : 'LOCKED', e.x + e.w / 2, e.y + 54);
  // Arrow pointing at the door when it is open.
  if (unlocked) {
    ctx.fillStyle = '#d6ffe2';
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2 - 10, e.y - 14);
    ctx.lineTo(e.x + e.w / 2 + 10, e.y - 14);
    ctx.lineTo(e.x + e.w / 2, e.y - 2);
    ctx.closePath();
    ctx.fill();
  }
}

function drawKeys(ctx, level, taken, time) {
  level.keys.forEach((key, i) => {
    if (taken[i]) return;
    const bob = Math.sin(time * 2.4 + i * 2) * 3;
    const y = key.y + bob;
    ctx.save();
    ctx.shadowColor = PALETTE.key;
    ctx.shadowBlur = 16;
    ctx.fillStyle = PALETTE.key;
    ctx.beginPath();
    ctx.moveTo(key.x, y - 14);
    ctx.lineTo(key.x + 11, y);
    ctx.lineTo(key.x, y + 14);
    ctx.lineTo(key.x - 11, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#5a3d00';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◆', key.x, y + 5);
    ctx.fillStyle = '#ffe082';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('SEAL-KEY', key.x, y - 22);
  });
}

function drawGuard(ctx, guard, alarmed, time) {
  ctx.save();
  // Facing wedge so the guard's look direction reads instantly.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, 26, guard.angle - 0.4, guard.angle + 0.4);
  ctx.closePath();
  ctx.fill();
  const bob = Math.sin(guard.stepPhase) * 1.5;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = PALETTE.guardDark;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + 3 + bob * 0.3, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob * 0.3, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Cap with a gold band.
  ctx.fillStyle = PALETTE.guardHat;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y - 4 + bob * 0.3, 12, Math.PI, Math.PI * 2);
  ctx.fill();
  // Eyes looking along the facing angle.
  const ex = Math.cos(guard.angle) * 6;
  const ey = Math.sin(guard.angle) * 6;
  ctx.fillStyle = '#1a0505';
  ctx.beginPath();
  ctx.arc(guard.x + ex - 4, guard.y + ey - 2 + bob * 0.3, 2.6, 0, Math.PI * 2);
  ctx.arc(guard.x + ex + 4, guard.y + ey - 2 + bob * 0.3, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 3;
  ctx.strokeText(guard.name.toUpperCase(), guard.x, guard.y - 28);
  ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - 28);
  if (alarmed) {
    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 26px sans-serif';
    ctx.strokeText('!', guard.x, guard.y - 44);
    ctx.fillText('!', guard.x, guard.y - 44);
  }
}

function drawPlayer(ctx, player, sneaking, time) {
  const r = sneaking ? 13 : 16;
  ctx.save();
  ctx.shadowColor = 'rgba(46,230,168,0.7)';
  ctx.shadowBlur = sneaking ? 6 : 14;
  ctx.fillStyle = PALETTE.playerDark;
  ctx.beginPath();
  ctx.arc(player.x, player.y + 3, r + 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hood point + face, facing the last move direction.
  const a = player.faceAngle ?? -Math.PI / 2;
  ctx.fillStyle = '#062b1e';
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(a) * (r + 4), player.y + Math.sin(a) * (r + 4));
  ctx.lineTo(player.x + Math.cos(a + 2.5) * r * 0.7, player.y + Math.sin(a + 2.5) * r * 0.7);
  ctx.lineTo(player.x + Math.cos(a - 2.5) * r * 0.7, player.y + Math.sin(a - 2.5) * r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(a) * 5, player.y + Math.sin(a) * 5, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 3;
  ctx.strokeText('MARA', player.x, player.y - r - 12);
  ctx.fillText('MARA', player.x, player.y - r - 12);
  if (sneaking) {
    ctx.fillStyle = '#b2ffdf';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('SNEAKING', player.x, player.y + r + 16);
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#10151f';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#2a3548';
  ctx.fillRect(0, HUD_H - 3, VIEW_W, 3);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(game.level.name, 14, 26);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px sans-serif';
  ctx.fillText(game.level.hint, 14, 47);
  // Keys collected, top right; time and score beneath them.
  const total = game.level.keys.length;
  const got = game.keysTaken.filter(Boolean).length;
  ctx.fillStyle = PALETTE.key;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`◆ ${got}/${total} SEAL-KEYS`, 946, 28);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`TIME ${Math.floor(game.elapsed)}s  •  SCORE ${game.score}`, 946, 50);
  // Suspicion meter.
  const det = game.detection;
  const mx = 500;
  const mw = 220;
  ctx.fillStyle = '#26303f';
  roundRect(ctx, mx, 38, mw, 16, 8);
  ctx.fill();
  const frac = det.suspicion / 100;
  ctx.fillStyle = det.alarmed ? PALETTE.danger : frac >= 0.7 ? '#ff9800' : PALETTE.calm;
  if (frac > 0) {
    roundRect(ctx, mx, 38, mw * frac, 16, 8);
    ctx.fill();
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  roundRect(ctx, mx, 38, mw, 16, 8);
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(detectionLabel(det), mx, 34);
  // Controls strip along the bottom edge.
  ctx.fillStyle = 'rgba(16,21,31,0.85)';
  ctx.fillRect(0, VIEW_H - 22, VIEW_W, 22);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'WASD / ARROWS move  •  SHIFT sprint (loud)  •  HOLD MOUSE or C sneak  •  E take key  •  R restart  •  CLICK buttons',
    VIEW_W / 2,
    VIEW_H - 7,
  );
}

function drawPanel(ctx, title, lines, buttonText, buttonRect) {
  ctx.fillStyle = 'rgba(6,10,18,0.78)';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  ctx.fillStyle = '#141c2b';
  roundRect(ctx, 230, 150, 500, 330, 16);
  ctx.fill();
  ctx.strokeStyle = '#f0c25e';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(title, VIEW_W / 2, 215);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = PALETTE.muted;
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 255 + i * 26);
  });
  if (buttonText && buttonRect) {
    ctx.fillStyle = '#2ee6a8';
    roundRect(ctx, buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h, 10);
    ctx.fill();
    ctx.fillStyle = '#062b1e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(buttonText, buttonRect.x + buttonRect.w / 2, buttonRect.y + 33);
  }
}

export function renderGame(ctx, game, time) {
  const { level } = game;
  drawFloor(ctx, level, time);
  drawPatrolPaths(ctx, level);
  const suspicious = game.detection.suspicion >= 30;
  const blockers = [...level.walls, ...level.crates];
  for (const guard of game.guards) {
    drawVisionCone(ctx, guard, game.detection.alarmed, suspicious, blockers);
  }
  drawWallsAndCrates(ctx, level);
  drawExit(ctx, level, time, game.exitUnlocked);
  drawKeys(ctx, level, game.keysTaken, time);
  for (const guard of game.guards) drawGuard(ctx, guard, game.detection.alarmed, time);
  drawPlayer(ctx, game.player, game.sneaking, time);
  drawHud(ctx, game);
  if (game.state === 'title') {
    drawPanel(
      ctx,
      'MIDNIGHT ARCHIVE',
      [
        'Mara, night archivist. Recover every seal-key,',
        'slip past the guards, and reach the glowing EXIT unseen.',
        '',
        'Vision cones are bright yellow. Crates block sight.',
        'Shadow rugs drain suspicion fast. Sprinting is loud.',
      ],
      '▶  START SNEAKING',
      game.buttons.start,
    );
  } else if (game.state === 'caught') {
    drawPanel(
      ctx,
      'CAUGHT!',
      [
        'A guard caught Mara in the open.',
        `Wing: ${level.name}   •   Time: ${Math.floor(game.elapsed)}s`,
        'Hide in shadow, break line of sight, wait for the cone to turn.',
      ],
      '↻  TRY AGAIN  (R)',
      game.buttons.restart,
    );
  } else if (game.state === 'levelClear') {
    drawPanel(
      ctx,
      'WING CLEARED!',
      [
        `Mara slipped out of ${level.name}.`,
        `Score so far: ${game.score}   •   Times spotted: ${game.detection.timesSpotted}`,
        'The next wing has more guards and tighter patrols.',
      ],
      '▶  NEXT WING',
      game.buttons.next,
    );
  } else if (game.state === 'won') {
    drawPanel(
      ctx,
      'ALL WINGS CLEARED!',
      [
        'Mara recovered every seal-key and vanished before dawn.',
        `Final score: ${game.score}   •   Time: ${Math.floor(game.elapsed)}s`,
        `Times spotted: ${game.detection.timesSpotted}   •   Recoveries: ${game.detection.recovered}`,
      ],
      '↻  PLAY AGAIN  (R)',
      game.buttons.restart,
    );
  } else if (game.state === 'paused') {
    drawPanel(ctx, 'PAUSED', ['Press P or click to keep sneaking.'], '▶  RESUME', game.buttons.start);
  }
}
