import React from 'react'
import ReactDOM from 'react-dom/client'
import { ShiftCalendar } from './components/ShiftCalendar'
import './styles.css'

// 서버고 라우터고 일단 다 치우고, 달력 화면부터 강제로 띄웁니다.
const rootElement = document.getElementById('root')!
const root = ReactDOM.createRoot(rootElement)

root.render(
  <React.StrictMode>
    <ShiftCalendar />
  </React.StrictMode>
)
