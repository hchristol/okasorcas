# Okasorcas
Okasorcas is a turn by turn / day by day strategic game 

![Okasorcas](/public/images/map_sample.png)


# Install 
- install nodejs
- clone this git
- install with npm
  
        npm install

- compatibilities issues : install other package required by npm 
- start the game 

        npm start

- redis is required by the game, install it
- default redis server is named redisokasorcas. You can change your redis server (and port)  by editing routes/redis.js, for instance to use a local redis server :

        exports.client = redis.createClient(6379,"127.0.0.1");

- once redis is installed, restart the game, it will work with default port (6379)

# Install with Docker :

Choose a directory for your persistant data, for instance home directory :

    cd /home
    git clone https://github.com/hchristol/okasorcas.git

    docker create network okasorcas

    docker pull node:10
    docker pull redis

start redis server

    docker run -d --rm --name redisokasorcas --network okasorcas  -v /home/okasorcas/database:/data redis:latest

If you want another name for your redis container, edit redis.js in routes folder to change default host :

    exports.client = redis.createClient(6379,"redisokasorcas");

start node container with okasorcas :

    cd /home/okasorcas
    docker run -d --rm --name okasorcas --network okasorcas -p 80:80 -v "$PWD":/home/okasorcas -w /home/okasorcas node:10  node app.js

if you want to update or install  some npm package :

docker run -it  --rm --name okasorcas --network okasorcas -v "$PWD":/home//okasorcas -w /home/okasorcas node:10  npm update
docker run -it  --rm --name okasorcas --network okasorcas -v "$PWD":/home/okasorcas -w /home/okasorcas node:10  npm install passport, passport-local, connect-flash, redis, express, connect, mkdirp, node-zip

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


