export const mod = (value, base) => ((value % base) + base) % base;
export const normalizeTime = value => mod(Math.round(value), 1440);
export function clockAngles(minutes) {
  return {hour: mod(minutes, 720) / 2, minute: mod(minutes, 60) * 6};
}
export function angleDelta(from, to) {
  return mod(to - from + 180, 360) - 180;
}
export function dragMinutes(start, deltaDegrees, hand, step) {
  const minutes = deltaDegrees * (hand === 'hour' ? 2 : 1 / 6);
  return normalizeTime(Math.round((start + minutes) / step) * step);
}
export function matchesTime(actual, target, periodRequired) {
  return mod(actual, periodRequired ? 1440 : 720) === mod(target, periodRequired ? 1440 : 720);
}
export function timeText(total, format = '12') {
  const time = normalizeTime(total), hour = Math.floor(time / 60), minute = time % 60;
  const prefix = format === 'period' ? (hour < 12 ? '午前' : '午後') : '';
  const h = format === '24' ? hour : format === 'period' ? hour % 12 : (hour % 12 || 12);
  return `${prefix}${h}時${minute ? `${minute}分` : ''}`;
}
export function durationText(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${h ? `${h}時間` : ''}${m === 30 && h ? '半' : m ? `${m}分` : ''}後`;
}
export function orderHint(order, actual) {
  const targetHour = Math.floor(mod(order.target, 720) / 60) || 12;
  const targetMinute = mod(order.target, 60);
  if (order.period && mod(actual, 720) === mod(order.target, 720)) return `針はぴったり！ あとは「${order.target < 720 ? '午前' : '午後'}」を選ぼう。`;
  if (order.duration) return `受付は${timeText(order.base, 'period')}。${durationText(order.duration).replace('後','')}だけ針を進めてみよう。`;
  if (targetMinute === 0) return `長い針は12、短い針は${targetHour}へ。ゆっくりで大丈夫じゃ。`;
  const location = targetMinute % 5 === 0 ? `${targetMinute / 5}` : `${Math.floor(targetMinute / 5) || 12}から${targetMinute % 5}目盛り先`;
  return `長い針は${location}へ。短い針は${targetHour}と${targetHour === 12 ? 1 : targetHour + 1}の間じゃよ。`;
}
