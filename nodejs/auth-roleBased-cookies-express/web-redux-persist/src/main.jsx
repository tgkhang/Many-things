// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '~/index.css'
import App from '~/App.jsx'
import GlobalStyles from '@mui/material/GlobalStyles'
import CssBaseline from '@mui/material/CssBaseline'
// import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import theme from '~/theme.js'
import React from 'react'
import { ToastContainer } from 'react-toastify'
import { ConfirmProvider } from 'material-ui-confirm'
import { store } from '~/redux/store.js'
import { Provider } from 'react-redux'
// react router dom with browserRouter
import { BrowserRouter } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
const persistor = persistStore(store)

// inject redux store into authorizeAxios
import { injectStore } from '~/utils/authorizeAxios.js'
injectStore(store)

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
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
            <GlobalStyles styles={{ a: { textDecoration: 'none' } }} />
            <CssBaseline enableColorScheme />
            <App />
            {/* Init ToastContainer */}
            <ToastContainer position="bottom-right" theme="colored" />
          </ConfirmProvider>
        </ThemeProvider>
      </BrowserRouter>
    </PersistGate>
  </Provider>
)
