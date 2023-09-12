import AbstractSpruceTest, { assert, test } from '@sprucelabs/test'
import SheetsReporterGoogleAdapter from '../../adapters/GoogleAdapter'

export default class GoogleAdapterTest extends AbstractSpruceTest {
	@test()
	protected static async badKeyThrowsErrorWithLinkToDocs() {
		const adapter = new SheetsReporterGoogleAdapter({
			privateKey: '234',
			serviceEmail: 'test@test.com',
		})

		await assert.doesThrowAsync(
			() =>
				adapter.updateCell({
					cell: 'B1',
					sheetId: '12345',
					worksheetId: 0,
					value: '100',
				})
			// 'https://theoephraim.github.io/node-google-spreadsheet/#/'
		)
	}
}
