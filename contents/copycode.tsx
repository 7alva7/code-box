import { Button } from "antd"
import type {
  PlasmoCSConfig,
  PlasmoCSUIProps,
  PlasmoGetInlineAnchor,
  PlasmoGetInlineAnchorList,
  PlasmoGetOverlayAnchorList,
  PlasmoGetShadowHostId,
  PlasmoGetStyle
} from "plasmo"
import { useEffect, useState } from "react"
import type { FC } from "react"

import { useStorage } from "@plasmohq/storage/dist/hook"

import { i18n } from "~tools"

export const config: PlasmoCSConfig = {
  matches: [
    "https://*.npmjs.com/*",
    "https://*.medium.com/*",
    "https://day.js.org/*",
    "https://stackoverflow.com/*",
    "https://dev.to/*",
    "https://greasyfork.org/*"
  ]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
  .codebox-copyCodeHeader {
    height: 0;
    display: flex;
    justify-content: space-between;
    width: 100%;
    background: transparent;
  }
  .codebox-copyCodeBtn {
    margin-right: 3px;
    border: 0;
    cursor: pointer;
    height: 28px;
  }`
  return style
}

const HOST_ID = "codebox-copycode"
export const getShadowHostId: PlasmoGetShadowHostId = () => HOST_ID

// export const getOverlayAnchorList: PlasmoGetOverlayAnchorList = async () =>
//   document.querySelectorAll("pre")

export const getOverlayAnchorList: PlasmoGetOverlayAnchorList = async () => {
  const preList = document.querySelectorAll("pre")

  const anchors = [] as any
  Array.from(preList).map((pre) => {
    const classList = pre.classList
    if (pre.textContent && !classList.contains("CodeMirror-line"))
      anchors.push(pre)
  })

  return anchors
}

const PlasmoOverlay: FC<PlasmoCSUIProps> = ({ anchor }) => {
  const [copyCode] = useStorage("config-copyCode", true)
  const [isCopy, setIsCopy] = useState(false)

  const element = anchor.element
  const style = window.getComputedStyle(element)
  let width = style.getPropertyValue("width")

  if (location.host.includes("greasyfork")) {
    const codeContainer = element.closest(".code-container")
    width = window.getComputedStyle(codeContainer).getPropertyValue("width")
  }

  const onCopy = async () => {
    try {
      const target = anchor.element as HTMLElement
      const preBlock = target.closest("pre")
      const codeBlock = target.querySelector("code")
      let textContent = ""

      if (codeBlock) {
        textContent = codeBlock.innerText
      } else {
        textContent = preBlock && preBlock.innerText
      }

      navigator.clipboard.writeText(textContent)

      setIsCopy(true)
      setTimeout(() => {
        setIsCopy(false)
      }, 1000)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      {copyCode ? (
        <div className="codebox-copyCodeHeader" style={{ width: width }}>
          <span className="codebox-copyCodeLogo"></span>
          <Button
            color="primary"
            variant="filled"
            onClick={onCopy}
            className="codebox-copyCodeBtn">
            {isCopy ? i18n("copied") : i18n("copy")}
          </Button>
        </div>
      ) : (
        <></>
      )}
    </>
  )
}

export default PlasmoOverlay
