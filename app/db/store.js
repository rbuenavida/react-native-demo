import SQLite from 'react-native-sqlite-storage';
import * as log from 'loglevel';
import config from '../../config';

SQLite.DEBUG(config.debug);
SQLite.enablePromise(true);

log.setLevel(config.debug ? "debug" : "trace")

function dbConnect() {
  log.debug("Plugin integrity check ...");
  return SQLite.echoTest()
    .catch(error => {
      throw new Error("echoTest failed - plugin not functional");
    })
    .then(() => {
      log.debug("Integrity check passed ...")
      log.debug("Opening database ...")
      return SQLite.openDatabase({ name: config.database.name })
    })
    .catch((error) => {
      throw new Error("Database could not be opened")
    })
    .then((db) => {
      log.debug("Database integrity check")
      log.debug("Database OPEN");
      return checkTables(db)
    })
    .catch((error) => {
      log.debug(error);
    });
}

function errorCB (err) {
  log.debug("error: ", err);
  return false;
}

// this needs to be fixed like this we can roll out changes using sql file instead
function checkTables(db) {
  return db.executeSql('SELECT 1 FROM Version LIMIT 1').then(() => {
      log.debug("Database is ready ... executing query ...");
    })
    .catch((error) => {
      log.debug("Received error: ", error)
      log.debug("Database not yet ready ... populating data")
      // have to catch this thing
      db.transaction(dbPopulate).then(() => {
        log.debug("Database populated ... executing query ...")
      });
    })
    .then(() => Promise.resolve(db));
}

/*
This will probably roll back if it fails
*/
function dbPopulate(tx) {
  log.debug("Executing DROP stmts")

  tx.executeSql('DROP TABLE IF EXISTS Settings;');

  log.debug("Executing CREATE stmts");

  tx.executeSql('CREATE TABLE IF NOT EXISTS Version( '
    + 'version_id INTEGER PRIMARY KEY NOT NULL); ').catch((error) => {
      errorCB(error)
    });

  tx.executeSql('CREATE TABLE IF NOT EXISTS Settings( '
    + 'name VARCHAR(20), '
    + 'value VARCHAR(20)) ; ').catch((error) => {
      errorCB(error)
    });

  log.debug("Executing INSERT stmts")

  tx.executeSql('INSERT INTO Settings (name, value) VALUES ("Key One", "Value for Key One");');
  tx.executeSql('INSERT INTO Settings (name, value) VALUES ("Key Two", "Value for Key One");');
  log.debug("all config SQL done");
}

function dbClose(db) {
  if (db) {
    log.debug("Closing database ...");
    return db.close().then((status) => {
      log.debug("Database CLOSED");
    }).catch((error) => {
      errorCB(error);
    });
  } else {
    log.debug("Database was not OPENED")
    return Promise.resolve()
  }
}

export default {
  getSettings () {
    log.debug("Executing get settings");
    let result = []
    return dbConnect().
      then((db) => {
        return db.transaction((tx) =>
          tx.executeSql(`
            SELECT name, value  
            FROM Settings 
          `).then(([tx, results]) => result = results)
        )
        .then(() => Promise.resolve(db))
      })
      .then((db) => {
        log.debug("Query completed")
        return dbClose(db).then(() => result)
      })
      .catch((error) => {
        log.debug(error);
      })
  },

  upsertSetting (key, value) {
    let result = ['ok']
    return dbConnect().
      then((db) => {
        return db.transaction((tx) => {
          // Try to update an existing record
          // If no record was changed by the update,
          tx.executeSql(`UPDATE Settings SET value = '${value}' WHERE name = '${key}';`);
          tx.executeSql(`INSERT INTO Settings (name, value) SELECT '${key}', '${value}' WHERE NOT EXISTS(SELECT changes() AS change FROM Settings WHERE change <> 0);`);
        })
        .then(() => Promise.resolve(db))
      })
      .then((db) => {
        log.debug("Query completed")
        return dbClose(db).then(() => result)
      })
      .catch((error) => {
        log.debug(error);
      })
  }
}

/*
BEGIN;
UPDATE Settings SET value = '43' WHERE name = 'kk';
INSERT INTO Settings(name, value)
SELECT 'kk', '43'
WHERE NOT EXISTS(SELECT changes() AS change FROM Settings WHERE change <> 0);
COMMIT;
*/