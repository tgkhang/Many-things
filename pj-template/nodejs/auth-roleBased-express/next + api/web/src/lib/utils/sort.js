
// create a new array that is ordered based on an id array
export const mapOrder = (originalArray, orderArray, key) => {
  if (!originalArray || !orderArray || !key) return []

  const clonedArray = [...originalArray] // shallow clone
  const orderedArray = clonedArray.sort((a, b) => {
    return orderArray.indexOf(a[key]) - orderArray.indexOf(b[key])
  })

  return orderedArray
}

