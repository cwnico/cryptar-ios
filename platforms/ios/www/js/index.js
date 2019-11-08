var host = window.localStorage.getItem('host');
var device;
var uuid;

function controlhost(){
	host = window.localStorage.getItem('host');
	if(host === null || host === "false"){
		window.localStorage.setItem('host', false);
		window.location.href="./cargarhosts.html";
	}
	host = window.localStorage.getItem('host');
}

function controlLogin() {
	var isLogged = window.localStorage.getItem('isLogged');
	if(isLogged === 'undefined' || isLogged === "false" || isLogged === null){
	}else{
		var nombreUsuario = window.localStorage.getItem('nombreUsuario') ? window.localStorage.getItem('nombreUsuario') : '';
		var claveUsuario = window.localStorage.getItem('claveUsuario') ? window.localStorage.getItem('claveUsuario') : '';

		if(nombreUsuario !== '' && claveUsuario !== ''){
			$('#nombreusuario').val(nombreUsuario);
			$('#password').val(claveUsuario);
			login();
		}
	}
}

function hashCryptar(string){
	var a = Array.from(string).map(ch => ch.charCodeAt());
	var b = new Uint8Array(a).buffer;
	var c = RIPEMD160.hash(b);
	var d = Array.from(new Uint8Array(c));
	var e = d.map(x => x.toString(16).padStart(2, 0)).join("");
	return e;
}

function loginSecond(cifradoEnc, clave){
	$.ajax({
		type: 'post',
		url: host+"/loginAPPSecond",
		data: {cifrado: cifradoEnc},
		success: function ( data ) {
			if(data.estado){
				try{

					var bf = new Blowfish(cifradoEnc);
					var encrypted64 = bf.base64Decode(data.respuesta);
					var encryptedHex = bf.decrypt(encrypted64);
					encryptedHex = bf.trimZeros(encryptedHex);

					data = JSON.parse(encryptedHex);

					window.localStorage.setItem('isLogged', true);
					window.localStorage.setItem('apellidoNombreUsuario', data.usuario.apellidonombre);
					window.localStorage.setItem('nombreUsuario', data.usuario.username);
					window.localStorage.setItem('claveUsuario', clave);
					window.localStorage.setItem('idUsuario', data.usuario.idusuario);
					window.localStorage.setItem('usuarios', JSON.stringify(data.respuesta));
					window.localStorage.setItem('key', data.key);
					window.localStorage.setItem('keyBF', data.keyBF);
					window.localStorage.setItem('keyBF', data.keyBF);
					window.localStorage.setItem("claves"+data.usuario.username, JSON.stringify(data.usuario));
					window.location.href="./inicio.html";
				}catch(err){
					$('.error').html(err.message).fadeIn().fadeOut(4000);
				}
			}else{
				$('.error').html(data.respuesta).fadeIn().fadeOut(2000);
			}
		},
		fail: function (datahost) {
			$('.spinner').addClass('hidden');
			$('.error').html('Error al conectarse al HOST PRINCIPAL: ' + JSON.stringify(datahost)).fadeIn().fadeOut(2000);
		}
	});
}

function login(){
	try{
		var nombreusuario = $('#nombreusuario').val();
		var clave = $('#password').val();
		$('.spinner').removeClass('hidden');

		// var usuarioprincipal = window.localStorage.getItem('usuarioprincipal');
		// if(usuarioprincipal !== null && usuarioprincipal !== nombreusuario){
		// 	$('.error').html("ESTE DISPOSITIVO LE PERTENECE A OTRO USUARIO.").fadeIn().fadeOut(2000);
		// }else{

		$.ajax({
			type: 'post',
			url: host+"/loginAPPFirst",
			data: {usuario: nombreusuario},
			success: function ( data ) {
				if(data.estado){
					var nrocomprobante = data.respuesta;

					var fullDate = new Date();
					var twoDigitMonth = (fullDate.getMonth()+1)+"";if(twoDigitMonth.length==1)	twoDigitMonth ="0"+twoDigitMonth;
					var twoDigitDate = fullDate.getDate()+"";if(twoDigitDate.length==1)	twoDigitDate="0" +twoDigitDate;
					var currentDate = twoDigitDate + "" + twoDigitMonth + "" + fullDate.getFullYear();
					var cifrado = currentDate+nrocomprobante;
					var hashC = hashCryptar(clave);
					var bf = new Blowfish(hashC);
					var cifradoEnc = bf.encrypt(cifrado);
					var encrypted64 = bf.base64Encode(cifradoEnc);

					try{
						loginSecond(encrypted64, clave);
					}catch(err){
						$('.error').html(err.message).fadeIn().fadeOut(2000);
					}
				}else{
					$('.error').html(data.respuesta).fadeIn().fadeOut(2000);
				}
			},
			fail: function (datahost) {
				$('.spinner').addClass('hidden');
				$('.error').html('Error al conectarse al HOST PRINCIPAL: ' + JSON.stringify(datahost)).fadeIn().fadeOut(2000);
			}
		});
		$('.spinner').addClass('hidden');
	}catch(err){
		$('.spinner').addClass('hidden');
		$('.error').html(err.message).fadeIn().fadeOut(4000);
	}
}

$('document').ready(function(){
	controlhost();
});

function onDeviceReady() {
	controlLogin();

	// window.localStorage.setItem('usuarioprincipal', 'larrosa');

	// try{
	// 	window.FirebasePlugin.onTokenRefresh(function(token) {
	// 		window.localStorage.setItem('token', token);
	// 	}, function(error) {
	// 		window.localStorage.setItem('token', '');
	// 	});
	// } catch (err) {
	// 	console.log(err.message);
	// }
}

document.addEventListener("deviceready", onDeviceReady, false);

