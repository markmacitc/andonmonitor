var sqlite3 = require('sqlite3');
sqlite3.verbose();
var db = undefined;
exports.connect = function(dbname, callback) {
  db = new sqlite3.Database(dbname,
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        function(err) {
          if (err) {callback(err);} else {callback();}
        }
);
};
exports.disconnect = function(callback) {
  callback();
};
exports.create = function(key, lineid, number, linetaktrate, andontaktrate,
   countstart, Type, callback) {
  db.run('INSERT INTO andon ( lineId, number, linetaktrate,andontaktrate,' +
    'countstart,type) ' +
    'VALUES ( ?, ?,?,?,?,?);',
    [lineid, number,linetaktrate,andontaktrate,countstart,Type],
        function(err) {
          if (err) {callback(err);} else {callback();}
        });
};
exports.update = function(key, lineid, number, linetaktrate, andontaktrate,
  countstart, Type, callback) {
  db.run('UPDATE andon ' +
      'SET lineId = ?, number = ?, linetaktrate =?, andontaktrate = ?,' +
       'countstart = ?, type = ? ' +
      'WHERE id = ?',
      [lineid, number,linetaktrate,andontaktrate,countstart,Type, key],
        function(err) {
          if (err) {callback(err);} else {callback();}
        });
};
exports.read = function(key, callback) {
  db.get('SELECT * FROM andon WHERE id = ?',
      [key],
        function(err, row) {
          if (err) {callback(err);} else {callback(null, row);}
        });
};
exports.destroy = function(key, callback) {
  db.run('DELETE FROM andon WHERE id = ?;',
        [key],
        function(err) {
          if (err) { callback(err);} else {callback();}
        });
};
exports.list = function(callback) {
  var andons = [];
  db.each('SELECT * FROM andon order by number',
        function(err, row) {
          if (err) {callback(err);} else {andons.push({
          id: row.id, lineid: row.lineid,number: row.number,linetakt:
          row.linetaktrate, andontaktrate: row.andontaktrate,countstart:
          row.countstart, type: row.type});}
        },
        function(err, num) {
          if (err) {callback(err);} else {callback(null, andons);}
        });
};
