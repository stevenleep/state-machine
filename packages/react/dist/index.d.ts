import { Action } from '@stevenleep/state-machine-core';
import { DelayedTransition } from '@stevenleep/state-machine-core';
import { EventObject } from '@stevenleep/state-machine-core';
import { EventSender } from '@stevenleep/state-machine-core';
import { Guard } from '@stevenleep/state-machine-core';
import { Listener } from '@stevenleep/state-machine-core';
import { ParallelStateConfig } from '@stevenleep/state-machine-core';
import { PersistenceAdapter } from '@stevenleep/state-machine-core';
import { SerializedState } from '@stevenleep/state-machine-core';
import { StateConfig } from '@stevenleep/state-machine-core';
import { StateDefinition } from '@stevenleep/state-machine-core';
import { StateHistory } from '@stevenleep/state-machine-core';
import { StateMachine } from '@stevenleep/state-machine-core';
import { StateMachineOptions } from '@stevenleep/state-machine-core';
import { StateNode } from '@stevenleep/state-machine-core';
import { StateValue } from '@stevenleep/state-machine-core';
import { TimerConfig } from '@stevenleep/state-machine-core';
import { Transition } from '@stevenleep/state-machine-core';

export { Action }

export { DelayedTransition }

export { EventObject }

export { EventSender }

export { Guard }

export { Listener }

export { ParallelStateConfig }

export { PersistenceAdapter }

export { SerializedState }

export { StateConfig }

export { StateDefinition }

export { StateHistory }

export { StateMachineOptions }

export { StateNode }

export { StateValue }

export { TimerConfig }

export { Transition }

/**
 * React hook for state machine integration
 * Provides reactive state updates and event sending
 */
export declare function useStateMachine<TState extends StateValue, TEvent extends StateValue, TContext = any>(config: StateConfig<TState, TEvent, TContext>, options?: StateMachineOptions<TState, TEvent, TContext>): [StateNode<TState, TEvent, TContext>, EventSender<TEvent>, StateMachine<TState, TEvent, TContext>];

/**
 * Utility hook for creating state machine actions with React integration
 */
export declare function useStateMachineActions<TContext = any, TEvent extends StateValue = any>(actions: Record<string, (context: TContext, event: any) => TContext | void>): Record<string, (context: TContext, event: any) => TContext | void>;

/**
 * Hook for state machine debugging and development
 */
export declare function useStateMachineDebug<TState extends StateValue, TEvent extends StateValue, TContext = any>(machine: StateMachine<TState, TEvent, TContext>, options?: {
    logTransitions?: boolean;
    logContext?: boolean;
}): {
    currentState: StateNode<TState, TEvent, TContext>;
    nextEvents: TEvent[];
    canTransition: (event: TEvent) => boolean;
    matches: (pattern: TState | TState[]) => boolean;
    hasTag: (tag: string) => boolean;
};

/**
 * Utility hook for creating state machine guards with React integration
 */
export declare function useStateMachineGuards<TContext = any, TEvent extends StateValue = any>(guards: Record<string, (context: TContext, event: any) => boolean>): Record<string, (context: TContext, event: any) => boolean>;

/**
 * Hook for enhanced state matching and querying
 */
export declare function useStateMachineMatches<TState extends StateValue, TEvent extends StateValue, TContext = any>(machine: StateMachine<TState, TEvent, TContext>, patterns: TState | TState[] | Record<string, TState | TState[]>): boolean | Record<string, boolean>;

/**
 * Hook for creating selectors to optimize re-renders
 * Only re-renders when the selected value changes
 */
export declare function useStateMachineSelector<TState extends StateValue, TEvent extends StateValue, TContext = any, TSelected = any>(machine: StateMachine<TState, TEvent, TContext>, selector: (state: StateNode<TState, TEvent, TContext>) => TSelected, equalityFn?: (a: TSelected, b: TSelected) => boolean): TSelected;

/**
 * Hook for creating a state machine service that persists across re-renders
 * Useful when you need to share the same machine instance across components
 */
export declare function useStateMachineService<TState extends StateValue, TEvent extends StateValue, TContext = any>(createMachine: () => StateMachine<TState, TEvent, TContext>): [StateNode<TState, TEvent, TContext>, EventSender<TEvent>, StateMachine<TState, TEvent, TContext>];

/**
 * Hook for subscribing to an existing state machine
 * Useful for child components that need to react to parent machine state
 */
export declare function useStateMachineSubscription<TState extends StateValue, TEvent extends StateValue, TContext = any>(machine: StateMachine<TState, TEvent, TContext>): StateNode<TState, TEvent, TContext>;

/**
 * Hook for delayed events and timers
 */
export declare function useStateMachineTimers<TState extends StateValue, TEvent extends StateValue, TContext = any>(machine: StateMachine<TState, TEvent, TContext>): {
    sendDelayed: (event: TEvent | EventObject<TEvent>, delay: number) => string;
    cancelDelayed: (id: string) => boolean;
    startTimer: (config: TimerConfig, callback: () => void) => void;
    clearTimer: (id: string) => void;
};

/**
 * Hook for state machine with history capabilities
 */
export declare function useStateMachineWithHistory<TState extends StateValue, TEvent extends StateValue, TContext = any>(config: StateConfig<TState, TEvent, TContext>, options?: StateMachineOptions<TState, TEvent, TContext>): [
StateNode<TState, TEvent, TContext>,
EventSender<TEvent>,
StateMachine<TState, TEvent, TContext>,
    {
    undo: () => boolean;
    redo: () => boolean;
    canUndo: boolean;
    canRedo: boolean;
    history: any;
}
];

/**
 * Hook for state machine with persistence
 */
export declare function useStateMachineWithPersistence<TState extends StateValue, TEvent extends StateValue, TContext = any>(config: StateConfig<TState, TEvent, TContext>, persistenceKey: string, options?: Omit<StateMachineOptions<TState, TEvent, TContext>, 'persistence'>): [StateNode<TState, TEvent, TContext>, EventSender<TEvent>, StateMachine<TState, TEvent, TContext>];

export { }
