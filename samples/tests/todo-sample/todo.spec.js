const { test, expect } = require('@playwright/test');



test.describe("Todo Component", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/samples/todo/todo.html`);
    })
    
    test('renders component', async ({ page }) => {

        const button = page.getByRole('button', { name: "Add" });
        const ivalueInput = page.getByLabel('New TODO');


        // Expect a title "to contain" a substring.
        await expect(page).toHaveTitle(/My TODOs/);

        await expect(ivalueInput).toBeInViewport();
        await expect(button).toBeInViewport();
        await expect(button).toBeDisabled();
    });
    test('adds value to input and enabled', async ({ page }) => {

        const button = page.getByRole('button', { name: "Add" });
        const ivalueInput = page.getByLabel('New TODO');

        await expect(ivalueInput).toBeInViewport();
        await expect(button).toBeInViewport();
        await expect(button).toBeDisabled();
        

        // 3 char or less will be disabled
        await ivalueInput.fill('hel');
        await expect(button).toBeDisabled();

        // more than 3 char enabled
        await ivalueInput.fill('helllo');
        // await page.close()
        // await expect(button).toBeEnabled();


    });
})
