import { expect, test } from '@playwright/test';

test('requester can submit, track, reply to and progress a ticket', async ({ page }) => {
  const suffix = Date.now();
  const email = `m1-${suffix}@example.com`;

  await page.goto('/register');
  await page.getByTestId('register-form').locator('input[type="email"]').fill(email);
  await page.getByTestId('register-form').locator('input[type="text"]').fill('M1 Requester');
  await page
    .getByTestId('register-form')
    .locator('input[type="password"]')
    .nth(0)
    .fill('Password123');
  await page
    .getByTestId('register-form')
    .locator('input[type="password"]')
    .nth(1)
    .fill('Password123');
  await page.getByTestId('register-form').getByRole('button').click();

  await expect(page).toHaveURL(/\/workspaces\/create/);
  await page
    .getByTestId('create-workspace-form')
    .locator('input[type="text"]')
    .nth(0)
    .fill('Acme Ops');
  await expect(
    page.getByTestId('create-workspace-form').locator('input[type="text"]').nth(1),
  ).toHaveValue('acme-ops');
  await page.getByTestId('create-workspace-form').getByRole('button').click();
  await expect(page).toHaveURL('http://localhost:3001/');

  await page.goto('/tickets/new');
  const authState = await page.evaluate(() => ({
    token: localStorage.getItem('access_token'),
    workspace: localStorage.getItem('current_workspace'),
  }));
  expect(authState.token).toContain('mock_access_token_');
  expect(authState.workspace).toContain('Acme Ops');
  await expect(page.getByTestId('ticket-submit-form')).toBeVisible();
  await page.getByLabel('Title').fill('VPN access is unavailable');
  await page
    .getByLabel('Description')
    .fill('Remote users cannot connect to the VPN from Windows laptops.');
  await page.getByLabel('Priority').selectOption('P2');
  await page.getByLabel('Category').fill('network');
  const createTicketResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/workspaces/') &&
      response.url().includes('/tickets') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Submit ticket' }).click();
  const createTicketResponse = await createTicketResponsePromise;
  expect(createTicketResponse.request().headers().authorization).toContain('mock_access_token_');
  expect(createTicketResponse.status()).toBe(201);

  await expect(page).toHaveURL(/\/workspaces\/[^/]+\/tickets\/[^/]+/);
  await expect(page.getByRole('heading', { name: 'VPN access is unavailable' })).toBeVisible();
  await expect(page.getByText('Remote users cannot connect to the VPN')).toBeVisible();
  await expect(page.getByText('NEW')).toBeVisible();

  const listTicketsResponsePromise = page.waitForResponse(
    (response) =>
      /\/api\/v1\/workspaces\/[^/]+\/tickets$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'GET',
  );
  await page.goto('/tickets');
  const listTicketsResponse = await listTicketsResponsePromise;
  expect(listTicketsResponse.status()).toBe(200);
  await expect(page.getByRole('link', { name: 'VPN access is unavailable' })).toBeVisible();
  await expect(page.getByText('P2')).toBeVisible();
  await page.getByRole('link', { name: 'VPN access is unavailable' }).click();

  await page
    .getByPlaceholder('Write a reply or internal note')
    .fill('I am checking the VPN concentrator.');
  await page.getByRole('button', { name: 'Add message' }).click();
  await expect(page.getByText('I am checking the VPN concentrator.')).toBeVisible();

  await page.getByRole('button', { name: 'Start work' }).click();
  await expect(page.getByText('IN_PROGRESS')).toBeVisible();
});
