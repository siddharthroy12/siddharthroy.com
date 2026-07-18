import { readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const htmlPath = resolve(root, 'dist/index.html')
const serverEntry = pathToFileURL(resolve(root, 'dist-server/entry-server.js')).href
const template = await readFile(htmlPath, 'utf8')
const { render } = await import(serverEntry)
const appHtml = render()

if (!template.includes('<!--ssr-outlet-->')) {
  throw new Error('Could not find the SSR outlet in dist/index.html.')
}

await writeFile(htmlPath, template.replace('<!--ssr-outlet-->', appHtml))
await rm(resolve(root, 'dist-server'), { recursive: true, force: true })
