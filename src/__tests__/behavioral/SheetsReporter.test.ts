import { test, assert } from '@sprucelabs/test'
import AbstractSheetsReporterTest from '../../AbstractSheetsReporterTest'
import { TEST_JEST_PASSED, TEST_JEST_FAILED } from '../../constants'
import SheetsReporter from '../../SheetsReporter'
import { IJestTestResult, ITestMap } from '../../sheetsReporter.types'
import { SheetsReporterUtility } from '../../SheetsReporterUtility'
require('dotenv').config()

export default class SheetsReporterTest extends AbstractSheetsReporterTest {
    private static reporter: SheetsReporter<typeof SheetsReporterTest.testMap>
    private static sheetId = '1ApKcKAquK-qkR-VqQKtajAvWOOtKdbCuBW80WsNAUj8'
    private static worksheetId: number

    private static readonly testResults: IJestTestResult[] = [
        {
            title: 'willPass',
            status: TEST_JEST_PASSED,
        },
        {
            title: 'canBootCli',
            status: TEST_JEST_PASSED,
        },
        {
            title: 'canSetupSchemas',
            status: TEST_JEST_FAILED,
        },
        {
            title: 'canSyncSchemas',
            status: TEST_JEST_FAILED,
        },
        {
            title: 'canBootCliInDifferentWorksheet',
            status: TEST_JEST_PASSED,
        },
    ]

    private static testMap: Record<string, string> = {
        canBootCli: 'B1',
        canSyncSchemas: 'B2',
    }

    protected static async beforeAll() {
        this.worksheetId = await this.sheetsAdapter.createRandomWorksheet(
            this.sheetId
        )
    }

    protected static async beforeEach() {
        await super.beforeEach()

        this.reporter = new SheetsReporter(
            {},
            {
                sheetId: this.sheetId,
                worksheetId: this.worksheetId,
                testMap: this.testMap,
            }
        )
    }

    protected static async afterAll() {
        await super.afterAll()
        await this.sheetsAdapter.deleteWorksheet(this.sheetId, this.worksheetId)
    }

    @test()
    protected static async canFilterMappedTests() {
        const testResults: IJestTestResult[] = this.testResults

        const testMap: ITestMap = this.testMap

        const results = SheetsReporterUtility.getMappedTests(
            testMap,
            testResults
        )

        const cliTest = results.map((r) => r.title === 'canBootCli')
        const canSyncTest = results.map((r) => r.title === 'canSyncSchemas')

        assert.isTruthy(cliTest)
        assert.isTruthy(canSyncTest)
    }

    @test()
    protected static async failsWithBadTestName() {
        await assert.doesThrowAsync(
            // @ts-ignore
            () => this.reporter.reportTestAsPassed('canBooCli'),
            /invalid/i
        )
    }

    @test()
    protected static async canUpdateTestCell() {
        await this.reporter.reportTestAsPassed('canBootCli')

        const value = await this.sheetsAdapter.fetchCellValue(
            this.sheetId,
            this.worksheetId,
            'B1'
        )

        assert.isEqual(value, 1)
    }

    @test()
    protected static async canUpdateAllTestsAfterCompletion() {
        this.reporter.onTestResult({}, { testResults: this.testResults })

        const value = await this.sheetsAdapter.fetchCellValue(
            this.sheetId,
            this.worksheetId,
            'B1'
        )

        assert.isEqual(value, 1)

        const value2 = await this.sheetsAdapter.fetchCellValue(
            this.sheetId,
            this.worksheetId,
            'B2'
        )

        assert.isEqual(value2, 0)
    }

    @test('can update in another worksheet 1', 'B1')
    @test('can update in another worksheet 2', 'B2')
    protected static async canSetWorksheetIdInCell(cell: string) {
        const worksheetId = await this.sheetsAdapter.createRandomWorksheet(
            this.sheetId
        )

        this.testMap.canBootCliInDifferentWorksheet = `${worksheetId}:${cell}`
        await this.reporter.reportTestAsPassed('canBootCliInDifferentWorksheet')

        const value = await this.sheetsAdapter.fetchCellValue(
            this.sheetId,
            worksheetId,
            cell
        )

        assert.isEqual(value, 1)
    }
}
