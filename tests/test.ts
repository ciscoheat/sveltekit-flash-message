import { expect, test } from '@playwright/test';

test('Messages are displayed as expected', async ({ page }) => {
	await page.goto('/');
	expect(await page.textContent('h1')).toBe('sveltekit-flash-message testing ground');

	const messages = page.locator('#messages .flash')

	const testContent = (testData: [string, string][]) => messages.evaluateAll(
		messages => {
			return messages.map(el => {
				const test = /(.*?)(\d+)$/.exec(el.textContent || '') as RegExpExecArray
				return {
					status: el.getAttribute('data-status'),
					text: test[1].trim(),
					timestamp: parseInt(test[2])
				}
			})
		}
	).then(messages => {
		expect(messages.length).toBe(testData.length)
		messages.forEach((msg, i) => {
			const expected = testData[i]
			expect(msg.status).toBe(expected[0])
			expect(msg.text).toBe(expected[1])

			if (i > 0) expect(msg.timestamp).toBeGreaterThan(messages[i - 1].timestamp)
		})
	})

	const submitAction = page.locator('text=Submit to action')
	const changeOnClient = page.locator('text=Change on client')
	const submitEndpointClient = page.locator('text=Submit to endpoint client-side')
	const submitEndpointServer = page.locator('text=Submit to endpoint server-side')
	const clearMessages = page.locator('text=Clear messages')

	// No messages
	await testContent([])

	// Post to action
	await submitAction.click()
	await testContent([
		['error', '+page.server.ts POST']
	])

	// Add message
	await changeOnClient.click()
	await testContent([
		['error', '+page.server.ts POST'],
		['error', 'Updated from other component']
	])

	// Fetch client-side
	await submitEndpointClient.click()
	await page.waitForResponse(page.url())
	await testContent([
		['error', '+page.server.ts POST'],
		['error', 'Updated from other component'],
		['ok', '+server.ts POST']
	])	

	// Post to endpoint
	await submitEndpointServer.click()
	await testContent([
		['ok', '+server.ts POST']
	])

	// Add message
	await changeOnClient.click()
	await testContent([
		['ok', '+server.ts POST'],
		['error', 'Updated from other component']
	])

	// Clear messages
	await clearMessages.click()
	await testContent([])
});
