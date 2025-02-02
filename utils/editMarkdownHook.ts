import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/dist/hook"

import Turndown from "~utils/turndown"

export function useEditMarkdown(option?) {
  const turndownService = Turndown(option)

  const [content, setContent] = useStorage({
    key: "md-content",
    instance: new Storage({
      area: "local"
    })
  })

  const handleSetContent = (selectorDom) => {
    const markdown = turndownService.turndown(selectorDom)
    setContent(markdown)
    window.open("https://md.randbox.top", "_blank")
  }

  return [content, handleSetContent]
}
