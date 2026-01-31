import { expect, test } from '@playwright/test';

test.describe('フィード追加ページ', () => {
    test('フォームが正しく表示される', async ({ page }) => {
        await page.goto('/add');

        await expect(page.getByRole('heading', { name: 'Add new feed' })).toBeVisible();
        await expect(page.getByLabel('Feed URL')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Feed' })).toBeVisible();
    });

    test('ページタイトルが正しく設定されている', async ({ page }) => {
        await page.goto('/add');

        await expect(page).toHaveTitle(/Add New Feed - Feed Slash/);
    });

    test('URLフィールドが必須属性を持っている', async ({ page }) => {
        await page.goto('/add');

        const urlInput = page.getByLabel('Feed URL');
        await expect(urlInput).toHaveAttribute('required', '');
        await expect(urlInput).toHaveAttribute('type', 'url');
    });

    test('プレースホルダーが正しく表示される', async ({ page }) => {
        await page.goto('/add');

        const urlInput = page.getByLabel('Feed URL');
        await expect(urlInput).toHaveAttribute('placeholder', 'https://example.com/feed.xml');
    });

    test('無効なURLでバリデーションエラーが発生する', async ({ page }) => {
        await page.goto('/add');

        const urlInput = page.getByLabel('Feed URL');
        await urlInput.fill('not-a-valid-url');

        await page.getByRole('button', { name: 'Add Feed' }).click();

        // ブラウザのバリデーションメッセージを確認
        const validationMessage = await urlInput.evaluate((el: HTMLInputElement) => el.validationMessage);
        expect(validationMessage).toBeTruthy();
    });

    test('有効なURL形式が受け入れられる', async ({ page }) => {
        await page.goto('/add');

        const urlInput = page.getByLabel('Feed URL');
        await urlInput.fill('https://example.com/feed.xml');

        const validationMessage = await urlInput.evaluate((el: HTMLInputElement) => el.validationMessage);
        expect(validationMessage).toBe('');
    });
});
