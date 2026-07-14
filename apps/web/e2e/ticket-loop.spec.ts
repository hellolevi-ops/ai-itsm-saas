import { expect, test } from '@playwright/test';

test('requester can submit, track, reply to and progress a ticket', async ({ page }) => {
  const suffix = Date.now();
  const email = `m1-${suffix}@example.com`;

  await page.goto('/');
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const live = await fetch('/api/v1/health/live');
        const ready = await fetch('/api/v1/health/ready');
        const liveText = await live.text();
        const readyText = await ready.text();
        if (!liveText.startsWith('{') || !readyText.startsWith('{')) {
          return { liveStatus: live.status, readyStatus: ready.status, pending: true };
        }
        return {
          liveStatus: live.status,
          readyStatus: ready.status,
          liveBody: JSON.parse(liveText),
          readyBody: JSON.parse(readyText),
        };
      }),
    )
    .toMatchObject({
      liveStatus: 200,
      readyStatus: 200,
      liveBody: { data: { status: 'ok' } },
      readyBody: { data: { status: 'ok', checks: { database: { status: 'ok' } } } },
    });

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

  await page.goto('/billing');
  await expect(page.getByTestId('billing-overview')).toContainText('Free');
  await expect(page.getByTestId('plan-list')).toContainText('Team');
  const billingOrderForm = page.getByTestId('billing-order-form');
  await billingOrderForm.getByLabel('Billing plan').selectOption('TEAM');
  await billingOrderForm.getByLabel('Billing cycle').selectOption('MONTHLY');
  const createOrderResponsePromise = page.waitForResponse(
    (response) =>
      /\/api\/v1\/workspaces\/[^/]+\/billing\/orders$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'POST',
  );
  await billingOrderForm.getByRole('button', { name: 'Create order' }).click();
  const createOrderResponse = await createOrderResponsePromise;
  expect(createOrderResponse.status()).toBe(201);
  await expect(page.getByTestId('billing-orders')).toContainText('PENDING');
  const activateOrderResponsePromise = page.waitForResponse(
    (response) =>
      /\/api\/v1\/workspaces\/[^/]+\/billing\/orders\/[^/]+\/activate$/.test(
        new URL(response.url()).pathname,
      ) && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Activate' }).click();
  const activateOrderResponse = await activateOrderResponsePromise;
  expect(activateOrderResponse.status()).toBe(200);
  await expect(page.getByTestId('billing-overview')).toContainText('Team');
  await expect(page.getByTestId('billing-overview')).toContainText('1000');

  await page.goto('/beta');
  await expect(page.getByRole('heading', { name: 'Beta Readiness' })).toBeVisible();
  await expect(page.getByTestId('beta-readiness')).toContainText('pre_release_test');
  await expect(page.getByTestId('beta-readiness')).toContainText('Blocked');
  await expect(page.getByTestId('beta-flags')).toContainText('beta_billing_manual_orders');
  const betaFlagResponsePromise = page.waitForResponse(
    (response) =>
      /\/api\/v1\/workspaces\/[^/]+\/beta\/feature-flags\/beta_billing_manual_orders$/.test(
        new URL(response.url()).pathname,
      ) && response.request().method() === 'POST',
  );
  await page.getByTestId('beta-flags').getByRole('button', { name: 'Enable' }).click();
  const betaFlagResponse = await betaFlagResponsePromise;
  expect(betaFlagResponse.status()).toBe(200);
  const betaFeedbackForm = page.getByTestId('beta-feedback-form');
  await betaFeedbackForm.getByLabel('Feedback type').selectOption('BUG');
  await betaFeedbackForm.getByLabel('Severity').selectOption('HIGH');
  await betaFeedbackForm.getByPlaceholder('Short title').fill('Invite copy is unclear');
  await betaFeedbackForm
    .getByPlaceholder('What happened and what should change')
    .fill('The design partner could not tell whether the beta invite link was reusable.');
  const betaFeedbackResponsePromise = page.waitForResponse(
    (response) =>
      /\/api\/v1\/workspaces\/[^/]+\/beta\/feedback$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'POST',
  );
  await betaFeedbackForm.getByRole('button', { name: 'Submit feedback' }).click();
  const betaFeedbackResponse = await betaFeedbackResponsePromise;
  expect(betaFeedbackResponse.status()).toBe(201);
  await expect(page.getByTestId('beta-feedback')).toContainText('Invite copy is unclear');
  await expect(page.getByTestId('beta-documents')).toContainText('Release Notes Draft');
  await expect(page.getByTestId('beta-exit')).toContainText('Release candidate verification');

  const teammateEmail = `teammate-${suffix}@example.com`;
  await page.goto('/team');
  const invitationForm = page.getByTestId('team-invite-form');
  await invitationForm.getByPlaceholder('teammate@example.com').fill(teammateEmail);
  await invitationForm.getByLabel('Role').selectOption('AGENT');
  const invitationResponsePromise = page.waitForResponse(
    (response) =>
      /\/api\/v1\/workspaces\/[^/]+\/invitations$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'POST',
  );
  await invitationForm.getByRole('button', { name: 'Create invite' }).click();
  const invitationResponse = await invitationResponsePromise;
  expect(invitationResponse.status()).toBe(201);
  await expect(page.getByTestId('invite-link')).toContainText('/invite/accept?token=');
  const inviteLinkText = (await page.getByTestId('invite-link').textContent()) || '';
  const inviteUrl = inviteLinkText.match(/http:\/\/localhost:3001\/invite\/accept\?token=\S+/)?.[0];
  expect(inviteUrl).toBeTruthy();

  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_workspace');
  });
  await page.goto(inviteUrl!);
  const acceptInviteForm = page.getByTestId('accept-invite-form');
  await acceptInviteForm.getByPlaceholder('teammate@example.com').fill(teammateEmail);
  await acceptInviteForm.getByPlaceholder('Name').fill('M6 Agent');
  await acceptInviteForm.getByPlaceholder('Password').fill('Password123');
  const acceptInvitationResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/invitations/accept') &&
      response.request().method() === 'POST',
  );
  await acceptInviteForm.getByRole('button', { name: 'Join workspace' }).click();
  const acceptInvitationResponse = await acceptInvitationResponsePromise;
  expect(acceptInvitationResponse.status()).toBe(201);
  await expect(page).toHaveURL(/\/tickets/);
  const teammateAuthState = await page.evaluate(() => ({
    token: localStorage.getItem('access_token'),
    workspace: localStorage.getItem('current_workspace'),
  }));
  expect(teammateAuthState.token).toContain('mock_access_token_');
  expect(teammateAuthState.workspace).toContain('Acme Ops');

  await page.goto('/channels');
  const channelForm = page.getByTestId('wecom-channel-form');
  await channelForm.getByPlaceholder('Channel name').fill('WeCom support');
  await channelForm.getByPlaceholder('Mock token').fill('mock-wecom-token');
  await channelForm.getByRole('button', { name: 'Add WeCom channel' }).click();
  await expect(page.getByText('WECOM / ACTIVE')).toBeVisible();

  const inboundForm = page.getByTestId('wecom-inbound-form');
  await inboundForm.getByPlaceholder('Subject').fill('Payroll VPN access failed');
  await inboundForm
    .getByPlaceholder('Message text')
    .fill('I cannot access the payroll system from the corporate VPN.');
  const inboundResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/channels/wecom/') &&
      response.url().includes('/messages') &&
      response.request().method() === 'POST',
  );
  await inboundForm.getByRole('button', { name: 'Send mock message' }).click();
  const inboundResponse = await inboundResponsePromise;
  expect(inboundResponse.status()).toBe(201);
  await expect(page.getByTestId('channel-ticket-result')).toContainText(
    'Payroll VPN access failed',
  );
  await expect(page.getByTestId('channel-ticket-result')).toContainText('WECOM');

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
  await expect(page.getByText('DRAFT ? INTERNAL')).toBeVisible();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('PUBLISHED ? REQUESTER')).toBeVisible();

  await page.goto('/knowledge');
  await expect(page.getByRole('heading', { name: 'Knowledge' })).toBeVisible();
  await page.getByPlaceholder('Search knowledge').fill('VPN');
  await expect(page.getByText('How to resolve: VPN access is unavailable')).toBeVisible();

  await page.goto('/legal');
  await expect(page.getByRole('heading', { name: 'Compliance Center' })).toBeVisible();
  await expect(page.getByTestId('compliance-center')).toContainText('Draft for review');
  await expect(page.getByTestId('compliance-documents')).toContainText('Privacy Policy Draft');
  await expect(page.getByTestId('compliance-documents')).toContainText(
    'Generative AI and Content Labeling Checklist',
  );
});
