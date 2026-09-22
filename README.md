# Miracle Clock 〜ルカと空のとけい便〜

Miracle Mine の続編。完成した蒸気飛行機で、ルカとトトじいが「空のとけい便」を開業します。
魔法の時計「とけいの羅針盤」を合わせ、モス・シェル・クリム・フレア・フウの荷物を浮遊島へ届けるブラウザゲームです。

## 遊び方

1. 配送先の島を選び、「トトじいと練習」または「お店をひらく」を選びます。
2. 注文の時刻に合わせて、短い針・長い針をドラッグします。両方の針は連動します。
3. 「この時刻に届ける」で出発。正解すると魔法と飛行機の演出が流れます。
4. お店では待ち客が5人に達するとひとやすみ。指定件数を届ければクリアです。

- 練習は時間制限・行列増加なし、3件で完了。
- 針が重なっているときは「短い針／長い針」で選択できます。＋／−、針にフォーカスして矢印キーでも操作できます。
- 分の補助目盛りを切り替え可能。ヒントは正しい針の位置を説明します。
- 一時停止とタブ非表示では行列を止めます。配送演出中も到着タイマーを止めます。
- クリア記録は端末内のlocalStorageに保存。別の端末とは同期しません。
- 全ステージを最初から選べる初回プレイ版です。

## ステージ

|章|舞台|学習内容|
|---|---|---|
|1|こもれびの森|正時|
|2|しおかぜの港|30分・半|
|3|きらめきの洞窟|15分・30分・45分|
|4|あかねの工房|前半5分、後半1分刻み|
|5|雲の展望台|午前・午後、後半24時間表記|
|6|すべての島|45分後・2時間半後など、日付またぎ|

相対時刻は注文ごとの受付時刻を固定。午前・午後は針とは別に指定します。
時計の判定は時刻の完全一致です。最初の4章のみ午前・午後を問いません。

## 開発

Node.js 20以上。ゲーム本体は外部依存なしの HTML / CSS / JavaScript。

```sh
npm test
npm run build
npm run dev
```

`http://localhost:4173` で開きます。`dist/` が静的配信用の出力です。
公開URL: https://miracle-clock.vercel.app/

初回は Vercel Drop to Deploy で、画像・CSS・JavaScriptを埋め込んだ静的HTMLを公開しました。`node scripts/pack.mjs` で同じ配信用ファイルを再生成できます。

通常のGit連携用のビルド・出力設定も `vercel.json` に同梱しています。

ブラウザテストは GitHub Actions が Chromium / WebKit で実行し、画面キャプチャを保存します。
ローカルでは `npm install --no-save --package-lock=false playwright@1.58.2` と `npx playwright install chromium webkit` の後に `node tests/browser.mjs`。

## 素材と仕様

- [アート出典・生成プロンプト](docs/ART.md)
- [ゲームデザイン](docs/DESIGN.md)
- 前作: https://github.com/shunta-furukawa/miracle-mine

初回版には、時計操作、6章、配送演出、行列、練習、ヒント、進行保存、短い効果音を実装。
BGM、PWA、ランキング、複数セーブ、読み上げは今回の範囲に含みません。


## CIからの本番デプロイ

`.github/workflows/test.yml` が単体テスト・ビルド・Chromium/WebKitのブラウザテストを実行します。
`main` へのpushまたはActionsの **Run workflow**（main指定）で、全テスト成功後にテスト済みの `dist/` を既存Vercelプロジェクトへ公開します。PRはテストのみです。同一ブランチの実行を直列化し、進行中のデプロイを中断しません。

最初に [Repository secrets](https://github.com/shunta-furukawa/miracle-clock/settings/secrets/actions) に次の3つを登録してください。

| Secret | 値の取得元 |
| --- | --- |
| `VERCEL_TOKEN` | [Vercel Tokens](https://vercel.com/account/tokens) で対象チームに限定したトークンを作成。期限切れ前に更新 |
| `VERCEL_ORG_ID` | [Team Settings](https://vercel.com/shunta-furukawas-projects/~/settings/general) の Team ID |
| `VERCEL_PROJECT_ID` | [Project Settings](https://vercel.com/shunta-furukawas-projects/miracle-clock/settings/general) の Project ID |

認証情報が未登録の間は、テストを実行し、デプロイは警告を出してスキップします。登録後は [Actions](https://github.com/shunta-furukawa/miracle-clock/actions/workflows/test.yml) の **Run workflow** で再実行できます。CIの初回本番デプロイは認証情報登録後の確認が必要です。

静的出力は [Vercel Build Output API](https://vercel.com/docs/build-output-api) 形式へ変換し、バージョン固定のCLIで `--prebuilt --prod` を実行します。VercelのGit自動デプロイとの二重実行を避けるため、この構成ではGitHub Actionsを公開経路にします。
