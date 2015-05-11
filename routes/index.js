
/*
 * GET home page.
 */

exports.index = function(req, res){
  if (! req.isAuthenticated() )
	res.render('index', { title: 'Okasorkas - as GUEST' });
  else 
    res.render('index', { title: 'Okasorkas - welcome ' + req.user.username });
};