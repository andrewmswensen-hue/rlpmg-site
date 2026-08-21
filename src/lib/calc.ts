/** Client-side helper shared by the calculator pages. Kept tiny on purpose. */
export const CALC_RUNTIME = `
function calcInit(id, compute) {
  const root = document.querySelector('[data-calc="' + id + '"]');
  if (!root) return;
  const form = root.querySelector('[data-calc-form]');
  const money = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
  const money2 = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function run() {
    const v = {};
    for (const el of form.elements) if (el.name) v[el.name] = el.type === 'number' ? parseFloat(el.value) || 0 : el.value;
    const out = compute(v, { money: money, money2: money2 });
    for (const k in out) {
      const node = root.querySelector('[data-calc-out="' + k + '"]');
      if (node) node.textContent = out[k];
    }
  }
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  run();
}
`;
