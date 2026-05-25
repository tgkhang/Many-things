// Create a new array that is ordered based on an id array
// ex : originalArray = [{id: 2, name: 'B'}, {id: 1, name: 'A'}, {id: 3, name: 'C'}]
// orderArray = [1, 2, 3]
// key = 'id'
// result: [{id: 1, name: 'A'}, {id: 2, name: 'B'}, {id: 3, name: 'C'}]
const mapOrder = (originalArray, orderArray, key) => {
  if (!originalArray || !orderArray || !key) return []

  // const clonedArray = [...originalArray] // shallow clone
  // const orderedArray = clonedArray.sort((a, b) => {
  //   return orderArray.indexOf(a[key]) - orderArray.indexOf(b[key])
  // })

  // return orderedArray

  return [...originalArray].sort((a, b) => {
    return orderArray.indexOf(a[key]) - orderArray.indexOf(b[key])
  })
}

