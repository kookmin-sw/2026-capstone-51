// Tailwind class merger. clsx의 가벼운 대체.
// 사용: cn('p-2', cond && 'bg-red-50', { 'opacity-50': disabled })
export function cn(...args) {
  const out = [];
  for (const a of args) {
    if (!a) continue;
    if (typeof a === 'string') out.push(a);
    else if (Array.isArray(a)) out.push(cn(...a));
    else if (typeof a === 'object') {
      for (const k in a) if (a[k]) out.push(k);
    }
  }
  return out.join(' ');
}
