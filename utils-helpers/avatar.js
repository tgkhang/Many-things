// helper function to get initials from name
// ex: "John Doe" -> "JD", "Alice" -> "AL"
export const getInitials = (name) => {
  if (!name) return 'NA'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}