import styled from '@emotion/styled'

// this component is used to create an input that is visually hidden but still accessible to screen readers
const HiddenInputStyle = styled('input')({
  display: 'none',

  // clip: 'rect(0 0 0 0)',
  // clipPath: 'inset(50%)',
  // height: '1px',
  // overflow: 'hidden',
  // position: 'absolute',
  // bottom: '0',
  // left: '0',
  // whiteSpace: 'nowrap',
  // width: '1px',
})

function VisuallyHiddeninput(props) {
  return <HiddenInputStyle {...props} />
}

export default VisuallyHiddeninput
