// Scene-relative choreography in metres and seconds. The route being revealed
// never changes the train's clock or travelled distance.
export const METRO_SHOT = Object.freeze({
  closeBegin: .34,
  closeEnd: .64,
  departure: .68,
  speed: 18,
  accelerationSeconds: 1.1,
  carSpacing: 19.3,
  headAtPlatform: 70,
});

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function metroMotionAt(progress, duration = 10, routeLength = Infinity) {
  const seconds = Math.max(.01, Number.isFinite(duration) ? duration : 10);
  const elapsed = Math.max(0, (clamp(progress, 0, 1) - METRO_SHOT.departure) * seconds);
  const acceleration = METRO_SHOT.accelerationSeconds;
  const u = clamp(elapsed / acceleration, 0, 1);
  // Integral of smoothstep velocity: zero acceleration at departure and at
  // cruise, with no ping-pong/modulo discontinuity or inherited frame state.
  const distance = METRO_SHOT.speed * (elapsed < acceleration
    ? acceleration * (u ** 3 - .5 * u ** 4)
    : elapsed - acceleration / 2);
  const headStart = Math.min(METRO_SHOT.headAtPlatform, Math.max(0, routeLength - 10));
  const head = Math.min(headStart + distance, Math.max(headStart, routeLength - 10));
  return {
    head,
    center: head - METRO_SHOT.carSpacing * 1.5,
    distance: head - headStart,
    speed: head >= routeLength - 10 ? 0 : METRO_SHOT.speed * u * u * (3 - 2 * u),
    moving: elapsed > 0,
  };
}
