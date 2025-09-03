export declare type Action<TContext = any, TEvent extends StateValue = any> = string | ((context: TContext, event: EventObject<TEvent>) => TContext | void);

export declare interface DelayedTransition<TState extends StateValue, TEvent extends StateValue, TContext = any> {
    id: string;
    delay: number;
    event: EventObject<TEvent>;
    target?: TState;
    actions?: Action<TContext, TEvent>[];
}

export declare interface EventObject<TEvent extends StateValue = any> {
    type: TEvent;
    payload?: any;
    [key: string]: any;
}

export declare type EventSender<TEvent extends StateValue> = (event: TEvent | EventObject<TEvent>) => void;

export declare type Guard<TContext = any, TEvent extends StateValue = any> = string | ((context: TContext, event: EventObject<TEvent>) => boolean);

export declare type Listener<TState extends StateValue, TEvent extends StateValue, TContext = any> = (state: StateNode<TState, TEvent, TContext>) => void;

export declare interface ParallelStateConfig<TState extends StateValue, TEvent extends StateValue, TContext = any> {
    type: 'parallel';
    states: Record<string, StateDefinition<TState, TEvent, TContext>>;
}

export declare interface PersistenceAdapter {
    save(key: string, data: any): Promise<void> | void;
    load(key: string): Promise<any> | any;
    remove(key: string): Promise<void> | void;
}

export declare interface SerializedState<TState extends StateValue, TContext = any> {
    value: TState;
    context: TContext;
    timestamp: number;
}

export declare interface StateConfig<TState extends StateValue, TEvent extends StateValue, TContext = any> {
    initial: TState;
    states: Record<TState, StateDefinition<TState, TEvent, TContext>>;
    context?: TContext;
}

export declare interface StateDefinition<TState extends StateValue, TEvent extends StateValue, TContext = any> {
    on?: Partial<Record<TEvent, Transition<TState, TEvent, TContext>>>;
    entry?: Action<TContext, TEvent>[];
    exit?: Action<TContext, TEvent>[];
    meta?: Record<string, any>;
}

export declare interface StateHistory<TState extends StateValue, TEvent extends StateValue, TContext = any> {
    states: StateNode<TState, TEvent, TContext>[];
    currentIndex: number;
    maxSize: number;
}

/**
 * Framework-agnostic TypeScript State Machine implementation
 * Core state machine without any framework dependencies
 */
export declare class StateMachine<TState extends StateValue, TEvent extends StateValue, TContext = any> {
    private config;
    private options;
    private currentState;
    private context;
    private listeners;
    private isTransitioning;
    private history?;
    private delayedTransitions;
    private timers;
    private persistenceThrottle?;
    constructor(config: StateConfig<TState, TEvent, TContext>, options?: StateMachineOptions<TState, TEvent, TContext>);
    /**
     * Get current state snapshot
     */
    getSnapshot(): StateNode<TState, TEvent, TContext>;
    /**
     * Send an event to the state machine
     */
    send: EventSender<TEvent>;
    /**
     * Subscribe to state changes
     */
    subscribe(listener: Listener<TState, TEvent, TContext>): () => void;
    /**
     * Check if the machine can handle a specific event
     */
    can(event: TEvent): boolean;
    /**
     * Get all possible events from current state
     */
    getNextEvents(): TEvent[];
    /**
     * Clone the machine with new context
     */
    withContext(context: Partial<TContext>): StateMachine<TState, TEvent, TContext>;
    /**
     * History and undo/redo capabilities
     */
    private initializeHistory;
    private addToHistory;
    canUndo(): boolean;
    canRedo(): boolean;
    undo(): boolean;
    redo(): boolean;
    getHistory(): StateHistory<TState, TEvent, TContext> | undefined;
    /**
     * Persistence capabilities
     */
    private loadPersistedState;
    private persistState;
    /**
     * Timer and delayed transition capabilities
     */
    startTimer(config: TimerConfig, callback: () => void): void;
    clearTimer(id: string): void;
    sendDelayed(event: TEvent | EventObject<TEvent>, delay: number): string;
    cancelDelayed(id: string): boolean;
    /**
     * Enhanced state querying
     */
    matches(statePattern: TState | TState[]): boolean;
    hasTag(tag: string): boolean;
    /**
     * Cleanup method
     */
    destroy(): void;
    private transition;
    private canTransition;
    private executeActions;
    private resolveAction;
    private resolveGuard;
    private normalizeEvent;
    private notifyListeners;
    private setupDevTools;
}

export declare interface StateMachineOptions<TState extends StateValue, TEvent extends StateValue, TContext = any> {
    actions?: Record<string, Action<TContext, TEvent>>;
    guards?: Record<string, Guard<TContext, TEvent>>;
    devTools?: boolean;
    history?: {
        enabled: boolean;
        maxSize?: number;
    };
    persistence?: {
        key: string;
        adapter: PersistenceAdapter;
        throttle?: number;
    };
    timers?: boolean;
}

export declare interface StateNode<TState extends StateValue, TEvent extends StateValue, TContext = any> {
    value: TState;
    context: TContext;
    changed: boolean;
    event: EventObject<TEvent>;
    meta: Record<string, any>;
}

/**
 * Core types for the state machine implementation
 * Framework-agnostic definitions
 */
export declare type StateValue = string | number | symbol;

export declare interface TimerConfig {
    id: string;
    delay: number;
    interval?: boolean;
}

export declare interface Transition<TState extends StateValue, TEvent extends StateValue, TContext = any> {
    target?: TState;
    actions?: Action<TContext, TEvent>[];
    guard?: Guard<TContext, TEvent>;
}

export { }
