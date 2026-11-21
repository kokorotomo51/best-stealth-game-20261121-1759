# Midnight Archive

[![Make the best stealth game](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/kokorotomo51/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/kokorotomo51/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

An original top-down stealth game that plays offline in a desktop browser.
You are Mara, the night archivist of a quiet old archive. Recover every
seal-key in each of the three wings, slip past guards whose bright vision
cones sweep predictable patrol loops, hide behind crates and in shadow
rugs, and reach the glowing green exit unseen.

[View the bounty on make.fun](https://make.fun/bounty/best-stealth-game-20261121-1759)

## How to play

- **WASD / arrow keys** — move Mara
- **Shift** — sprint (fast, but loud and easier to spot)
- **Hold the mouse button or C** — sneak (slow, harder to spot)
- **E** — take a seal-key when standing close to one
- **R** — restart the wing, **P** — pause, **Enter** — start / continue
- **Mouse click** — press the on-screen buttons

## The stealth rules

- A guard's yellow vision cone fills the suspicion meter when Mara is
  seen inside it with a clear line of sight. Walls and crates block sight.
- Suspicion drains when Mara is hidden; shadow rugs drain it faster.
- At full suspicion the alarm sounds and guards chase Mara's last-known
  spot for a few seconds. Break sight, reach shadow, and they return to
  patrol — a near miss does not have to end the run.
- A guard only catches Mara if it reaches her while the alarm is still up.
- Collect every seal-key to unlock the exit, then step through it.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no libraries. The game is plain
HTML, CSS and ES modules under `game/`, with synthesized WebAudio sounds.
Screenshots: `?shot=start`, `?shot=play` and `?shot=end` (with `&seed=1`
or `&seed=2`) stage deterministic scenes for screenshots.
