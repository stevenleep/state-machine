import React from 'react';
import { useStateMachine } from '@stevenleep/state-machine-react';

// 简单的开关状态机示例
type ToggleState = 'off' | 'on';
type ToggleEvent = 'TOGGLE';

export const ToggleExample: React.FC = () => {
  const [state, send] = useStateMachine<ToggleState, ToggleEvent>({
    initial: 'off',
    states: {
      off: {
        on: {
          TOGGLE: { target: 'on' }
        }
      },
      on: {
        on: {
          TOGGLE: { target: 'off' }
        }
      }
    }
  });

  return (
    <div>
      <h3>开关示例</h3>
      <p>当前状态: {state.value === 'on' ? '开启' : '关闭'}</p>
      <button onClick={() => send('TOGGLE')}>
        {state.value === 'on' ? '关闭' : '开启'}
      </button>
    </div>
  );
};

// 复杂的数据获取状态机示例
type FetchState = 'idle' | 'loading' | 'success' | 'error';
type FetchEvent = 'FETCH' | 'SUCCESS' | 'ERROR' | 'RETRY';

interface FetchContext {
  data: any[];
  error?: string;
  retryCount: number;
}

export const DataFetchExample: React.FC = () => {
  const [state, send] = useStateMachine<FetchState, FetchEvent, FetchContext>({
    initial: 'idle',
    context: {
      data: [],
      retryCount: 0
    },
    states: {
      idle: {
        on: {
          FETCH: { target: 'loading' }
        }
      },
      loading: {
        on: {
          SUCCESS: {
            target: 'success',
            actions: [(context, event) => ({
              ...context,
              data: event.payload?.data || [],
              error: undefined
            })]
          },
          ERROR: {
            target: 'error',
            actions: [(context, event) => ({
              ...context,
              error: event.payload?.message || '获取数据失败',
              retryCount: context.retryCount + 1
            })]
          }
        }
      },
      success: {
        on: {
          FETCH: { target: 'loading' }
        }
      },
      error: {
        on: {
          RETRY: {
            target: 'loading',
            guard: (context) => context.retryCount < 3
          },
          FETCH: { target: 'loading' }
        }
      }
    }
  });

  const fetchData = async () => {
    send('FETCH');
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (Math.random() > 0.3) {
        send({
          type: 'SUCCESS',
          payload: {
            data: [
              { id: 1, name: '项目 1' },
              { id: 2, name: '项目 2' },
              { id: 3, name: '项目 3' }
            ]
          }
        });
      } else {
        throw new Error('网络错误');
      }
    } catch (error) {
      send({
        type: 'ERROR',
        payload: { message: (error as Error).message }
      });
    }
  };

  return (
    <div>
      <h3>数据获取示例</h3>
      
      <button onClick={fetchData} disabled={state.value === 'loading'}>
        {state.value === 'loading' ? '加载中...' : '获取数据'}
      </button>
      
      {state.value === 'success' && (
        <div>
          <h4>数据:</h4>
          <ul>
            {state.context.data.map((item: any) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </div>
      )}
      
      {state.value === 'error' && (
        <div style={{ color: 'red' }}>
          <p>错误: {state.context.error}</p>
          {state.context.retryCount < 3 && (
            <button onClick={() => send('RETRY')}>
              重试 ({3 - state.context.retryCount} 次机会)
            </button>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        状态: {state.value} | 重试次数: {state.context.retryCount}
      </div>
    </div>
  );
};
