import {
  StateValue,
  StateConfig,
  StateDefinition,
  Transition,
  Action,
  Guard,
  EventObject,
  StateNode,
  StateMachineOptions,
  Listener,
  EventSender,
  StateHistory,
  DelayedTransition,
  TimerConfig,
  SerializedState
} from './types';

/**
 * Framework-agnostic TypeScript State Machine implementation
 * Core state machine without any framework dependencies
 */
export class StateMachine<
  TState extends StateValue,
  TEvent extends StateValue,
  TContext = any
> {
  private config: StateConfig<TState, TEvent, TContext>;
  private options: StateMachineOptions<TState, TEvent, TContext>;
  private currentState: TState;
  private context: TContext;
  private listeners: Set<Listener<TState, TEvent, TContext>> = new Set();
  private isTransitioning = false;
  private history?: StateHistory<TState, TEvent, TContext>;
  private delayedTransitions = new Map<string, any>(); // Using any for timer type compatibility
  private timers = new Map<string, any>();
  private persistenceThrottle?: any;

  constructor(
    config: StateConfig<TState, TEvent, TContext>,
    options: StateMachineOptions<TState, TEvent, TContext> = {}
  ) {
    this.config = config;
    this.options = options;
    this.currentState = config.initial;
    this.context = config.context || ({} as TContext);
    
    // Initialize history if enabled
    if (options.history?.enabled) {
      this.initializeHistory();
    }
    
    // Load persisted state if configured
    if (options.persistence) {
      this.loadPersistedState();
    }
    
    if (options.devTools && typeof window !== 'undefined') {
      this.setupDevTools();
    }
  }

  /**
   * Get current state snapshot
   */
  getSnapshot(): StateNode<TState, TEvent, TContext> {
    const stateDefinition = this.config.states[this.currentState];
    return {
      value: this.currentState,
      context: this.context,
      changed: false,
      event: { type: 'INIT' as TEvent },
      meta: stateDefinition?.meta || {}
    };
  }

  /**
   * Send an event to the state machine
   */
  send: EventSender<TEvent> = (event) => {
    if (this.isTransitioning) {
      console.warn('State machine is currently transitioning. Event ignored:', event);
      return;
    }

    const eventObject = this.normalizeEvent(event);
    this.transition(eventObject);
  };

  /**
   * Subscribe to state changes
   */
  subscribe(listener: Listener<TState, TEvent, TContext>): () => void {
    this.listeners.add(listener);
    
    // Send initial state
    listener(this.getSnapshot());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Check if the machine can handle a specific event
   */
  can(event: TEvent): boolean {
    const stateDefinition = this.config.states[this.currentState];
    const transition = stateDefinition?.on?.[event];
    
    if (!transition) return false;
    
    const eventObject = this.normalizeEvent(event);
    return this.canTransition(transition, eventObject);
  }

  /**
   * Get all possible events from current state
   */
  getNextEvents(): TEvent[] {
    const stateDefinition = this.config.states[this.currentState];
    if (!stateDefinition?.on) return [];
    
    return Object.keys(stateDefinition.on).filter(event => 
      this.can(event as TEvent)
    ) as TEvent[];
  }

  /**
   * Clone the machine with new context
   */
  withContext(context: Partial<TContext>): StateMachine<TState, TEvent, TContext> {
    const newConfig = {
      ...this.config,
      context: { ...this.context, ...context }
    };
    
    const newMachine = new StateMachine(newConfig, this.options);
    newMachine.currentState = this.currentState;
    return newMachine;
  }

  /**
   * History and undo/redo capabilities
   */
  private initializeHistory(): void {
    const maxSize = this.options.history?.maxSize || 50;
    this.history = {
      states: [this.getSnapshot()],
      currentIndex: 0,
      maxSize
    };
  }

  private addToHistory(state: StateNode<TState, TEvent, TContext>): void {
    if (!this.history) return;
    
    // Remove any states after current index (when undoing then making new changes)
    this.history.states = this.history.states.slice(0, this.history.currentIndex + 1);
    
    // Add new state
    this.history.states.push(state);
    this.history.currentIndex = this.history.states.length - 1;
    
    // Maintain max size
    if (this.history.states.length > this.history.maxSize) {
      this.history.states.shift();
      this.history.currentIndex--;
    }
  }

  canUndo(): boolean {
    return this.history ? this.history.currentIndex > 0 : false;
  }

  canRedo(): boolean {
    return this.history ? this.history.currentIndex < this.history.states.length - 1 : false;
  }

  undo(): boolean {
    if (!this.canUndo() || !this.history) return false;
    
    this.history.currentIndex--;
    const previousState = this.history.states[this.history.currentIndex];
    
    this.currentState = previousState.value;
    this.context = previousState.context;
    
    this.notifyListeners({
      ...previousState,
      changed: true,
      event: { type: 'UNDO' as TEvent }
    });
    
    return true;
  }

  redo(): boolean {
    if (!this.canRedo() || !this.history) return false;
    
    this.history.currentIndex++;
    const nextState = this.history.states[this.history.currentIndex];
    
    this.currentState = nextState.value;
    this.context = nextState.context;
    
    this.notifyListeners({
      ...nextState,
      changed: true,
      event: { type: 'REDO' as TEvent }
    });
    
    return true;
  }

  getHistory(): StateHistory<TState, TEvent, TContext> | undefined {
    return this.history;
  }

  /**
   * Persistence capabilities
   */
  private async loadPersistedState(): Promise<void> {
    if (!this.options.persistence) return;
    
    try {
      const serialized = await this.options.persistence.adapter.load(this.options.persistence.key);
      if (serialized) {
        this.currentState = serialized.value;
        this.context = serialized.context;
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }

  private persistState(): void {
    if (!this.options.persistence) return;
    
    const serialized: SerializedState<TState, TContext> = {
      value: this.currentState,
      context: this.context,
      timestamp: Date.now()
    };
    
    if (this.options.persistence.throttle) {
      if (this.persistenceThrottle) {
        clearTimeout(this.persistenceThrottle);
      }
      
      this.persistenceThrottle = setTimeout(() => {
        this.options.persistence!.adapter.save(this.options.persistence!.key, serialized);
      }, this.options.persistence.throttle);
    } else {
      this.options.persistence.adapter.save(this.options.persistence.key, serialized);
    }
  }

  /**
   * Timer and delayed transition capabilities
   */
  startTimer(config: TimerConfig, callback: () => void): void {
    if (!this.options.timers) {
      console.warn('Timers are not enabled. Set options.timers = true');
      return;
    }
    
    this.clearTimer(config.id);
    
    if (config.interval) {
      this.timers.set(config.id, setInterval(callback, config.delay));
    } else {
      this.timers.set(config.id, setTimeout(() => {
        callback();
        this.timers.delete(config.id);
      }, config.delay));
    }
  }

  clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  sendDelayed(event: TEvent | EventObject<TEvent>, delay: number): string {
    const id = `delayed_${Date.now()}_${Math.random()}`;
    const eventObject = this.normalizeEvent(event);
    
    const timeout = setTimeout(() => {
      this.send(eventObject);
      this.delayedTransitions.delete(id);
    }, delay);
    
    this.delayedTransitions.set(id, timeout);
    return id;
  }

  cancelDelayed(id: string): boolean {
    const timeout = this.delayedTransitions.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.delayedTransitions.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Enhanced state querying
   */
  matches(statePattern: TState | TState[]): boolean {
    if (Array.isArray(statePattern)) {
      return statePattern.includes(this.currentState);
    }
    return this.currentState === statePattern;
  }

  hasTag(tag: string): boolean {
    const stateDefinition = this.config.states[this.currentState];
    return stateDefinition?.meta?.tags?.includes(tag) || false;
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear delayed transitions
    this.delayedTransitions.forEach(timeout => clearTimeout(timeout));
    this.delayedTransitions.clear();
    
    // Clear persistence throttle
    if (this.persistenceThrottle) {
      clearTimeout(this.persistenceThrottle);
    }
    
    // Clear listeners
    this.listeners.clear();
  }

  private transition(event: EventObject<TEvent>): void {
    this.isTransitioning = true;
    
    const stateDefinition = this.config.states[this.currentState];
    const transition = stateDefinition?.on?.[event.type];
    
    if (!transition || !this.canTransition(transition, event)) {
      this.isTransitioning = false;
      return;
    }

    const previousState = this.currentState;
    const previousContext = this.context;

    try {
      // Execute exit actions
      this.executeActions(stateDefinition?.exit, event);
      
      // Execute transition actions
      this.executeActions(transition.actions, event);
      
      // Update state
      if (transition.target) {
        this.currentState = transition.target;
      }
      
      // Execute entry actions
      const newStateDefinition = this.config.states[this.currentState];
      this.executeActions(newStateDefinition?.entry, event);
      
      // Notify listeners
      const stateNode: StateNode<TState, TEvent, TContext> = {
        value: this.currentState,
        context: this.context,
        changed: previousState !== this.currentState || previousContext !== this.context,
        event,
        meta: newStateDefinition?.meta || {}
      };
      
      // Add to history if enabled
      if (this.history && stateNode.changed) {
        this.addToHistory(stateNode);
      }
      
      // Persist state if configured
      if (stateNode.changed) {
        this.persistState();
      }
      
      this.notifyListeners(stateNode);
      
    } catch (error) {
      console.error('Error during state transition:', error);
      // Rollback on error
      this.currentState = previousState;
      this.context = previousContext;
    } finally {
      this.isTransitioning = false;
    }
  }

  private canTransition(
    transition: Transition<TState, TEvent, TContext>,
    event: EventObject<TEvent>
  ): boolean {
    if (!transition.guard) return true;
    
    const guard = this.resolveGuard(transition.guard);
    return guard ? guard(this.context, event) : true;
  }

  private executeActions(
    actions: Action<TContext, TEvent>[] | undefined,
    event: EventObject<TEvent>
  ): void {
    if (!actions) return;
    
    for (const action of actions) {
      const actionFn = this.resolveAction(action);
      if (actionFn) {
        const result = actionFn(this.context, event);
        if (result !== undefined) {
          this.context = result;
        }
      }
    }
  }

  private resolveAction(action: Action<TContext, TEvent>): ((context: TContext, event: EventObject<TEvent>) => TContext | void) | null {
    if (typeof action === 'function') {
      return action;
    }
    
    if (typeof action === 'string' && this.options.actions?.[action]) {
      return this.options.actions[action] as (context: TContext, event: EventObject<TEvent>) => TContext | void;
    }
    
    return null;
  }

  private resolveGuard(guard: Guard<TContext, TEvent>): ((context: TContext, event: EventObject<TEvent>) => boolean) | null {
    if (typeof guard === 'function') {
      return guard;
    }
    
    if (typeof guard === 'string' && this.options.guards?.[guard]) {
      return this.options.guards[guard] as (context: TContext, event: EventObject<TEvent>) => boolean;
    }
    
    return null;
  }

  private normalizeEvent(event: TEvent | EventObject<TEvent>): EventObject<TEvent> {
    if (typeof event === 'object' && event !== null && 'type' in event) {
      return event as EventObject<TEvent>;
    }
    
    return { type: event as TEvent };
  }

  private notifyListeners(state: StateNode<TState, TEvent, TContext>): void {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state machine listener:', error);
      }
    });
  }

  private setupDevTools(): void {
    // Simple dev tools integration
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
        name: 'StateMachine'
      });
      
      this.subscribe((state) => {
        devTools.send(state.event, state);
      });
    }
  }
}
