
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('test', { title: 'TEST' });
};