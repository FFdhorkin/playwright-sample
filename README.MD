# Running tests
1. Open `testData.json` and fill in the `username` and `password` fields under `credentials`.
2. Run `npm i` to install dependencies
3. Run `npm run test` to execute tests (or `npm run test:ui` to run in UI mode)

## Introduction
The repo contains a Playwright test suite of parameterized, dynamically generated test cases that pull data from a JSON file to minimize code duplication.

This makes it simple to add/remove test cases without needing to modify actual code.

Each test verifies a given task is part of a specific project and contains a task in an expected state with expected tags.

NOTE: username/password are blank to follow best-practices, even though they're not a security risk since this is a demo app. In order to run the automation, username/password must be provided in testData.json.

## Implementation Details:
Data including urls, credentials, and test cases (projects, columns/task state, task names, and expected tags) are stored in a JSON file, which is imported in the test spec.

Test cases are dynamically generated from the JSON via a forEach loop that iterates over the `testCases` property in the JSON.

Before any test is run, there is a beforeEach hook that signs into the web page, as the sign-in process is not actually part of the requested test suite. While this could have been placed in forEach that generates test cases, this ensures that if a failure occurs during the sign-in phase, it doesn't look like the test case itself failed.

## Challenges and Solutions:
Playwright contains a feature called "fixtures" which let you provide an object that should be provided to test cases, which is extremely similar to the imported JSON I am using to generate tests. The original version of my code used these fixtures for the login credentials.

However, Playwright fixtures are not available outside of the `test` object, meaning that while I could have used Fixtures for this task, I would have had to use testData[index] in addition to a forEach loop, which would lead to less readable/maintainable code. Since the forEach that generates the tests could also provide the test fixture, I did everything together to improve readability.

## Results:
Test cases all pass. Note, however, that if the log-in flow is throttled or has bot detection or additional security measures such as captchas or email verification, that these tests will fail in the beforeEach hook.

## Recommendations:
In a production environment, username/password should be provided via a secret manager (e.g. GitHub), not via plain-text JSON.

Many of the controls on the page being tested do not have test identifiers. In order to unambiguously select the correct controls (and not, for example, a parent thereof), I had to use CSS classes to narrow the locators. This is brittle, as changing the CSS could cause the tests to break, even though the only change is visual.

For example, tags on a task are <span> with the CSS property "rounded-full." However, if this was changed to a rectangle, this automation would break.

By adding a test ids to controls (e.g. `<div test-id="task">` and `<span test-id="tag">`), the code about direct descendants and CSS locators could be removed/simplified and made less brittle.

Worse, though, is that selecting by text was required at times. A test-id would remain the same even if multiple language versions of a page were available or if labels were changed later. For example, I had to search for a button that had "Sign in" as its label. A Spanish user would have "Iniciar Sesión" on the button text, but this automation would be unable to run in a Spanish translation of the page. Selecting a button with id "sign-in" would work even if the language was something completely unexpected.

As a final thought, a dedicated "does log in work" test case would probably be a good idea, even though the beforeEach hook signs in at the start of each test case.