// Helper functions for update
// remove null or undefined attribute in an object
const removeUndefinedNullObject = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === null || obj[key] === undefined) {
      delete obj[key]
    }
  })
  return obj
}
 //use to convert nested object to dot notation object
/*
const input = {
  name: "John",
  address: {
    city: "New York",
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    }
  },
  hobbies: ["reading", "gaming"]
}

const result = updateNestedObjectParser(input)
// Output:
{
  name: "John",
  "address.city": "New York",
  "address.coordinates.lat": 40.7128,
  "address.coordinates.lng": -74.0060,
  hobbies: ["reading", "gaming"]
}
normal version and lodash version
*/
const updateNestedObjectParser = (obj) => {
  
}