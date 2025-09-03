import { useRef as l, useState as d, useEffect as u, useCallback as p, useMemo as h } from "react";
class S {
  constructor(t, e = {}) {
    var s;
    this.listeners = /* @__PURE__ */ new Set(), this.isTransitioning = !1, this.delayedTransitions = /* @__PURE__ */ new Map(), this.timers = /* @__PURE__ */ new Map(), this.send = (i) => {
      if (this.isTransitioning) {
        console.warn("State machine is currently transitioning. Event ignored:", i);
        return;
      }
      const r = this.normalizeEvent(i);
      this.transition(r);
    }, this.config = t, this.options = e, this.currentState = t.initial, this.context = t.context || {}, (s = e.history) != null && s.enabled && this.initializeHistory(), e.persistence && this.loadPersistedState(), e.devTools && typeof window < "u" && this.setupDevTools();
  }
  /**
   * Get current state snapshot
   */
  getSnapshot() {
    const t = this.config.states[this.currentState];
    return {
      value: this.currentState,
      context: this.context,
      changed: !1,
      event: { type: "INIT" },
      meta: (t == null ? void 0 : t.meta) || {}
    };
  }
  /**
   * Subscribe to state changes
   */
  subscribe(t) {
    return this.listeners.add(t), t(this.getSnapshot()), () => {
      this.listeners.delete(t);
    };
  }
  /**
   * Check if the machine can handle a specific event
   */
  can(t) {
    var e;
    const s = this.config.states[this.currentState], i = (e = s == null ? void 0 : s.on) == null ? void 0 : e[t];
    if (!i) return !1;
    const r = this.normalizeEvent(t);
    return this.canTransition(i, r);
  }
  /**
   * Get all possible events from current state
   */
  getNextEvents() {
    const t = this.config.states[this.currentState];
    return t != null && t.on ? Object.keys(t.on).filter(
      (e) => this.can(e)
    ) : [];
  }
  /**
   * Clone the machine with new context
   */
  withContext(t) {
    const e = {
      ...this.config,
      context: { ...this.context, ...t }
    }, s = new S(e, this.options);
    return s.currentState = this.currentState, s;
  }
  /**
   * History and undo/redo capabilities
   */
  initializeHistory() {
    var t;
    const e = ((t = this.options.history) == null ? void 0 : t.maxSize) || 50;
    this.history = {
      states: [this.getSnapshot()],
      currentIndex: 0,
      maxSize: e
    };
  }
  addToHistory(t) {
    this.history && (this.history.states = this.history.states.slice(0, this.history.currentIndex + 1), this.history.states.push(t), this.history.currentIndex = this.history.states.length - 1, this.history.states.length > this.history.maxSize && (this.history.states.shift(), this.history.currentIndex--));
  }
  canUndo() {
    return this.history ? this.history.currentIndex > 0 : !1;
  }
  canRedo() {
    return this.history ? this.history.currentIndex < this.history.states.length - 1 : !1;
  }
  undo() {
    if (!this.canUndo() || !this.history) return !1;
    this.history.currentIndex--;
    const t = this.history.states[this.history.currentIndex];
    return this.currentState = t.value, this.context = t.context, this.notifyListeners({
      ...t,
      changed: !0,
      event: { type: "UNDO" }
    }), !0;
  }
  redo() {
    if (!this.canRedo() || !this.history) return !1;
    this.history.currentIndex++;
    const t = this.history.states[this.history.currentIndex];
    return this.currentState = t.value, this.context = t.context, this.notifyListeners({
      ...t,
      changed: !0,
      event: { type: "REDO" }
    }), !0;
  }
  getHistory() {
    return this.history;
  }
  /**
   * Persistence capabilities
   */
  async loadPersistedState() {
    if (this.options.persistence)
      try {
        const t = await this.options.persistence.adapter.load(this.options.persistence.key);
        t && (this.currentState = t.value, this.context = t.context);
      } catch (t) {
        console.warn("Failed to load persisted state:", t);
      }
  }
  persistState() {
    if (!this.options.persistence) return;
    const t = {
      value: this.currentState,
      context: this.context,
      timestamp: Date.now()
    };
    this.options.persistence.throttle ? (this.persistenceThrottle && clearTimeout(this.persistenceThrottle), this.persistenceThrottle = setTimeout(() => {
      this.options.persistence.adapter.save(this.options.persistence.key, t);
    }, this.options.persistence.throttle)) : this.options.persistence.adapter.save(this.options.persistence.key, t);
  }
  /**
   * Timer and delayed transition capabilities
   */
  startTimer(t, e) {
    if (!this.options.timers) {
      console.warn("Timers are not enabled. Set options.timers = true");
      return;
    }
    this.clearTimer(t.id), t.interval ? this.timers.set(t.id, setInterval(e, t.delay)) : this.timers.set(t.id, setTimeout(() => {
      e(), this.timers.delete(t.id);
    }, t.delay));
  }
  clearTimer(t) {
    const e = this.timers.get(t);
    e && (clearTimeout(e), this.timers.delete(t));
  }
  sendDelayed(t, e) {
    const s = `delayed_${Date.now()}_${Math.random()}`, i = this.normalizeEvent(t), r = setTimeout(() => {
      this.send(i), this.delayedTransitions.delete(s);
    }, e);
    return this.delayedTransitions.set(s, r), s;
  }
  cancelDelayed(t) {
    const e = this.delayedTransitions.get(t);
    return e ? (clearTimeout(e), this.delayedTransitions.delete(t), !0) : !1;
  }
  /**
   * Enhanced state querying
   */
  matches(t) {
    return Array.isArray(t) ? t.includes(this.currentState) : this.currentState === t;
  }
  hasTag(t) {
    var e, s;
    const i = this.config.states[this.currentState];
    return ((s = (e = i == null ? void 0 : i.meta) == null ? void 0 : e.tags) == null ? void 0 : s.includes(t)) || !1;
  }
  /**
   * Cleanup method
   */
  destroy() {
    this.timers.forEach((t) => clearTimeout(t)), this.timers.clear(), this.delayedTransitions.forEach((t) => clearTimeout(t)), this.delayedTransitions.clear(), this.persistenceThrottle && clearTimeout(this.persistenceThrottle), this.listeners.clear();
  }
  transition(t) {
    var e;
    this.isTransitioning = !0;
    const s = this.config.states[this.currentState], i = (e = s == null ? void 0 : s.on) == null ? void 0 : e[t.type];
    if (!i || !this.canTransition(i, t)) {
      this.isTransitioning = !1;
      return;
    }
    const r = this.currentState, o = this.context;
    try {
      this.executeActions(s == null ? void 0 : s.exit, t), this.executeActions(i.actions, t), i.target && (this.currentState = i.target);
      const a = this.config.states[this.currentState];
      this.executeActions(a == null ? void 0 : a.entry, t);
      const c = {
        value: this.currentState,
        context: this.context,
        changed: r !== this.currentState || o !== this.context,
        event: t,
        meta: (a == null ? void 0 : a.meta) || {}
      };
      this.history && c.changed && this.addToHistory(c), c.changed && this.persistState(), this.notifyListeners(c);
    } catch (a) {
      console.error("Error during state transition:", a), this.currentState = r, this.context = o;
    } finally {
      this.isTransitioning = !1;
    }
  }
  canTransition(t, e) {
    if (!t.guard) return !0;
    const s = this.resolveGuard(t.guard);
    return s ? s(this.context, e) : !0;
  }
  executeActions(t, e) {
    if (t)
      for (const s of t) {
        const i = this.resolveAction(s);
        if (i) {
          const r = i(this.context, e);
          r !== void 0 && (this.context = r);
        }
      }
  }
  resolveAction(t) {
    var e;
    return typeof t == "function" ? t : typeof t == "string" && (e = this.options.actions) != null && e[t] ? this.options.actions[t] : null;
  }
  resolveGuard(t) {
    var e;
    return typeof t == "function" ? t : typeof t == "string" && (e = this.options.guards) != null && e[t] ? this.options.guards[t] : null;
  }
  normalizeEvent(t) {
    return typeof t == "object" && t !== null && "type" in t ? t : { type: t };
  }
  notifyListeners(t) {
    this.listeners.forEach((e) => {
      try {
        e(t);
      } catch (s) {
        console.error("Error in state machine listener:", s);
      }
    });
  }
  setupDevTools() {
    if (typeof window < "u" && window.__REDUX_DEVTOOLS_EXTENSION__) {
      const t = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
        name: "StateMachine"
      });
      this.subscribe((e) => {
        t.send(e.event, e);
      });
    }
  }
}
function g(n, t) {
  const e = l();
  e.current || (e.current = new S(n, t));
  const [s, i] = d(
    () => e.current.getSnapshot()
  );
  u(() => e.current.subscribe(i), []);
  const r = p((o) => {
    e.current.send(o);
  }, []);
  return [s, r, e.current];
}
function x(n) {
  const t = l();
  t.current || (t.current = n());
  const [e, s] = d(
    () => t.current.getSnapshot()
  );
  u(() => t.current.subscribe(s), []);
  const i = p((r) => {
    t.current.send(r);
  }, []);
  return [e, i, t.current];
}
function v(n) {
  const [t, e] = d(
    () => n.getSnapshot()
  );
  return u(() => n.subscribe(e), [n]), t;
}
function b(n, t, e) {
  const [s, i] = d(
    () => t(n.getSnapshot())
  ), r = l(t), o = l(e);
  return r.current = t, o.current = e, u(() => n.subscribe((c) => {
    const y = r.current(c);
    i((f) => (o.current ? o.current(f, y) : Object.is(f, y)) ? f : y);
  }), [n]), s;
}
function E(n) {
  return h(() => n, []);
}
function w(n) {
  return h(() => n, []);
}
function I(n, t) {
  const e = {
    ...t,
    history: { enabled: !0, ...t == null ? void 0 : t.history }
  }, [s, i, r] = g(n, e), o = h(() => ({
    undo: () => r.undo(),
    redo: () => r.redo(),
    canUndo: r.canUndo(),
    canRedo: r.canRedo(),
    history: r.getHistory()
  }), [r, s]);
  return [s, i, r, o];
}
function D(n, t, e) {
  const s = h(() => ({
    save: (r, o) => {
      try {
        localStorage.setItem(r, JSON.stringify(o));
      } catch (a) {
        console.warn("Failed to save to localStorage:", a);
      }
    },
    load: (r) => {
      try {
        const o = localStorage.getItem(r);
        return o ? JSON.parse(o) : null;
      } catch (o) {
        return console.warn("Failed to load from localStorage:", o), null;
      }
    },
    remove: (r) => {
      try {
        localStorage.removeItem(r);
      } catch (o) {
        console.warn("Failed to remove from localStorage:", o);
      }
    }
  }), []), i = {
    ...e,
    persistence: {
      key: t,
      adapter: s,
      throttle: 500
      // Default throttle
    }
  };
  return g(n, i);
}
function M(n) {
  const t = h(() => ({
    sendDelayed: (e, s) => n.sendDelayed(e, s),
    cancelDelayed: (e) => n.cancelDelayed(e),
    startTimer: (e, s) => n.startTimer(e, s),
    clearTimer: (e) => n.clearTimer(e)
  }), [n]);
  return u(() => () => {
    n.destroy();
  }, [n]), t;
}
function O(n, t) {
  const e = v(n);
  return h(() => {
    if (typeof t == "object" && !Array.isArray(t)) {
      const s = {};
      for (const [i, r] of Object.entries(t))
        s[i] = n.matches(r);
      return s;
    } else
      return n.matches(t);
  }, [n, t, e.value]);
}
function _(n, t = {}) {
  const { logTransitions: e = !0, logContext: s = !1 } = t;
  return u(() => e ? n.subscribe((r) => {
    r.changed && (console.group(`🔄 State Transition: ${String(r.event.type)}`), console.log("Previous → Current:", r.value), s && console.log("Context:", r.context), console.log("Event:", r.event), console.log("Next Events:", n.getNextEvents()), console.groupEnd());
  }) : void 0, [n, e, s]), {
    currentState: n.getSnapshot(),
    nextEvents: n.getNextEvents(),
    canTransition: (i) => n.can(i),
    matches: (i) => n.matches(i),
    hasTag: (i) => n.hasTag(i)
  };
}
export {
  g as useStateMachine,
  E as useStateMachineActions,
  _ as useStateMachineDebug,
  w as useStateMachineGuards,
  O as useStateMachineMatches,
  b as useStateMachineSelector,
  x as useStateMachineService,
  v as useStateMachineSubscription,
  M as useStateMachineTimers,
  I as useStateMachineWithHistory,
  D as useStateMachineWithPersistence
};
