// shots.js — deterministic staged scenes for screenshots. The game reads
// ?shot=start|play|end and ?seed=N from its own URL, freezes the
// simulation, and poses the archivist, the guards and the cones so a
// single still frame shows the whole stealth game at a glance.
export function parseShotParams(search) {
  const params = new URLSearchParams(search);
  const shot = params.get('shot');
  const seed = Number.parseInt(params.get('seed') ?? '1', 10);
  if (!['start', 'play', 'end'].includes(shot)) return null;
  return { shot, seed: Number.isFinite(seed) ? seed : 1 };
}

export function stageShot(game, shot, seed) {
  const { level } = game;
  const crate = level.crates[1] ?? level.crates[0];
  const guardA = game.guards[0];
  const guardB = game.guards[1];

  if (shot === 'start') {
    game.state = 'title';
    game.player.x = level.start.x;
    game.player.y = level.start.y;
    game.player.faceAngle = -Math.PI / 2;
    if (guardA) {
      guardA.x = guardA.waypoints[0].x;
      guardA.y = guardA.waypoints[0].y;
      guardA.angle = Math.PI / 2;
    }
    if (guardB) {
      guardB.x = guardB.waypoints[1].x;
      guardB.y = guardB.waypoints[1].y;
      guardB.angle = -Math.PI / 2;
    }
    game.detection.suspicion = 0;
    return;
  }

  if (shot === 'play') {
    game.state = 'playing';
    // Mara crouched just behind cover, a guard's cone sweeping past.
    game.player.x = crate.x - 26;
    game.player.y = crate.y + crate.h / 2;
    game.player.faceAngle = 0;
    game.sneaking = true;
    if (guardA) {
      const wp = guardA.waypoints[0];
      guardA.x = wp.x;
      guardA.y = wp.y;
      guardA.angle = Math.atan2(game.player.y - wp.y, game.player.x - wp.x) + 0.35;
    }
    if (guardB) {
      const wp = guardB.waypoints[2] ?? guardB.waypoints[0];
      guardB.x = wp.x;
      guardB.y = wp.y;
      guardB.angle = Math.atan2(game.player.y - wp.y, game.player.x - wp.x) - 0.3;
    }
    if (seed === 2) {
      // Mid-alert staged frame: the alarm is up, a guard is chasing.
      game.detection.suspicion = 100;
      game.detection.alarmed = true;
      game.detection.alarmLeft = 3;
      game.detection.graceLeft = 0.5;
      game.detection.timesSpotted = 1;
      if (guardA) {
        guardA.mode = 'chase';
        guardA.lastKnown = { x: game.player.x, y: game.player.y };
        guardA.x = game.player.x + 150;
        guardA.y = game.player.y - 40;
        guardA.angle = Math.atan2(game.player.y - guardA.y, game.player.x - guardA.x);
      }
    } else {
      game.detection.suspicion = 38;
    }
    return;
  }

  // shot === 'end': Mara at the open exit, the wing cleared.
  game.state = 'won';
  game.keysTaken = game.keysTaken.map(() => true);
  game.exitUnlocked = true;
  game.player.x = level.exit.x + level.exit.w / 2;
  game.player.y = level.exit.y + level.exit.h + 30;
  game.player.faceAngle = -Math.PI / 2;
  game.score = 2450;
  game.elapsed = 187;
  if (guardA) guardA.angle = Math.PI;
  if (guardB) guardB.angle = 0;
}
