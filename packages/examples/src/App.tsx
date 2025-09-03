import React from 'react';
import { LoginExample } from './examples/LoginExample';
import { ToggleExample, DataFetchExample } from './examples/ToggleExample';
import { AdvancedEditorExample, PersistentCounterExample } from './examples/AdvancedExample';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Elegant State Machine Examples</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>Basic Examples</h2>
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <ToggleExample />
          </div>
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <DataFetchExample />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Advanced Examples</h2>
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <LoginExample />
        </div>
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <AdvancedEditorExample />
        </div>
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <PersistentCounterExample />
        </div>
      </section>
    </div>
  );
}

export default App;
