import { saveAs } from "file-saver"

import { sendToBackground } from "@plasmohq/messaging"

export function addCss(code) {
  const style = document.createElement("style")
  const css = document.createTextNode(code)
  style.appendChild(css)
  document.head.appendChild(style)
}

export function addJs(code) {
  const script = document.createElement("script")
  // const js = document.createTextNode(`(()=>{${code}})()`)
  const js = document.createTextNode(code)
  script.appendChild(js)
  document.head.appendChild(script)
}

export function setIcon(active: boolean) {
  sendToBackground({
    name: "icon",
    body: {
      active: active
    }
  })
}

export function saveHtml(dom: Element, filename?: string) {
  if (dom) {
    const htmlContent = dom.outerHTML
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" })
    filename = filename || "CodeBox-page"
    saveAs(blob, `${filename}.html`)
  }
}

export function i18n(key: string) {
  return chrome.i18n.getMessage(key)
}

export function getMetaContentByProperty(metaProperty: string) {
  const metas = document.getElementsByTagName("meta")

  for (let i = 0; i < metas.length; i++) {
    if (metas[i].getAttribute("property") === metaProperty) {
      return metas[i].getAttribute("content")
    }
  }

  return ""
}

export function isValidUrl(urlString: string) {
  try {
    return Boolean(new URL(urlString))
  } catch (e) {
    return false
  }
}
