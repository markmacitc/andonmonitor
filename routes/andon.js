//var notes = require('../models/notes');
var andons = undefined;
var line = require('../models/lines');
exports.configure = function(params) {
  andons = params.model;
};
var readandon = function(key, res, done) {
  andons.read(key,
        function(err, data) {
          debugger;
          if (err) {
            res.render('showerror', {
              title: 'Could not read andon ' + key,
              error: err
            });
            done(err);
          } else {done(null, data);}
        });
};

exports.index = function(req, res) {
  andons.list(function(err, andons) {
    if (err) {
      res.render('showerror', {
        description: 'Could not retrieve note keys from data store',
        error: err
      });
    } else {
      res.render('andons', {title: 'Andons', andons: andons});
    }
  });
};

exports.add = function(req, res, next) {
  line.list(function(err, lines) {

    res.render('andonedit', {
      title: 'Add an Andon',
      docreate: true,
      notekey: '',
      andon: undefined,
      linelist: lines
    });
  });
};
exports.save = function(req, res, next) {
  ((req.body.docreate === 'create')      ?
        andons.create : andons.update
  )(req.body.id,req.body.lineid, req.body.number,req.body.linetaktrate,
    req.body.andontaktrate,req.body.countstart,req.body.type,
        function(err) {
          if (err) {
            // show error page
            res.render('showerror', {
              title: 'Could not update file',
              error: err
            });
          } else {
            res.redirect('/andons');
          }
        });
};
exports.view = function(req, res, next) {
  if (req.query.id) {

    readandon(req.query.id, res, function(err, data) {
      if (!err) {
        res.render('andonview', {
          title: data.number,
          notekey: req.query.id,
          andon: data
        });
      }
    });
  } else {
    res.render('showerror', {
      title: 'No key given for Andon',
      error: 'Must provide a Key to view an Andon'
    });
  }
};
exports.edit = function(req, res, next) {
  line.list(function(err, lines) {
    if (!err) {
      if (req.query.id) {
        readandon(req.query.id, res, function(err, data) {
          if (!err) {
            res.render('andonedit', {
              title: data ?
                 ('Edit ' + data.id) : 'Add an andon',
              docreate: false,
              notekey: req.query.id,
              andon: data,
              linelist: lines
            });
          }
        });
      } else {
        res.render('showerror', {
          title: 'No key given for Andon',
          error: 'Must provide a Key to view an Andon'
        });
      }
    } else {
      res.render('showerror', {
        title: 'Line retrieval error',
        error: 'Unable to retrive a list of lines'
      });
    }});
};
exports.destroy = function(req, res, next) {
  if (req.query.id) {
    readandon(req.query.id, res, function(err, data) {
      if (!err) {
        res.render('andondestroy', {
          title: data.number,
          notekey: req.query.id,
          andon: data
        });
      }
    });
  } else {
    res.render('showerror', {
      title: 'No key given for Andon',
      error: 'Must provide a Key to view an  Andon'
    });
  }
};
exports.dodestroy = function(req, res, next) {
  andons.destroy(req.body.id, function(err) {
    if (err) {
      res.render('showerror', {
        title: 'Could not delete Andon '             +
                     req.body.id,
        error: err
      });
    } else {
      res.redirect('/andons');
    }
  });
};

exports.getandons = function(callback) {

  andons.list(function(err, andons) {
    if (err) {
      return callback(err);
    }
    results = andons;
    callback(null,results);
  });
};
