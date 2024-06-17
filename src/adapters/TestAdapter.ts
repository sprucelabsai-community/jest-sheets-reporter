import SheetsReporterGoogleAdapter from './GoogleAdapter'

export default class SheetsReporterTestAdapter extends SheetsReporterGoogleAdapter {
    private static randomCount = 0

    public async fetchCellValue(
        sheetId: string,
        worksheetId: number,
        cell: string
    ) {
        const results = await this.fetchSheetAndCell(sheetId, worksheetId, cell)
        return results.cell.value
    }

    public async createRandomWorksheet(sheetId: string): Promise<number> {
        const name = `TEST.${Date.now()}-${SheetsReporterTestAdapter.randomCount}`
        const sheet = await this.fetchSpreadsheet(sheetId)
        const worksheet = await sheet.addWorksheet({ title: name })

        SheetsReporterTestAdapter.randomCount++
        return parseInt(worksheet.sheetId, 10)
    }

    public async deleteWorksheet(
        sheetId: string,
        worksheetId: number
    ): Promise<void> {
        const sheet = await this.fetchSpreadsheet(sheetId)

        const worksheet = sheet.sheetsById[worksheetId]

        await worksheet.delete()
    }

    protected async fetchSpreadsheet(sheetId: string) {
        return this.uncachedFetchSpreadsheet(sheetId)
    }
}
