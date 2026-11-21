// guards.js — guard movement and sight. A guard walks its patrol loop,
// pauses at each waypoint and turns to scan, chases a last-known spot
// while alarmed, then walks back to its loop. Sight is a cone plus a
// line-of-sight test: walls and crates block it, shadow shortens it.
import {
  CONE_HALF_ANGLE,
  CONE_RANGE,
  GUARD_CHASE,
  GUARD_PATROL,
  GUARD_RETURN,
  SNEAK_RANGE,
} from './config.js';

export function makeGuard(def, index) {
  const first = def.waypoints[0];
  const second = def.waypoints[1] ?? first;
  return {
    name: def.name,
    x: first.x,
    y: first.y,
    angle: Math.atan2(second.y - first.y, second.x - first.x),
    waypoint: 1 % def.waypoints.length,
    pauseLeft: 0,
    pause: def.pause ?? 1,
    mode: 'patrol', // patrol | chase | return
    lastKnown: null,
    alarmLeft: 0,
    scanPhase: index * 1.7,
    stepPhase: index * 2.1,
    waypoints: def.waypoints,
  };
}

export function rectsBlockSight(x1, y1, x2, y2, rect) {
  // Segment vs rectangle: true when the segment crosses the rectangle.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rect.x, rect.x + rect.w - x1, y1 - rect.y, rect.y + rect.h - y1];
  for (let i = 0; i < 4; i += 1) {
    if (Math.abs(p[i]) < 1e-9) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > tmax) return false;
        if (t > tmin) tmin = t;
      } else {
        if (t < tmin) return false;
        if (t < tmax) tmax = t;
      }
    }
  }
  return true;
}

export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (const rect of blockers) {
    if (rectsBlockSight(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

export function guardCanSee(guard, px, py, blockers, sneaking, inShadow) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  let range = CONE_RANGE;
  if (sneaking) range = SNEAK_RANGE;
  if (inShadow) range *= 0.62;
  if (dist > range) return { seen: false, dist };
  if (dist < 26) {
    // Point blank: felt, not seen — still counts if sight is not blocked.
    const clear = hasLineOfSight(guard.x, guard.y, px, py, blockers);
    return { seen: clear, dist };
  }
  const toPlayer = Math.atan2(dy, dx);
  let diff = toPlayer - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CONE_HALF_ANGLE) return { seen: false, dist };
  const clear = hasLineOfSight(guard.x, guard.y, px, py, blockers);
  return { seen: clear, dist };
}

function moveToward(guard, tx, ty, speed, dt, blockers) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  // Guards slide along walls: try each axis separately when blocked.
  const blocked = (x, y) => blockers.some((r) => x > r.x - 14 && x < r.x + r.w + 14 && y > r.y - 14 && y < r.y + r.h + 14);
  if (!blocked(nx, guard.y)) guard.x = nx;
  if (!blocked(guard.x, ny)) guard.y = ny;
  guard.stepPhase += dt * (speed / 40);
  return dist - step < 4;
}

export function updateGuard(guard, dt, blockers, time) {
  if (guard.mode === 'chase' && guard.lastKnown) {
    guard.alarmLeft -= dt;
    const arrived = moveToward(guard, guard.lastKnown.x, guard.lastKnown.y, GUARD_CHASE, dt, blockers);
    if (arrived || guard.alarmLeft <= 0) {
      guard.mode = 'return';
      guard.alarmLeft = 0;
    }
    return;
  }
  if (guard.mode === 'return') {
    const target = guard.waypoints[guard.waypoint];
    const arrived = moveToward(guard, target.x, target.y, GUARD_RETURN, dt, blockers);
    if (arrived) {
      guard.mode = 'patrol';
      guard.pauseLeft = guard.pause;
    }
    return;
  }
  // Patrol: walk the loop, pause and scan at each waypoint.
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.angle += Math.sin(time * 1.4 + guard.scanPhase) * dt * 0.9;
    return;
  }
  const target = guard.waypoints[guard.waypoint];
  const arrived = moveToward(guard, target.x, target.y, GUARD_PATROL, dt, blockers);
  if (arrived) {
    guard.waypoint = (guard.waypoint + 1) % guard.waypoints.length;
    guard.pauseLeft = guard.pause;
  }
}

export function raiseAlarm(guard, px, py) {
  guard.mode = 'chase';
  guard.lastKnown = { x: px, y: py };
  guard.alarmLeft = 4;
}
