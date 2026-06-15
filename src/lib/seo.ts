// Minimal per-route head manager for the SPA — Googlebot renders JS, so setting
// title/description/canonical/JSON-LD client-side is indexed. Idempotent; returns
// a cleanup that restores the previous head state when the route unmounts.

interface PageSeo {
  title:       string
  description: string
  canonical:   string
  jsonLd?:     object
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): () => void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  const existed = !!el
  const prev = el?.content
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.content = content
  return () => {
    if (!el) return
    if (existed && prev !== undefined) el.content = prev
    else el.remove()
  }
}

export function applyPageSeo({ title, description, canonical, jsonLd }: PageSeo): () => void {
  const prevTitle = document.title
  document.title = title

  const undo: Array<() => void> = []
  undo.push(upsertMeta('name', 'description', description))
  undo.push(upsertMeta('property', 'og:title', title))
  undo.push(upsertMeta('property', 'og:description', description))
  undo.push(upsertMeta('property', 'og:url', canonical))
  undo.push(upsertMeta('name', 'twitter:title', title))
  undo.push(upsertMeta('name', 'twitter:description', description))

  // canonical
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  const prevHref = link?.href
  const linkExisted = !!link
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
  link.href = canonical

  // JSON-LD
  let script: HTMLScriptElement | null = null
  if (jsonLd) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-page-seo', '1')
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)
  }

  return () => {
    document.title = prevTitle
    undo.forEach(fn => fn())
    if (link) { if (linkExisted && prevHref) link.href = prevHref; else link.remove() }
    script?.remove()
  }
}
