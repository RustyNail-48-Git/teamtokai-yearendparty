# web3tokai-yearendparty

11/29（日）に開催される web3tokai 大忘年会（ガーデン伏見・リリーバンケット）の参加申込みフォームです。

## 技術スタック
- フロントエンド: HTML5 / CSS3 (Vanilla) / JavaScript (Vanilla)
- バックエンド: Google スプレッドシート + Google Apps Script (GAS)
- ホスティング: GitHub Pages

## 構成ファイル
- `index.html`: イベント概要と入力フォーム
- `style.css`: 年末の夜をイメージしたネイビー × ゴールドのデザイン
- `script.js`: バリデーション、参加費計算、GASとの連携送信ロジック、ゴミ拾い表示の切り替え（`GOMI_ENABLED`）
- `setup-guide.md`: Google スプレッドシートおよびGASのセットアップ手順書
