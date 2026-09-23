# アート出典と生成プロンプト


## モバイルレイアウト改善用の追加素材

組み込み画像生成ツールで新規生成（CLI/APIフォールバックなし）。既存の配送所を世界観の参照として使用。生成PNGをWebP quality 86へ変換。

- `src/assets/cockpit-sky.webp`: ゲーム画面専用の空の操縦席。元PNG `exec-50fb2823-85e0-44c7-ac3a-6abc22b7b047.png`。
- `src/assets/delivery-islands.webp`: 6つの配送先を描いた3×2のアトラス。元PNG `exec-5122d4a4-7d2a-4c35-ba11-6a9de890a6cf.png`。ステージ選択カードの背景に使用。

### 操縦席プロンプト

Use case: illustration-story. Production background for Miracle Clock, sequel to Miracle Mine. Reference image is world and rendering style only. Create a NEW panoramic view from a cozy brass-and-honeywood postal airship cockpit above floating islands at morning, teal enamel instrument panels only around outer lower corners, wisps of steam, small bundled parcels at bottom left, distant automated teal propeller delivery planes and lush floating islands. Wide 1536x1024 composition. Central 75% uncluttered pale turquoise sky and soft cream clouds so a large interactive clock and order panels remain clear when overlaid. Soft matte hand-painted storybook anime aesthetic, warm brass, timber, turquoise, paper texture, hopeful atmosphere. No people, text, numerals, clock faces, UI, borders or logos. Full bleed background.

### 配送先アトラスのプロンプト

Use case: illustration-story. Asset type: a single production game environment atlas for Miracle Clock in the same warm painterly storybook floating-island world as the reference. EXACT regular 3 columns by 2 rows grid of six equally sized rectangular landscape scenes, total canvas 1536x1024. No gutters, no borders, no text, no numerals, no characters, no UI. Each tile is independent with its subject centered safely away from tile edges. TOP LEFT: mossy floating forest island with a little timber postal cottage, flowers and brass lantern. TOP MIDDLE: sunny turquoise floating harbor island with white shells, sailboats and a sea waterfall. TOP RIGHT: floating amethyst crystal cave island, luminous lilac crystals and a tiny wooden landing pier. BOTTOM LEFT: warm sunset island of red-roofed brass steam workshops and teal propeller planes. BOTTOM MIDDLE: floating cloud observatory, domed brass telescope tower at twilight, sun-glow left and crescent moon right. BOTTOM RIGHT: panoramic network of lush floating islands linked by trails of tiny teal postal planes and glowing wind currents. Matte brass, teal enamel, honey timber, soft clouds, lavish but readable small-size storybook adventure art; match reference softness and palette. Do not add letters or chapter badges.


## 継承素材

`src/assets/game-cast.webp` と `src/assets/sky-toto.webp` はオーナーの Miracle Mine プロジェクトから再利用。キャラクターデザインを改変せず、前作と同じルカ・トトじい・5人の仲間を描画します。

原本: https://github.com/shunta-furukawa/miracle-mine/tree/main/src/assets

## 新規生成素材

OpenAI 組み込み画像生成ツール（imagegenスキル、CLI/APIフォールバックなし）で生成。

- `src/assets/post-office.webp` — 浮遊島の配送所。元PNG: exec-5b8a0009-a54b-463c-8de8-3aaf5c32108b.png。
- `src/assets/delivery-plane.webp` — 透明背景の荷物を積んだ自動配送用蒸気飛行機。元PNG: exec-d3805dec-0eb4-4c13-aa5c-a6778ef03b43.png。

参照画像は前作の `sky-world.webp` と `airplane-stages.webp`。生成PNGをWebP quality 88へエンコード、飛行機のアルファチャンネルを維持。外部広告・有料素材は使用していません。

### 配送所のプロンプト

Use case: illustration-story. Create a production game background for Miracle Clock, a sequel to Miracle Mine. Image 1 is a style and world reference only (floating islands, warm painterly storybook anime, brass, teal enamel, timber, cloud sea). Image 2 is airplane design reference only. Wide landscape 1536x1024. View from inside a welcoming sky-island postal workshop looking out onto a sunlit wooden airship departure terrace, turquoise sky, magnificent soft clouds and a distant floating island town. Left side timber post and a small stack of wrapped parcels tied with string, brass lantern, teal pennants; right side a modest brass-and-wood postal counter and hanging clockwork apparatus; distant little teal steam delivery planes traversing the sky. Central 55 percent open light blue sky and soft white clouds, uncluttered so gameplay clock can be overlaid. Warm soft hand painted detail, matte gold not shiny photorealistic, same world as reference. No humans, no characters, no writing, no lettering, no numbers, no logo, no UI, no border. Rich storybook quality, optimistic new business adventure.

### 配送機のプロンプト

Use case: illustration-story. Production game sprite with REAL TRANSPARENT background, no white backdrop or ground. Reference image is aircraft design reference only: preserve Miracle Mine's finished teal enamel, brass and honey-brown wood steam propeller airplane in bottom right, blue circular magical crystal, brass boiler and tiny chimney. Create one complete small autonomous parcel delivery plane (no pilot, no person), with two brown paper parcels tied with twine securely on cargo rack behind cockpit. Plane pointing RIGHT, three-quarter side view, entire wings propeller and tail visible with 12% clear transparent padding on every edge. Soft warm painterly children's adventure anime illustration, detailed but readable at small size, matte metal. A small wisp of white steam is okay. Isolated object only, no writing, no typography, no numbers, no logo, no UI, no extra objects, no sheet, no variants.

## 配送所と魔法時計（2026-09-22 / 0.2）

Built-in ImageGenで作成。前作 `game-cast.webp` と `stones.webp` を参照。外部キャラクターなし。PNGの透過を維持してWebPに変換し、住民・背景のアトラスをゲーム用セルに分割。生成画像に学習用数字を焼き込まず、時計の数字と目盛りはコード側で正確に描く。

- `src/assets/residents/{0..4}-{0..2}.webp`: 森の木の住民、港の貝の住民、結晶のモグラ、火のトカゲ、雲のキツネ、各3種類。320×360。元画像 `exec-149af08b-b7bd-4dab-a2b7-7207503f58e8.png`。地域の代表キャラクターは前作の素材を継続利用。
- `src/assets/magic-clock.webp`: 正面向きの円形、真鍮・木・青緑エナメルの魔法時計。960×960。元画像 `exec-9da09554-81d4-4c6c-9ae4-3ba41694468e.png`。
- `src/assets/depots/{0..5}.webp`: 森・港・結晶洞窟・工房・雲・中央の配送所。元画像 `exec-fc51d580-f6b7-400e-a1d9-26922b27fef1.png`。

### Prompt set

1. Production transparent sprite atlas, 3 columns × 5 rows; warm storybook watercolor/anime matching the original cast; fifteen distinct full-body parcel-holding residents with generous padding. Forest: sapling child, stout oak adult, flowering elder. Harbour: pink scallop child, turquoise spiral shell, pearl oyster elder. Crystal: amber mole, violet crystal mole, rose quartz elder. Fire: tiny ember salamander, stout volcanic lizard with apron, lava elder with goggles. Cloud: cream cloud fox child, blue wind fox with satchel, long-eared white fox elder. No labels or scenery; real transparency.
2. Perfectly circular magical time-stamping clock viewed straight on; carved walnut, concentric antique brass rings, teal enamel, restrained gears; ivory parchment center and subtle compass engraving, twelve empty bezel sockets around rim. No numerals, ticks, hands or text. Outside silhouette transparent; soft painterly storybook finish, reference original Mine stone materials and palette.
3. Six depot backgrounds in 3×2 atlas; watercolor steampunk, wooden parcel counter in foreground, launch pier with brass rails, open central UI space. Top row forest village, seashell harbour, crystal cavern; bottom row volcanic workshop, cloud observatory, central postal exchange. No people, aircraft, text, clock faces or logos.

Three.js runtime is pinned and vendored (0.184.0, MIT, `src/vendor/THREE-LICENSE.txt`) so production does not depend on a public CDN. The plane and dock are code-native 3D meshes; the generated aircraft illustration remains the fallback for unsupported devices.

- `src/assets/residents-waiting.webp`: 全15住民の待ちくたびれた表情差分。生成元 `exec-bdac8d7a-0e46-45c2-bf5d-15bcd407ac4c.png`。3×5、768×1440に整列。通常の住民アトラスを編集参照し、同じ人物・服・荷物・順序を保ち、半目、あくび、肩を下げた小さなため息だけを追加。怒りや苦痛を避けた子ども向けの穏やかな表現。25秒から表情と持ち替え、55秒からため息、受付完了時は通常の笑顔とお礼に切り替える。

## 2026-09-22: image-based clock minerals

`src/assets/gems/1.webp` through `12.webp` replace the flat SVG mineral plates. Each transparent image includes its numeral, elemental emblem, faceted crystal and brass bezel. The legend uses the same files. Built-in image generation was used with Miracle Mine's `stones.webp` as the visual reference; the resulting 1086 × 1448 transparent 3-column / 4-row sheet was cropped into cells, alpha-trimmed and resized to 256 × 256 WebP without redrawing its contents.

Prompt: Create exactly twelve isolated front-facing octagonal brass-mounted mineral tiles in a uniform 3-column / 4-row transparent sprite sheet. Match the reference's rich crystalline facets, internal glow, tiny gear clasps and broad readable serif numerals. Rows: 1 blue water/drop, 2 yellow sunlight/sun, 3 red fire/flame; 4 green forest/leaf, 5 amber resin/double chevron, 6 cyan ice/snowflake; 7 indigo moon/crescent, 8 magenta star, 9 lavender steam/three crystals; 10 celadon wind/curled wind lines, 11 copper orange lightning/bolt, 12 pearl white raw crystal/hollow circle. Paint the exact numeral and emblem into every tile; white raw crystal reads 12, never 0. Equal scale and transparent gutters; no poster, titles, captions, paper or connecting decorations.


### 会話の立ち絵
`dialogue-cast-safe.webp` と `cast-expressions-safe.webp` は Miracle Mine の同名素材をそのまま共用。会話背景は各配送所の既存画像を使用する。

プロローグの冒頭は Miracle Mine の `sky-world.webp` を共用。残る場面は Clock の既存配送所・郵便局・機体画像を使用し、時計はゲームと同じ文字盤を重ねて表示する。

## 砂丘の温室・トビネズミ族（36ステージ改訂）

内蔵画像生成で制作。`assets/sunari-residents.webp` は4列×3行の透過アトラス（スナリ／ポポ／ネム／サフランばあ、通常／待ちくたびれ／喜び）。`assets/depots/6.webp` は砂丘の温室背景。既存 `depots/5.webp` は中央便専用として継続利用。PNG原本をWebPへ変換しアルファを保持。

キャラクター生成プロンプト：Warm hand-painted storybook steampunk sprite atlas, regular 4 columns x 3 rows, 1536x1024. Cute anthropomorphic jerboas with large rounded ears, long tufted tails, sandy cream fur, brass/wood/leather accessories. Col1 Sunari: teal scarf, goggles, hourglass satchel, seedling parcel. Col2 Popo: cream fur, coral vest, tea box. Col3 Nemu: brown sturdy gardener, green apron, straw hat, wrapped pot. Col4 Grandma Saffron: silver cream fur, glasses, plum shawl, seed envelope. Rows neutral / bored waiting / delighted. Complete silhouettes, generous padding, no text or borders. Transparent background. 背景除去の追指示を行い、生成画像のRGBA透明度をそのまま使用。

背景生成プロンプト：THE DUNE GREENHOUSE, a cozy postal counter and botanical conservatory on a floating sandstone desert island above clouds. Warm watercolor/gouache, fine ink, brass curved glass domes, timber, leather straps, teal and ochre. Reception desk faces greenhouses, seedlings, lavender, hourglass, steam irrigation and windmills. Floating desert mesas and sky bridges through arched windows. Softly detailed center, rich edges, no people or writing, landscape with portrait center crop.

## PWA / air post title (2026-09-22)
Built-in imagegen, reference-based original illustration. `src/assets/air-post-title.webp`: one coherent warm storybook scene of Luca stamping parcels while Toto loads a teal/brass steam delivery plane at a floating island dock; sky kept clear for HTML title. Character identity references: game-cast.webp and sky-toto.webp. Prompt: brown-haired boy with brass goggles, orange scarf, teal jacket; kindly white-haired grandfather, round glasses, leather apron; kraft parcels, stamps, floating islands, painted light, no text, no cutout collage.

`src/icons/clock-{180,192,512}.png`: revised icon matches the in-game magic-clock.webp and gameplay reference. Prompt: dark carved wood outer ring, brass frame, turquoise enamel, four gears, twelve octagonal mineral colours in game order, ivory dial, teal short hand, copper long hand, teal central stamp; parcel below, small wings, opaque teal background, no typography. Resized from the generated original; used as favicon, Apple touch icon and manifest icons.

## Clock hands (2026-09-22)
`src/assets/clock-hands.webp` is a transparent imagegen sprite sheet. Prompt: two isolated front-view upward clock hands; broad deep-teal enamel hour hand with antique brass filigree and ivory diamond, slender copper-orange minute hand with ivory/brass edge, warm storybook bevels, no dial or labels, actual alpha. The original 1254px square is converted to WebP retaining alpha, with each hand framed through a nested SVG viewBox. Selected hand has a slow 2.8s glow; reduced-motion uses a steady outline. Flight materials use deterministic procedural wood grain, cloth weave and riveted metal maps, environment reflection, warm sun/cool rim light and shadow maps; all resources are local and disposed after flight scene teardown.

## Shared title identity (2026-09-23)
Built-in image generation, matching Miracle Mine's title-logo.webp and Clock's magic-clock.webp / air-post-title.webp. No paid API fallback.

- `src/assets/title-logo.webp`: transparent two-line "Miracle Clock" emblem, ivory/brass ornate serif lettering, teal outlines, aviation wings, small wood/brass magic clock replacing Mine's crystal crest. Prompt: "Text EXACTLY two lines: Miracle above Clock. Warm storybook illustration, ivory and brass serif lettering, dark teal fine silhouette edging, wing ornaments, handcrafted gears. Small ornate round magic clock, wood ring, brass and teal enamel, cream face with two visible hands. No other words, no rectangular plaque. Genuine transparent alpha."
- `src/icons/luca-clock-{180,192,512}.png`: new square app icon, Luca's smiling face with the existing gemstone-ring magic clock and a parcel. Prompt: "Luca's exact character: chestnut hair, amber eyes, aviator goggles, orange scarf, teal jacket. Face principal subject, magic clock clear secondary subject: brass/wood ring, teal enamel, colorful gemstones, ivory face, teal short hand and copper long hand. Kraft parcel, deep teal full bleed background. Warm storybook paint, readable at 60 pixels, no text."
- `src/assets/menu-icons.webp`: shared existing Miracle Mine menu sprite, used for the adventure, instructions and settings buttons.
Generated source PNGs converted/resized for delivery; logo alpha preserved. Original clock-only icons retained as previous assets; all active manifest and Apple icon references use the Luca version.

## 配送所と中央配送所の開所準備（0.4.0）

- `depot-icons.webp`: 3列×2行。森の受付小屋、港の荷物桟橋、結晶の洞窟受付、真鍮の工房、雲の通信所、砂丘の温室。各章の緑・青緑・紫・銅・空色・淡い赤を使った、真鍮枠の円形メダリオン。人物の肖像の代わりに使用。
- `central-preparation.webp`: 4列×2行の固定視点。閉じた配送所から、受付カウンター→荷物棚→結晶の案内灯→仕分け機→通信塔→花の開所看板の順に加わる。最後の補助セルは夕景。温かな絵本風、木・真鍮・浮遊島の空の港。文字は画像に焼き込まずUIで表示。
- 生成時は既存の配送所・タイトルの画像を参照。アトラスのセル位置は `depot.js` にまとめ、CSSの背景位置で描画。

## クリア演出（0.4.2）

`luka-victory.webp` は同一作者の Miracle Mine の喜ぶルカをそのまま共有。拳と顔を切らず、結果枠内にcontain表示。`celebration.js` の64枚の紙吹雪・20個の星・2つの光輪もMineから共有し、操作を遮らず一度だけ再生。動きを減らす設定では静止画のみ。
