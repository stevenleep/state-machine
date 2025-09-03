# @stevenleep/state-machine-core

TypeScript 状态机实现，解决复杂状态逻辑管理难题。提供类型安全的状态转换、避免无效状态组合、简化异步流程控制，支持 React 集成。

## 🚀 快速开始

### 安装

```bash
# 安装核心包（框架无关）
npm install @stevenleep/state-machine-core

# 安装 React 集成
npm install @stevenleep/state-machine-react
```

### 基础用法

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

### React 集成

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
      <p>状态: {state.value}</p>
      {state.value === 'idle' && (
        <button onClick={() => send('FETCH')}>获取数据</button>
      )}
      {state.value === 'error' && (
        <button onClick={() => send('RETRY')}>重试</button>
      )}
    </div>
  );
}
```

## 🔧 核心功能

### 状态管理
- **类型安全**: 编译时状态和事件类型检查，防止运行时错误
- **状态订阅**: 监听状态变化，触发相应的 UI 更新或副作用
- **守卫条件**: 基于上下文数据控制状态转换的执行
- **动作执行**: 状态转换时执行副作用和上下文更新
- **上下文管理**: 状态机内部数据存储和更新机制

### 扩展功能
- **历史记录**: 状态变更历史追踪，支持撤销/重做操作
- **数据持久化**: 状态自动保存到 localStorage 或自定义存储
- **定时器管理**: 延迟事件调度和定时任务控制
- **模式匹配**: 复杂状态模式查询和匹配
- **调试支持**: Redux DevTools 集成和状态变更日志

### React Hooks
- **useStateMachine**: 基础状态机集成
- **useStateMachineWithHistory**: 历史记录和撤销/重做
- **useStateMachineWithPersistence**: 状态持久化到存储
- **useStateMachineTimers**: 定时器和延迟事件处理
- **useStateMachineMatches**: 状态模式匹配优化
- **useStateMachineDebug**: 开发阶段调试工具

## 🎯 使用场景

### 应用场景
- **表单验证**: 多步骤表单的状态流转和验证逻辑
- **API 请求**: 网络请求的生命周期状态管理（pending/fulfilled/rejected）
- **身份认证**: 用户登录、注册、权限校验的状态流程
- **界面交互**: 复杂 UI 组件的状态协调和管理
- **业务流程**: 多阶段工作流的状态跟踪和控制

## 📄 许可证

MIT License
