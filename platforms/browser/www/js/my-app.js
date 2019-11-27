/*
// Initialize app
var myApp = new Framework7();
var propietario = "Sin identificar";
var pictureSource;   // picture source
var destinationType; // sets the format of returned value
var url = "http://sistemastitanio.com.ar/CRYPTAR/";
var id;
var myMessages;
var inicio = true;
var abrirchat;
// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true,
	cache: false
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
	if(device){
		propietario = device.model+' '+device.uuid;
	}
	setUsername(propietario);
});

document.addEventListener("deviceready",onDeviceReady,false);

// device APIs are available
function onDeviceReady() {
	id = 0;
	pictureSource=navigator.camera.PictureSourceType;
	destinationType=navigator.camera.DestinationType;
	if(device){
		propietario = device.model+' '+device.uuid;
	}
}

// Now we need to run the code that will be executed only for About page.

// Option 1. Using page callback for page (for "about" page in this case) (recommended way):
myApp.onPageInit('about', function (page) {
    // Do something here for "about" page
})

// Option 2. Using one 'pageInit' event handler for all pages:
$$(document).on('pageInit', function (e) {
    // Get page data from event data
    var page = e.detail.page;

    if (page.name === 'about') {
		$('#toolbarindex').show();
    }
    if (page.name === 'chat') {
		$('#toolbarindex').hide();
    }
    if (page.name === 'messages') {
		pictureSource=navigator.camera.PictureSourceType;
		destinationType=navigator.camera.DestinationType;
		// $$('.ks-notification-simple').on('click', function () {
			// myApp.addNotification({
				// title: 'Cryptar',
				// message: 'Usted tiene 6 mensajes sin leer'
			// });
		// });
    }
});

// TRATAMIENTO DE LAS IMAGENES
function hacerFoto(){
	navigator.camera.getPicture(onSuccess, onFail, { quality: 50,
											destinationType: Camera.DestinationType.FILE_URI });
}
			
function onSuccess(imageURI) {
	myApp.showIndicator();
	var image = new Image();
	image.src = imageURI;
	subirImagen(imageURI);
}

function subirImagen(fileURL) {				
	var options = new FileUploadOptions();
	options.fileKey = "imagen";
	if(device){
		propietario = device.model+' '+device.uuid;
	}else{
		propietario = "Sin identificar";
	}
	options.fileName = propietario;
	
	var ft = new FileTransfer();
	ft.upload(fileURL, encodeURI(url+"upload.php"), uploadSuccess, uploadFail, options);
}

function uploadSuccess(r) {
	actualizar();
}

function uploadFail(error) {
	myApp.alert("Ocurrio un error al subir la imagen: Code = " + error.code+ " upload error source " + error.source+" upload error target " + error.target);
}

function capturePhotoEdit() {
	navigator.camera.getPicture(onPhotoDataSuccess, onFail, { quality: 20, allowEdit: true,
	destinationType: destinationType.DATA_URL });
}

function getPhoto(source) {
	navigator.camera.getPicture(onSuccess, onFail, { quality: 50,
	destinationType: destinationType.FILE_URI,
	sourceType: source });
}

function onFail(message) {
  myApp.alert('No pudiste procesar tu imagen: ' + message);
}

myApp.onPageInit('messages', function (page) {
	var macactual = page.query.mac;
	console.log("Mac Actual: "+macactual );
	id = 0;
	myApp.showIndicator();
    var conversationStarted = false;
	if(device){
		propietario = device.model+' '+device.uuid;
	}
    myMessages = myApp.messages('.messages');

	msgstr = localStorage.getItem(macactual);
	if(msgstr!="" && msgstr!=null){
		var mensajes=JSON.parse(msgstr);		
	}else{
		mensajes=null;
	}
	
	if(mensajes==null){
		myApp.hideIndicator();
		console.log("Sin mensajes");		
	}else{
		myApp.hideIndicator();
		console.log(mensajes);		
	}
	
	// recorrido(mensajes, false);
		
    var isFocused;

    var myMessagebar = myApp.messagebar('.messagebar');

    $$('.messagebar a.send-message').on('touchstart mousedown', function () {
        isFocused = document.activeElement && document.activeElement === myMessagebar.textarea[0];
    });
    $$('.messagebar a.send-message').on('click', function (e) {
        // Keep focused messagebar's textarea if it was in focus before
        if (isFocused) {
            e.preventDefault();
            myMessagebar.textarea[0].focus();
        }
        var messageText = myMessagebar.value();
        if (messageText.length === 0) {
            return;
        }
        // Clear messagebar
        myMessagebar.clear();
		
		var dataString = "propietario=" + propietario + "&mensaje=" + messageText +"&insert=SI";

		if ($.trim(messageText).length > 0) {
			conversacionactual=JSON.parse(localStorage.getItem(macactual));
			mensajeobj = {'propietario': propietario, 'mensaje': messageText};
			if(conversacionactual==null){
				mensajes = [mensajeobj]; 
				localStorage.setItem(macactual, JSON.stringify(mensajes));
			}else{
				conversacionactual.push(mensajeobj); 
				localStorage.setItem(macactual, JSON.stringify(conversacionactual));
			}
			sendMessage(messageText, propietario, macactual);
			// Add Message
			myMessages.addMessage({
				text: mensaje,
				name: propietario,
				type: 'sent'
			});
		}
		
    });
});

function recorrido(result, agregados){
	$.each(result, function(i, field) {
		ultimoid = id;
		id = field.id;				
		var propietariomsj = field.propietario;
		var mensaje = field.mensaje;
		
		if(propietario==propietariomsj){
			var type = 'sent';
		}else{
			var type = 'received';
		}
		
		if(ultimoid != id){		
			if(mensaje.length > 2000){
				// Add Message
				myMessages.addMessage({
					text: "<img src='"+mensaje+"' />",
					name: propietariomsj,
					type: type
				});
			}else{
				// Add Message
				myMessages.addMessage({
					text: mensaje,
					name: propietariomsj,
					type: type
				});					
			}				
		}
	});
}
*/