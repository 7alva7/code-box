import { saveAs } from "file-saver"
import JSZip from "jszip"
import type {
  PlasmoCSConfig,
  PlasmoCSUIProps,
  PlasmoGetOverlayAnchor,
  PlasmoGetShadowHostId,
  PlasmoGetStyle
} from "plasmo"
import { useEffect, type FC } from "react"

import { useMessage } from "@plasmohq/messaging/hook"
import { useStorage } from "@plasmohq/storage/dist/hook"

import { i18n, saveHtml, saveMarkdown } from "~tools"
import useCssCodeHook from "~utils/cssCodeHook"
import { savePdf } from "~utils/downloadPdf"
import { useContent } from "~utils/editMarkdownHook"
import Turndown from "~utils/turndown"

export const config: PlasmoCSConfig = {
  matches: ["https://mp.weixin.qq.com/s/*"]
}

const turndownService = Turndown()
const articleTitle = document
  .querySelector<HTMLElement>("head title")
  .innerText.trim()

const HOST_ID = "codebox-weixin"
export const getShadowHostId: PlasmoGetShadowHostId = () => HOST_ID

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () =>
  document.querySelector("#img-content .rich_media_title")

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
  .codebox-tagBtn {
    height: 28px;
    display: flex;
    cursor: pointer;
    align-items: center;
    color: #1e80ff;
    width: 66px;
    background: transparent;
    border-radius: 5px;
    justify-content: space-between;
    padding: 0 8px;
    margin-top: -20px;
    font-size: 14px;
  }
  `
  return style
}

const PlasmoOverlay: FC<PlasmoCSUIProps> = ({ anchor }) => {
  const [showTag, setShowTag] = useStorage<boolean>("weixin-showTag")
  const [cssCode, runCss] = useCssCodeHook("weixin")
  const [history, setHistory] = useStorage<any[]>("codebox-history")
  const [content, setContent] = useContent()

  useMessage(async (req: any, res: any) => {
    if (req.name == "weixin-isShow") {
      res.send({ isShow: true })
    }
    if (req.name == "weixin-editMarkdown") {
      setContent("#img-content")
    }
    if (req.name == "weixin-downloadMarkdown") {
      downloadMarkdown()
    }
    if (req.name == "weixin-downloadHtml") {
      downloadHtml()
    }
    if (req.name == "weixin-downloadPdf") {
      var article = document.querySelector<HTMLElement>("#img-content")
      savePdf(article, articleTitle)
    }
    if (req.name == "weixin-downloadImages") {
      await downloadImages(req.body?.onProgress)
    }
  })

  async function downloadImages(
    onProgress?: (current: number, total: number) => void
  ) {
    const article = document.querySelector("#js_content")
    if (!article) return

    const images = Array.from(article.getElementsByTagName("img"))
    const imageUrls = images
      .map((img) => img.dataset.src || img.src)
      .filter((url) => url)
      .map((url) =>
        url.replace(
          "//res.wx.qq.com/mmbizwap",
          "https://res.wx.qq.com/mmbizwap"
        )
      )

    const zip = new JSZip()
    const title = document.title.trim()
    const total = imageUrls.length

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const response = await fetch(imageUrls[i])
        const blob = await response.blob()

        let ext = ".jpg"
        if (
          imageUrls[i].includes("wx_fmt=gif") ||
          imageUrls[i].includes("mmbiz_gif")
        ) {
          ext = ".gif"
        } else if (
          imageUrls[i].includes("wx_fmt=png") ||
          imageUrls[i].includes("mmbiz_png")
        ) {
          ext = ".png"
        } else if (
          imageUrls[i].includes("wx_fmt=bmp") ||
          imageUrls[i].includes("mmbiz_bmp")
        ) {
          ext = ".bmp"
        }

        zip.file(`${title}-${i}${ext}`, blob)

        if (onProgress) {
          onProgress(i + 1, total)
        }
      } catch (error) {
        console.error(`Failed to download image ${i}:`, error)
      }
    }

    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, `${title}-images.zip`)
  }

  function downloadMarkdown() {
    const html = document.querySelector("#img-content")
    const markdown = turndownService.turndown(html)
    saveMarkdown(markdown, articleTitle)
  }

  function downloadHtml() {
    const dom = document.querySelector("#img-content")
    saveHtml(dom, articleTitle)
  }

  function handleEdit() {
    setContent("#img-content")
  }

  function handleDownload() {
    const html = document.querySelector("#img-content")
    const markdown = turndownService.turndown(html)
    saveMarkdown(markdown, articleTitle)
  }

  function closeTag() {
    setShowTag(false)
  }

  return showTag ? (
    <div className="codebox-tagBtn">
      <div onClick={handleEdit}>{i18n("edit")}</div>
      <div onClick={handleDownload}>{i18n("download")}</div>
    </div>
  ) : (
    <></>
  )
}

export default PlasmoOverlay
