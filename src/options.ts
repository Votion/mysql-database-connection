import * as mysqlDefault from 'mysql';

export interface IConnectionOptions {
    database?: string,
    defaultConnection?: mysqlDefault.IPoolConfig,
    writeConnections?: mysqlDefault.IPoolConfig[],
    readConnections?: mysqlDefault.IPoolConfig[],
}

export interface IConnectionOption {
    database?: string|null,
    host?: string|null,
    user?: string|null,
    password?: string|null,
    port?: number,
}