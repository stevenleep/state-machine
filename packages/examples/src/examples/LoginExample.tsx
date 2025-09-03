import React from 'react';
import { useStateMachine, useStateMachineActions, useStateMachineGuards } from '@stevenleep/state-machine-react';

// 定义状态和事件类型
type LoginState = 'idle' | 'loading' | 'success' | 'error';
type LoginEvent = 'SUBMIT' | 'SUCCESS' | 'ERROR' | 'RETRY' | 'RESET';

// 定义上下文类型
interface LoginContext {
  username: string;
  password: string;
  error?: string;
  attempts: number;
}

// 登录组件示例
export const LoginExample: React.FC = () => {
  // 定义动作
  const actions = useStateMachineActions<LoginContext, LoginEvent>({
    setLoading: (context) => ({
      ...context,
      error: undefined
    }),
    setSuccess: (context) => ({
      ...context,
      error: undefined
    }),
    setError: (context, event) => ({
      ...context,
      error: event.payload?.message || '登录失败',
      attempts: context.attempts + 1
    }),
    resetForm: () => ({
      username: '',
      password: '',
      attempts: 0
    })
  });

  // 定义守卫
  const guards = useStateMachineGuards<LoginContext, LoginEvent>({
    canRetry: (context) => context.attempts < 3,
    hasValidInput: (context) => 
      context.username.length > 0 && context.password.length > 0
  });

  // 状态机配置
  const [state, send] = useStateMachine<LoginState, LoginEvent, LoginContext>({
    initial: 'idle',
    context: {
      username: '',
      password: '',
      attempts: 0
    },
    states: {
      idle: {
        on: {
          SUBMIT: {
            target: 'loading',
            actions: ['setLoading'],
            guard: 'hasValidInput'
          }
        }
      },
      loading: {
        on: {
          SUCCESS: {
            target: 'success',
            actions: ['setSuccess']
          },
          ERROR: {
            target: 'error',
            actions: ['setError']
          }
        }
      },
      success: {
        on: {
          RESET: {
            target: 'idle',
            actions: ['resetForm']
          }
        },
        meta: {
          message: '登录成功！'
        }
      },
      error: {
        on: {
          RETRY: {
            target: 'idle',
            guard: 'canRetry'
          },
          RESET: {
            target: 'idle',
            actions: ['resetForm']
          }
        }
      }
    }
  }, {
    actions,
    guards,
    devTools: true
  });

  // 模拟登录API调用
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    send('SUBMIT');
    
    try {
      // 模拟API调用
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (state.context.username === 'admin' && state.context.password === 'password') {
            resolve(true);
          } else {
            reject(new Error('用户名或密码错误'));
          }
        }, 1000);
      });
      
      send('SUCCESS');
    } catch (error) {
      send({ 
        type: 'ERROR', 
        payload: { message: (error as Error).message } 
      });
    }
  };

  const updateContext = (field: keyof LoginContext, value: string) => {
    // 这里可以通过发送事件来更新上下文
    // 或者使用 machine.withContext() 方法
  };

  return (
    <div className="login-container">
      <h2>登录示例</h2>
      
      {state.value === 'success' && (
        <div className="success-message">
          {state.meta.message}
          <button onClick={() => send('RESET')}>重新登录</button>
        </div>
      )}
      
      {state.value !== 'success' && (
        <form onSubmit={handleSubmit}>
          <div>
            <label>用户名:</label>
            <input
              type="text"
              value={state.context.username}
              onChange={(e) => {
                // 在实际应用中，你可能需要发送事件来更新上下文
                // 这里为了简化直接修改了
              }}
              disabled={state.value === 'loading'}
            />
          </div>
          
          <div>
            <label>密码:</label>
            <input
              type="password"
              value={state.context.password}
              onChange={(e) => {
                // 同上
              }}
              disabled={state.value === 'loading'}
            />
          </div>
          
          {state.context.error && (
            <div className="error-message">
              {state.context.error}
              {state.value === 'error' && state.context.attempts < 3 && (
                <button type="button" onClick={() => send('RETRY')}>
                  重试 ({3 - state.context.attempts} 次机会)
                </button>
              )}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={
              state.value === 'loading' || 
              !state.context.username || 
              !state.context.password
            }
          >
            {state.value === 'loading' ? '登录中...' : '登录'}
          </button>
          
          {state.value === 'error' && state.context.attempts >= 3 && (
            <button type="button" onClick={() => send('RESET')}>
              重置表单
            </button>
          )}
        </form>
      )}
      
      <div className="debug-info">
        <h4>调试信息:</h4>
        <p>当前状态: {state.value}</p>
        <p>尝试次数: {state.context.attempts}</p>
        <p>可用事件: {JSON.stringify(['SUBMIT', 'SUCCESS', 'ERROR', 'RETRY', 'RESET'])}</p>
      </div>
    </div>
  );
};
