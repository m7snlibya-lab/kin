import {t} from './i18n.js';

// Decorative, local SVGs: the visible text remains every control's accessible name.
const paths={
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 moon:'<path d="M17 3C10-.5 3 4 3 12s7 12.5 14 9C5 18 5 6 17 3Z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/>',
 people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m3 11v-3a6 6 0 0 0-2-4.5"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h2m6 0h2m-10 3h2"/>',
 timeline:'<path d="M5 3v18m4-16h11M9 12h7m-7 7h11"/><circle cx="5" cy="5" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="19" r="1"/>',
 compare:'<rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="4" width="7" height="16" rx="1"/><path d="M5 8h3m8 0h3M5 12h3m8 0h3"/>',
 printer:'<path d="M7 8V3h10v5M7 17H4V9h16v8h-3"/><rect x="7" y="14" width="10" height="7" rx="1"/><path d="M16 11h1"/>',
 folder:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v2M3 7h17l-3 11H2L3 7Z"/>',
 copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
 backup:'<path d="M4 3h14l3 3v15H3V3h1Z"/><path d="M7 3v6h10V3M7 21v-7h10v7"/>',
 qr:'<path d="M3 3h6v6H3V3Zm12 0h6v6h-6V3ZM3 15h6v6H3v-6Zm12 0h2v2h-2v-2Zm4 0h2v6h-6v-2"/>',
 export:'<path d="M14 3h7v7m0-7L10 14M9 3H3v18h18v-6"/>',
 offline:'<path d="M7 18H6a4 4 0 0 1-1-7.9A7 7 0 0 1 18 8a5 5 0 0 1 0 10h-1"/><path d="m9 16 3 3 5-5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 warning:'<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
 globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
 install:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 8h18M7 5.5h.01M12 11v7m-3-3h6"/>',
 text:'<path d="M4 5h16M12 5v15m-4 0h8"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 previous:'<path d="m15 5-7 7 7 7"/>',
 next:'<path d="m9 5 7 7-7 7"/>',
 edit:'<path d="m15 4 5 5M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6Z"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 filter:'<path d="M4 6h16M7 12h10m-7 6h4"/>',
 chevron:'<path d="m6 9 6 6 6-6"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1-1.5 2m0 3h.01"/>',
 history:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v5l3 2"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-5-5L5 21"/>',
 download:'<path d="M12 3v12m-4-4 4 4 4-4M4 18v3h16v-3"/>'
};
export function icon(name){return `<svg class="ui-icon icon-${name}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||''}</svg>`}
export function labelControl(el,name,key=el.dataset.i18n){
 delete el.dataset.i18n;
 el.innerHTML=icon(name);
 const label=document.createElement('span');label.dataset.i18n=key;label.textContent=t(key);el.append(label);
 el.classList.add('has-icon');
}
