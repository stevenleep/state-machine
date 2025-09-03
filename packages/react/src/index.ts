// React adapter exports
export {
  useStateMachine,
  useStateMachineService,
  useStateMachineSubscription,
  useStateMachineSelector,
  useStateMachineActions,
  useStateMachineGuards,
  useStateMachineWithHistory,
  useStateMachineWithPersistence,
  useStateMachineTimers,
  useStateMachineMatches,
  useStateMachineDebug
} from './hooks';

// Re-export core types for convenience
export type {
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
  SerializedState,
  PersistenceAdapter,
  ParallelStateConfig
} from '@stevenleep/state-machine-core';
