import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import awsconfig from './aws-config'
import './index.css'
import App from './App.jsx'

// AWS Amplify の初期化
Amplify.configure(awsconfig)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
