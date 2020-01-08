# Okasorcas
Okasorcas is a turn by turn / day by day strategic game 

![Okasorcas](/public/images/map_sample.png)

See tutorial (in french) [here](http://okasorcas.eu01.aws.af.cm/tutorial)

# Install
- install nodejs
- clone this git
- install with npm
  
        npm install

- compatibilities issues : install other package required by npm 
- start the game 

        npm start

- redis is required by the game, install it
- once redis is installed, restart the game, it will work with default port

# Passwords :
- go to http://myserver/partie1/login
- connect as admin. Default password for admin and other players is 'todo'
- download the current game 
- unzip backup.zip
- in zip, edit users.json to add password.  "0" user is admin.
- you can link wizard to special user by editing admin.json (default is : same id)
- upload the new backup.zip

# Customized game
- go to http://myserver/partie1/login as admin
- choose turn duration (default : 1 day)
- enter edit map mode and draw your own map
- save map


