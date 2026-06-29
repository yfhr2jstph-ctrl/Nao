# ポケカ コレクション 🃏

ポケモンカードの**コレクション管理・検索**アプリ。スマホでホーム画面に追加して使える PWA です。

- 🔍 **カード名で検索**（日本語）— [TCGdex](https://tcgdex.dev/) の多言語カードDBから取得
- ➕ **所持枚数を登録** — 「＋／−」で枚数を増減
- 🗂️ **マイコレクション** — 名前で絞り込み、種類数・合計枚数を表示
- 💾 **端末内に保存** — IndexedDB に保存。サーバー・ログイン不要
- 📱 **PWA** — ホーム画面に追加、オフラインでもコレクション閲覧・カード画像はキャッシュ
- 🔁 **書出／読込** — JSON でバックアップ（機種変更時の移行用）

## 技術構成

| 項目 | 採用 |
| --- | --- |
| フロント | Vite + React + TypeScript |
| 保存 | Dexie（IndexedDB） |
| カードデータ | TCGdex REST API（`ja` 日本語） |
| PWA | vite-plugin-pwa（Workbox） |

## 開発

```bash
npm install
npm run dev        # 開発サーバー
npm run build      # 型チェック + 本番ビルド（dist/）
npm run preview    # ビルド結果をプレビュー
npm run typecheck  # 型チェックのみ
```

> **データ取得について**：カード情報は端末のブラウザから直接 `api.tcgdex.net` を呼びます。
> ネットワーク制限のある環境（CI のサンドボックス等）では取得できないことがありますが、
> 実機・通常のブラウザでは問題なく動作します。

## デプロイ（GitHub Pages）

`.github/workflows/deploy.yml` で自動デプロイします。

1. リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定
2. `main`（または開発ブランチ）に push すると自動ビルド＆公開
3. 公開URL: `https://<ユーザー名>.github.io/nao/`

プロジェクトサイトはサブパス配信のため、ビルド時に `BASE_PATH=/nao/` を渡しています
（ワークフロー内で設定済み）。独自ドメインやユーザーサイトの場合は `BASE_PATH` を調整してください。

## データ構造

所持カード1件（IndexedDB `items` テーブル）:

```ts
{
  id: string;        // TCGdex のカードID（主キー）
  name: string;      // カード名
  localId: string;   // セット内の番号
  setName: string;   // セット名
  image?: string;    // 画像ベースURL（/high.webp 等を付けて使用）
  rarity?: string;   // レアリティ
  quantity: number;  // 所持枚数
  addedAt: number;   // 追加日時
}
```

## 今後の拡張アイデア

- セット／レアリティ／タイプでの絞り込み検索
- 「ほしい物（ウィッシュリスト）」フラグ
- セット単位のコンプ率表示
- クラウド同期（複数端末で共有）
