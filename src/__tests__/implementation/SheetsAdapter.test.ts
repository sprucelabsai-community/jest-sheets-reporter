import { test, assert } from '@sprucelabs/test'
import AbstractSheetsReporterTest from '../../AbstractSheetsReporterTest'
import { IGoogleSheetsAdapter } from '../../sheetsReporter.types'
import { SheetsReporterUtility } from '../../SheetsReporterUtility'
require('dotenv').config()

const sheetsAdapterPath = SheetsReporterUtility.resolveAdapterPath(
    process.env.SHEETS_REPORTER_ADAPTER_TEST ?? 'GoogleAdapter'
)

const AdapterClass = require(sheetsAdapterPath).default

export default class SheetsAdapterTest extends AbstractSheetsReporterTest {
    private static adapter: IGoogleSheetsAdapter
    private static sheetId = '1MFb9AkB8sm7rurYew8hgzrXTz3JDxOFhl4kN9sNQVxw'
    private static worksheetId: number

    protected static async beforeEach() {
        await super.beforeEach()

        const email = process.env.GOOGLE_SERVICE_EMAIL_TEST as string
        const key = process.env.GOOGLE_SERVICE_PRIVATE_KEY_TEST as string

        this.adapter = new AdapterClass({
            serviceEmail: email,
            privateKey: key,
        })
    }

    protected static async beforeAll() {
        this.worksheetId = await this.sheetsAdapter.createRandomWorksheet(
            this.sheetId
        )
    }

    protected static async afterAll() {
        await super.afterAll()
        const worksheets = await this.sheetsAdapter.fetchAllWorksheets(
            this.sheetId
        )

        worksheets.pop()

        for (const worksheet of worksheets) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            this.log('deleting worksheet', worksheet.sheetId, worksheet.title)
            await this.sheetsAdapter.deleteWorksheet(
                this.sheetId,
                parseInt(worksheet.sheetId, 10)
            )
        }
    }

    @test('can set number value', 100)
    @test('can set a boolean value', true)
    @test('can set string value', 'it worked!')
    protected static async canUpdateCell(expected: string | number | boolean) {
        const sheetId = this.sheetId
        const worksheetId = this.worksheetId

        await this.adapter.updateCell({
            sheetId,
            worksheetId,
            cell: 'A1',
            value: expected,
        })

        // make sure it actually worked
        const actualValue = await this.sheetsAdapter.fetchCellValue(
            sheetId,
            worksheetId,
            'A1'
        )

        assert.isEqual(actualValue, expected)
    }

    @test.skip()
    protected static async updatingCellManyTimesAtOnceDoesNotHitRateLimit() {
        await Promise.all(
            new Array(55).fill(0).map(async (_, idx) => {
                await this.adapter.updateCell({
                    sheetId: this.sheetId,
                    worksheetId: this.worksheetId,
                    cell: 'A1',
                    value: idx,
                })
            })
        )
    }
}
