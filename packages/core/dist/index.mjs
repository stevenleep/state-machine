class a {
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
    var r;
    const e = this.config.states[this.currentState], s = (r = e == null ? void 0 : e.on) == null ? void 0 : r[t];
    if (!s) return !1;
    const i = this.normalizeEvent(t);
    return this.canTransition(s, i);
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
    }, s = new a(e, this.options);
    return s.currentState = this.currentState, s;
  }
  /**
   * History and undo/redo capabilities
   */
  initializeHistory() {
    var e;
    const t = ((e = this.options.history) == null ? void 0 : e.maxSize) || 50;
    this.history = {
      states: [this.getSnapshot()],
      currentIndex: 0,
      maxSize: t
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
    var s, i;
    const e = this.config.states[this.currentState];
    return ((i = (s = e == null ? void 0 : e.meta) == null ? void 0 : s.tags) == null ? void 0 : i.includes(t)) || !1;
  }
  /**
   * Cleanup method
   */
  destroy() {
    this.timers.forEach((t) => clearTimeout(t)), this.timers.clear(), this.delayedTransitions.forEach((t) => clearTimeout(t)), this.delayedTransitions.clear(), this.persistenceThrottle && clearTimeout(this.persistenceThrottle), this.listeners.clear();
  }
  transition(t) {
    var h;
    this.isTransitioning = !0;
    const e = this.config.states[this.currentState], s = (h = e == null ? void 0 : e.on) == null ? void 0 : h[t.type];
    if (!s || !this.canTransition(s, t)) {
      this.isTransitioning = !1;
      return;
    }
    const i = this.currentState, r = this.context;
    try {
      this.executeActions(e == null ? void 0 : e.exit, t), this.executeActions(s.actions, t), s.target && (this.currentState = s.target);
      const n = this.config.states[this.currentState];
      this.executeActions(n == null ? void 0 : n.entry, t);
      const o = {
        value: this.currentState,
        context: this.context,
        changed: i !== this.currentState || r !== this.context,
        event: t,
        meta: (n == null ? void 0 : n.meta) || {}
      };
      this.history && o.changed && this.addToHistory(o), o.changed && this.persistState(), this.notifyListeners(o);
    } catch (n) {
      console.error("Error during state transition:", n), this.currentState = i, this.context = r;
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
    return typeof t == "function" ? t : typeof t == "string" && ((e = this.options.actions) != null && e[t]) ? this.options.actions[t] : null;
  }
  resolveGuard(t) {
    var e;
    return typeof t == "function" ? t : typeof t == "string" && ((e = this.options.guards) != null && e[t]) ? this.options.guards[t] : null;
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
export {
  a as StateMachine
};
