## Plan: Agent APIキー作成機能

既存のトークン基盤（作成・一覧・削除API）は活用しつつ、保存方式を平文からハッシュへ移行し、設定画面でキー管理UIを完成させます。方針は「管理UI + Agent API連携」「有効期限は任意（デフォルト無期限）」「query token継続」「既存平文キーは互換移行」です。これにより既存利用者を壊さずにセキュリティを強化し、未実装の設定画面を実運用可能にします。加えて、欠落しているApiTokensマイグレーションを整備して、新規環境でも再現可能な状態に揃えます。

**Steps**
1. 現行スキーマとマイグレーションの整合を修正し、ApiTokensの土台を確立  
   - 更新対象: [lib/schema.ts](lib/schema.ts), [drizzle](drizzle), [drizzle/meta/_journal.json](drizzle/meta/_journal.json)  
   - apiTokensに tokenHash, tokenPrefix, expiresAt, lastUsedAt を追加し、tokenHash一意制約と userId索引を定義  
   - 既存 token 列は互換期間のため一時維持（後段で段階削除可能な形）

2. トークン作成APIをハッシュ保存・ワンタイム返却に変更  
   - 更新対象: [server/api/tokens.post.ts](server/api/tokens.post.ts)  
   - 平文キーを生成してレスポンスで一度だけ返し、DBにはtokenHashのみ保存  
   - 期限は任意入力（未指定は無期限）として保存し、レスポンスにメタ情報を同梱

3. トークン一覧/削除APIを新スキーマに合わせて調整  
   - 更新対象: [server/api/tokens.get.ts](server/api/tokens.get.ts), [server/api/tokens.delete.ts](server/api/tokens.delete.ts)  
   - 一覧は tokenPreview, expiresAt, lastUsedAt を返却し、秘密値は返さない  
   - 削除は現行のユーザースコープ検証を維持

4. Agent API認証をハッシュ検証 + 互換移行に対応  
   - 更新対象: [server/api/agents.ts](server/api/agents.ts)  
   - query token を受け取り、まずハッシュ照合、未一致時は旧平文照合（互換）  
   - 旧平文で一致した場合はその場でハッシュへバックフィル  
   - 期限切れを401で拒否し、成功時にlastUsedAtを更新

5. APIキー管理画面を実装（作成・一覧・削除・ワンタイム表示）  
   - 更新対象: [app/pages/settings/api-key.vue](app/pages/settings/api-key.vue)  
   - 画面初期化で一覧取得、作成フォーム（label/任意期限）、削除操作を実装  
   - 作成直後のみ平文キーを表示し、コピー導線を提供  
   - 既存ページのUIパターンに合わせる（例: [app/pages/add.vue](app/pages/add.vue), [app/pages/bookmark/folder/index.vue](app/pages/bookmark/folder/index.vue)）

6. Agent API設定画面を実キー連携に変更  
   - 更新対象: [app/pages/settings/agent-api.vue](app/pages/settings/agent-api.vue)  
   - TEST固定値を廃止し、直近作成キー（ワンタイム表示中）または選択キーのプレビューでURL生成  
   - コピー対象を実運用URLへ更新し、キー未作成時の案内を追加

7. 設定導線と表示文言を最終調整  
   - 更新対象: [app/pages/settings/index.vue](app/pages/settings/index.vue)  
   - 必要ならリンク文言を「Agent API」「APIキー管理」の責務に合わせて明確化

**Verification**
- マイグレーション整合確認（生成SQL・journal反映・新規DB適用）
- API手動確認  
  - POST /api/tokens: 平文キーが一度だけ返る  
  - GET /api/tokens: 平文が返らず、expiresAt/lastUsedAtが返る  
  - GET /api/agents?token=: 有効キーで成功、期限切れは401、成功時lastUsedAt更新  
  - DELETE /api/tokens: 自分のキーのみ削除可能
- UI確認  
  - [app/pages/settings/api-key.vue](app/pages/settings/api-key.vue): 作成→コピー→再読込で平文再表示されない  
  - [app/pages/settings/agent-api.vue](app/pages/settings/agent-api.vue): placeholder廃止、実データでURLコピー
- 回帰確認  
  - bun run test:e2e（既存ナビゲーションや静的ページの破壊がないこと）

**Decisions**
- 管理UI + Agent API連携まで実施
- 保存方式はハッシュ + expiresAt/lastUsedAt
- Agent APIの受け渡しは当面query token継続
- 既存平文キーは互換移行（段階的バックフィル）で無停止移行
