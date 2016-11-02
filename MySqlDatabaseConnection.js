'use strict';

/**
 * Manage a writing and reading from a MySQL (or MySQL compatible) database.
 *
 * Under the hood, this handles pooling of multiple connections for reading and writing.
 *
 */
const mysqlDefault = require('mysql');
const _ = require('lodash');
const noop = require('./includes/noop');

class MySqlDatabaseConnection {
  /**
   * @param {host: {string}, user: {string}, password: {string}, database: {string}, port: {number}}
   *   config
   * @param poolingOptions
   * @param mysql
   *
   * TODO Update documentation
   * If you leave any option out, it will look for an environment variable: DB_HOST, DB_USER,
   * DB_PASS, DB_NAME, DB_PORT.
   */
  constructor(connectionOptions, poolingOptions, mysql) {
    const poolClusterConfig = _.defaults(poolingOptions, {
      canRetry: true,
      removeNodeErrorCount: 5,
      restoreNodeTimeout: 600000, // 10 minutes
      defaultSelector: 'RANDOM',
    });

    const defaults = {
      database: null,

      defaultConnection: {
        host: null,
        user: null,
        password: null,
        port: 3306,
      },

      writeConnections: [],

      readConnections: [],
    };

    _.defaultsDeep(connectionOptions, defaults);

    // Default to the default connection if no write or read connection is provided
    if (connectionOptions.writeConnections.length === 0) {
      connectionOptions.writeConnections.push(connectionOptions.defaultConnection);
    }

    if (connectionOptions.readConnections.length === 0) {
      connectionOptions.readConnections.push(connectionOptions.defaultConnection);
    }

    this.pool = (mysql || mysqlDefault).createPoolCluster(poolClusterConfig);

    // Add the write connections
    connectionOptions.writeConnections.forEach((connectionDef, index) => {
      const conDef = _.defaults(connectionDef, connectionOptions.defaultConnection);
      conDef.database = connectionOptions.database;
      this.pool.add(`WRITE${index}`, conDef);
    });

    // Add the read connections
    connectionOptions.readConnections.forEach((connectionDef, index) => {
      const conDef = _.defaults(connectionDef, connectionOptions.defaultConnection);
      conDef.database = connectionOptions.database;
      this.pool.add(`READ${index}`, conDef);
    });

    Object.freeze(this);
  }

  /**
   * Get a connection from the database pool
   *
   * @return {Promise} A promise with the connection for reading
   */
  getReadConnection() {
    return new Promise((resolve, reject) => {
      this.pool.getConnection('READ*', (err, connection) => {
        if (err) {
          reject(err);
        } else {
          resolve(connection);
        }
      });
    });
  }

  /**
   * Get a connection from the database pool
   *
   * @return {Promise} A promise with the connection for writing
   */
  getWriteConnection() {
    return new Promise((resolve, reject) => {
      this.pool.getConnection('WRITE*', (err, connection) => {
        if (err) {
          reject(err);
        } else {
          resolve(connection);
        }
      });
    });
  }

  /**
   * Query the database for getting the results
   *
   * @param {string} query
   * @param {{}} args - replacement values in the query
   * @return {Promise}
   */
  readQuery(query, args) {
    return new Promise((resolve, reject) => {
      this.getReadConnection()
        .then((connection) => {
          connection.query(query, args || {}, (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }

            connection.release();
          });
        }, reject);
    });
  }

  /**
   * Do a query to write to the database and get the results
   *
   * @param {string} query
   * @param {{}} args - replacement values in the query
   * @return {Promise}
   */
  writeQuery(query, args) {
    return new Promise((resolve, reject) => {
      this.getWriteConnection()
        .then((connection) => {
          connection.query(query, args || {}, (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }

            connection.release();
          });
        }, reject);
    });
  }

  /**
   * TODO Use the destory to clean up connections
   * Destroy the connections
   * @param {function} done
   */
  destroy(done) {
    this.pool.end(done || noop);
  }
}

module.exports = MySqlDatabaseConnection;
