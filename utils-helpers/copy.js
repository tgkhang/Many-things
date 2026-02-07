// skip in pagination
const skip = (page-1) *limit


const roundProductRating = (val) => Math.round(val * 10) / 10, // e.g., 4.6666 => 47 => 4.7 

const arr = [{id: 1, data: {x: 1}}, {id: 2, data: {x: 2}}]

//Shallower copy methods:
// Spread operator
const copy1 = [...arr]

// Array.from()
const copy2 = Array.from(arr)

// slice()
const copy3 = arr.slice()

// concat()
const copy4 = [].concat(arr)

// Array.of() with spread
const copy5 = Array.of(...arr)


// For objects:
const obj = {a: 1, nested: {b: 2}}

// Spread operator
const copyObj1 = {...obj}

// Object.assign()
const copyObj2 = Object.assign({}, obj)


//DEEP COPY
// JSON method (loses functions, undefined, symbols, dates become strings)
const deepCopy1 = JSON.parse(JSON.stringify(obj))

// structuredClone (modern browsers, Node 17+)
const deepCopy2 = structuredClone(obj)

// Lodash
const deepCopy3 = _.cloneDeep(obj)

// Custom recursive function
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const cloned = {}
    Object.keys(obj).forEach(key => cloned[key] = deepClone(obj[key]))
    return cloned
  }
}