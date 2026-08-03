export const States = Object.freeze({
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
});

export function createStateMachine() {
  let current = States.READY;
  const listeners = new Set();

  function is(state) {
    return current === state;
  }

  function get() {
    return current;
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function notify(prev) {
    for (const fn of listeners) {
      try {
        fn(prev, current);
      } catch (e) {
        console.error('erro no listener de estado', e);
      }
    }
  }

  const valid = {
    [States.READY]: [States.PLAYING],
    [States.PLAYING]: [States.PAUSED, States.GAME_OVER],
    [States.PAUSED]: [States.PLAYING],
    [States.GAME_OVER]: [States.READY],
  };

  function transition(to) {
    if (current === to) return;
    const allowed = valid[current] || [];
    if (allowed.includes(to)) {
      const prev = current;
      current = to;
      notify(prev);
    } else {
      console.warn(`Transição inválida: ${current} -> ${to}`);
    }
  }

  // força o estado (útil para reset)
  function force(state) {
    if (current !== state) {
      const prev = current;
      current = state;
      notify(prev);
    }
  }

  return Object.freeze({ is, get, transition, onChange, force });
}
