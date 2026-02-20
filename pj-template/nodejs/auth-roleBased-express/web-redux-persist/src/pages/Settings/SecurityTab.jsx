import { useConfirm } from 'material-ui-confirm'
import { useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import LockIcon from '@mui/icons-material/Lock'
import PasswordIcon from '@mui/icons-material/Password'
import { FIELD_REQUIRED_MESSAGE } from '~/utils/constants'
import { PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from '~/utils/validators'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { logoutUserAPI, updateUserAPI } from '~/redux/user/userSlice'

function SecurityTab() {
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm()

  const confirmPasswordChange = useConfirm()
  const submitChangePassword = async (data) => {
    const { confirmed } = await confirmPasswordChange({
      title: 'Confirm Password Change',
      description: 'This action will permanently change your password. Are you sure you want to proceed?',
      confirmationText: 'Confirm',
      cancellationText: 'Cancel',
    })

    if (confirmed) {
      const { current_password, new_password } = data

      try {
        const result = await dispatch(updateUserAPI({ currentPassword: current_password, newPassword: new_password }))

        // Only logout if the password was successfully changed (no error)
        if (!result.error) {
          toast.success('Successfully changed password. Please log in again.')
          dispatch(logoutUserAPI(false))
        } else {
          // Show error message from backend
          toast.error(result.error?.message || 'Failed to update password')
        }
      } catch {
        toast.error('Failed to update password')
      }
    }
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
        <Box>
          <Typography variant="h5">Security Dashboard</Typography>
        </Box>

        <form onSubmit={handleSubmit(submitChangePassword)}>
          <Box sx={{ width: '400px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PasswordIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                {...register('current_password', {
                  required: FIELD_REQUIRED_MESSAGE,
                  pattern: {
                    value: PASSWORD_RULE,
                    message: PASSWORD_RULE_MESSAGE,
                  },
                })}
                error={!!errors['current_password']}
              />
              <FieldErrorAlert errors={errors} fieldName={'current_password'} />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                {...register('new_password', {
                  required: FIELD_REQUIRED_MESSAGE,
                  pattern: {
                    value: PASSWORD_RULE,
                    message: PASSWORD_RULE_MESSAGE,
                  },
                })}
                error={!!errors['new_password']}
              />
              <FieldErrorAlert errors={errors} fieldName={'new_password'} />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="New Password Confirmation"
                type="password"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                {...register('new_password_confirmation', {
                  validate: (value) => {
                    if (value === watch('new_password')) return true
                    return 'The password confirmation does not match'
                  },
                })}
                error={!!errors['new_password_confirmation']}
              />
              <FieldErrorAlert errors={errors} fieldName={'new_password_confirmation'} />
            </Box>

            <Box>
              <Button className="interceptor-loading" type="submit" variant="contained" color="primary" fullWidth>
                Change
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  )
}

export default SecurityTab
