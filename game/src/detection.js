// detection.js — the suspicion meter. Being seen fills it; hiding drains
// it. At full it triggers a short chase. Breaking sight and reaching
// shadow or cover lets you recover instead of being caught outright,
// so a near miss raises the alarm without ending the run.
import {
  ALARM_SECONDS,
  DRAIN_RATE,
  GRACE_SECONDS,
  SHADOW_DRAIN,
  SPOT_RATE,
} from './config.js';
import { guardCanSee, raiseAlarm } from './guards.js';

export function makeDetection() {
  return {
    suspicion: 0,
    alarmed: false,
    alarmLeft: 0,
    graceLeft: 0,
    seenNow: false,
    anySeen: false,
    timesSpotted: 0,
    recovered: 0,
  };
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function playerInShadow(player, level) {
  return level.shadows.some((zone) => pointInRect(player.x, player.y, zone));
}

export function updateDetection(det, guards, player, level, dt, sneaking) {
  const blockers = [...level.walls, ...level.crates];
  const inShadow = playerInShadow(player, level);
  det.seenNow = false;
  det.anySeen = false;
  let strongest = 0;
  for (const guard of guards) {
    const sight = guardCanSee(guard, player.x, player.y, blockers, sneaking, inShadow);
    if (sight.seen) {
      det.seenNow = true;
      // Closer + moving fast = fills faster; sneaking + shadow = slower.
      const closeness = 1 - Math.min(1, sight.dist / 190);
      let rate = SPOT_RATE * (0.35 + closeness);
      if (sneaking) rate *= 0.55;
      if (inShadow) rate *= 0.5;
      if (player.movingFast) rate *= 1.35;
      strongest = Math.max(strongest, rate);
    }
  }
  if (strongest > 0) {
    const before = det.suspicion;
    det.suspicion = Math.min(100, det.suspicion + strongest * dt);
    det.anySeen = true;
    if (before < 100 && det.suspicion >= 100 && !det.alarmed) {
      det.alarmed = true;
      det.alarmLeft = ALARM_SECONDS;
      det.graceLeft = GRACE_SECONDS;
      det.timesSpotted += 1;
      for (const guard of guards) raiseAlarm(guard, player.x, player.y);
    }
  } else {
    const drain = inShadow ? SHADOW_DRAIN : DRAIN_RATE;
    const before = det.suspicion;
    det.suspicion = Math.max(0, det.suspicion - drain * dt);
    if (det.alarmed && det.suspicion <= 0) {
      det.alarmed = false;
      det.recovered += 1;
    }
  }
  if (det.alarmed) {
    det.alarmLeft -= dt;
    if (det.graceLeft > 0) det.graceLeft -= dt;
    if (det.alarmLeft <= 0 && det.suspicion <= 0) det.alarmed = false;
  }
  return det;
}

export function detectionLabel(det) {
  if (det.alarmed) return 'ALARM — HIDE!';
  if (det.suspicion >= 70) return 'SPOTTED — BREAK SIGHT!';
  if (det.suspicion >= 30) return 'SUSPICIOUS…';
  if (det.suspicion > 0) return 'GLIMPSED';
  return 'UNSEEN';
}
