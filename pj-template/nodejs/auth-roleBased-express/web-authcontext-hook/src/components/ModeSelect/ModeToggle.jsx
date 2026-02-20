import Button from '@mui/material/Button'
import { useColorScheme } from '@mui/material/styles'

function ModeToggle() {
  const { mode, setMode } = useColorScheme()

  // const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  // console.log({ prefersDarkMode })
  // const prefersLightMode = useMediaQuery('(prefers-color-scheme: light)')
  // console.log({ prefersLightMode })

  if (!mode) {
    return null
  }

  return (
    <Button onClick={() => {
      setMode(mode === 'light' ? 'dark' : 'light')
    }}>
      Toggle to {mode === 'light' ? 'dark' : 'light'} mode
    </Button>
  )
}

export default ModeToggle


