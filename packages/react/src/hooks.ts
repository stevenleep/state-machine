import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  StateMachine,
  StateConfig,
  StateMachineOptions,
  StateNode,
  EventSender,
  StateValue,
  EventObject,
  TimerConfig
} from '@stevenleep/state-machine-core';

/**
 * React hook for state machine integration
 * Provides reactive state updates and event sending
 */
export function useStateMachine<
  TState extends StateValue,
  TEvent extends StateValue,
  TContext = any
>(
  config: StateConfig<TState, TEvent, TContext>,
  options?: StateMachineOptions<TState, TEvent, TContext>
): [StateNode<TState, TEvent, TContext>, EventSender<TEvent>, StateMachine<TState, TEvent, TContext>] {
  const machineRef = useRef<StateMachine<TState, TEvent, TContext>>();
  
  // Initialize machine only once
  if (!machineRef.current) {
    machineRef.current = new StateMachine(config, options);
  }

  const [state, setState] = useState<StateNode<TState, TEvent, TContext>>(
    () => machineRef.current!.getSnapshot()
  );

  useEffect(() => {
    const machine = machineRef.current!;
    const unsubscribe = machine.subscribe(setState);
    return unsubscribe;
  }, []);

  const send = useCallback<EventSender<TEvent>>((event) => {
    machineRef.current!.send(event);
  }, []);

  return [state, send, machineRef.current];
}

/**
 * Hook for creating a state machine service that persists across re-renders
 * Useful when you need to share the same machine instance across components
 */
export function useStateMachineService<
  TState extends StateValue,
  TEvent extends StateValue,
  TContext = any
>(
  createMachine: () => StateMachine<TState, TEvent, TContext>
): [StateNode<TState, TEvent, TContext>, EventSender<TEvent>, StateMachine<TState, TEvent, TContext>] {
  const machineRef = useRef<StateMachine<TState, TEvent, TContext>>();
  
  if (!machineRef.current) {
    machineRef.current = createMachine();
  }

  const [state, setState] = useState<StateNode<TState, TEvent, TContext>>(
    () => machineRef.current!.getSnapshot()
  );

  useEffect(() => {
    const machine = machineRef.current!;
    const unsubscribe = machine.subscribe(setState);
    return unsubscribe;
  }, []);

  const send = useCallback<EventSender<TEvent>>((event) => {
    machineRef.current!.send(event);
  }, []);

  return [state, send, machineRef.current];
}

/**
 * Hook for subscribing to an existing state machine
 * Useful for child components that need to react to parent machine state
 */
export function useStateMachineSubscription<
  TState extends StateValue,
  TEvent extends StateValue,
  TContext = any
>(
  machine: StateMachine<TState, TEvent, TContext>
): StateNode<TState, TEvent, TContext> {
  const [state, setState] = useState<StateNode<TState, TEvent, TContext>>(
    () => machine.getSnapshot()
  );

  useEffect(() => {
    const unsubscribe = machine.subscribe(setState);
    return unsubscribe;
  }, [machine]);

  return state;
}

/**
 * Hook for creating selectors to optimize re-renders
 * Only re-renders when the selected value changes
 */
export function useStateMachineSelector<
  TState extends StateValue,
  TEvent extends StateValue,
  TContext = any,
  TSelected = any
>(
  machine: StateMachine<TState, TEvent, TContext>,
  selector: (state: StateNode<TState, TEvent, TContext>) => TSelected,
  equalityFn?: (a: TSelected, b: TSelected) => boolean
): TSelected {
  const [selectedState, setSelectedState] = useState<TSelected>(
    () => selector(machine.getSnapshot())
  );

  const selectorRef = useRef(selector);
  const equalityRef = useRef(equalityFn);
  
  // Update refs
  selectorRef.current = selector;
  equalityRef.current = equalityFn;

  useEffect(() => {
    const unsubscribe = machine.subscribe((state) => {
      const newSelected = selectorRef.current(state);
      
      setSelectedState((prevSelected) => {
        const isEqual = equalityRef.current 
          ? equalityRef.current(prevSelected, newSelected)
          : Object.is(prevSelected, newSelected);
          
        return isEqual ? prevSelected : newSelected;
      });
    });
    
    return unsubscribe;
  }, [machine]);

  return selectedState;
}

/**
 * Utility hook for creating state machine actions with React integration
 */
export function useStateMachineActions<TContext = any, TEvent extends StateValue = any>(
  actions: Record<string, (context: TContext, event: any) => TContext | void>
) {
  return useMemo(() => actions, []);
}

/**
 * Utility hook for creating state machine guards with React integration
 */
export function useStateMachineGuards<TContext = any, TEvent extends StateValue = any>(
  guards: Record<string, (context: TContext, event: any) => boolean>
) {
  return useMemo(() => guards, []);
}

/**
 * Hook for state machine with history capabilities
 */
export function useStateMachineWithHistory<
  TState extends StateValue,
  TEvent extends StateValue,
  TContext = any
>(
  config: StateConfig<TState, TEvent, TContext>,
  options?: StateMachineOptions<TState, TEvent, TContext>
): [
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
] {
  const historyOptions = {
    ...options,
    history: { enabled: true, ...options?.history }
  };
  
  const [state, send, machine] = useStateMachine(config, historyOptions);
  
  const historyControls = useMemo(() => ({
    undo: () => machine.undo(),
    redo: () => machine.redo(),
    canUndo: machine.canUndo(),
    canRedo: machine.canRedo(),
    history: machine.getHistory()
  }), [machine, state]); // Re-compute when state changes
  
  return [state, send, machine, historyControls];
}

/**
 * Hook for state machine with persistence
 */
export function useStateMachineWithPersistence<
  TState extends StateValue,
  TEvent extends StateValue,
  TContext = any
>(
  config: StateConfig<TState, TEvent, TContext>,
  persistenceKey: string,
  options?: Omit<StateMachineOptions<TState, TEvent, TContext>, 'persistence'>
): [StateNode<TState, TEvent, TContext>, EventSender<TEvent>, StateMachine<TState, TEvent, TContext>] {
  
  // Default localStorage adapter
  const defaultAdapter = useMemo(() => ({
    save: (key: string, data: any) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    },
    load: (key: string) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return null;
      }
    },
    remove: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    }
  }), []);
  
  const persistenceOptions = {
    ...options,
    persistence: {
      key: persistenceKey,
      adapter: defaultAdapter,
      throttle: 500 // Default throttle
    }
  };
  
  return useStateMachine(config, persistenceOptions);
}

/**
 * Hook for delayed events and timers
 */
export function useStateMachineTimers<
  TState extends StateValue,
  TEvent extends StateValue,
  TContext = any
>(
  machine: StateMachine<TState, TEvent, TContext>
) {
  const timerControls = useMemo(() => ({
    sendDelayed: (event: TEvent | EventObject<TEvent>, delay: number) => 
      machine.sendDelayed(event, delay),
    cancelDelayed: (id: string) => machine.cancelDelayed(id),
    startTimer: (config: TimerConfig, callback: () => void) => 
      machine.startTimer(config, callback),
    clearTimer: (id: string) => machine.clearTimer(id)
  }), [machine]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      machine.destroy();
    };
  }, [machine]);
  
  return timerControls;
}

/**
 * Hook for enhanced state matching and querying
 */
export function useStateMachineMatches<
  TState extends StateValue,
  TEvent extends StateValue,
  TContext = any
>(
  machine: StateMachine<TState, TEvent, TContext>,
  patterns: TState | TState[] | Record<string, TState | TState[]>
) {
  const state = useStateMachineSubscription(machine);
  
  return useMemo(() => {
    if (typeof patterns === 'object' && !Array.isArray(patterns)) {
      // Return object with named matches
      const result: Record<string, boolean> = {};
      for (const [key, pattern] of Object.entries(patterns)) {
        result[key] = machine.matches(pattern);
      }
      return result;
    } else {
      // Return single boolean
      return machine.matches(patterns as TState | TState[]);
    }
  }, [machine, patterns, state.value]);
}

/**
 * Hook for state machine debugging and development
 */
export function useStateMachineDebug<
  TState extends StateValue,
  TEvent extends StateValue,
  TContext = any
>(
  machine: StateMachine<TState, TEvent, TContext>,
  options: { logTransitions?: boolean; logContext?: boolean } = {}
) {
  const { logTransitions = true, logContext = false } = options;
  
  useEffect(() => {
    if (!logTransitions) return;
    
    const unsubscribe = machine.subscribe((state) => {
      if (state.changed) {
        console.group(`🔄 State Transition: ${String(state.event.type)}`);
        console.log('Previous → Current:', state.value);
        if (logContext) {
          console.log('Context:', state.context);
        }
        console.log('Event:', state.event);
        console.log('Next Events:', machine.getNextEvents());
        console.groupEnd();
      }
    });
    
    return unsubscribe;
  }, [machine, logTransitions, logContext]);
  
  return {
    currentState: machine.getSnapshot(),
    nextEvents: machine.getNextEvents(),
    canTransition: (event: TEvent) => machine.can(event),
    matches: (pattern: TState | TState[]) => machine.matches(pattern),
    hasTag: (tag: string) => machine.hasTag(tag)
  };
}
