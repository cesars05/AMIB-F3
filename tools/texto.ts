/** Utilidades de texto compartidas por los parsers. */

/** Colapsa cualquier secuencia de espacios (incluye NBSP y saltos de línea) en un solo espacio. */
export function colapsar(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/** Quita acentos y diacríticos (ñ → n). */
export function sinAcentos(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '')
}

/** Slug estable en kebab-case sin acentos, apto para ids (`[a-z0-9-]`). */
export function slug(s: string): string {
  return sinAcentos(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Clave de comparación: sin acentos, minúsculas y espacios colapsados. */
export function clave(s: string): string {
  return colapsar(sinAcentos(s).toLowerCase())
}
