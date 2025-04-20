export async function mountSvelte({ id, component, attachTo }) {
  const waitForElement = (selector, timeout = 3000) =>
    new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) return resolve(element);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(`[mountSvelte] Элемент не найден за ${timeout} мс: ${selector}`);
      }, timeout);
    });

  try {
    const target = await waitForElement(attachTo);
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = id;
    target.appendChild(container);
    new component({ target: container });
    console.log(`[mountSvelte] ✅ Компонент смонтирован в ${attachTo}`);
  } catch (err) {
    console.warn(err);
  }
}
