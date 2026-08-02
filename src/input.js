export function setupInput({ onJump, onTogglePause } = {}) {
  function keyHandler(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (onJump) onJump(e);
    } else if (e.code === 'KeyP') {
      if (onTogglePause) onTogglePause(e);
    }
  }

  document.addEventListener('keydown', keyHandler);

  const canvas = document.getElementById('canvas');
  function canvasClickHandler(e) {
    if (onJump) onJump(e);
  }
  function canvasTouchHandler(e) {
    e.preventDefault();
    if (onJump) onJump(e);
  }
  if (canvas) {
    canvas.addEventListener('click', canvasClickHandler);
    canvas.addEventListener('touchstart', canvasTouchHandler, { passive: false });
  }

  return function teardown() {
    document.removeEventListener('keydown', keyHandler);
    if (canvas) {
      canvas.removeEventListener('click', canvasClickHandler);
      canvas.removeEventListener('touchstart', canvasTouchHandler);
    }
  };
}
