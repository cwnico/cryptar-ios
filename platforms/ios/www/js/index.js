let host = window.localStorage.getItem('host');
let device;
let uuid;

function controlhost(){
  if(parameters.production){
    host = window.localStorage.getItem('host');
    if(host === null || host === "false"){
      window.localStorage.setItem('host', false);
      window.location.href="./cargarhosts.html";
    }
    host = window.localStorage.getItem('host');
  }else{
    host = parameters.hostdev;
    window.localStorage.setItem('host', parameters.hostdev);
  }
}

function controlLogin() {
  var isLogged = window.localStorage.getItem('isLogged');
  if(isLogged === 'undefined' || isLogged === false || isLogged === null){
  }else{
    var nombreUsuario = window.localStorage.getItem('nombreUsuario') ? window.localStorage.getItem('nombreUsuario') : '';
    var claveUsuario = window.localStorage.getItem('claveUsuario') ? window.localStorage.getItem('claveUsuario') : '';

    if(nombreUsuario !== '' && claveUsuario !== ''){
      $('#nombreusuario').text(nombreUsuario);
      $('#password').text(claveUsuario);
      login(true);
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
          window.localStorage.setItem('fecha_desde', data.fecha_desde);
          window.localStorage.setItem('fecha_hasta', data.fecha_hasta);
          window.localStorage.setItem("claves"+data.usuario.username, JSON.stringify(data.usuario));
          window.location.href="./inicio.html";
        }catch(err){
          $('.error').html(err.message).fadeIn().fadeOut(4000);
          $('.spinner').addClass('hidden');
        }
      }else{
        $('.error').html(data.respuesta).fadeIn().fadeOut(2000);
        $('.spinner').addClass('hidden');
      }
    },
    fail: function (datahost) {
      $('.spinner').addClass('hidden');
      $('.error').html('Error al conectarse al HOST PRINCIPAL: ' + JSON.stringify(datahost)).fadeIn().fadeOut(2000);
    }
  });
}

function login(use_localstorage){
  try{
    if(use_localstorage){
      var nombreusuario = window.localStorage.getItem('nombreUsuario') ? window.localStorage.getItem('nombreUsuario') : '';
      var clave = window.localStorage.getItem('claveUsuario') ? window.localStorage.getItem('claveUsuario') : '';
    }else{
      var nombreusuario = $('#nombreusuario').val();
      var clave = $('#password').val();
    }

    // $('.spinner').removeClass('hidden');

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
          // var hashC = hashCryptar(clave);
          var bf = new Blowfish(cifrado);
          var cifradoEnc = bf.encrypt(clave);
          var encrypted64 = bf.base64Encode(cifradoEnc);

          try{
            loginSecond(encrypted64, clave);
          }catch(err){
            $('.error').html(err.message).fadeIn().fadeOut(2000);
            $('.spinner').addClass('hidden');
          }
        }else{
          $('.error').html(data.respuesta).fadeIn().fadeOut(2000);
          $('.spinner').addClass('hidden');
        }
      },
      fail: function (datahost) {
        $('.spinner').addClass('hidden');
        $('.error').html('Error al conectarse al HOST PRINCIPAL: ' + JSON.stringify(datahost)).fadeIn().fadeOut(2000);
      }
    });
  }catch(err){
    $('.spinner').addClass('hidden');
    $('.error').html(err.message).fadeIn().fadeOut(4000);
  }
}

$('document').ready(function(){
  controlhost();
  controlLogin();
});

function onDeviceReady() {
  try {
    window.plugins.PushbotsPlugin.initialize("5de5244640038e0a430f9c63", {"android":{"sender_id":"724144400703"}});

    window.plugins.PushbotsPlugin.on("user:ids", function(data){
      window.localStorage.setItem('token', data.token);
    });
  }catch(err) {
    $(".error").html(err.message).fadeIn().fadeOut(2000);
  }
}

document.addEventListener("deviceready", onDeviceReady, false);

