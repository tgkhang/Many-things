// this function is used to add loading effect to elements with class 'interceptor-loading'
// just add class 'interceptor-loading' to any element need calling api loading effect
export const interceptorLoadingElements = (calling) => {

  const elements = document.querySelectorAll('.interceptor-loading')

  for (let i=0;i < elements.length; ++i)
  {
    if (calling) {
      elements[i].computedStyleMap.opacity = '0.5'
      elements[i].style.pointerEvents = 'none'
    }
    else {
      elements[i].style.opacity = 'initial'
      elements[i].style.pointerEvents = 'initial'
    }
  }
}