import type {
  PlasmoCSConfig,
  PlasmoCSUIProps,
  PlasmoGetOverlayAnchor,
  PlasmoGetShadowHostId,
  PlasmoGetStyle
} from "plasmo"
import { useEffect, useRef, type FC } from "react"
import { v4 as uuidv4 } from "uuid"

import { useMessage } from "@plasmohq/messaging/hook"
import { useStorage } from "@plasmohq/storage/hook"

import TagBtnStyle from "~component/tagBtn/style"
import { addCss, i18n, saveHtml, saveMarkdown } from "~tools"
import useCssCodeHook from "~utils/cssCodeHook"
import { useContent } from "~utils/editMarkdownHook"
import { Print } from "~utils/print"
import Turndown from "~utils/turndown"

export const config: PlasmoCSConfig = {
  matches: ["https://*.zhihu.com/p/*"]
}

const turndownService = Turndown()
const articleTitle = document
  .querySelector<HTMLElement>("head title")
  .innerText.trim()

const HOST_ID = "codebox-zhihu"
export const getShadowHostId: PlasmoGetShadowHostId = () => HOST_ID

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () =>
  document.querySelector("article.Post-Main .Post-Title")

export const getStyle: PlasmoGetStyle = () => TagBtnStyle()

const PlasmoOverlay: FC<PlasmoCSUIProps> = ({ anchor }) => {
  const [showTag, setShowTag] = useStorage<boolean>("zhihu-showTag", true)
  const [cssCode, runCss] = useCssCodeHook("zhihu")
  const [closeLoginModal] = useStorage<boolean>("zhihu-closeLoginModal")
  const [copyCode] = useStorage<boolean>("zhihu-copyCode")
  const [autoOpenCode] = useStorage<boolean>("zhihu-autoOpenCode")
  const [history, setHistory] = useStorage<any[]>("codebox-history")
  const [closeLog] = useStorage("config-closeLog", true)
  const [content, setContent] = useContent()

  useEffect(() => {
    closeLog ||
      console.log("zhihu status", { copyCode, closeLoginModal, autoOpenCode })
    copyCode && copyCodeFunc()
    closeLoginModal && closeLoginModalFunc()
    autoOpenCode && autoOpenCodeFunc()
  }, [copyCode, closeLoginModal, autoOpenCode])

  useMessage(async (req, res) => {
    if (req.name == "zhihu-isShow") {
      res.send({ isShow: true })
    }
    if (req.name == "zhihu-editMarkdown") {
      editMarkdown()
    }
    if (req.name == "zhihu-downloadMarkdown") {
      downloadMarkdown()
    }
    if (req.name == "zhihu-downloadHtml") {
      downloadHtml()
    }
    if (req.name == "zhihu-downloadPdf") {
      downloadPdf()
    }
  })

  // 功能一： 修改复制按钮，支持一键复制
  function copyCodeFunc() {
    const codes = document.querySelectorAll<HTMLElement>(
      ".RichContent .highlight"
    )

    codes.forEach((code) => {
      const button = document.createElement("button")
      button.innerText = "复制"
      button.style.position = "absolute"
      button.style.top = "0"
      button.style.right = "0"
      button.title = "一键复制代码"
      button.classList.add("Button")
      button.classList.add("VoteButton")

      code.appendChild(button)
      code.style.position = "relative"

      button.addEventListener("click", (e) => {
        // 实现复制
        const target = e.target as HTMLElement
        const parentPreBlock = target.closest(".highlight")
        const codeBlock = parentPreBlock.querySelector<HTMLElement>("pre")

        navigator.clipboard.writeText(codeBlock.innerText)
        setHistory((prevData) =>
          prevData
            ? [
                {
                  id: uuidv4(),
                  value: codeBlock.innerText,
                  createdAt: new Date(),
                  from: "知乎",
                  link: location.href,
                  tags: [],
                  remark: ""
                },
                ...prevData
              ]
            : [
                {
                  id: uuidv4(),
                  value: codeBlock.innerText,
                  createdAt: new Date(),
                  from: "知乎",
                  link: location.href,
                  tags: [],
                  remark: ""
                }
              ]
        )

        target.innerText = "复制成功"
        setTimeout(() => {
          target.innerText = "复制"
        }, 1000)
        e.stopPropagation()
        e.preventDefault()
      })
    })
  }

  // 隐藏登录弹窗
  function closeLoginModalFunc() {
    addCss(`
    .Modal-wrapper--transparent,
    .Modal-enter-done{
      display:none !important;
    }`)
    const element = document.querySelector("html")
    element.style.overflow = "auto"
    element.style.margin = "0px"
  }

  // 自动展开全文
  function autoOpenCodeFunc() {
    removeExpandButton()
    removeRichContentCollapsed()
    addCss(`
    .RichContent--unescapable.is-collapsed .RichContent-inner {
      max-height: unset !important;
      mask-image: unset !important;
    }
    .RichContent--unescapable.is-collapsed .ContentItem-rightButton {
      display:none !important;
    }`)
  }

  function removeExpandButton(element?) {
    element || (element = document)
    const expandButtons = element.querySelectorAll(".ContentItem-expandButton")
    if (expandButtons.length) {
      expandButtons.forEach((button) => {
        const parent = button.parentElement
        if (!element.classList) {
          if (parent.classList.contains("RichContent")) {
            const collapsed = parent.querySelector(
              ".RichContent-inner--collapsed"
            )
            collapsed && (collapsed.style.maxHeight = "unset")
            removeExpandButton(parent)
          } else {
            parent.style.display = "none"
          }
        }
        button.style.display = "none"
      })
    }
  }

  function removeRichContentCollapsed() {
    const isCollapseds = document.querySelectorAll(".RichContent.is-collapsed")
    if (isCollapseds.length > 0) {
      isCollapseds.forEach((isCollapsed) => {
        isCollapsed.classList.remove("is-collapsed")
      })
    }
  }

  function downloadPdf() {
    const article = document.querySelector<HTMLElement>("article.Post-Main")
    if (article) {
      Print.print(article, { title: articleTitle })
        .then(() => console.log("Printing complete"))
        .catch((error) => console.error("Printing failed:", error))
    }
  }

  function editMarkdown() {
    const dom = document.querySelector("article.Post-Main")
    setContent(dom)
  }

  function downloadMarkdown() {
    const html = document.querySelector("article.Post-Main")
    const markdown = turndownService.turndown(html)
    saveMarkdown(markdown, articleTitle)
  }

  function downloadHtml() {
    const dom = document.querySelector("article.Post-Main")
    saveHtml(dom, articleTitle)
  }

  function handleEdit() {
    editMarkdown()
  }

  function handleDownload() {
    downloadMarkdown()
  }

  function handlePrint() {
    downloadPdf()
  }

  function closeTag() {
    setShowTag(false)
  }

  return showTag ? (
    <div className="codebox-tagBtn">
      <div onClick={handleEdit}>{i18n("edit")}</div>
      <div onClick={handleDownload}>{i18n("download")}</div>
      <div onClick={handlePrint}>{i18n("print")}</div>
    </div>
  ) : (
    <></>
  )
}

export default PlasmoOverlay
