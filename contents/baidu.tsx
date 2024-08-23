import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"

import { useMessage } from "@plasmohq/messaging/hook"
import { useStorage } from "@plasmohq/storage/hook"

import { addCss, setIcon } from "~tools"

export const config: PlasmoCSConfig = {
  matches: ["https://*.baidu.com/*"]
}

export default function Custom() {
  const [closeAIBox] = useStorage<boolean>("baidu-closeAIBox")
  const [closeLog] = useStorage("config-closeLog", true)

  useEffect(() => {
    closeLog || console.log("baidu", { closeAIBox })
    closeAIBox && closeAIBoxFunc()
    setIcon(closeAIBox)
  }, [closeAIBox])

  useMessage(async (req, res) => {
    if (req.name == "baidu-isShow") {
      res.send({ isShow: true })
    }
  })

  /* 删除百度AI对话框 */
  function closeAIBoxFunc() {
    addCss(`.wd-ai-index-pc{
      display:none !important;
    }`)
  }

  return <div style={{ display: "none" }}></div>
}
