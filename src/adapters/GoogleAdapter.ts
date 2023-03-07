import { GoogleSpreadsheet } from 'google-spreadsheet'
import retry from 'retry'
import {
	IGoogleSheetsAdapter,
	IGoogleSheetsOptions,
} from '../sheetsReporter.types'

export default class SheetsReporterGoogleAdapter
	implements IGoogleSheetsAdapter {
	private serviceEmail: string
	private privateKey: string
	private spreadsheetInstancesById: Record<string, Promise<GoogleSpreadsheet>> =
		{}

	public constructor(options?: IGoogleSheetsOptions) {
		const email = options
			? options.serviceEmail
			: process.env.GOOGLE_SERVICE_EMAIL

		if (!email) {
			throw new Error(
				`GoogleSpreadsheetAdapter needs GOOGLE_SERVICE_EMAIL in the env or passed email to constructor`
			)
		}

		this.serviceEmail = email

		const privateKey = options
			? options.privateKey
			: process.env.GOOGLE_SERVICE_PRIVATE_KEY

		if (!privateKey) {
			throw new Error(
				'GoogleSpreadsheetAdapter needs GOOGLE_SERVICE_PRIVATE_KEY in the env or privateKey in constructor'
			)
		}

		this.privateKey = privateKey
	}

	public async updateCell(options: {
		sheetId: string
		worksheetId: number
		cell: string
		value: string | number | boolean
	}): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			void this.retriedUpdateCell(options, resolve, reject)
		})
	}

	private async retriedUpdateCell(
		options: {
			sheetId: string
			worksheetId: number
			cell: string
			value: string | number | boolean
		},
		resolve: () => void,
		reject: (reason?: any) => void
	) {
		const { sheetId, worksheetId, value, cell: cellLookup } = options

		const operation = retry.operation({
			factor: 2,
			retries: 10,
			randomize: true,
		})

		operation.attempt(async () => {
			try {
				const { cell, sheet } = await this.fetchSheetAndCell(
					sheetId,
					worksheetId,
					cellLookup
				)

				cell.value = value

				await sheet.saveUpdatedCells()
				resolve()
			} catch (err: any) {
				const isBadKey =
					err.reason === 'no start line' || err.code === 'ERR_OSSL_UNSUPPORTED'

				if (isBadKey) {
					reject(
						new Error(
							`Bad private key! Checkout this for next steps:\n\nhttps://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication`
						)
					)
					return
				}

				if (operation.retry(err) && isBadKey) {
					console.error('Sheets reporter error', err)
					return
				}

				const error = operation.mainError()
				reject(error)
			}
		})
	}

	protected async fetchSheetAndCell(
		sheetId: string,
		worksheetId: number,
		cellLookup: string
	) {
		const spreadsheet = await this.fetchSpreadsheet(sheetId)
		const sheet = spreadsheet.sheetsById[worksheetId]

		if (!sheet) {
			throw new Error(`Could not find worksheet with id: ${worksheetId}`)
		}
		await sheet.loadCells(cellLookup)

		const cell = sheet.getCellByA1(cellLookup)

		return { cell, sheet }
	}

	protected async fetchSpreadsheet(sheetId: string) {
		//@ts-ignore
		if (this.spreadsheetInstancesById[sheetId]) {
			return this.spreadsheetInstancesById[sheetId]
		}

		const spreadsheet = this.uncachedFetchSpreadsheet(sheetId)

		this.spreadsheetInstancesById[sheetId] = spreadsheet

		return spreadsheet
	}

	protected async uncachedFetchSpreadsheet(sheetId: string) {
		const doc = new GoogleSpreadsheet(sheetId)

		await doc.useServiceAccountAuth({
			// eslint-disable-next-line @typescript-eslint/naming-convention
			client_email: this.serviceEmail,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			private_key: this.privateKey,
		})

		await doc.loadInfo()

		return doc
	}
}
