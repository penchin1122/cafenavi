# カフェナビ

駅と目的（作業・会話・休憩など）からカフェを探せる検索サイトです（β版）。

## ファイル構成

- `index.html` … サイト本体（画面だけ。データは開いたときに下の2つから読み込みます）
- `stations.json` … 駅データ（東京・神奈川・埼玉・千葉の駅）
- `cafes.json` … 店舗データ（ODbL。フッターからのダウンロード用も兼ねています）
- `terms.html` … 利用規約・免責事項・個人情報の取り扱い
- `build_data.py` … 開発用の元データ（正本）から `stations.json` と `cafes.json` を作るスクリプト
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

## データの更新手順

1. 開発用の元データ（正本。claude.ai のアーティファクト）で店舗を追加・修正する
2. 正本の HTML を保存し、`python3 build_data.py 正本.html` を実行する（非表示の店は自動で除かれます）
3. `out/` にできた `stations.json`・`cafes.json` をアップロードして上書きする（画面を変えない限り `index.html` はそのまま）

※ `index.html` をパソコンで直接開くと、データを読み込めず「店舗データを読み込めませんでした」と出ます。確認は公開サイトか、`python3 -m http.server` で起動したローカルサーバーで行ってください。


## ログイン機能（Firebase）の設定

ログイン機能は、`index.html` の `FIREBASE_CONFIG` が空（`null`）の間は表示されません。設定するまでは、今までどおり保存は端末内だけで動きます。

### 1. Firebase のプロジェクトを作る
1. https://console.firebase.google.com/ を開き、「プロジェクトを作成」（名前の例：`cafenavi`）。Google アナリティクスはオフで構いません
2. プロジェクトの「概要」で「ウェブ（</>）」のアイコンを押し、アプリを登録する（ニックネームの例：`cafenavi-web`。Hosting の設定は不要）
3. 表示された `firebaseConfig = { ... }` の中身を控えておく

### 2. ログイン方法を有効にする
1. 左のメニュー「構築」→「Authentication」→「始める」
2. 「Sign-in method」で「メール / パスワード」を有効にする（「メールリンク」はオフのまま）
3. 「設定」→「承認済みドメイン」に `penchin1122.github.io` を追加する
4. 「Templates」で言語を日本語にしておくと、確認メールや再設定メールが日本語になる

### 3. 保存一覧の置き場所（Firestore）を作る
1. 「構築」→「Firestore Database」→「データベースの作成」
2. ロケーションは `asia-northeast1（東京）`、「本番環境モード」で作成
3. 「ルール」タブを開き、次の内容に置き換えて「公開」する

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['favs', 'updatedAt'])
        && request.resource.data.favs is map
        && request.resource.data.favs.size() <= 2000;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. `index.html` に設定を書き込む
`index.html` の中の `var FIREBASE_CONFIG=null;` を、手順1で控えた内容に書き換えてアップロードする。

```js
var FIREBASE_CONFIG={
  apiKey:"AIza...",
  authDomain:"cafenavi-xxxxx.firebaseapp.com",
  projectId:"cafenavi-xxxxx",
  appId:"1:xxxx:web:xxxx"
};
```

※ この設定値は公開しても問題ない種類のものです（読み書きの制限は、上のルールと承認済みドメインで行います）。

### 5. 規約の連絡先を埋める
`terms.html` の「（お問い合わせ用メールアドレス）」を、問い合わせ専用に作ったメールアドレスに書き換える。

## データについて

- 店舗データ：© OpenStreetMap contributors（ODbL）
- 駅データ：TrainLCD StationAPI の公開データを加工
