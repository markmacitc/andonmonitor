//var notes = require('../models/notes');
var lines = undefined;
var errors = undefined;

exports.configure = function(params) {
  lines = params.model;
};
var readLine = function(key, res, done) {
  lines.read(key,
        function(err, data) {
          debugger;
          if (err) {
            res.render('showerror', {
              title: 'Could not read line ' + key,
              error: err
            });
            done(err);
          } else {done(null, data);}
        });
};
exports.index = function(req, res) {
  res.render('index', {title: 'Lines', lines: lines});
};

exports.add = function(req, res, next) {
  res.render('lineedit', {
    title: 'Add a Line',
    docreate: true,
    notekey: '',
    line: undefined,
    flash: undefined
  });
};
exports.save = function(req, res, next) {

  //validation(req,res);
  errors = req.validationErrors();
  if (errors) {
    debugger;
    res.render('lineedit',{
      title: 'Error encountered',
      docreate: false,
      notekey: '',
      line: undefined,
      flash:  errors
    });
  } else {
    ((req.body.docreate === 'create') ?
        lines.create : lines.update
    )(req.body.id,req.body.line, req.body.description,
        function(err) {
          if (err) {
            // show error page
            res.render('showerror', {
              title: 'Could not update file',
              error: err
            });
          } else {
            res.redirect('/lines');
          }
        });
  }
};
exports.view = function(req, res, next) {
  if (req.query.id) {

    readLine(req.query.id, res, function(err, data) {
      if (!err) {

        res.render('lineview', {
          title: data.Line,
          notekey: req.query.id,
          line: data
        });
      }
    });
  } else {
    res.render('showerror', {
      title: 'No key given for Note',
      error: 'Must provide a Key to view a Line'
    });
  }
};
exports.edit = function(req, res, next) {
  if (req.query.id) {
    readLine(req.query.id, res, function(err, data) {
      if (!err) {
        res.render('lineedit', {
          title: data ?
             ('Edit ' + data.Id) : 'Add a Line',
          docreate: false,
          notekey: req.query.id,
          line: data,
          flash: undefined
        });
      }
    });
  } else {
    res.render('showerror', {
      title: 'No key given for Note',
      error: 'Must provide a Key to view a Note'
    });
  }
};
exports.destroy = function(req, res, next) {
  if (req.query.id) {
    readLine(req.query.id, res, function(err, data) {
      if (!err) {
        res.render('linedestroy', {
          title: data.Line,
          notekey: req.query.id,
          line: data
        });
      }
    });
  } else {
    res.render('showerror', {
      title: 'No key given for Note',
      error: 'Must provide a Key to view a Lne'
    });
  }
};
exports.dodestroy = function(req, res, next) {
  debugger;
  lines.destroy(req.body.id, function(err) {
    if (err) {
      res.render('showerror', {
        title: 'Could not delete Note '             +
                     req.body.notekey,
        error: err
      });
    } else {
      res.redirect('/lines');
    }
  });
};
function validation(req, res, errors) {
  req.checkBody('line','Line is required').notEmpty();
  req.checkBody('description','Description is required').notEmpty();

}
