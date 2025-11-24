import Alert from '@mui/material/Alert'

// Component to show error alert for a specific field
function FieldErrorAlert({ errors, fieldName }) {
  if (!errors || !errors[fieldName]) return null
  return (
    <Alert
      severity="error"
      sx={{ mt: '0.75rem', '.MuiAlert-message': { overflow:'hidden' } }}>
      {errors[fieldName].message}
    </Alert>
  )
}

export default FieldErrorAlert