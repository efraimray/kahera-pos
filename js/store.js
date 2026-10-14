/**
 * Kahera POS — store.js
 * Tiny persistence layer over localStorage. Every read and write is wrapped in
 * try/catch: private windows, full quotas and blocked storage fall back to an
 * in-memory copy so the register keeps working for the session.
 */
(function (root) {
  'use strict';
  var PREFIX = 'kahera:v1:';
  var mem = {};

  function get(key, fallback) {
    if (Object.prototype.hasOwnProperty.call(mem, key)) return mem[key];
    try {
      var raw = root.localStorage.getItem(PREFIX + key);
      if (raw !== null) return (mem[key] = JSON.parse(raw));
    } catch (e) { /* storage blocked or corrupt: use fallback */ }
    return fallback;
  }

  function set(key, value) {
    mem[key] = value;
    try { root.localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }

  function remove(key) {
    delete mem[key];
    try { root.localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
  }

  root.KaheraStore = { get: get, set: set, remove: remove };
})(typeof self !== 'undefined' ? self : this);
