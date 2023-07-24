export class Markdown {
    /**
     * Generate a Markdown table from an array of column names.
     * @param {string[]} columnNames 
     */
    public static generateMarkdownTable(columnNames: string[]) {
        let headerRow = '|' + columnNames.map((i) => ' ' + i + ' ').join('|') + '|';
        let separatorRow = '|' + columnNames.map((i) => ' ' + '-'.repeat(i.length) + ' ').join('|') + '|';
        let emptyDataRow = '|' + columnNames.map((i) => ' '.repeat(i.length + 2)).join('|') + '|';

        return [headerRow, separatorRow, emptyDataRow].join('\n');
    }
}
