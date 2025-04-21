import { observeUrlChanges } from './observer.js';
import { renderUIForRecordPage } from '../components/renderRecordPageUI.js';

const routes = [
  { match: /\/medical_records\/\d+\/\d+$/, render: renderUIForRecordPage },
  { match: /\/entries\/\d+$/, render: renderUIForRecordPage }
];

let currentMatch = null;

export function startRouter() {
  console.log('📡 Router запущен');
  observeUrlChanges(() => {
    const path = window.location.pathname;
    const match = routes.find(r => r.match.test(path));
    console.log('📌 Найден роут:', match?.match);
    if (match !== currentMatch) {
      currentMatch = match;
      match?.render();
    }
  });
}