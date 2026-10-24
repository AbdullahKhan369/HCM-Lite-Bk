const TZ = 'Asia/Karachi';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(v) {
  if (!v) return '-';
  const s = String(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  const d = new Date(s);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function fmtTime(v) {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}

export function fmtDateTime(v) {
  if (!v) return '-';
  return fmtDate(v) + ' ' + fmtTime(v);
}

export function fmtMoney(n) {
  if (n === null || n === undefined || n === '' || isNaN(Number(n))) return '-';
  return 'PKR ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// "YYYY-MM-DD" for today in business timezone
export function todayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function monthStr(dateStr) {
  return (dateStr || todayStr()).slice(0, 7);
}

export function monthBounds(month) {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Builds an ISO string from a day + "HH:MM" in business timezone (Asia/Karachi, UTC+5, no DST)
export function toIsoKarachi(day, time) {
  if (!day || !time) return null;
  return `${day}T${time}:00+05:00`;
}
