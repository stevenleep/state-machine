import React, { useState, useEffect } from 'react';
import {
  useStateMachine,
  useStateMachineWithHistory,
  useStateMachineWithPersistence,
  useStateMachineTimers,
  useStateMachineMatches,
  useStateMachineDebug,
  useStateMachineActions,
  useStateMachineGuards
} from '@stevenleep/state-machine-react';

// 高级状态机示例：文档编辑器
type EditorState = 'idle' | 'editing' | 'saving' | 'saved' | 'error' | 'autosaving';
type EditorEvent = 'START_EDIT' | 'SAVE' | 'SAVE_SUCCESS' | 'SAVE_ERROR' | 'AUTO_SAVE' | 'RESET';

interface EditorContext {
  content: string;
  lastSaved: string;
  isDirty: boolean;
  saveCount: number;
  error?: string;
}

export const AdvancedEditorExample: React.FC = () => {
  const [content, setContent] = useState('');

  // 定义动作
  const actions = useStateMachineActions<EditorContext, EditorEvent>({
    startEditing: (context, event) => ({
      ...context,
      content: event.payload?.content || context.content,
      isDirty: true
    }),
    saveContent: (context) => ({
      ...context,
      lastSaved: context.content,
      isDirty: false,
      saveCount: context.saveCount + 1,
      error: undefined
    }),
    setError: (context, event) => ({
      ...context,
      error: event.payload?.message || '保存失败'
    }),
    clearError: (context) => ({
      ...context,
      error: undefined
    })
  });

  // 定义守卫
  const guards = useStateMachineGuards<EditorContext, EditorEvent>({
    hasChanges: (context) => context.isDirty,
    canSave: (context) => context.content.length > 0 && context.isDirty
  });

  // 使用带历史记录的状态机
  const [state, send, machine, history] = useStateMachineWithHistory<EditorState, EditorEvent, EditorContext>({
    initial: 'idle',
    context: {
      content: '',
      lastSaved: '',
      isDirty: false,
      saveCount: 0
    },
    states: {
      idle: {
        on: {
          START_EDIT: {
            target: 'editing',
            actions: ['startEditing']
          }
        },
        meta: {
          tags: ['ready']
        }
      },
      editing: {
        on: {
          SAVE: {
            target: 'saving',
            guard: 'canSave'
          },
          AUTO_SAVE: {
            target: 'autosaving',
            guard: 'hasChanges'
          }
        },
        meta: {
          tags: ['active', 'dirty']
        }
      },
      saving: {
        on: {
          SAVE_SUCCESS: {
            target: 'saved',
            actions: ['saveContent']
          },
          SAVE_ERROR: {
            target: 'error',
            actions: ['setError']
          }
        }
      },
      autosaving: {
        on: {
          SAVE_SUCCESS: {
            target: 'editing',
            actions: ['saveContent']
          },
          SAVE_ERROR: {
            target: 'editing',
            actions: ['setError']
          }
        }
      },
      saved: {
        on: {
          START_EDIT: {
            target: 'editing',
            actions: ['startEditing']
          },
          RESET: {
            target: 'idle'
          }
        },
        meta: {
          tags: ['success']
        }
      },
      error: {
        on: {
          SAVE: {
            target: 'saving',
            actions: ['clearError'],
            guard: 'canSave'
          },
          RESET: {
            target: 'idle',
            actions: ['clearError']
          }
        },
        meta: {
          tags: ['error']
        }
      }
    }
  }, {
    actions,
    guards,
    history: { enabled: true, maxSize: 20 },
    timers: true,
    devTools: true
  });

  // 定时器控制
  const timers = useStateMachineTimers(machine);

  // 状态匹配
  const matches = useStateMachineMatches(machine, {
    isActive: ['editing', 'saving', 'autosaving'],
    canEdit: ['idle', 'editing', 'saved', 'error'],
    isLoading: ['saving', 'autosaving'],
    hasError: 'error'
  }) as Record<string, boolean>;

  // 调试信息
  const debug = useStateMachineDebug(machine, {
    logTransitions: true,
    logContext: false
  });

  // 自动保存定时器
  React.useEffect(() => {
    if (state.value === 'editing' && state.context.isDirty) {
      const timerId = timers.sendDelayed('AUTO_SAVE', 3000); // 3秒后自动保存
      
      return () => {
        timers.cancelDelayed(timerId);
      };
    }
  }, [state.value, state.context.isDirty, timers]);

  // 模拟保存操作
  const handleSave = async () => {
    send('SAVE');
    
    try {
      // 模拟API调用
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.2) {
            resolve(true);
          } else {
            reject(new Error('网络错误'));
          }
        }, 1000);
      });
      
      send('SAVE_SUCCESS');
    } catch (error) {
      send({
        type: 'SAVE_ERROR',
        payload: { message: (error as Error).message }
      });
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    send({
      type: 'START_EDIT',
      payload: { content: newContent }
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>高级文档编辑器示例</h2>
      
      {/* 状态指示器 */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <div><strong>当前状态:</strong> {state.value}</div>
        <div><strong>保存次数:</strong> {state.context.saveCount}</div>
        <div><strong>是否有修改:</strong> {state.context.isDirty ? '是' : '否'}</div>
        {state.context.error && (
          <div style={{ color: 'red' }}><strong>错误:</strong> {state.context.error}</div>
        )}
      </div>

      {/* 状态匹配指示器 */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: matches.isActive ? '#4CAF50' : '#ccc',
          color: 'white'
        }}>
          {matches.isActive ? '活跃' : '非活跃'}
        </span>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: matches.isLoading ? '#FF9800' : '#ccc',
          color: 'white'
        }}>
          {matches.isLoading ? '保存中' : '空闲'}
        </span>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: matches.hasError ? '#F44336' : '#ccc',
          color: 'white'
        }}>
          {matches.hasError ? '有错误' : '正常'}
        </span>
      </div>

      {/* 编辑器 */}
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="开始输入内容..."
        disabled={!matches.canEdit}
        style={{
          width: '100%',
          height: '200px',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      />

      {/* 控制按钮 */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={!machine.can('SAVE') || matches.isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: machine.can('SAVE') && !matches.isLoading ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: machine.can('SAVE') && !matches.isLoading ? 'pointer' : 'not-allowed'
          }}
        >
          {matches.isLoading ? '保存中...' : '保存'}
        </button>

        <button
          onClick={() => send('RESET')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重置
        </button>

        {/* 历史记录控制 */}
        <button
          onClick={history.undo}
          disabled={!history.canUndo}
          style={{
            padding: '8px 16px',
            backgroundColor: history.canUndo ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: history.canUndo ? 'pointer' : 'not-allowed'
          }}
        >
          撤销
        </button>

        <button
          onClick={history.redo}
          disabled={!history.canRedo}
          style={{
            padding: '8px 16px',
            backgroundColor: history.canRedo ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: history.canRedo ? 'pointer' : 'not-allowed'
          }}
        >
          重做
        </button>
      </div>

      {/* 调试信息 */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        <h4>调试信息</h4>
        <div><strong>可用事件:</strong> {debug.nextEvents.join(', ')}</div>
        <div><strong>历史记录长度:</strong> {history.history?.states.length || 0}</div>
        <div><strong>当前历史索引:</strong> {history.history?.currentIndex || 0}</div>
        <div><strong>具有 'active' 标签:</strong> {debug.hasTag('active') ? '是' : '否'}</div>
        <div><strong>具有 'error' 标签:</strong> {debug.hasTag('error') ? '是' : '否'}</div>
      </div>

      {/* 功能说明 */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
        <h4>功能演示:</h4>
        <ul>
          <li>✅ <strong>自动保存:</strong> 编辑后3秒自动触发保存</li>
          <li>✅ <strong>历史记录:</strong> 支持撤销/重做操作</li>
          <li>✅ <strong>状态持久化:</strong> 状态会保存到 localStorage</li>
          <li>✅ <strong>状态匹配:</strong> 智能状态判断和UI更新</li>
          <li>✅ <strong>调试模式:</strong> 控制台输出状态转换日志</li>
          <li>✅ <strong>定时器管理:</strong> 自动清理和管理定时器</li>
          <li>✅ <strong>错误处理:</strong> 完整的错误状态管理</li>
        </ul>
      </div>
    </div>
  );
};

// 带持久化的简单计数器示例
export const PersistentCounterExample: React.FC = () => {
  const [state, send] = useStateMachineWithPersistence({
    initial: 'active',
    context: { count: 0 },
    states: {
      active: {
        on: {
          INCREMENT: {
            actions: [(context) => ({ ...context, count: context.count + 1 })]
          },
          DECREMENT: {
            actions: [(context) => ({ ...context, count: Math.max(0, context.count - 1) })]
          },
          RESET: {
            actions: [() => ({ count: 0 })]
          }
        }
      }
    }
  }, 'counter-state');

  return (
    <div style={{ padding: '20px' }}>
      <h3>持久化计数器</h3>
      <p>计数: {state.context.count}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => send('INCREMENT')}>+1</button>
        <button onClick={() => send('DECREMENT')}>-1</button>
        <button onClick={() => send('RESET')}>重置</button>
      </div>
      <p style={{ fontSize: '12px', color: '#666' }}>
        * 计数器状态会自动保存到 localStorage
      </p>
    </div>
  );
};
