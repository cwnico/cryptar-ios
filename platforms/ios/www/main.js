// Initialize app
var socket, username, pictureSource, destinationType, myMessages, modeloUUID, myMessagebar, innerH, fechaDesde, fechaHasta;
var propietario = "Sin identificar";
var myApp = new Framework7({
  pushState: true,
  swipeBackPage: false
});

var mostrardia = false;
var tapped = false;
var ultimaRed = '';
var FADE_TIME = 150; // ms
var TYPING_TIMER_LENGTH = 400; // ms

var host = window.localStorage.getItem('host');
host = host.replace(/(^\w+:|^)\/\//, '');
socket = io("https://cryptarchat."+host);


function controldehosts() {
  var hostCtrl = window.localStorage.getItem('host');

  if (hostCtrl === null || hostCtrl === false) {
    window.localStorage.setItem('host', false);
    window.location.href = "./cargarhosts.html";
  }
}

function dateFromString(string) {
  var fechaErronea = string.split(" ")[0];
  var hora = string.split(" ")[1];
  var arrFecha = fechaErronea.split("-");
  var fechaCorrecta = arrFecha[2] + "/" + arrFecha[1] + "/" + arrFecha[0] + " " + hora;
  return fechaCorrecta;
}

function controlFechas(fecha){
  fechaDesde = window.localStorage.getItem('fecha_desde');
  fechaHasta = window.localStorage.getItem('fecha_hasta');

  var dateFrom = new Date(fechaDesde);
  var dateTo = new Date(fechaHasta);
  var msgDate = new Date(dateFromString(fecha+":00"));

  if (dateFrom === 'undefined' || dateTo === 'undefined' || dateFrom > msgDate || msgDate > dateTo) {
    return true;
  }

  return false;
}

var $$ = Dom7;
var usuarioactual = "";
$(function() {
  var typing = false;
  var lastTypingTime;

  function date() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    var hours = today.getHours();
    var min = today.getMinutes();
    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }

    today = dd + '-' + mm + '-' + yyyy + ' ' + hours + ':' + min;
    return today;
  }

  function addParticipantsMessage(data) {
    // ESTO AHORA SOLO ME DICE SI ESTA EN LINEA
  }

  function enviarcola() {
    colasalidastr = window.localStorage.getItem("colasalida");
    if (colasalidastr !== '') {
      colasalida = JSON.parse(colasalidastr);
      colatemp = colasalida;
      colasalida = [];
      window.localStorage.setItem("colasalida", JSON.stringify(colasalida));
      $.each(colatemp, function(index, value) {
        if (value !== null) {
          sendMessage(value.message, value.propietario, value.destinatario, value.iv, value.idMessage);
        }
      });
    }
  }

  function sendMessage(mensaje, propietario, destinatario, iv, idMessage) {
    var message = mensaje;
    propietario = window.localStorage.getItem('nombreUsuario');
    if (message && socket.connected) {
      datosenvio = {
        username: username,
        tipo: "texto",
        message: message,
        registrationId: window.localStorage.getItem('token'),
        fecha: date(),
        propietario: propietario,
        destinatario: destinatario,
        idMessage: idMessage,
        iv: iv
      };

      // TODO: Reenviar mensajes en cola de espera. Aca solo se guardan.
      colasalidastr = window.localStorage.getItem("colasalida");
      if (colasalidastr === '') {
        colasalida = [];
      } else {
        colasalida = JSON.parse(colasalidastr);
      }

      colasalida.push(datosenvio);
      colastr = JSON.stringify(colasalida);
      window.localStorage.setItem("colasalida", colastr);

      try {
        socket.emit('new message', JSON.stringify(datosenvio), function(response) {
          var user = $('.messages > div:last-child > .message-name').html();
          objResponse = JSON.parse(response);
          if (objResponse.estado === "ok" && user === propietario) {
            $('.message-sent:last-child  > .message-label').html(objResponse.mensaje);
            colasalidastr = window.localStorage.getItem("colasalida");
            colasalida = JSON.parse(colasalidastr);
            colasalida.splice(-1, 1);
            window.localStorage.setItem("colasalida", JSON.stringify(colasalida));
          }
        });
      } catch (err) {
        navigator.notification.console.log(err.message);
      }
    }
  }


  function dateString(date) {
    if (typeof date === 'undefined') {
      return false;
    }
    var month = new Array();
    month['01'] = "Ene";
    month['02'] = "Feb";
    month['03'] = "Mar";
    month['04'] = "Abr";
    month['05'] = "May";
    month['06'] = "Jue";
    month['07'] = "Jul";
    month['08'] = "Ago";
    month['09'] = "Sep";
    month['10'] = "Oct";
    month['11'] = "Nov";
    month['12'] = "Dic";
    return month[date.split("-")[1]] + " " + date.split("-")[0] + " de " + (date.split("-")[2]).split(" ")[0];
  }

  function addMessage(text, name, type, date) {
    myMessages.addMessage({
      text: text,
      name: name,
      type: type,
      date: (typeof date !== 'undefined') ? date.split(" ")[1] : '',
      day: mostrardia ? dateString(date) : false
      // time: date.split(" ")[1]
    });

    myMessagebar = myApp.messagebar('.messagebar');
    myMessagebar.textarea[0].focus();
    // myMessages.scrollMessages();
  }
  // Sends Image
  function sendImage(mensaje, propietario, destinatario, iv) {
    var message = mensaje;
    propietario = window.localStorage.getItem('nombreUsuario');
    if (message && socket.connected) {
      datosenvio = {
        username: username,
        tipo: "imagen",
        message: message,
        registrationId: '',
        fecha: date(),
        iv: iv,
        propietario: propietario,
        destinatario: destinatario
      };
      // tell server to execute 'new photo' and send along one parameter
      socket.emit('new photo', JSON.stringify(datosenvio));
      addMessage("<strong>IMAGEN ENVIADA</strong>", propietario, 'sent', datosenvio.fecha);
    }
  }

  // Whenever the server emits 'login', log the login message
  socket.on('login', function(data) {
    addParticipantsMessage(data);
  });
  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function(data, callback) {
    obj = JSON.parse(data);

    if(controlFechas(obj.fecha)){
      return false;
    }

    if (obj.tipo === 'texto') {
      if (usuarioactual != "") {
        clase = "." + usuarioactual;
        $(clase).css('display', 'none');
      }
      propietario = window.localStorage.getItem('nombreUsuario');
      objetoClaves = {
        key: window.localStorage.getItem("key"),
        keyBF: window.localStorage.getItem("keyBF"),
        iv: obj.iv
      };
      mensajeDecriptado = deCryptar(obj.message, objetoClaves);
      if (usuarioactual !== obj.propietario) {
        clase = "." + obj.propietario;
        $(clase).css('display', 'block');
        myApp.addNotification({
          title: obj.propietario,
          message: mensajeDecriptado,
          hold: 1500,
          onClick: function() {
            $('#' + obj.username).click();
          }
        });
      }
      mensajesjson = window.localStorage.getItem(propietario + obj.propietario);
      if (mensajesjson !== "" && mensajesjson !== null) {
        conversacionactual = JSON.parse(mensajesjson);
      } else {
        conversacionactual = null;
      }
      mensajeobj = {
        'propietario': obj.propietario,
        'fecha': obj.fecha,
        'mensaje': obj.message,
        'iv': obj.iv,
        'idMessage': obj.idMessage,
        'registrationId': obj.registrationId
      };
      if (conversacionactual === null) {
        mensajes = [mensajeobj];
        window.localStorage.setItem(propietario + obj.propietario, JSON.stringify(mensajes));
      } else {
        conversacionactual.push(mensajeobj);
        window.localStorage.setItem(propietario + obj.propietario, JSON.stringify(conversacionactual));
      }
      // guardo el mensaje en la BD local.
      if (usuarioactual === obj.propietario) {
        if($("#" + obj.idMessage).length == 0) {
          addMessage(mensajeDecriptado, obj.propietario, 'received', mensajeobj.fecha);
          $('.message-received:last-child').attr('id', obj.idMessage);
        }
      }
    }

    try {
      callback('ok');
    } catch (err) {
      console.log(err.message);
    }
  });
  socket.on('connect_timeout', function(timeout) {
    // Murio por timeout
  });
  socket.on('new photo', function(data, callback) {
    obj = JSON.parse(data);
    if (usuarioactual != "") {
      clase = "." + usuarioactual;
      $(clase).css('display', 'none');
    }
    propietario = window.localStorage.getItem('nombreUsuario');
    objetoClaves = {
      key: window.localStorage.getItem("key"),
      keyBF: window.localStorage.getItem("keyBF"),
      iv: obj.iv
    };
    mensajeDecriptado = deCryptar(obj.message, objetoClaves);
    if (usuarioactual !== obj.propietario) {
      clase = "." + obj.propietario;
      $(clase).css('display', 'block');
      myApp.addNotification({
        title: obj.propietario,
        message: "IMAGEN DESCARGADA",
        hold: 1500,
        onClick: function() {
          $('#' + obj.username).click();
        }
      });
    }
    mensajesjson = window.localStorage.getItem(propietario + obj.propietario);
    if (mensajesjson !== "" && mensajesjson !== null) {
      conversacionactual = JSON.parse(mensajesjson);
    } else {
      conversacionactual = null;
    }
    mensajeEncriptadoParaMostrar = cryptar("IMAGEN DESCARGADA", objetoClaves);
    mensajeobj = {
      'propietario': obj.propietario,
      'fecha': obj.fecha,
      'mensaje': mensajeEncriptadoParaMostrar,
      'iv': obj.iv,
      'registrationId': obj.registrationId
    };

    if (conversacionactual === null) {
      mensajes = [mensajeobj];
      window.localStorage.setItem(propietario + obj.propietario, JSON.stringify(mensajes));
    } else {
      conversacionactual.push(mensajeobj);
      window.localStorage.setItem(propietario + obj.propietario, JSON.stringify(conversacionactual));
    }
    // guardo el mensaje en la BD local.

    switch (device.platform) {
      case "Android":
        storageLocation = 'file:///storage/emulated/0/Download';
        break;
      case "iOS":
        storageLocation = cordova.file.documentsDirectory;
        break;
      case "browser":
        storageLocation = 'C:/Users/Nicolas/';
        break;
    }

    writeToFile('cryptarimg' + getRandomInt(0, 17) + '.jpg', storageLocation, mensajeDecriptado);

    if (usuarioactual === obj.propietario) {
      addMessage("IMAGEN DESCARGADA", obj.propietario, 'received', mensajeobj.fecha);
    }

    try {
      callback('ok');
    } catch (err) {
      console.log(err.message);
    }
  });

  socket.on('user joined', function(data) {
    addParticipantsMessage(data);
  });
  socket.on('user left', function(data) {
    addParticipantsMessage(data);
  });
  socket.on('typing', function(data) {
    if (usuarioactual === data.username) {
      $(".typing").html('Escribiendo..').fadeIn();
    }
  });
  socket.on('stop typing', function(data) {
    $(".typing").html('').fadeOut();
  });

  socket.on('disconnect', function() {});
  socket.on('connect', function() {
    enviarcola();
  });

  socket.on('reconnect', function() {
    if (username) {
      objuser = {
        username: username,
        token: window.localStorage.getItem("token")
      };
      socket.emit('add user', JSON.stringify(objuser));
    }
    enviarcola();
  });
  socket.on('reconnecting', function() {
    enviarcola();
  });

  socket.on('reconnect_error', function() {
    // connected = false;
  });
  // Add view
  var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true,
    cache: false
  });

  // Updates the typing event
  function updateTyping() {
    if (socket.connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing', usuarioactual);
      }
      lastTypingTime = (new Date()).getTime();
      setTimeout(function() {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing', usuarioactual);
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  function stopEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    $("#toolbar-navigation").removeClass('hidden');
  }

  function onDeviceReady() {
    try{
      if(window.Keyboard){
        window.Keyboard.shrinkView(true);
      }
      if(Keyboard){
        Keyboard.shrinkView(true);
      }
    }catch (e) {
      console.log(e.message)
    }
    $('.spinner').addClass('hidden');
    var isLogged = window.localStorage.getItem('isLogged');
    if (isLogged === 'undefined' || isLogged === false || isLogged === null) {
      window.location.href = "./index.html";
    } else {
      nombreUsuario = window.localStorage.getItem('nombreUsuario');
      usuarios = JSON.parse(window.localStorage.getItem('usuarios'));

      fechaDesde = window.localStorage.getItem('fecha_desde');
      fechaHasta = window.localStorage.getItem('fecha_hasta');

      for (var i = 0; i < usuarios.length; i++) {
        $$("#usuarios").append('<li id="' + usuarios[i].username + '">' +
          '<a href="messages.html?mac=' + usuarios[i].username + '&apellidonombre=' + usuarios[i].apellidonombre + '" class="item-link item-content">' +
          '<div class="item-media"><img src="img/icon.png" width="30" /></div>' +
          '<div class="item-inner"><div class="item-title">' + usuarios[i].apellidonombre + '</div>' +
          '<div class="item-after ' + usuarios[i].username + '" style="display: none;">' +
          '<span class="badge"><i class="fa fa-exclamation"></i></span></div>' +
          '</div>' +
          '</a>' +
          '</li>');
      }

      $("#nombreUsuario").html(nombreUsuario).change();

      document.addEventListener("backbutton", stopEvent, false);
      document.addEventListener("volumedownbutton", stopEvent, false);
      document.addEventListener("volumeupbutton", stopEvent, false);
      document.addEventListener("online", enviarcola, false);

    }

    colasalida = window.localStorage.getItem("colasalida");
    if (colasalida === 'undefined' || colasalida === false || colasalida === null || colasalida === '') {
      colasalida = new Array();
      window.localStorage.setItem("colasalida", JSON.stringify(colasalida));
    }

    propietario = window.localStorage.getItem('nombreUsuario');
    setUsername(propietario);
    // pictureSource = navigator.camera.PictureSourceType;
    // destinationType = navigator.camera.DestinationType;
    if (device) {
      modeloUUID = device.model + '' + device.uuid;
    }

    try {
      window.FirebasePlugin.getToken(function(token) {
        window.localStorage.setItem('token', token);
        console.log(token);
      }, function() {
        window.localStorage.setItem('token', null);
      });
      window.FirebasePlugin.onTokenRefresh(function(token) {
        window.localStorage.setItem('token', token);
      }, function() {
        window.localStorage.setItem('token', null);
      });
      window.FirebasePlugin.onNotificationOpen(function(notification) {
        console.log(notification);
      }, function(error) {
        console.log(error);
      });
    } catch (err) {
      console.log(err.message);
    }

    try{
		window.plugins.PushbotsPlugin.initialize("5dd8234b9cb2c20ff10d9b55", {"android":{"sender_id":"GOOGLE_SENDER_ID"}});
		window.plugins.PushbotsPlugin.on("registered", function(token){
			window.localStorage.setItem('token', token);			
			console.log("Registration Id:" + token);
		});
    }catch (e) {
      console.log(e.message)
    }

    $('.spinner').addClass('hidden');
  }

  document.addEventListener("deviceready", onDeviceReady, false);

  $$(document).on('pageInit', function(e) {
    $("#toolbar-navigation").removeClass('hidden');
    var page = e.detail.page;
    $("#tituloapp").css('display', 'inline-block');
    if (page.name === 'about') {
      $('#toolbarindex').show();
    }
    if (page.name === 'index') {
      $("#toolbar-navigation").removeClass('hidden');
      usuarioactual = "";
    }
    if (page.name === 'chat') {
      $('#toolbarindex').hide();
      $("#tituloapp").css('display', 'none');
    }
    if (page.name === 'messages') {
      $("#tituloapp").css('display', 'none');
      $("#toolbar-navigation").addClass('hidden');

      // pictureSource = navigator.camera.PictureSourceType;
      // destinationType = navigator.camera.DestinationType;
    }

    if (ultimaRed !== navigator.connection.type) {
      ultimaRed = navigator.connection.type;
    }
    enviarcola();
  });

  // TRATAMIENTO DE LAS IMAGENES

  $("#botoncamara").click(function() {
    $('.popover').hide();
    hacerFoto();
  });
  $("#botonarchivos").click(function() {
    $('.popover').hide();
    getPhoto(pictureSource.PHOTOLIBRARY);
  });

  // CAPTURA IMAGEN DESDE LA CAMARA
  function hacerFoto() {
    navigator.camera.getPicture(onSuccess, onFail, {
      quality: 20,
      destinationType: Camera.DestinationType.DATA_URL
      // destinationType: Camera.DestinationType.DATA_URL
    });
  }

  // CAPTURA IMAGEN DESDE LA GALERIA
  function getPhoto(source) {
    navigator.camera.getPicture(onSuccess, onFail, {
      quality: 20,
      destinationType: destinationType.DATA_URL,
      // destinationType: destinationType.DATA_URL,
      sourceType: source
    });
  }

  function onSuccess(imageDATA) {
    subirImagen(imageDATA);
  }

  function onFail(message) {
    myApp.console.log('No pudiste procesar tu imagen: ' + message);
  }

  function subirImagen(imageDATA) {
    prepararImagen(imageDATA);
  }

  function topNavbar(){
    var innerHMsg = window.innerHeight;
    var actualH = innerH - innerHMsg;
    $(".navbar").css({"position": "fixed", "top": actualH+"px"});
  }

  myApp.onPageInit('index', function () {
    $("#toolbar-navigation").removeClass('hidden');
  });

  myApp.onPageInit('messages', function(page) {
    usuarioactual = page.query.mac;
    apellidonombre = page.query.apellidonombre;

    if (usuarioactual != "") {
      clase = "." + usuarioactual;
      $(clase).css('display', 'none');
    }
    $('#nombredechat').html(apellidonombre);
    $('#cajademensajes').focus();
    myApp.showIndicator();
    mostrardia = false;

    propietario = window.localStorage.getItem('nombreUsuario');

    myMessages = myApp.messages('.messages', {
      scrollMessagesOnlyOnEdge: true
    });

    msgstr = window.localStorage.getItem(propietario + usuarioactual);
    if (msgstr !== "" && msgstr !== null) {
      var mensajes = JSON.parse(msgstr);
    } else {
      mensajes = null;
    }
    if (mensajes === null) {
      myApp.hideIndicator();
    } else {
      myApp.hideIndicator();
      recorrido(mensajes, false);
    }

    var isFocused;
    myMessagebar = myApp.messagebar('.messagebar');

    $$('textarea').keyup(function(e) {
      updateTyping();
    });

    $$('textarea').focus(function() {
      // topNavbar();
    });

    $$('.messagebar a.send-message').on('touchstart mousedown', function(evt) {
      // topNavbar();
      isFocused = document.activeElement && document.activeElement === myMessagebar.textarea[0];
    });

    $$('.messages-content').on('touchstart', function(evt) {
      // topNavbar();
      if($("textarea").is(":focus")){
        if(!tapped){ //if tap is not set, set up single tap
          evt.preventDefault();
          evt.stopPropagation();
          evt.stopImmediatePropagation();
          myMessages.scrollMessages();
          tapped=setTimeout(function(){
            tapped=null;
          },300);
        } else {
          clearTimeout(tapped);
          tapped=null;
        }
      }
      enviarcola();
    });

    $$('.messagebar a.send-message').on('click', function(e) {
      var messageText = myMessagebar.value();
      if (messageText.length === 0) {
        return;
      }

      if ($.trim(messageText).length > 0) {
        if (socket.connected) {
          // Clear messagebar
          myMessagebar.clear();
          prepararMensaje(messageText);
        } else {
          myApp.console.log('No estas conectado, volvé a intentarlo o comprobá tu conexión a internet.', 'CRYPTAR');
        }
      }
    });
  });

  function recorrido(result, agregados) {
    fechaactual = "";
    $.each(result, function(i, field) {
      if (typeof field.fecha !== 'undefined') {
        fecharecorrido = field.fecha.split(" ")[0];
        if (fecharecorrido !== fechaactual) {
          mostrardia = true;
          fechaactual = fecharecorrido;
        } else {
          mostrardia = false;
        }
      }
      try{
        if(controlFechas(field.fecha) == false){
          var propietariomsj = field.propietario;
          objetoClaves = {
            key: window.localStorage.getItem("key"),
            keyBF: window.localStorage.getItem("keyBF"),
            iv: field.iv
          };
          var mensaje = deCryptar(field.mensaje, objetoClaves);
          var type;

          if (propietario === propietariomsj) {
            type = 'sent';
          } else {
            type = 'received';
          }
          if (mensaje.tipo === "imagen") {
            addMessage("<strong>IMAGEN ENVIADA</strong>", propietariomsj, type, field.fecha);
          } else {
            if($("#" + field.idMessage).length == 0) {
              addMessage(mensaje, propietariomsj, type, field.fecha);
              $('.message-'+type+':last-child').attr('id', field.idMessage);
            }
          }
        }
      }catch (e) {
        console.log(e.message);
      }
    });
  }

  function setUsername(user) {
    username = user;
    if (username) {
      objuser = {
        username: username,
        token: window.localStorage.getItem("token")
      };
      socket.emit('add user', JSON.stringify(objuser));
    }
  }

  function cryptar(mensaje, objClaves) {
    // Convert text to bytes
    var textBytes = aesjs.utils.utf8.toBytes(mensaje);
    var key = JSON.parse(objClaves.key);
    var iv = JSON.parse(objClaves.iv)
    var aesOfb = new aesjs.ModeOfOperation.ofb(key, iv);
    var encryptedBytes = aesOfb.encrypt(textBytes);
    // To print or store the binary data, you may convert it to hex
    var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);

    var bf = new Blowfish(objClaves.keyBF);
    var res = bf.encrypt(encryptedHex);
    res = bf.base64Encode(res);

    return res;
  }

  function deCryptar(text, objClaves) {

    var bf = new Blowfish(objClaves.keyBF);
    encrypted64 = bf.base64Decode(text);
    var encryptedHex = bf.decrypt(encrypted64);
    encryptedHex = bf.trimZeros(encryptedHex);

    var key = JSON.parse(objClaves.key);
    var iv = JSON.parse(objClaves.iv);

    var encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
    var aesOfb = new aesjs.ModeOfOperation.ofb(key, iv);
    var decryptedBytes = aesOfb.decrypt(encryptedBytes);
    var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

    return decryptedText;
  }

  function prepararMensaje(messageText) {
    var now = new Date();
    idMessage = now.getTime();

    mensajesjson = window.localStorage.getItem(propietario + usuarioactual);
    if (mensajesjson !== "" && mensajesjson !== null) {
      conversacionactual = JSON.parse(mensajesjson);
    } else {
      conversacionactual = null;
    }

    iv = JSON.stringify([getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17)]);
    iv2 = JSON.stringify([getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17)]);

    propietario = window.localStorage.getItem('nombreUsuario');
    objetoClaves = {
      key: window.localStorage.getItem("key"),
      keyBF: window.localStorage.getItem("keyBF"),
      iv: iv
    };
    mensajeEncriptado = cryptar(messageText, objetoClaves);

    mensajeobj = {
      'propietario': propietario,
      'fecha': date(),
      'mensaje': mensajeEncriptado,
      'iv': iv,
      'idMessage': idMessage,
      'registrationId': window.localStorage.getItem('token')
    };

    if (conversacionactual === null) {
      mensajes = [mensajeobj];
      window.localStorage.setItem(propietario + usuarioactual, JSON.stringify(mensajes));
    } else {
      conversacionactual.push(mensajeobj);
      window.localStorage.setItem(propietario + usuarioactual, JSON.stringify(conversacionactual));
    }

    sendMessage(mensajeEncriptado, propietario, usuarioactual, iv, idMessage);

    // $('.message-sent:last-child').attr('id', idMessage).append('<div class="message-label"><i class="fa fa-clock-o"></i></div>');

    if($("#" + idMessage).length == 0) {
      addMessage(messageText, propietario, 'sent', mensajeobj.fecha);
      $('.message-sent:last-child').attr('id', idMessage).append('<div class="message-label"></div>');
    }
  }

  function prepararImagen(imagenDATA) {
    iv = JSON.stringify([getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17)]);
    propietario = window.localStorage.getItem('nombreUsuario');
    objetoClaves = {
      key: window.localStorage.getItem("key"),
      keyBF: window.localStorage.getItem("keyBF"),
      iv: iv
    };
    mensajeEncriptado = cryptar(imagenDATA, objetoClaves);
    mensajeEncriptadoParaMostrar = cryptar("IMAGEN", objetoClaves);
    // mensajeEncriptado = imagenDATA;

    mensajeobj = {
      'propietario': propietario,
      'fecha': date(),
      'mensaje': mensajeEncriptadoParaMostrar,
      'iv': iv,
      'registrationId': ''
    };

    mensajesjson = window.localStorage.getItem(propietario + usuarioactual);
    if (mensajesjson !== "" && mensajesjson !== null) {
      conversacionactual = JSON.parse(mensajesjson);
    } else {
      conversacionactual = null;
    }

    if (conversacionactual === null) {
      mensajes = [mensajeobj];
      window.localStorage.setItem(propietario + usuarioactual, JSON.stringify(mensajes));
    } else {
      conversacionactual.push(mensajeobj);
      window.localStorage.setItem(propietario + usuarioactual, JSON.stringify(conversacionactual));
    }
    sendImage(mensajeEncriptado, propietario, usuarioactual, iv);
    // sendImage(mensajeEncriptado, propietario, usuarioactual);
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // Tratamiento de IMAGENES
  function writeToFile(fileName, storageLocation, data) {
    window.resolveLocalFileSystemURL(storageLocation, function(directoryEntry) {
      directoryEntry.getFile(fileName, {
        create: true
      }, function(fileEntry) {
        fileEntry.createWriter(function(fileWriter) {
          fileWriter.onwriteend = function(e) {
            // myApp.console.log("Imagen guardada en el dispositivo");
          };

          fileWriter.onerror = function(e) {
            myApp.console.log("No pudimos procesar tu imagen");
          };
          contentType = 'image/jpeg';
          // contentType = '';
          var DataBlob = b64toBlob(data, contentType);
          //					var blob = new Blob([data], { type: 'image/jpeg' });
          fileWriter.write(DataBlob);
        }, errorHandler.bind(null, fileName));
      }, errorHandler.bind(null, fileName));
    }, errorHandler.bind(null, fileName));
  }

  function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = window.atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {
      type: contentType
    });
    return blob;
  }

  var errorHandler = function(fileName, e) {
    var msg = '';
    switch (e.code) {
      case FileError.QUOTA_EXCEEDED_ERR:
        msg = 'Storage quota exceeded';
        break;
      case FileError.NOT_FOUND_ERR:
        msg = 'File not found';
        break;
      case FileError.SECURITY_ERR:
        msg = 'Security error';
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        msg = 'Invalid modification';
        break;
      case FileError.INVALID_STATE_ERR:
        msg = 'Invalid state';
        break;
      default:
        msg = 'Unknown error';
        break;
    }
    console.log('Error (' + fileName + '): ' + msg);
  };
});

// DUPLICADAS Y POR FUERA PARA SU USO EXTERNO.
function limpiarMac() {
  $("#tituloapp").css('display', 'inline-block');
  $("#toolbar-navigation").removeClass('hidden');
  usuarioactual = "";
}

function salir() {
  window.localStorage.setItem('isLogged', false);
  usuarios = JSON.parse(window.localStorage.getItem('usuarios'));

  for (var i = 0; i < usuarios.length; i++) {
    window.localStorage.setItem(window.localStorage.getItem('nombreUsuario') + usuarios[i].username, "");
  }

  window.localStorage.setItem('nombreUsuario', '');
  window.localStorage.setItem('idUsuario', 0);
  window.location.href = "./index.html";
}

function reconfigurar() {
  window.location.href = "./cargarhosts.html";
}

