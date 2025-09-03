# @stevenleep/state-machine-core

TypeScript state machine implementation that solves complex state logic management challenges. Provides type-safe state transitions, prevents invalid state combinations, simplifies async flow control, with React integration support.

## 🚀 Quick Start

### Installation

```bash
# Install core package (framework-agnostic)
npm install @stevenleep/state-machine-core

# Install React integration
npm install @stevenleep/state-machine-react
```

### Basic Usage

```typescript
import { StateMachine } from '@stevenleep/state-machine-core';

type State = 'idle' | 'loading' | 'success' | 'error';
type Event = 'FETCH' | 'SUCCESS' | 'ERROR' | 'RETRY';

const machine = new StateMachine<State, Event>({
  initial: 'idle',
  states: {
    idle: {
      on: { FETCH: { target: 'loading' } }
    },
    loading: {
      on: { 
        SUCCESS: { target: 'success' },
        ERROR: { target: 'error' }
      }
    },
    success: {
      on: { FETCH: { target: 'loading' } }
    },
    error: {
      on: { 
        RETRY: { target: 'loading' },
        FETCH: { target: 'loading' }
      }
    }
  }
});
```

### React Integration

```tsx
import { useStateMachine } from '@stevenleep/state-machine-react';

function DataFetcher() {
  const [state, send] = useStateMachine({
    initial: 'idle',
    states: {
      idle: {
        on: { FETCH: { target: 'loading' } }
      },
      loading: {
        on: { 
          SUCCESS: { target: 'success' },
          ERROR: { target: 'error' }
        }
      },
      success: {},
      error: {
        on: { RETRY: { target: 'loading' } }
      }
    }
  });

  return (
    <div>
      <p>Status: {state.value}</p>
      {state.value === 'idle' && (
        <button onClick={() => send('FETCH')}>Fetch Data</button>
      )}
      {state.value === 'error' && (
        <button onClick={() => send('RETRY')}>Retry</button>
      )}
    </div>
  );
}
```

## 🔧 Core Features

### State Management
- **Type Safety**: Compile-time state and event type checking to prevent runtime errors
- **State Subscription**: Monitor state changes and trigger corresponding UI updates or side effects
- **Guard Conditions**: Control state transition execution based on context data
- **Action Execution**: Execute side effects and context updates during state transitions
- **Context Management**: Internal data storage and update mechanisms within the state machine

### Extended Features
- **History Tracking**: State change history tracking with undo/redo operation support
- **Data Persistence**: Automatic state saving to localStorage or custom storage
- **Timer Management**: Delayed event scheduling and timer task control
- **Pattern Matching**: Complex state pattern querying and matching
- **Debug Support**: Redux DevTools integration and state change logging

### React Hooks
- **useStateMachine**: Basic state machine integration
- **useStateMachineWithHistory**: History tracking and undo/redo
- **useStateMachineWithPersistence**: State persistence to storage
- **useStateMachineTimers**: Timer and delayed event handling
- **useStateMachineMatches**: State pattern matching optimization
- **useStateMachineDebug**: Development debugging tools

## 🎯 Use Cases

### Application Scenarios
- **Form Validation**: Multi-step form state flow and validation logic
- **API Requests**: Network request lifecycle state management (pending/fulfilled/rejected)
- **Authentication**: User login, registration, and permission validation state flows
- **UI Interactions**: Complex UI component state coordination and management
- **Business Processes**: Multi-stage workflow state tracking and control

## 📄 License

MIT License
