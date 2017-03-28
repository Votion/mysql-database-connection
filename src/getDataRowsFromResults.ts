import filterResultArray from './includes/filterResultArray';

/**
 * A utility to get just the RowDataPackets in the results.
 *
 * The DB results will contain the OkPackets and sometimes be nested arrays. This will walk
 * through nested arrays to find the RowDataPackets.
 *
 * @param results
 * @returns {Array}
 */
export default function getDataRowsFromResults(results: {[fieldName: string]: any}[]): {[fieldName: string]: any}[] {
  const rows: {}[] = [];
  filterResultArray(results, rows);
  return rows;
}
