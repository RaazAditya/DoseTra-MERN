
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import {Provider} from "react-redux"
import { appStore } from './app/store.js';
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')).render(
  <Provider store = {appStore}>
  <BrowserRouter>
      <App />
      <Toaster richColors position="top-right" /> 
  </BrowserRouter>
  </Provider>
)
