import { expect, test } from '@playwright/test';

test.describe('Privacy Policyページ', () => {
    test('必要なセクションが表示される', async ({ page }) => {
        await page.goto('/privacy');

        await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Information We Collect' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'How We Use Your Information' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Data Storage and Security' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Third-Party Services' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Your Rights' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
    });

    test('ページタイトルが正しく設定されている', async ({ page }) => {
        await page.goto('/privacy');

        await expect(page).toHaveTitle(/Privacy Policy - Feed Slash/);
    });

    test('最終更新日が表示される', async ({ page }) => {
        await page.goto('/privacy');

        await expect(page.getByText('Last updated:')).toBeVisible();
    });
});

test.describe('Precautionsページ', () => {
    test('必要なセクションが表示される', async ({ page }) => {
        await page.goto('/precautions');

        await expect(page.getByRole('heading', { name: 'Precautions when using' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Usage Guidelines' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Service Availability' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'User Responsibilities' })).toBeVisible();
    });

    test('ページタイトルが正しく設定されている', async ({ page }) => {
        await page.goto('/precautions');

        await expect(page).toHaveTitle(/Precautions when using - Feed Slash/);
    });
});
