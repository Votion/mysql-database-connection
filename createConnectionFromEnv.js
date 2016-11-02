'use strict';

const MySqlDatabaseConnection = require('./MySqlDatabaseConnection');

function createConnectionFromEnv(poolOptions, envs, mysql) {
  const envsValues = envs || process.env;

  const connectionConfig = {
    database: envsValues.DB_NAME,

    defaultConnection: {
      host: envsValues.DB_HOST,
      user: envsValues.DB_USER,
      password: envsValues.DB_PASS,
      port: envsValues.DB_PORT || 3306,
    },

    writeConnections: [],

    readConnections: [],
  };

  Object.keys(envsValues).forEach((envName) => {
    const envValue = envsValues[envName];

    const match = envName.match(/^DB_(WRITE|READ)(\d+)_(\w+)$/);
    if (match) {
      const index = parseInt(match[2], 10);
      const prop = match[3].toLowerCase();
      const mode = match[1];

      if (mode === 'WRITE') {
        connectionConfig.writeConnections[index] = connectionConfig.writeConnections[index] || {};
        connectionConfig.writeConnections[index][prop] = envValue;
      }
      if (mode === 'READ') {
        connectionConfig.readConnections[index] = connectionConfig.readConnections[index] || {};
        connectionConfig.readConnections[index][prop] = envValue;
      }
    }
  });

  // Remove writeConnections if none set
  if (connectionConfig.writeConnections.length === 0) {
    delete connectionConfig.writeConnections;
  }

  // Remove readConnections if none set
  if (connectionConfig.readConnections.length === 0) {
    delete connectionConfig.readConnections;
  }

  return new MySqlDatabaseConnection(connectionConfig, poolOptions, mysql);
}

module.exports = createConnectionFromEnv;
