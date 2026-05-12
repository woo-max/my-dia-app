import React from 'react'
import ReactDOM from 'react-dom/client'

// App.tsx를 불러오지 않고 바로 글자를 씁니다.
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<h1>BOOT OK</h1>);
}
