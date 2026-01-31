import { expect, test } from '@playwright/test';

test.describe('ホームページ', () => {
    test('ヘッダーとロゴが表示される', async ({ page }) => {
        await page.goto('/');

        // ヘッダーが表示されていることを確認
        await expect(page.locator('header')).toBeVisible();

        // ロゴリンクが表示されていることを確認
        await expect(page.getByRole('link', { name: 'f/' })).toBeVisible();
    });

    test('ナビゲーションリンクが表示される', async ({ page }) => {
        await page.goto('/');

        // デスクトップナビゲーションリンクを確認
        await expect(page.locator('nav').getByRole('link', { name: "Today's Digest" })).toBeVisible();
        await expect(page.locator('nav').getByRole('link', { name: 'Bookmarks' })).toBeVisible();
    });

    test('ページタイトルが正しく設定されている', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/RSS Feeds - Feed Slash/);
    });

    test('RSS Feedsの見出しが表示される', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('heading', { name: 'RSS Feeds' })).toBeVisible();
    });

    test('Add New Feedボタンが表示される', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('link', { name: 'Add New Feed' })).toBeVisible();
    });

    test('フッターリンクが表示される', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('link', { name: 'Precautions when using' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    });
});
