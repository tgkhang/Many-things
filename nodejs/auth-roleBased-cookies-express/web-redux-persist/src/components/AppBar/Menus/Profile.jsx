import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'
import Box from '@mui/material/Box'
import { useState } from 'react'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import PersonAdd from '@mui/icons-material/PersonAdd'
import Settings from '@mui/icons-material/Settings'
import Logout from '@mui/icons-material/Logout'
import { useConfirm } from 'material-ui-confirm'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUserAPI, selectCurrentUser } from '~/redux/user/userSlice'
import { Link } from 'react-router-dom'

function Profile() {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const confirmLogout = useConfirm()
  const handleLogout = async () => {
    const { confirmed } = await confirmLogout({
      title: 'Confirm Logout',
      description: 'Are you sure you want to logout?',
      confirmationText: 'Confirm',
      cancellationText: 'Cancel',
    })

    if (confirmed) {
      // console.log('User confirmed logout')
      dispatch(logoutUserAPI(true))
    }
  }

  return (
    <Box>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ padding: 0 }}
          aria-controls={open ? 'basic-menu-profile' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar src={currentUser?.avatar} alt="Profile Picture" sx={{ width: 32, height: 32 }} />
        </IconButton>
      </Tooltip>

      <Menu
        id="basic-menu-profile"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'basic-button-profile',
          },
        }}
      >
        <Link to="/settings/account" style={{ color: 'inherit' }}>
          <MenuItem
            onClick={handleClose}
            sx={{
              '&:hover': { color: 'success.light' },
            }}
          >
            <Avatar src={currentUser.avatar} sx={{ width: 28, height: 28, mr: 2 }} /> Profile
          </MenuItem>
        </Link>

        <Divider />
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <PersonAdd fontSize="small" />
          </ListItemIcon>
          Add another account
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{
            '&:hover': { color: 'warning.dark', '& .logout-icon': { color: 'warning.dark' } },
          }}
        >
          <ListItemIcon>
            <Logout className="logout-icon" fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Profile
