var socket, username, pictureSource, destinationType, myMessages, modeloUUID, myMessagebar, innerH, fechaDesde, fechaHasta, hostnode, host;
var propietario = "Sin identificar";
var myApp = new Framework7({
  pushState: true,
  swipeBackPage: false
});

var colorUsuario = [
  '#fd9e06',
  '#ff4499',
  '#7dd5d5',
  '#be3b49',
  '#a350fe',
  '#37cd93',
  '#01aced',
  '#375ecd',
  '#596996',
  '#3cbbbb',
  '#e81b78',
  '#ce4214'
];

var mostrardia = false;
var tapped = false;
var ultimaRed = '';
var FADE_TIME = 150; // ms
var TYPING_TIMER_LENGTH = 400; // ms

if(parameters.production){
  host = window.localStorage.getItem('host');
  host = host.replace(/(^\w+:|^)\/\//, '');
  hostnode = "https://cryptarchat."+host;
}else{
  host = parameters.hostdev;
  hostnode = parameters.hostnodedev + ':' + parameters.portdev;
}

socket = io(hostnode);

// function controldehosts() {
//   var hostCtrl = window.localStorage.getItem('host');
//
//   if (hostCtrl === null || hostCtrl === false) {
//     window.localStorage.setItem('host', false);
//     window.location.href = "./cargarhosts.html";
//   }
// }

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
$('document').ready(function(){
  var usuarios = JSON.parse(window.localStorage.getItem('usuarios'));
  // var items = [];
  for (var i = 0; i < usuarios.length; i++) {
    $$("#usuarios").append('<li id="' + usuarios[i].username + '">' +
      '<a href="messages.html?mac=' + usuarios[i].username + '&apellidonombre=' + usuarios[i].apellidonombre + '" class="item-link item-content">' +
      '<div class="item-media"><div class="circle-icon" style="background: '+colorUsuario[i]+'">'+usuarios[i].apellidonombre.charAt(0)+'</div></div>' +
      '<div class="item-inner"><div class="item-title">' + usuarios[i].apellidonombre + '</div>' +
      '<div class="item-after ' + usuarios[i].username + '" style="margin-top: -4px;display: none;">' +
      '<span class="badge"></span></div>' +
      '</div>' +
      '</a>' +
      '</li>');
  }
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
    let nombreUsuario = window.localStorage.getItem('nombreUsuario');

    fechaDesde = window.localStorage.getItem('fecha_desde');
    fechaHasta = window.localStorage.getItem('fecha_hasta');

    $("#nombreUsuario").html(nombreUsuario);

    document.addEventListener("backbutton", stopEvent, false);
    document.addEventListener("volumedownbutton", stopEvent, false);
    document.addEventListener("volumeupbutton", stopEvent, false);
    document.addEventListener("online", enviarcola, false);
  }

  let colasalida = window.localStorage.getItem("colasalida");
  if (colasalida === 'undefined' || colasalida === false || colasalida === null || colasalida === '') {
    colasalida = new Array();
    window.localStorage.setItem("colasalida", JSON.stringify(colasalida));
  }

  propietario = window.localStorage.getItem('nombreUsuario');
  setUsername(propietario);

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
    let colasalidastr = window.localStorage.getItem("colasalida");
    if (colasalidastr !== '') {
      colasalida = JSON.parse(colasalidastr);
      let colatemp = colasalida;
      colasalida = [];
      window.localStorage.setItem("colasalida", JSON.stringify(colasalida));
      $.each(colatemp, function(index, value) {
        if (value !== null) {
          sendMessage(value.message, value.propietario, value.destinatario, value.iv, value.idMessage, value.tipo);
        }
      });
    }
  }

  function sendMessage(mensaje, propietario, destinatario, iv, idMessage, tipo) {
    var message = mensaje;
    propietario = window.localStorage.getItem('nombreUsuario');
    if (message && socket.connected) {
      let datosenvio = {
        username: username,
        tipo: tipo,
        message: message,
        registrationId: window.localStorage.getItem('token'),
        fecha: date(),
        propietario: propietario,
        destinatario: destinatario,
        idMessage: idMessage,
        iv: iv,
        iv2: iv,
      };

      // TODO: Reenviar mensajes en cola de espera. Aca solo se guardan.
      let colasalidastr = window.localStorage.getItem("colasalida");
      let colasalida = [];

      if (colasalidastr !== '') {
        colasalida = JSON.parse(colasalidastr);
      }

      colasalida.push(datosenvio);
      let colastr = JSON.stringify(colasalida);
      window.localStorage.setItem("colasalida", colastr);

      try {
        socket.emit('new message', JSON.stringify(datosenvio), function(response) {
          var user = $('.messages > div:last-child > .message-name').html();
          let objResponse = JSON.parse(response);
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

  function nl2br (str, is_xhtml) {
    if (typeof str === 'undefined' || str === null) {
      return '';
    }
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
  }

  function addMessage(text, name, type, date) {
    myMessages.addMessage({
      text: nl2br(text),
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

  function addMessageImage(url, name, type, date) {
    myMessages.addMessage({
      text: "<img src='https://"+host+"/"+url+"'>",
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

  socket.on('login', function(data) {
    addParticipantsMessage(data);
  });

  socket.on('new message', function(data, callback) {
    let obj = JSON.parse(data);

    if(controlFechas(obj.fecha) === true){
      return;
    }

    if (obj.tipo === 'texto') {
      if (usuarioactual !== "") {
        let clase = "." + usuarioactual;
        $(clase).css('display', 'none');
      }
      propietario = window.localStorage.getItem('nombreUsuario');
      let objetoClaves = {
        key: window.localStorage.getItem("key"),
        keyBF: window.localStorage.getItem("keyBF"),
        iv: obj.iv
      };
      let mensajeDecriptado = deCryptar(obj.message, objetoClaves);
      if(mensajeDecriptado === ""){
        return;
      }
      if (usuarioactual !== obj.propietario) {
        let clase = "." + obj.propietario;
        let identificador = "#" + obj.propietario;
        $("#usuarios li:eq(0)").before($( identificador ));

        let  msjs = $(clase+" .badge").html() === '' ? 1 : parseInt($(clase+" .badge").html()) + 1;
        $(clase+" .badge").html(msjs);
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

      let conversacionactual;
      let mensajesjson = window.localStorage.getItem(propietario + obj.propietario);
      if (mensajesjson !== "" && mensajesjson !== null) {
        conversacionactual = JSON.parse(mensajesjson);
      } else {
        conversacionactual = null;
      }
      let mensajeobj = {
        'propietario': obj.propietario,
        'fecha': obj.fecha,
        'mensaje': obj.message,
        'tipo': obj.tipo,
        'iv': obj.iv,
        'iv2': obj.iv2,
        'idMessage': obj.idMessage,
        'registrationId': obj.registrationId
      };
      if (conversacionactual === null) {
        let mensajes = [mensajeobj];
        window.localStorage.setItem(propietario + obj.propietario, JSON.stringify(mensajes));
      } else {
        conversacionactual.push(mensajeobj);
        window.localStorage.setItem(propietario + obj.propietario, JSON.stringify(conversacionactual));
      }


      if (usuarioactual === obj.propietario) {
        if($("#" + obj.idMessage).length == 0) {
          if (obj.tipo === "imagen"){
            addMessageImage(mensajeDecriptado, obj.propietario, 'received', mensajeobj.fecha);
          }else{
            addMessage(mensajeDecriptado, obj.propietario, 'received', mensajeobj.fecha);
          }
          $('.message-received:last-child').attr('id', obj.idMessage);
        }
      }
      if (obj.tipo === "imagen"){
        writeToFile('cryptarimg' + getRandomInt(0, 17) + '.jpg', cordova.file.documentsDirectory, mensajeDecriptado);
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

      pictureSource = navigator.camera.PictureSourceType;
      destinationType = navigator.camera.DestinationType;
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
    prepararImagen(imageDATA);
  }

  function onFail(message) {
    myApp.console.log('No pudiste procesar tu imagen: ' + message);
  }

  myApp.onPageInit('index', function () {
    $("#toolbar-navigation").removeClass('hidden');
  });

  $('#search-box').focus(function() {
    $('#toolbar-navigation').addClass('hidden');
  });

  $('#search-box').blur(function() {
    $('#toolbar-navigation').removeClass('hidden');
  });

  myApp.onPageInit('messages', function(page) {

    usuarioactual = page.query.mac;
    let apellidonombre = page.query.apellidonombre;

    if (usuarioactual !== "") {
      let clase = "." + usuarioactual;
      $(clase).css('display', 'none');
    }
    $('#nombredechat').html(decodeURIComponent(apellidonombre));
    $('#cajademensajes').focus();
    myApp.showIndicator();
    mostrardia = false;

    propietario = window.localStorage.getItem('nombreUsuario');

    myMessages = myApp.messages('.messages', {
      scrollMessagesOnlyOnEdge: true
    });

    let msgstr = window.localStorage.getItem(propietario + usuarioactual);
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

    $$('.messagebar a.send-message').on('touchstart mousedown', function(evt) {
      isFocused = document.activeElement && document.activeElement === myMessagebar.textarea[0];
    });


    $$('.messages-content').on('touchstart', function(evt) {
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
          prepararMensaje(messageText, "texto");
        } else {
          myApp.console.log('No estas conectado, volvé a intentarlo o comprobá tu conexión a internet.', 'CRYPTAR');
        }
      }
    });
  });

  function recorrido(result, agregados) {
    let fechaactual = "";
    $.each(result, function(i, field) {
      if (typeof field.fecha !== 'undefined') {
        let fecharecorrido = field.fecha.split(" ")[0];
        if (fecharecorrido !== fechaactual) {
          mostrardia = true;
          fechaactual = fecharecorrido;
        } else {
          mostrardia = false;
        }
      }
      try{
        if(controlFechas(field.fecha) === true){
          return;
        }
        var propietariomsj = field.propietario;
        let objetoClaves = {
          key: window.localStorage.getItem("key"),
          keyBF: window.localStorage.getItem("keyBF"),
          iv: field.iv
        };
        var mensaje = deCryptar(field.mensaje, objetoClaves);

        if(mensaje === ""){
          return;
        }

        var type;

        if (propietario === propietariomsj) {
          type = 'sent';
        } else {
          type = 'received';
        }

        if($("#" + field.idMessage).length === 0) {
          if (field.tipo === "imagen"){
            addMessageImage(mensaje, propietariomsj, type, field.fecha);
          }else{
            addMessage(mensaje, propietariomsj, type, field.fecha);
          }
          $('.message-'+type+':last-child').attr('id', field.idMessage);
        }
      }catch (e) {
        console.log(e.message);
      }
    });
  }

  function setUsername(user) {
    username = user;
    if (username) {
      let objuser = {
        username: username,
        token: window.localStorage.getItem("token")
      };
      socket.emit('add user', JSON.stringify(objuser));
    }
  }

  function cryptar(mensaje, objClaves) {
    // First ENC
    var textBytes = aesjs.utils.utf8.toBytes(encodeURI(mensaje));
    var key = JSON.parse(objClaves.key);
    var iv = JSON.parse(objClaves.iv);

    var aesOfb = new aesjs.ModeOfOperation.ofb(key, iv);
    var encryptedBytes = aesOfb.encrypt(textBytes);
    var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);

    // Second ENC
    var cryptTF = twofish(iv);
    var keyTF = cryptTF.stringToByteArray(objClaves.keyBF);
    var textByteArray = cryptTF.stringToByteArray(encryptedHex);
    var encyptedMessage = cryptTF.encryptCBC(keyTF, textByteArray);
    encyptedMessage = JSON.stringify(encyptedMessage);

    return encyptedMessage;
  }

  function deCryptar(text, objClaves) {
    try {
      var key = JSON.parse(objClaves.key);
      var iv = JSON.parse(objClaves.iv);

      // First DEC
      var cryptTF = twofish(iv);
      var keyTF = cryptTF.stringToByteArray(objClaves.keyBF);
      var cpt = cryptTF.decryptCBC(keyTF, JSON.parse(text));
      var encryptedHex = cryptTF.byteArrayToString(cpt);

      // Second DEC
      var encryptedHex = encryptedHex.replace(/\0+$/g, "");
      var encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
      var aesOfb = new aesjs.ModeOfOperation.ofb(key, iv);
      var decryptedBytes = aesOfb.decrypt(encryptedBytes);
      var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

      return decodeURI(decryptedText);
    }catch (e) {
      return "";
    }
  }

  function prepararMensaje(messageText, tipomensaje) {
    var now = new Date();
    let idMessage = now.getTime();

    let conversacionactual;
    let mensajesjson = window.localStorage.getItem(propietario + usuarioactual);
    if (mensajesjson !== "" && mensajesjson !== null) {
      conversacionactual = JSON.parse(mensajesjson);
    } else {
      conversacionactual = null;
    }

    let iv = JSON.stringify([getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17)]);
    let iv2 = JSON.stringify([getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17), getRandomInt(0, 17)]);

    propietario = window.localStorage.getItem('nombreUsuario');
    let objetoClaves = {
      key: window.localStorage.getItem("key"),
      keyBF: window.localStorage.getItem("keyBF"),
      iv: iv
    };
    let mensajeEncriptado = cryptar(messageText, objetoClaves);

    let mensajeobj = {
      'propietario': propietario,
      'fecha': date(),
      'tipo': tipomensaje,
      'mensaje': mensajeEncriptado,
      'iv': iv,
      'iv2': iv2,
      'idMessage': idMessage,
      'registrationId': window.localStorage.getItem('token')
    };

    if (conversacionactual === null) {
      let mensajes = [mensajeobj];
      window.localStorage.setItem(propietario + usuarioactual, JSON.stringify(mensajes));
    } else {
      conversacionactual.push(mensajeobj);
      window.localStorage.setItem(propietario + usuarioactual, JSON.stringify(conversacionactual));
    }

    sendMessage(mensajeEncriptado, propietario, usuarioactual, iv, idMessage, tipomensaje);

    // $('.message-sent:last-child').attr('id', idMessage).append('<div class="message-label"><i class="fa fa-clock-o"></i></div>');

    if($("#" + idMessage).length === 0) {
      if (tipomensaje === "imagen"){
        addMessageImage(messageText, propietario, 'sent', mensajeobj.fecha);
      }else{
        addMessage(messageText, propietario, 'sent', mensajeobj.fecha);
      }
      $('.message-sent:last-child').attr('id', idMessage).append('<div class="message-label"></div>');
    }
  }

  function prepararImagen(imagenDATA) {
    try{
      myApp.showPreloader();
      console.log(imagenDATA);
      console.log(host);
      setTimeout(function () {
        myApp.hidePreloader();
      }, 2000);

      $.ajax({
        type: 'post',
        url: "https://" + host + "/upload_image",
        data: {file: imagenDATA},
        success: function ( data ) {
          console.log(data);
          if(data.response !== ''){
            console.log("IMAGEN ENVIADA: "+ data.response);
            prepararMensaje(data.response, "imagen");
          }
        },
        fail: function ( data ) {
          console.log(data);
        }
      });
    }catch(e){
      console.log(e.message);
    }
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

  function onDeviceReady() {
    // pictureSource = navigator.camera.PictureSourceType;
    // destinationType = navigator.camera.DestinationType;
    try{
      if (device) {
        modeloUUID = device.model + '' + device.uuid;
      }
      window.plugins.PushbotsPlugin.initialize("5de5244640038e0a430f9c63", {"android":{"sender_id":"724144400703"}});
      window.plugins.PushbotsPlugin.on("user:ids", function(data){
        window.localStorage.setItem('token', data.token);
      })
    } catch (err) {
      console.log(err.message);
    }

    $('.spinner').addClass('hidden');
  }

  document.addEventListener("deviceready", onDeviceReady, false);

});

// DUPLICADAS Y POR FUERA PARA SU USO EXTERNO.
function limpiarMac() {
  $("#tituloapp").css('display', 'inline-block');
  $("#toolbar-navigation").removeClass('hidden');
  usuarioactual = "";
}

function salir() {
  window.localStorage.setItem('isLogged', false);
  let usuarios = JSON.parse(window.localStorage.getItem('usuarios'));

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
