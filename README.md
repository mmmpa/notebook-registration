# notebook-registration

To install dependencies:

```bash
bun install
npx playwright install
```

To run:

```bash
bun run src/index.ts
```

To test:

```bash
./test.sh
```

## Google Login Issues

Googleは自動化されたブラウザからのログインをブロックすることがあります。以下の対策があります：

### 1. 認証情報を事前に保存する（推奨）

```bash
# 手動でログインして認証情報を保存
bun run save-auth.ts

# 保存した認証情報を使用してサーバーを起動
PLAYWRIGHT_AUTH_FILE=tmp/auth.json bun run src/index.ts
```

### 2. 既存のChromeプロファイルを使用

```bash
# Chromeのユーザーデータディレクトリを確認
# macOS: ~/Library/Application Support/Google/Chrome
# Linux: ~/.config/google-chrome
# Windows: %USERPROFILE%\AppData\Local\Google\Chrome\User Data

# プロファイルを指定して起動（index.tsの修正が必要）
```

### 3. その他の回避策

- VPNを無効にする
- 同じIPアドレスから頻繁にアクセスしない
- 2段階認証を一時的に無効にする（非推奨）

## ブックマークレット

現在開いているページをNotebookLMに登録するためのブックマークレットです。

### 設定方法

1. ブラウザのブックマークバーを表示
2. 新しいブックマークを作成
3. 名前: `NotebookLM登録`
4. URL: 以下のコードをコピー&ペースト

```javascript
javascript:(function(){
  const url = window.location.href;
  fetch('https://YOUR_DOMAIN.ts.net:10001/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('NotebookLMに登録しました: ' + url);
    } else {
      alert('登録に失敗しました: ' + (data.details || data.error));
    }
  })
  .catch(error => {
    alert('エラーが発生しました: ' + error.message);
  });
})();
```

### 使用方法

#### HTTPS (Tailscale証明書を使用)

**重要**: ブックマークレットをHTTPSサイトで使用する場合、HTTPサーバーへのリクエストはMixed Contentエラーによりブロックされます。必ずHTTPSモードで起動してください。

1. Tailscale証明書を取得:
   ```bash
   tailscale cert YOUR_DOMAIN.ts.net
   ```
2. HTTPSサーバーを起動:
   ```bash
   HTTPS=true \
   TLS_KEY_PATH=./YOUR_DOMAIN.ts.net.key \
   TLS_CERT_PATH=./YOUR_DOMAIN.ts.net.crt \
   PLAYWRIGHT_AUTH_FILE=tmp/auth.json \
   bun run src/index.ts
   ```
3. ブックマークレットのURLを `https://YOUR_DOMAIN.ts.net:10001/register` に変更

**環境変数**:
- `TLS_KEY_PATH`: TLS秘密鍵ファイルのパス (デフォルト: `./key.pem`)
- `TLS_CERT_PATH`: TLS証明書ファイルのパス (デフォルト: `./cert.pem`)

**メリット**: Tailscale証明書は信頼されているため、ブラウザでの手動許可が不要です。

**注意**: HTTPSサイトからHTTPサーバーへのリクエストは、Mixed Contentエラーにより使用できません。必ずHTTPSモードで起動してください。
