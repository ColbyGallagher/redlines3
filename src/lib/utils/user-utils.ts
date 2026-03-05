export function formatName(name: string | null | undefined) {
    return name ?? ""
}

export function toTitleCaseFallback(firstName: string, lastName: string) {
    const first = firstName.trim()
    const last = lastName.trim()
    if (!first && !last) return "MT"
    const firstInitial = first ? first[0] : ""
    const lastInitial = last ? last[0] : ""
    const fallback = `${firstInitial}${lastInitial || (firstInitial ? firstInitial : "?")}`
    return fallback.toUpperCase()
}
