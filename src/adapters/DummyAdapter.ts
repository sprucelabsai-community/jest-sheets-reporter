import SheetsReporterTestAdapter from './TestAdapter'

export default class SheetsReporterDummyAdapter extends SheetsReporterTestAdapter {
    private static cellCache: Record<string, string | number | boolean> = {}

    public constructor() {
        super({ serviceEmail: 'not-needed@nothing.com', privateKey: 'nothing' })
    }

    public async updateCell(options: {
        sheetId: string
        worksheetId: number
        cell: string
        value: string | number | boolean
    }): Promise<void> {
        const key = `${options.sheetId}${options.worksheetId}${options.cell}`
        SheetsReporterDummyAdapter.cellCache[key] = options.value
    }

    public async fetchCellValue(
        sheetId: string,
        worksheetId: number,
        cell: string
    ) {
        const key = `${sheetId}${worksheetId}${cell}`
        return SheetsReporterDummyAdapter.cellCache[key]
    }

    public async createRandomWorksheet() {
        return -1
    }

    public async deleteWorksheet() {}
}
