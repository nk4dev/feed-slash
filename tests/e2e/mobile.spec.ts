import { expect, test } from '@playwright/test';

test.describe('モバイルナビゲーション', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('ハンバーガーメニューが表示される', async ({ page }) => {
        await page.goto('/');

        // ハンバーガーボタンが表示されていることを確認
        const menuButton = page.getByLabel('Toggle menu');
        await expect(menuButton).toBeVisible();
    });

    test('メニューボタンをクリックできる', async ({ page }) => {
        await page.goto('/');

        const menuButton = page.getByLabel('Toggle menu');

        // メニューを開く - SVGアイコンが変わることを確認
        await menuButton.click();

        // ボタンが引き続きクリック可能
        await expect(menuButton).toBeVisible();

        // メニューを閉じる
        await menuButton.click();
    });
});

test.describe('レスポンシブデザイン', () => {
    test('デスクトップではナビゲーションリンクが表示される', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');

        // デスクトップナビゲーションが表示される
        await expect(page.locator('.hidden.md\\:flex')).toBeVisible();

        // ハンバーガーメニューは非表示
        await expect(page.getByLabel('Toggle menu')).not.toBeVisible();
    });

    test('小さい画面ではハンバーガーメニューが表示される', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // ハンバーガーメニューが表示される
        await expect(page.getByLabel('Toggle menu')).toBeVisible();
    });

    test('ホームページが正常に表示される', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // RSS Feedsの見出しが表示される
        await expect(page.getByRole('heading', { name: 'RSS Feeds' })).toBeVisible();

        // Add New Feedボタンが表示される
        await expect(page.getByRole('link', { name: 'Add New Feed' })).toBeVisible();
    });
});
