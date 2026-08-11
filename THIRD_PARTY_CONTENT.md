# Third-Party Content

## 引文内容

ECHO 应用中的引文内容来自以下来源，使用 CC BY-SA 协议：

### 英文引文
- 来源：English Wikiquote + ECHO 原始目录
- 数量：1,465 条
  - Wikiquote 来源：约 1,391 条
  - ECHO 原始目录：约 74 条（有明确来源）
- 协议：CC BY-SA 4.0（Wikiquote）+ 原始授权（ECHO 原始）
- 署名：https://en.wikiquote.org/

### 简体中文引文
- 来源：Chinese Wikiquote
- 数量：891 条
- 协议：CC BY-SA 4.0
- 署名：https://zh.wikiquote.org/

### 日文引文
- 来源：Japanese Wikiquote
- 数量：1,927 条
- 协议：CC BY-SA 4.0
- 署名：https://ja.wikiquote.org/

## 人物生平

人物介绍页「生平 / LIFE」一节的正文取自维基百科条目的导言段。

- 来源：English / 日本語 / 中文 Wikipedia
- 覆盖：1,214 位作者中的 994 位（其余作者不显示生平段落）
- 协议：CC BY-SA 4.0
- 署名：每条生平在应用内显示条目名与「Wikipedia (CC BY-SA 4.0)」，
  条目 URL 存放在作者记录的 `biography_sources` 字段
- 抓取脚本：`scripts/fetch-author-biographies.mjs`
  （缓存写入 `data/author-biographies.json`，未纳入版本控制，可随时重新抓取）

## 历史回声

「历史回声 / ECHO / 歴史の残響」一节描述说话者所处的时代与环境，由两类素材拼装：

- **作者结构化事实**：Wikidata 声明 `P569` 生年、`P570` 卒年、`P19` 出生地、
  `P27` 国籍、`P106` 职业、`P135` 流派、`P2348` 时代（CC0，无署名义务）
- **作品导言段**：名言出处对应的维基百科条目首句，共解析出 264 部作品
  （CC BY-SA 4.0）

署名同样显示在应用内，作者条目与作品条目一并列出，URL 存放在
`historical_echo_sources`。抓取脚本与生平共用同一个。

**边界**：这一节只陈述抓取到的事实，**不声称任何一句名言被说出的具体场合**。
全部 4,283 条记录的 `verification_status` 仍为 `pending`，出处考证另见
`docs/QUOTE_CONTEXT_RESEARCH.md`。

## 署名要求

根据 CC BY-SA 协议，使用这些内容时需要：
1. 署名：注明内容来源
2. 相同方式共享：如果修改内容，必须使用相同协议分发

## 代码许可

ECHO 应用代码使用 MIT 协议，详见 LICENSE 文件。

## 其他内容

### inBox Card (unpublished)

The inBox Card records are retained only in the local unpublished audit
archive. They are not bundled in the 1.0.0 catalog because the repository does
not contain verifiable permission or licensing evidence for republishing the
collection.

- Website: https://card.gudong.site/
- API: https://card.gudong.site/api/random-note
- Per-record collection and source-file URLs:
  `data/quote-audit/chinese-provenance.json`

The provider describes the API as free, open, and requiring no authentication.
That statement is not treated as a redistribution license. The unpublished
records and their provenance are stored in:

- `data/quote-audit/chinese-inbox-unpublished.json`
- `data/quote-audit/chinese-inbox-provenance-unpublished.json`

## Hitokoto

Hitokoto is not copied into the bundled ECHO catalog.

Its official documentation discourages repeatedly refreshing the random API to
crawl the database and directs bulk users to the public sentence package. That
package is distributed under AGPL, with a stated exception for use through the
provider's supplied remote links. ECHO currently remains offline-first and does
not copy that package into its MIT-licensed application bundle.
