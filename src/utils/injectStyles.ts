let injected = false;

export function injectFauiStyles(): void {
  if (injected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.id = 'faui-styles';
  style.textContent = `
@layer faui {
  .faui-box { display: flex; flex-direction: column; }
  .faui-box-h { display: flex; flex-direction: row; }
  .faui-repeater { display: flex; flex-direction: column; }
  .faui-repeater-h { display: flex; flex-direction: row; }
  .faui-trigger-wrap { display: inline-block; }
  .faui-motion { width: 100%; }
}`;
  document.head.prepend(style);
  injected = true;
}
