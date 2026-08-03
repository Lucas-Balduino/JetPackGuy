const KEY = 'jetpackguy:highscore';

export function getHighScore() {
  const value = localStorage.getItem(KEY);
  if (value === null) return 0;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

export function saveHighScore(points) {
  localStorage.setItem(KEY, String(points));
}
