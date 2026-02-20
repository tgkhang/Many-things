import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Box from '@mui/material/Box'
import PersonIcon from '@mui/icons-material/Person'
import LockIcon from '@mui/icons-material/Lock'
import HistoryIcon from '@mui/icons-material/History'
import DevicesIcon from '@mui/icons-material/Devices'
import AccountTab from './AccountTab'
import SecurityTab from './SecurityTab'
import SecurityEventsTab from './SecurityEventsTab'
import SessionsTab from './SessionsTab'

const TABS = {
  ACCOUNT: 'account',
  SECURITY: 'security',
  EVENTS: 'events',
  SESSIONS: 'sessions',
}

function Settings() {
  const location = useLocation()

  const getTabDefault = () => {
    if (location.pathname.includes(TABS.ACCOUNT)) return TABS.ACCOUNT
    if (location.pathname.includes(TABS.EVENTS)) return TABS.EVENTS
    if (location.pathname.includes(TABS.SESSIONS)) return TABS.SESSIONS
    return TABS.SECURITY
  }

  const [activeTab, setActiveTab] = useState(getTabDefault())

  const handleTabChange = (event, selectedTab) => {
    setActiveTab(selectedTab)
  }

  return (
    <Container disableGutters maxWidth={false}>
      <AppBar />
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab
              label="Account"
              value={TABS.ACCOUNT}
              icon={<PersonIcon />}
              iconPosition="start"
              component={Link}
              to="/settings/account"
            />
            <Tab
              label="Password"
              value={TABS.SECURITY}
              icon={<LockIcon />}
              iconPosition="start"
              component={Link}
              to="/settings/security"
            />
            <Tab
              label="Security Events"
              value={TABS.EVENTS}
              icon={<HistoryIcon />}
              iconPosition="start"
              onClick={() => setActiveTab(TABS.EVENTS)}
            />
            <Tab
              label="Sessions"
              value={TABS.SESSIONS}
              icon={<DevicesIcon />}
              iconPosition="start"
              onClick={() => setActiveTab(TABS.SESSIONS)}
            />
          </TabList>
        </Box>
        <TabPanel value={TABS.ACCOUNT}>
          <AccountTab />
        </TabPanel>
        <TabPanel value={TABS.SECURITY}>
          <SecurityTab />
        </TabPanel>
        <TabPanel value={TABS.EVENTS}>
          <SecurityEventsTab />
        </TabPanel>
        <TabPanel value={TABS.SESSIONS}>
          <SessionsTab />
        </TabPanel>
      </TabContext>
    </Container>
  )
}

export default Settings
