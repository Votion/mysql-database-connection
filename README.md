# MySqlDatabaseConnection

A class to using multiple read and write MySQL connections.
Under the hood, this is a using the `mysql` package and its pooling
feature.

It comes with a factory to create an instance from environment variables
which follows common best practices of not storing DB info in code.

## Connection options 

There are five properties used for each connection:

### 1. Database name

The same name is used for all the connections.

* environment variable: `DB_NAME=myDbName`
* constructor config: `{database: 'myDbName'}`

### 2. Database user

Each connection may have a different username. If a connection doesn't have a username set, the username set
in the default connection will be used.

* default environment variable: `DB_USER=myuser`
* default constructor config: `{defaultConnection: {user: 'myuser'}}`
* per connection environment variable: `DB_READ0_USER=readonlyuser`
* per connection constructor config: `{readConnections: [{user: 'readonlyuser'}]}`

### 3. Database password

Each connection may have a different password. If a connection doesn't have a password set, the password set
in the default connection will be used.

* default environment variable: `DB_PASS=secret`
* default constructor config: `{defaultConnection: {pass: 'secret'}}`
* per connection environment variable: `DB_WRITE0_PASS=secret`
* per connection constructor config: `{writeConnections: [{pass: 'secret'}]}`

### 4. Database host

Each connection may have a different host. If a connection doesn't have a host set, the host set
in the default connection will be used.

* default environment variable: `DB_HOST=mysql.example.com`
* default constructor config: `{defaultConnection: {host: 'mysql.example.com'}}`
* per connection environment variable: `DB_READ0_HOST=mysql.example.com`
* per connection constructor config: `{readConnections: [{host: 'mysql.example.com'}]}`

### 5. Database port

Each connection may have a different port. If a connection doesn't have a port set, the port set
in the default connection will be used. If no default port is set, then the MySQL default port of `3306`
is used.

* default environment variable: `DB_PORT=8888`
* default constructor config: `{defaultConnection: {port: 8888}}`
* per connection environment variable: `DB_READ0_PORT=8888`
* per connection constructor config: `{readConnections: [{port: 8888}]}`

### Environment variable configuration example

An example of configuring the connections via the environment variables.

```ini
# The same name is used in all connections
DB_NAME=myDatabase

# Default connection info used to populate other connections
DB_USER=myUser
DB_PASS=secret
DB_PORT=8888

# Write connection 1 has a different host while using the same user,
# password and port
DB_WRITE0_HOST=master.mysql.example.com

# Read connection 1 has a different host
DB_READ0_HOST=1.slave.mysql.example.com

# Read connection 2 has different host, user and password
DB_READ1_HOST=2.slave.mysql.example.com
DB_READ1_USER=readonly
DB_READ1_PASS=someOtherSecret

# Read connection 3
DB_READ2_HOST=6.slave.mysql.example.com
```

```javascript
const MySqlDatabaseConnection = require('mysql-database-connection');
const dbConnections = MySqlDatabaseConnection.createConnectionFromEnv();
```

### In Code Configuration Example

```javascript
const MySqlDatabaseConnection = require('mysql-database-connection');
const dbConnections = new MySqlDatabaseConnection.MySqlDatabaseConnection({
  // The same name is used in all connections
  database: 'myDatabase',
    
  // Default connection info used to populate other connections
  defaultConnection: {
    user: 'myUser',
    password: 'secret',
    port: 8888,
  },

  writeConnections: [
    // Write connection 1 has a different host while using the same user,
    // password and port
    {
      host: 'master.mysql.example.com',
    }
  ],

  readConnections: [
    // Read connection 1 has a different host
    {
      host: '1.slave.mysql.example.com',
    },
    
    // Read connection 2 has different host, user and password
    {
      host: '2.slave.mysql.example.com',
      user: 'readonly',
      pass: 'someOtherSecret',
    },
    
    // Read connection 3
    {
      host: '6.slave.mysql.example.com',
    },
  ],
});
```


## MySqlDatabaseConnection class

### constructor(connectionOptions [, poolingOptions [, mysql]])

<dl>
  <dt>connectionOptions</dt>
  <dd>The connection options as defined in 'Connection options'
   section</dd>

  <dt>poolingOptions</dt>
  <dd>An optional object of options for configuring the pooling</dd>
  
  <dt>mysql</dt>
  <dd>An optional mysql compatible module. This is mostly used for 
   using a mock in tests.</dd>
</dl>

### methods

#### readQuery(sqlString [, values])

Execute a read query.

```javascript
db.readQuery('SELECT * FROM users WHERE id=?', [5])
  .then((dbResults) => {
    console.log('User DB', dbResults);
  }, (dbError) => {
    console.log('Error: ', dbError);
  });
```

##### Parameters

<dl>
  <dt>sqlString</dt>
  <dd>A string of SQL to execute</dd>

  <dt>values</dt>
  <dd>An optional array of values to replace the `?` in the sqlString 
</dl>

##### Return value

A promise with the results.

#### writeQuery(query, args)

Execute a write query.

```javascript
db.readQuery('INSERT INTO users VALUES (?, ?)', ['John', 'john@example.com'])
  .then((dbResults) => {
    console.log('Insert', dbResults);
  }, (dbError) => {
    console.log('Error: ', dbError);
  });
```

##### Parameters

<dl>
  <dt>sqlString</dt>
  <dd>A string of SQL to execute</dd>

  <dt>values</dt>
  <dd>An optional array of values to replace the `?` in the sqlString 
</dl>

##### Return value

A promise with the results.

#### getReadConnection()

Get a mysql read connection.

#### getWriteConnection()

Get a mysql write connection.

#### destroy([done])

Destroy the pool of connections. 

##### Parameters

<dl>
  <dt>done</dt>
  <dd>An optional function to call when the connections are
  destroyed.</dd>
</dl>

## getDataRowsFromResults(results)

A utility to get just the RowDataPackets in the results.

The DB results will contain the `OkPackets` and sometimes be nested
arrays. This will walk through nested arrays to find the 
`RowDataPackets.`

##### Parameters

<dl>
  <dt>results</dt>
  <dd>The results from a query</dd>
</dl>

##### Return value

An array of just `RowDataPackets`.

## createConnectionFromEnv([poolOptions [, envs [, mysql]]])

#### Parameters

<dl>
  <dt>poolingOptions</dt>
  <dd>An optional object of options for configuring the pooling</dd>
  
  <dt>envs</dt>
  <dd>An optional object of environmental variables.
  Defaults to `process.env`.</dd>
  
  <dt>mysql</dt>
  <dd>An optional mysql compatible module. This is mostly used for 
   using a mock in tests.</dd>
</dl>



