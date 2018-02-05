import SQLite from 'react-native-sqlite-storage';
import * as log from 'loglevel';
import config from '../config';

// 0527073606 Vered

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

  tx.executeSql('DROP TABLE IF EXISTS Employees;');
  tx.executeSql('DROP TABLE IF EXISTS Offices;');
  tx.executeSql('DROP TABLE IF EXISTS Departments;');

  log.debug("Executing CREATE stmts");

  tx.executeSql('CREATE TABLE IF NOT EXISTS Version( '
    + 'version_id INTEGER PRIMARY KEY NOT NULL); ').catch((error) => {
      errorCB(error)
    });

  tx.executeSql('CREATE TABLE IF NOT EXISTS Departments( '
    + 'department_id INTEGER PRIMARY KEY NOT NULL, '
    + 'name VARCHAR(30) ); ').catch((error) => {
      errorCB(error)
    });

  tx.executeSql('CREATE TABLE IF NOT EXISTS Offices( '
    + 'office_id INTEGER PRIMARY KEY NOT NULL, '
    + 'name VARCHAR(20), '
    + 'longtitude FLOAT, '
    + 'latitude FLOAT ) ; ').catch((error) => {
      errorCB(error)
    });

  tx.executeSql('CREATE TABLE IF NOT EXISTS Employees( '
    + 'employe_id INTEGER PRIMARY KEY NOT NULL, '
    + 'name VARCHAR(55), '
    + 'office INTEGER, '
    + 'department INTEGER, '
    + 'FOREIGN KEY ( office ) REFERENCES Offices ( office_id ) '
    + 'FOREIGN KEY ( department ) REFERENCES Departments ( department_id ));').catch((error) => {
      errorCB(error)
    });

  log.debug("Executing INSERT stmts")

  tx.executeSql('INSERT INTO Departments (name) VALUES ("Client Services");');
  tx.executeSql('INSERT INTO Departments (name) VALUES ("Investor Services");');
  tx.executeSql('INSERT INTO Departments (name) VALUES ("Shipping");');
  tx.executeSql('INSERT INTO Departments (name) VALUES ("Direct Sales");');

  tx.executeSql('INSERT INTO Offices (name, longtitude, latitude) VALUES ("Denver", 59.8,  34.1);');
  tx.executeSql('INSERT INTO Offices (name, longtitude, latitude) VALUES ("Warsaw", 15.7, 54.1);');
  tx.executeSql('INSERT INTO Offices (name, longtitude, latitude) VALUES ("Berlin", 35.3, 12.1);');
  tx.executeSql('INSERT INTO Offices (name, longtitude, latitude) VALUES ("Paris", 10.7, 14.1);');

  tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Sylvester Stallone", 2,  4);');
  tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Elvis Presley", 2, 4);');
  tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Leslie Nelson", 3,  4);');
  tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Fidel Castro", 3, 3);');
  tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Bill Clinton", 1, 3);');
  tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Margaret Thatcher", 1, 3);');
  tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Donald Trump", 1, 3);');
  tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Dr DRE", 2, 2);');
  tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Samantha Fox", 2, 1);');
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
  getEmployees () {
    log.debug("Executing employee query");
    let result = []
    return dbConnect().
      then((db) => {
        return db.transaction((tx) => 
          tx.executeSql(`
            SELECT a.name, b.name as deptName 
            FROM Employees a, Departments b 
            WHERE a.department = b.department_id
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

  getConfig () {

  },

  insertConfig (config) {
    // UPDATE config SET value = 'code_monkey' WHERE key = 'key_name';
    // INSERT INTO config(key, value) values('key_name', code monkey) WHERE changes() = 0;
  }
}
