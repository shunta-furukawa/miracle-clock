# アート出典と生成プロンプト

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

