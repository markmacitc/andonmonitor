var sqlite3 = require('sqlite3');
sqlite3.verbose();
var db = undefined;
exports.connect = function(dbname, callback) {
    db = new sqlite3.Database(dbname,
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        function(err) {
            if (err) callback(err);
            else     callback();
        }
);
}
exports.disconnect = function(callback) {
    callback();
}
exports.create = function(key,line,description, callback) {    
    debugger;
    db.run("INSERT INTO line ( Line, Description) "+
        "VALUES ( ?, ?);",
        [ line, description ],
        function(err) {
            if (err) callback(err);
            else     callback();
        });
}
exports.update = function(key, line, description, callback) {
    db.run("UPDATE line "+
        "SET line = ?, Description = ? "+
        "WHERE id = ?",
        [ line, description, key ],
        function(err) {
            if (err) callback(err);
            else     callback();
        });
}
exports.read = function(key, callback) {    
    db.get("SELECT * FROM line WHERE id = ?", 
        [ key ], 
        function(err, row) {
        if (err) callback(err);
        else     callback(null, row);
    });
}
exports.destroy = function(key, callback) {
    db.run("DELETE FROM line WHERE id = ?;", 
        [ key ],
        function(err) {
        if (err) callback(err);
        else     callback();
    });
}
exports.list = function(callback) {
    var titles = [];
    db.each("SELECT id, line, description FROM Line",
        function(err, row) {            
            if (err) callback(err);            
            else titles.push({
               id: row.Id, line: row.Line, desc: row.Description });
        },
        function(err, num) {
            if (err) callback(err);
            else callback(null, titles);
        });    
}
