'use strict';

function filterResultArray(results, filterRows) {
  results.forEach((row) => {
    if (row.constructor.name === 'RowDataPacket') {
      filterRows.push(row);
    } else if (Array.isArray(row)) {
      filterResultArray(row, filterRows);
    }
  });
}

module.exports = filterResultArray;
