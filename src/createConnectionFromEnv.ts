import MySqlDatabaseConnection from './MySqlDatabaseConnection';
import * as mysqlDefault from 'mysql';
import * as options from './options';

function setConnectionProp(connection: options.IConnectionOption[], index: number, name: string, value: string) {
  switch(name) {
    case 'host':
      connection[index].host = value;
      return;
    case 'user':
      connection[index].user = value;
      return;
    case 'password':
      connection[index].password = value;
      return;
    case 'port':
      connection[index].port = parseInt(value);
      return;
  }
}

export default function createConnectionFromEnv(poolOptions?: mysqlDefault.IPoolClusterConfig, envs?: {}, mysql?: mysqlDefault.IMySql) {
  const envsValues = envs || process.env;

  const connectionConfig : options.IConnectionOptions = {
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
        connectionConfig.writeConnections = connectionConfig.writeConnections || [];
        connectionConfig.writeConnections[index] = connectionConfig.writeConnections[index] || {};
        setConnectionProp(connectionConfig.writeConnections, index, prop, envValue);
      }
      if (mode === 'READ') {
        connectionConfig.readConnections = connectionConfig.readConnections || [];
        connectionConfig.readConnections[index] = connectionConfig.readConnections[index] || {};
        setConnectionProp(connectionConfig.readConnections, index, prop, envValue);
      }
    }
  });

  // Remove writeConnections if none set
  if (connectionConfig.writeConnections && connectionConfig.writeConnections.length === 0) {
    delete connectionConfig.writeConnections;
  }

  // Remove readConnections if none set
  if (connectionConfig.readConnections && connectionConfig.readConnections.length === 0) {
    delete connectionConfig.readConnections;
  }

  return new MySqlDatabaseConnection(connectionConfig, poolOptions, mysql);
}
