# カフェナビ

駅と目的（作業・会話・休憩など）からカフェを探せる検索サイトです（β版）。

## ファイル構成

- `index.html` … サイト本体（店舗データも中に含まれています）
- `terms.html` … 利用規約・免責事項
- `cafes.json` … 店舗データ（ODbL。フッターからダウンロードできるようにしています）
- `.nojekyll` … GitHub Pages の変換処理を止めるための空ファイル

## GitHub Pages での公開手順

1. GitHub で新しいリポジトリを作る（名前の例：`cafenavi`、公開設定は Public）
2. リポジトリの「Add file」→「Upload files」から、このフォルダの中身をすべてアップロードする
3. 「Settings」→「Pages」を開き、「Branch」を `main`、フォルダを `/ (root)` にして保存する
4. 数分待つと `https://ユーザー名.github.io/cafenavi/` で公開される

## 報告フォーム（Googleフォーム）の設定

1. Googleフォームを新規作成し、次の3つの質問を作る
   - 店名（記述式）
   - 報告内容（ラジオボタン：閉店・移転していた／カフェではなかった／営業時間・価格などが違う／その他）
   - 補足（段落）
2. 右上の「︙」→「事前入力したURLを取得」を開き、適当な値を入れて「リンクを取得」
3. 取得したURLに含まれる `entry.数字` を、`index.html` 内の `REPORT_FORM` に書き込む

```js
var REPORT_FORM={
  url:"https://docs.google.com/forms/d/e/XXXXXXXX/viewform",
  shopEntry:"entry.111111111",
  reasonEntry:"entry.222222222",
  noteEntry:"entry.333333333"
};
```

設定するまでは、報告ボタンを押すと「報告フォームは準備中です」と表示されます。

## データについて

- 店舗データ：© OpenStreetMap contributors（ODbL）
- 駅データ：TrainLCD StationAPI の公開データを加工
