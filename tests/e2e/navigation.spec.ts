import { expect, test } from '@playwright/test';

test.describe('ナビゲーション', () => {
    test('Add New Feedページに遷移できる', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('link', { name: 'Add New Feed' }).click();

        await expect(page).toHaveURL('/add');
        await expect(page.getByRole('heading', { name: 'Add new feed' })).toBeVisible();
    });

    test("Today's Digestページに遷移できる", async ({ page }) => {
        await page.goto('/');

        await page.locator('nav').getByRole('link', { name: "Today's Digest" }).click();

        await expect(page).toHaveURL('/today-digest');
    });

    test('Bookmarksページに遷移できる', async ({ page }) => {
        await page.goto('/');

        await page.locator('nav').getByRole('link', { name: 'Bookmarks' }).click();

        await expect(page).toHaveURL('/bookmark');
    });

    test('Privacy Policyページに遷移できる', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('link', { name: 'Privacy Policy' }).click();

        await expect(page).toHaveURL('/privacy');
        await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    });

    test('Precautionsページに遷移できる', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('link', { name: 'Precautions when using' }).click();

        await expect(page).toHaveURL('/precautions');
        await expect(page.getByRole('heading', { name: 'Precautions when using' })).toBeVisible();
    });

    test('Privacy PolicyページからHomeに戻れる', async ({ page }) => {
        await page.goto('/privacy');

        await page.getByRole('link', { name: '← Back to Home' }).click();

        await expect(page).toHaveURL('/');
    });

    test('PrecautionsページからHomeに戻れる', async ({ page }) => {
        await page.goto('/precautions');

        await page.getByRole('link', { name: '← Back to Home' }).click();

        await expect(page).toHaveURL('/');
    });

    test('ロゴをクリックするとホームに戻る', async ({ page }) => {
        await page.goto('/privacy');

        await page.getByRole('link', { name: 'f/' }).click();

        await expect(page).toHaveURL('/');
    });
});
