export default function filterResultArray(results: {[fieldName: string]: any}[], filterRows: {[fieldName: string]: any}[]) {
  results.forEach((row) => {
    if (row.constructor.name === 'RowDataPacket') {
      filterRows.push(row);
    } else if (Array.isArray(row)) {
      filterResultArray(row, filterRows);
    }
  });
}
