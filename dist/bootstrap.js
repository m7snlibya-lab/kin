// Gate imports, storage and worker registration, not just the visible interface.
// Pages cannot supply frame-ancestors headers; this is defense in depth, not a
// replacement for those headers on a host that supports them.
if(window.self===window.top)await import('./app.js');
