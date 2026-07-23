import type { Quote, QuoteLanguage } from "../data/quotes";

const SHARE_SIGNATURE = "Shared from Echo";

export function formatQuoteShareText(quote: Quote): string {
  return `"${quote.text.trim()}"\n— ${quote.author.trim()}\n\n${SHARE_SIGNATURE}`;
}

const SHARE_COPY = {
  en: {
    title: "Share Quote",
    copy: "Copy Text",
    copied: "Copied",
    image: "Share as Image",
    more: "More Sharing Options",
    close: "Close sharing options",
  },
  "zh-Hans": {
    title: "分享名言",
    copy: "复制文字",
    copied: "已复制",
    image: "分享为图片",
    more: "更多分享方式",
    close: "关闭分享选项",
  },
  ja: {
    title: "言葉をシェア",
    copy: "テキストをコピー",
    copied: "コピーしました",
    image: "画像としてシェア",
    more: "その他の共有方法",
    close: "共有メニューを閉じる",
  },
} as const;

export function getShareCopy(language: QuoteLanguage) {
  return SHARE_COPY[language];
}
