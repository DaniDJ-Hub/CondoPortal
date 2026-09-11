import AppRouter from './routes/AppRouter'
import { ToastProvider } from './shared/components/ToastProvider'

function App() {
  // Los toasts envuelven al router para que cualquier pantalla —incluido el
  // login, que está fuera de la sesión— pueda notificar.
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  )
}

export default App
