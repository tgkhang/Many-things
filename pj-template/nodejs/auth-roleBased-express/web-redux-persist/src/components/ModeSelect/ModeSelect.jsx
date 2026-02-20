import { useColorScheme } from '@mui/material/styles'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness'
import Box from '@mui/material/Box'

export default function ModeSelect() {
  const { mode, setMode } = useColorScheme()
  const handleChange = (event) => {
    const newMode = event.target.value
    setMode(newMode)
  }

  if (!mode) {
    return null
  }

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
      <InputLabel
        id="label-select-dark-light-mode"
        sx={{
          color: 'white',
          '&.Mui-focused': { color: 'white' }
        }}
      >Mode
      </InputLabel>

      <Select
        labelId="label-select-dark-light-mode"
        id="select-dark-light-mode"
        value={mode}
        label="Mode"
        onChange={handleChange}
        sx={{
          color: 'white',
          '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
          '.MuiSvgIcon-root': { color: 'white' }
        }}
      >

        <MenuItem value="light">
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <LightModeIcon fontSize='small' /> Light
          </Box>
        </MenuItem>
        <MenuItem value="dark">
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <DarkModeIcon fontSize='small' /> Dark
          </Box>
        </MenuItem>
        <MenuItem value="system">
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <SettingsBrightnessIcon fontSize='small' /> System
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  )
}