import { createRoot } from 'react-dom/client'
import '~/index.css'
import App from '~/App.jsx'
import GlobalStyles from '@mui/material/GlobalStyles'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import theme from '~/theme.js'
import { ToastContainer } from 'react-toastify'
import { ConfirmProvider } from 'material-ui-confirm'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '~/contexts/AuthContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/">
    <ThemeProvider theme={theme}>
      <ConfirmProvider
        defaultOptions={{
          dialogActionsProps: { maxWidth: 'xs' },
          confirmationButtonProps: { variant: 'outlined' },
          cancellationButtonProps: { color: 'inherit' },
          buttonOrder: ['confirm', 'cancel'],
        }}
      >
        <AuthProvider>
          <GlobalStyles styles={{ a: { textDecoration: 'none' } }} />
          <CssBaseline enableColorScheme />
          <App />
          <ToastContainer position="bottom-right" theme="colored" />
        </AuthProvider>
      </ConfirmProvider>
    </ThemeProvider>
  </BrowserRouter>
)
