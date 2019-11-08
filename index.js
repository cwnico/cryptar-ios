// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var usuariosConectados = {};
var localStorage;
var port = process.env.PORT || 50000;
var ipUsers = [];
var usernames = [];
var userTokens = [];

var request = require("request");

// 128-bit key

server.listen(port, function () {
	console.log('CRYPTAR escuchando puerto: %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom
var numUsers = 0;
io.on('connection', function (socket) {
	var addedUser = false;

	socket.on('new message', function (data, callback) {
		objdata = JSON.parse(data);
		// refresco siempre el registrationId
		userTokens[objdata.propietario] = objdata.registrationId;

		if(estaPresente(objdata.destinatario)==true){
			usuariosConectados[objdata.destinatario].emit('new message', data, function (response) {
				if(response == "ok"){
					callback(JSON.stringify({estado:'ok', mensaje: '<i class="fa fa-check" style="position: relative;left: 8px;"></i><i class="fa fa-check"></i>', idMessage: objdata.idMessage}));
				}
			});
			//sendPush(objdata.destinatario, objdata.propietario);
		}else{
			guardarMensajeEnEspera(objdata.destinatario, objdata);
			// envio push
			sendPush(objdata.destinatario, objdata.propietario);
			callback(JSON.stringify({estado:'ok', mensaje: '<i class="fa fa-check"></i>', idMessage: objdata.idMessage}));

		}
		// Envio masivo de mensajes.
		// socket.broadcast.emit('new message', data);
	});

	socket.on('new photo', function (data) {
		console.log("llego la imagen");
		// we tell the client to execute 'new message'
		objdata = JSON.parse(data);
		if(estaPresente(objdata.destinatario)==true){
			//console.log("Presente");
			usuariosConectados[objdata.destinatario].emit('new photo', data);
		}else{
			guardarMensajeEnEspera(objdata.destinatario, objdata);
		}
	});

	// when the client emits 'add user', this listens and executes
	socket.on('add user', function (objuser) {
		try{
			obj = JSON.parse(objuser);
			userTokens[obj.username] = obj.token;
			if (addedUser) return;

			console.log('CONECTADO: '+obj.username);
			ipUsers.push(socket.request.connection.remoteAddress);
			socket.username = obj.username;
			
			usuariosConectados[obj.username] = socket;

			++numUsers;

			if (usernames.indexOf(obj.username) === -1){
				// Customizar claves por usuario.
				usernames.push({'username':obj.username});
			}

			addedUser = true;
			socket.emit('login', {
				usernames: usernames,
				numUsers: numUsers,
				ipUsers: ipUsers
			});
			// echo globally (all clients) that a person has connected
			socket.broadcast.emit('user joined', {
				usernames: usernames,
				numUsers: numUsers,
				ipUsers: ipUsers
			});
			chequearMensajesGuardados(obj.username);
		}catch(err){
			console.log(err.message);
		}
	});

	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', function (username) {
		console.log("is typing - "+username);
		try{
			usuariosConectados[username].emit('typing', {
				username: socket.username
			});
		}catch(err){
			console.log(err.message);
		}
	}); 

	// when the client emits 'stop typing', we broadcast it to others
	socket.on('stop typing', function (username) {
		console.log("stop typing - "+username);
		try{
			usuariosConectados[username].emit('stop typing', {
				username: socket.username
			});
		}catch(err){
			console.log(err.message);
		}
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function () {
		if (addedUser) {
			console.log('Se DESCONECTO: '+socket.username);
			--numUsers;
			var nuevoarr = [];
			for (var i = 0; i < usernames.length; i++) {
				if(usernames[i].username!=socket.username){
					nuevoarr.push(usernames[i]);
				}
			}

			usernames = nuevoarr;

			// echo globally that this client has left
			socket.broadcast.emit('user left', {
				usernames: usernames,
				numUsers: numUsers
			});
		}
	});

	function sendPush(destinatario, propietario){
		var url = 'http://cryptar.com.ar/notification?usuario='+propietario+'&token='+userTokens[destinatario];
		request({
			url: url,
			json: true
		}, function (error, response, body) {
//			if (!error && response.statusCode === 200) {
				// console.log(body) // Print the json response
//			}
			var control = true;
		});
	}
	function estaPresente(username){
		presente = false;
		for (var i = 0; i < usernames.length; i++) {
			if(usernames[i].username==username){
				presente = true;
			}
		}
		return presente;
	}
	function guardarMensajeEnEspera(username, data){
		if (typeof localStorage === "undefined" || localStorage === null) {
			var LocalStorage = require('node-localstorage').LocalStorage;
			localStorage = new LocalStorage('./msgGuardados');
		}
		mensajesjson = localStorage.getItem("historial"+username);
		if (mensajesjson != "" && mensajesjson != null) {
			conversacionguardada = JSON.parse(mensajesjson);
		} else {
			conversacionguardada = null;
		}

		if(conversacionguardada == null) {
			mensajes = [data];
			localStorage.setItem("historial"+username, JSON.stringify(mensajes));
		} else {
			conversacionguardada.push(data);
			localStorage.setItem("historial"+username, JSON.stringify(conversacionguardada));
		}
	}
	function chequearMensajesGuardados(username){
		if (typeof localStorage === "undefined" || localStorage === null) {
			var LocalStorage = require('node-localstorage').LocalStorage;
			localStorage = new LocalStorage('./msgGuardados');
		}

		mensajesjson = localStorage.getItem("historial"+username);
		if (mensajesjson != "" && mensajesjson != null) {
			conversacionguardada = JSON.parse(mensajesjson);
		} else {
			conversacionguardada = null;
		}
		if(conversacionguardada!=null){
			for(var i = 0; i<conversacionguardada.length; i++){
				var tipo = conversacionguardada[i].tipo;
				if(tipo == "texto"){
					usuariosConectados[username].emit('new message', JSON.stringify(conversacionguardada[i]));
				}else{
					usuariosConectados[username].emit('new photo', JSON.stringify(conversacionguardada[i]));
				}
			}
			localStorage.setItem("historial"+username, "");
		}
	}
});