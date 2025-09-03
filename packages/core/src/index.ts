// Core state machine exports (framework-agnostic)
export { StateMachine } from './StateMachine';

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
} from './types';
