/**
 * Manage a writing and reading from a MySQL (or MySQL compatible) database.
 *
 * Under the hood, this handles pooling of multiple connections for reading and writing.
 *
 */
import * as mysqlDefault from 'mysql';
import * as _ from 'lodash';
import {IConnectionOption, IConnectionOptions} from './options';

interface IInternalConnectionOption {
  database?: string|null,
  host: string|null,
  user: string|null,
  password: string|null,
  port: number,
}

interface IInternalConnectionOptions {
  database: string|null,
  defaultConnection: IInternalConnectionOption,
  writeConnections: IInternalConnectionOption[],
  readConnections: IInternalConnectionOption[],
}

export default class MySqlDatabaseConnection {

  pool: mysqlDefault.IPoolCluster;

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
  constructor(connectionOptions: IConnectionOptions, poolingOptions?: mysqlDefault.IPoolClusterConfig, mysql?: mysqlDefault.IMySql) {
    const poolClusterConfig = _.defaults(poolingOptions || {}, {
      canRetry: true,
      removeNodeErrorCount: 5,
      restoreNodeTimeout: 600000, // 10 minutes
      defaultSelector: 'RANDOM',
    });

    const defaults: IInternalConnectionOptions = {
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

    const conOpts = _.defaultsDeep<IConnectionOptions, IInternalConnectionOptions>(connectionOptions, defaults);

    // Default to the default connection if no write or read connection is provided
    if (conOpts.writeConnections.length === 0) {
      conOpts.writeConnections.push(conOpts.defaultConnection);
    }

    if (conOpts.readConnections.length === 0) {
      conOpts.readConnections.push(conOpts.defaultConnection);
    }

    this.pool = (mysql || mysqlDefault).createPoolCluster(poolClusterConfig);

    // Add the write connections
    conOpts.writeConnections.forEach((connectionDef, index) => {
      const conDef = _.defaults<IConnectionOption, mysqlDefault.IPoolConfig>(connectionDef, conOpts.defaultConnection);
      conDef.database = connectionOptions.database;
      this.pool.add(`WRITE${index}`, conDef);
    });

    // Add the read connections
    conOpts.readConnections.forEach((connectionDef, index) => {
      const conDef = _.defaults<IConnectionOption, mysqlDefault.IPoolConfig>(connectionDef, conOpts.defaultConnection);
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
  readQuery(query: string, args = {}): Promise<{[fieldName: string]: any}[]> {
    return new Promise((resolve, reject) => {
      this.getReadConnection()
        .then((connection: mysqlDefault.IConnection) => {
          connection.query(query, args || {}, (err: Error|null, results) => {
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
  writeQuery(query: string, args = {}): Promise<{[fieldName: string]: any}[]> {
    return new Promise((resolve, reject) => {
      this.getWriteConnection()
        .then((connection: mysqlDefault.IConnection) => {
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
  destroy() {
    this.pool.end();
  }
}
