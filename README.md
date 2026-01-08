# [pexisgle.dev](https://pexisgle.dev)

[![CI](https://github.com/pexisgle/pexisgle.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/pexisgle/pexisgle.dev/actions/workflows/ci.yml)
[Visit Website](https://pexisgle.dev)

SvelteKit と Cloudflare D1 を使用して構築された、個人的な Web サイトおよびポートフォリオプロジェクトです。
管理ダッシュボード、ブログ機能、作品紹介（Works）、認証機能などを備えています。

## 🚀 技術スタック (Tech Stack)

### Core

- **Framework:** [SvelteKit](https://kit.svelte.dev/) (Svelte 5 Runes mode)
- **Language:** TypeScript
- **Runtime:** [Bun](https://bun.sh/)
- **Deployment:** [Cloudflare Workers](https://workers.cloudflare.com/) / Pages

### Database & Backend

- **Database:** Cloudflare D1
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** [Arctic](https://arctic.js.org/) (GitHub OAuth), [Oslo](https://oslojs.dev/)

### UI / Styling

- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
- **Component Library:** [Flowbite Svelte](https://flowbite-svelte.com/)
- **Icons:** Flowbite Svelte Icons, Iconify
- **Markdown Editor:** [Carta MD](https://github.com/cartamd/carta)

### Form & Validation

- **Form Handling:** [Superforms](https://superforms.rocks/)
- **Validation:** [Arktype](https://arktype.io/)

## 🛠️ 開発環境のセットアップ (Setup)

### 前提条件 (Prerequisites)

- [Bun](https://bun.sh/) がインストールされていること
- Cloudflare アカウント（デプロイおよび D1 利用のため）

### インストール (Installation)

```bash
# 依存関係のインストール
bun install
```

### 環境変数 (Environment Variables)

`.env.example` をコピーして `.env` を作成し、必要な値を設定してください。

```bash
cp .env.example .env
```

`.env` には以下の情報の記述が必要です（実際のファイルを確認してください）:

- GitHub OAuth Client ID / Secret
- Database 接続情報

### データベースのセットアップ (Database Setup)

ローカル開発用にデータベースのマイグレーションを行います。

```bash
# マイグレーションファイルの生成
bun run db:generate

# ローカル D1 へのマイグレーション適用
bun run db:migrate
```

## 📜 利用可能なスクリプト (Scripts)

開発・ビルド・データベース操作のための主なコマンドです。

### 開発 (Development)

| コマンド          | 説明                                                |
| ----------------- | --------------------------------------------------- |
| `bun run dev`     | ローカル開発サーバーを起動します (Vite)             |
| `bun run preview` | ビルドを行い、Wrangler でプレビュー環境を起動します |
| `bun run build`   | プロダクションビルドを実行します                    |
| `bun run deploy`  | Cloudflare へデプロイします                         |

### データベース (Database / Drizzle)

| コマンド                  | 説明                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| `bun run db:generate`     | スキーマ変更に基づいてマイグレーションファイルを生成します            |
| `bun run db:migrate`      | **ローカル** D1 データベースにマイグレーションを適用します            |
| `bun run db:migrate:prod` | **本番** (Cloudflare) データベースにマイグレーションを適用します      |
| `bun run db:studio`       | **ローカル** データベースを確認するための Drizzle Studio を起動します |
| `bun run db:studio:prod`  | **本番** データベースを確認するための Drizzle Studio を起動します     |
| `bun run db:push`         | スキーマをデータベースに直接プッシュします（プロトタイピング用）      |

### コード品質 (Linting & Formatting)

| コマンド         | 説明                                              |
| ---------------- | ------------------------------------------------- |
| `bun run check`  | Svelte check (TypeScript 型チェック) を実行します |
| `bun run format` | Prettier でコードをフォーマットします             |
| `bun run lint`   | Prettier チェックと ESLint を実行します           |

## 📂 プロジェクト構造 (Project Structure)

- `src/lib`: コンポーネント、ユーティリティ、型定義など
  - `server`: サーバーサイドのロジック、DBスキーマなど
  - `components`: 再利用可能な Svelte コンポーネント
- `src/routes`: SvelteKit のルーティング定義
  - `(app)`: 一般公開ページ
  - `(dashboard)`: 管理者用ダッシュボード（認証が必要）
- `drizzle`: データベースのマイグレーションファイル
- `static`: 静的ファイル

## 📄 ライセンス (License)

このプロジェクトは [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/) (CC BY-NC-SA 4.0) の下でライセンスされています。

詳細については `LICENSE` ファイルを確認してください。
