import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import HomeIcon from '@mui/icons-material/Home'
import Profile from './Menus/Profile'
import ModeSelect from '../ModeSelect/ModeSelect'
import { Link } from 'react-router-dom'

function AppBar() {
  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        height: theme.app.appBarHeight,
        display: 'flex',
        px: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        overflowX: 'auto',
        bgcolor: '#1565c0',
        ...theme.applyStyles('dark', {
          bgcolor: '#2c3e50',
        }),
        '&::-webkit-scrollbar-track': { m: 2 },
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HomeIcon sx={{ color: 'white' }} />
            <Typography variant="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
              Auth App
            </Typography>
          </Box>
        </Link>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ModeSelect />
        <Tooltip title="Help">
          <HelpOutlineIcon sx={{ cursor: 'pointer', color: 'white' }} />
        </Tooltip>
        <Profile />
      </Box>
    </Box>
  )
}

export default AppBar
