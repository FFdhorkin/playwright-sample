import type { Locator, Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { loginUrl, signedInUrl, credentials, testCases } from './testData.json';

/**
 * Locate the cell that contains a specific task in a specific column.
 * @param page Page object, from test parameters
 * @param columnName Name of Agile column that task should be under
 * @param taskName Name of task that should be present
 * @returns Locator for the required task
 */
function locateTaskInColumn(page: Page, columnName: string, taskName: string) {
    const column = page.locator('main')
        .locator('div.flex-col', { has: page.getByRole('heading', { name: columnName })});
    // Due to lack of test-ids for task cells, there is no tidy way to select the cell with a given header
    // This looks for a direct descendant <div> of the Todo column that has a <div> that has a header matching the task name
    // A better solution would be to modify the webpage code to include a test ID field called taskCell
    // and then simply look for a taskCell with a matching header
    return column
        .locator('>div')
        .locator('>div', { has: page.getByRole('heading', { name: taskName })});
}

/**
 * Assert that a task contains the specified tags
 * @param taskCell Locator returned by locateTaskInColumn corresponding to a Task that is in an expected state
 * @param tagsText Array of strings for the tags that should be present
 * @param exactMatch If true, any extraneous tags will cause a failed test
 * @returns Promise containing assertions that must be awaited
 */
async function assertTaskHasTags(taskCell: Locator, tagsText: string[], exactMatch: boolean = true) {
    const visibilityAssertions = Promise.all(tagsText.map(async (tag) => 
        expect(taskCell.locator('//span', { hasText: tag }))
            .toBeVisible())
    );
    if (exactMatch) {
        // rounded-full is a CSS class that approximates being able to specifically target the tags,
        // since the assignee and date are also <span>s
        return visibilityAssertions.then(async () => 
            expect(new Set(await taskCell.locator('span.rounded-full').allInnerTexts())).toStrictEqual(new Set(tagsText))
        );
    } else {
        return visibilityAssertions;
    }
}

test.describe('Asana sample tests', () => {
    // This beforeEach signs in before each test case is executed
    test.beforeEach(async ({ page }) => {
        await page.goto(loginUrl, { waitUntil: 'domcontentloaded'});

        // While these next few commented lines work, it is generally better to select by an id,
        // as that should be unambiguous and will work even if a page contains multiple language variants
        // or multiple occurrances of a string such as 'Username'

        // await page.getByRole('textbox', { name: 'Username' })
        //     .fill(credentials.username);
        // await page.getByRole('textbox', { name: 'Password' })
        //     .fill(credentials.password);
            
        await page.fill("[id='username']", credentials.username);
        await page.fill("[id='password']", credentials.password);
        await page.getByRole('button', { name: 'Sign in' })
            .click();
        await page.waitForURL(signedInUrl, { waitUntil: 'domcontentloaded' });
    });

    // Dynamically generate test cases based on the JSON data in testData.json
    testCases.forEach(({ project, column, task, expectedTags }, i) => {
        test(`Test Case ${i + 1}`, async ({ page }) => {
            await page.getByRole('button', { name: project})
                .click();
            const taskCell = locateTaskInColumn(page, column, task)
            await expect(taskCell).toBeVisible();
            await assertTaskHasTags(taskCell, expectedTags);
        })
    });
});