/**
 * Core types for the state machine implementation
 * Framework-agnostic definitions
 */

export type StateValue = string | number | symbol;

export interface StateConfig<TState extends StateValue, TEvent extends StateValue, TContext = any> {
  initial: TState;
  states: Record<TState, StateDefinition<TState, TEvent, TContext>>;
  context?: TContext;
}

export interface StateDefinition<TState extends StateValue, TEvent extends StateValue, TContext = any> {
  on?: Partial<Record<TEvent, Transition<TState, TEvent, TContext>>>;
  entry?: Action<TContext, TEvent>[];
  exit?: Action<TContext, TEvent>[];
  meta?: Record<string, any>;
}

export interface Transition<TState extends StateValue, TEvent extends StateValue, TContext = any> {
  target?: TState;
  actions?: Action<TContext, TEvent>[];
  guard?: Guard<TContext, TEvent>;
}

export type Action<TContext = any, TEvent extends StateValue = any> = 
  | string
  | ((context: TContext, event: EventObject<TEvent>) => TContext | void);

export type Guard<TContext = any, TEvent extends StateValue = any> = 
  | string
  | ((context: TContext, event: EventObject<TEvent>) => boolean);

export interface EventObject<TEvent extends StateValue = any> {
  type: TEvent;
  payload?: any;
  [key: string]: any;
}

export interface StateNode<TState extends StateValue, TEvent extends StateValue, TContext = any> {
  value: TState;
  context: TContext;
  changed: boolean;
  event: EventObject<TEvent>;
  meta: Record<string, any>;
}

export interface StateMachineOptions<TState extends StateValue, TEvent extends StateValue, TContext = any> {
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

export type Listener<TState extends StateValue, TEvent extends StateValue, TContext = any> = 
  (state: StateNode<TState, TEvent, TContext>) => void;

export type EventSender<TEvent extends StateValue> = (event: TEvent | EventObject<TEvent>) => void;

// History and time-based capabilities
export interface StateHistory<TState extends StateValue, TEvent extends StateValue, TContext = any> {
  states: StateNode<TState, TEvent, TContext>[];
  currentIndex: number;
  maxSize: number;
}

export interface DelayedTransition<TState extends StateValue, TEvent extends StateValue, TContext = any> {
  id: string;
  delay: number;
  event: EventObject<TEvent>;
  target?: TState;
  actions?: Action<TContext, TEvent>[];
}

export interface TimerConfig {
  id: string;
  delay: number;
  interval?: boolean;
}

// Parallel states
export interface ParallelStateConfig<TState extends StateValue, TEvent extends StateValue, TContext = any> {
  type: 'parallel';
  states: Record<string, StateDefinition<TState, TEvent, TContext>>;
}

// Persistence
export interface SerializedState<TState extends StateValue, TContext = any> {
  value: TState;
  context: TContext;
  timestamp: number;
}

export interface PersistenceAdapter {
  save(key: string, data: any): Promise<void> | void;
  load(key: string): Promise<any> | any;
  remove(key: string): Promise<void> | void;
}
