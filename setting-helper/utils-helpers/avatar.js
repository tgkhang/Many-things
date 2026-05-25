/**
 * Helper function to get initials from name with a limit of 2 characters
 * ex: "John Doe" -> "JD", "Alice" -> "AL", "Bob" -> "BO"
 */
export const getTwoCharacterInitials = (name) => {
  // if name is empty or null, return 'NA'
  if (!name) return 'NA'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  // If the name has only one part, return the first two characters of that part
  // ex: "Alice" -> "AL"
  return name.substring(0, 2).toUpperCase()
}

export const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== 'string') return ''
  return str.charAt(0).toUpperCase() + strs.slice(1)
}
