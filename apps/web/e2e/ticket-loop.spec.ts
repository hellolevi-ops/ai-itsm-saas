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

  await page.goto('/service-catalog');
  const serviceItemForm = page.getByTestId('service-item-form');
  await serviceItemForm.getByPlaceholder('Service name').fill('Access requests');
  await serviceItemForm.getByPlaceholder('Category').fill('access');
  await serviceItemForm
    .getByPlaceholder('Description')
    .fill('Access requests for business applications and employee systems.');
  await serviceItemForm.getByLabel('Response target minutes').fill('60');
  await serviceItemForm.getByLabel('Resolution target minutes').fill('480');
  await serviceItemForm.getByRole('button', { name: 'Add service' }).click();
  await expect(page.getByRole('heading', { name: 'Access requests' })).toBeVisible();

  const requestTemplateForm = page.getByTestId('request-template-form');
  await requestTemplateForm.locator('select[name="service_catalog_item_id"]').selectOption({
    label: 'Access requests',
  });
  await requestTemplateForm.getByPlaceholder('Template name').fill('VPN access request');
  await requestTemplateForm.getByPlaceholder('Default title').fill('VPN access is unavailable');
  await requestTemplateForm.getByPlaceholder('Default category').fill('network');
  await requestTemplateForm
    .getByPlaceholder('Default description')
    .fill('Remote users cannot connect to the VPN from Windows laptops.');
  await requestTemplateForm.locator('select[name="default_priority"]').selectOption('P2');
  await requestTemplateForm.getByRole('button', { name: 'Add template' }).click();
  await expect(page.getByText('VPN access request')).toBeVisible();

  await page.goto('/tickets/new');
  const authState = await page.evaluate(() => ({
    token: localStorage.getItem('access_token'),
    workspace: localStorage.getItem('current_workspace'),
  }));
  expect(authState.token).toContain('mock_access_token_');
  expect(authState.workspace).toContain('Acme Ops');
  await expect(page.getByTestId('ticket-submit-form')).toBeVisible();
  await page
    .getByLabel('Request template')
    .selectOption({ label: 'Access requests / VPN access request' });
  await expect(page.getByLabel('Title')).toHaveValue('VPN access is unavailable');
  await expect(page.getByLabel('Description')).toHaveValue(
    'Remote users cannot connect to the VPN from Windows laptops.',
  );
  await expect(page.getByLabel('Priority')).toHaveValue('P2');
  await expect(page.getByLabel('Category')).toHaveValue('network');
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
  await expect(page.getByRole('heading', { name: 'Service targets' })).toBeVisible();
  await expect(page.getByText('Custom request')).not.toBeVisible();
  await expect(page.getByText('Not set')).not.toBeVisible();

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

  await page.getByRole('button', { name: 'Generate suggestion' }).click();
  await expect(page.getByText('network', { exact: true })).toBeVisible();
  await expect(page.getByText(/Human review required/)).toBeVisible();

  await page
    .getByPlaceholder('Write a reply or internal note')
    .fill('I am checking the VPN concentrator.');
  await page.getByRole('button', { name: 'Add message' }).click();
  await expect(page.getByText('I am checking the VPN concentrator.')).toBeVisible();

  await page.getByRole('button', { name: 'Start work' }).click();
  await expect(page.getByText('IN_PROGRESS')).toBeVisible();

  await page.getByRole('button', { name: 'Resolve' }).click();
  await expect(page.getByText('RESOLVED')).toBeVisible();
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page.getByText('How to resolve: VPN access is unavailable')).toBeVisible();
  await expect(page.getByText('DRAFT 路 INTERNAL')).toBeVisible();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('PUBLISHED 路 REQUESTER')).toBeVisible();

  await page.goto('/knowledge');
  await expect(page.getByRole('heading', { name: 'Knowledge' })).toBeVisible();
  await page.getByPlaceholder('Search knowledge').fill('VPN');
  await expect(page.getByText('How to resolve: VPN access is unavailable')).toBeVisible();
});
