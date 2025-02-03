## Code Review

Pull requests should be titled in the format of `#issue_number: Descriptive name ideally matching ticket name - [sandbox]`
Pull requests including a migration should be suffixed with ` - MIGRATION`

After creating a pull request, pull request submitters should:
- Message on Slack or in standup to notify the team that a PR is ready for review.
- If any model was updated to modify/add/delete columns, run makemigrations and commit the associated migrations file.

## Pull request approvals
Code changes on user-facing features (excluding content updates) require approval from at least one developer and one designer.
All other changes require a single approving review.

The submitter is responsible for merging their PR unless the approver is given explicit permission. Similarly, do not commit to another person's branch unless given explicit permission.

Bias towards approving i.e. "good to merge once X is fixed" rather than blocking until X is fixed, requiring an additional review.

## Pull Requests for User-facing changes
When making or reviewing user-facing changes, test that your changes work on multiple browsers including Chrome, Microsoft Edge, Firefox, and Safari.

Add new pages to the .pa11yci file so they are included in our automated accessibility testing.

## Other Pull request norms
- Keep pull requests as small as possible. This makes them easier to review and track changes.
- Write descriptive pull requests. This is not only something that makes it easier to review, but is a great source of documentation. 

## Coding standards

### Plain language
All functions and methods should use plain language.