    var lines = undefined;
exports.configure = function(params) {
  lines = params.model;
};
exports.index = function(req, res) {
  lines.list(function(err, lines) {
    if (err) {
      res.render('showerror', {
        description: 'Could not retrieve note keys from data store',
        error: err
      });
    } else {
      res.render('index', {title: 'Lines', lines: lines});
    }
  });
};

exports.view = function(req, res, next) {
  if (req.query.id) {
    readNote(req.query.id, res, function(err, data) {
      if (!err) {
        res.render('noteview', {
          title: data.title,
          notekey: req.query.id,
          note: data
        });
      }
    });
  } else {
    res.render('showerror', {
      title: 'No key given for Line',
      error: 'Must provide an Id to view a Line'
    });
  }
};
exports.save = function(req, res, next) {
  ((req.body.docreate === 'create')      ?
        notes.create : notes.update
  )(req.body.notekey, req.body.title, req.body.body,
        function(err) {
          if (err) {
            // show error page
            res.render('showerror', {
              title: 'Could not update file',
              error: err
            });
          } else {
            res.redirect('/noteview?key=' + req.body.notekey);
          }
        });
};
exports.add = function(req, res, next) {
  res.render('noteedit', {
    title: 'Add a Note',
    docreate: true,
    notekey: '',
    note: undefined
  });
};
exports.edit = function(req, res, next) {
  if (req.query.key) {
    readNote(req.query.key, res, function(err, data) {
      if (!err) {
        res.render('noteedit', {
          title: data ?
             ('Edit ' + data.title) : 'Add a Note',
          docreate: false,
          notekey: req.query.key,
          note: data
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
  if (req.query.key) {
    readNote(req.query.key, res, function(err, data) {
      if (!err) {
        res.render('notedelete', {
          title: data.title,
          notekey: req.query.key,
          note: data
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
exports.dodestroy = function(req, res, next) {
  notes.destroy(req.body.notekey, function(err) {
    if (err) {
      res.render('showerror', {
        title: 'Could not delete Note '             +
                     req.body.notekey,
        error: err
      });
    } else {
      res.redirect('/');
    }
  });
};
