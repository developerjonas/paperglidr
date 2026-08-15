export function canCreateCategory(user: { role?: string } | null) {
  return user?.role === "admin"
}

export function canDeleteCategory(user: { role?: string } | null) {
  return user?.role === "admin"
}
