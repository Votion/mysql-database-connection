'use strict';

const filterResultArray = require('./includes/filterResultArray');

/**
 * A utility to get just the RowDataPackets in the results.
 *
 * The DB results will contain the OkPackets and sometimes be nested arrays. This will walk
 * through nested arrays to find the RowDataPackets.
 *
 * @param results
 * @returns {Array}
 */
function getDataRowsFromResults(results) {
  const rows = [];
  filterResultArray(results, rows);
  return rows;
}

module.exports = getDataRowsFromResults;
