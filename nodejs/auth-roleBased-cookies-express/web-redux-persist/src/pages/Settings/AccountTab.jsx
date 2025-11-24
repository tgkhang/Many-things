import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { selectCurrentUser, updateUserAPI } from '~/redux/user/userSlice'
import { useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import MailIcon from '@mui/icons-material/Mail'
import AccountBoxIcon from '@mui/icons-material/AccountBox'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import { FIELD_REQUIRED_MESSAGE } from '~/utils/constants'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'

function AccountTab() {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  const initialGeneralForm = {
    displayName: currentUser?.displayName || '',
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialGeneralForm,
  })

  const submitChangeGeneralInfo = (data) => {
    const { displayName } = data

    if (displayName === currentUser.displayName) return

    // call api
    toast
      .promise(dispatch(updateUserAPI({ displayName })), {
        pending: 'Updating user info...',
        success: 'User info updated successfully',
        error: 'Failed to update user info',
      })
      .then((res) => {
        if (!res.error) {
          toast.success('User info updated successfully')
        }
      })
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <form onSubmit={handleSubmit(submitChangeGeneralInfo)}>
          <Box sx={{ width: '400px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <TextField
                disabled
                defaultValue={currentUser?.email}
                fullWidth
                label="Your Email"
                type="text"
                variant="filled"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box>
              <TextField
                disabled
                defaultValue={currentUser?.username}
                fullWidth
                label="Your Username"
                type="text"
                variant="filled"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBoxIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Your Display Name"
                type="text"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AssignmentIndIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                {...register('displayName', {
                  required: FIELD_REQUIRED_MESSAGE,
                })}
                error={!!errors['displayName']}
              />
              <FieldErrorAlert errors={errors} fieldName={'displayName'} />
            </Box>

            <Box>
              <Button className="interceptor-loading" type="submit" variant="contained" color="primary" fullWidth>
                Update
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  )
}

export default AccountTab
