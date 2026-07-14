// Кодирование данных для переноса через QR: gzip (если доступен) + base64url.
// Префикс 'g' — gzip, 'r' — сырой JSON. Всё локально, без сторонних сервисов.

function toB64url(bytes: Uint8Array): string {
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/")
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function gzip(str: string): Promise<Uint8Array> {
  const cs = new CompressionStream("gzip")
  const writer = cs.writable.getWriter()
  writer.write(new TextEncoder().encode(str) as BufferSource)
  writer.close()
  const buf = await new Response(cs.readable).arrayBuffer()
  return new Uint8Array(buf)
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  const ds = new DecompressionStream("gzip")
  const writer = ds.writable.getWriter()
  writer.write(bytes as BufferSource)
  writer.close()
  const buf = await new Response(ds.readable).arrayBuffer()
  return new TextDecoder().decode(buf)
}

export async function encodePayload(json: string): Promise<string> {
  if (typeof CompressionStream !== "undefined") {
    return "g" + toB64url(await gzip(json))
  }
  return "r" + toB64url(new TextEncoder().encode(json))
}

export async function decodePayload(payload: string): Promise<string> {
  const tag = payload[0]
  const bytes = fromB64url(payload.slice(1))
  return tag === "g" ? gunzip(bytes) : new TextDecoder().decode(bytes)
}

export function buildTransferUrl(payload: string): string {
  return `${location.origin}${import.meta.env.BASE_URL}#import=${payload}`
}

export function buildChallengeUrl(payload: string): string {
  return `${location.origin}${import.meta.env.BASE_URL}#challenge=${payload}`
}
