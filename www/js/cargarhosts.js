$('document').ready(function(){
	var host = (localStorage.getItem('host') === 'false' ? '' : window.localStorage.getItem('host'));
	$('#host').val(host);

	window.localStorage.setItem('host', false);
});

function configurarhosts() {
	try {
		if ($.trim($('#host').val()) !== '') {
			window.localStorage.setItem('host', $.trim($('#host').val()));
			var host = $.trim($('#host').val());

			$.ajax({
				type: 'get',
				url: host + "/test",
				success: function ( datahost ) {
					$('.success').html("CONTROL 1 de 2: OK.").fadeIn().fadeOut(2000);
					host = host.replace(/(^\w+:|^)\/\//, '');
					var socket = io("https://cryptarchat." + host);

					try {
						socket.on('connect', function () {
							$('.success').html("CONTROL 2 de 2: OK. Gracias por terminar de configurar CRYPTAR, la app se cerrada para terminar la configuración.").fadeIn().fadeOut(2000);
							window.location.href = "./index.html";
						});
						socket.on('disconnect', function () {
							$('.error').html('Error al conectarse al HOST SECUNDARIO.').fadeIn().fadeOut(2000);
						});
						socket.on('connect_error', function () {
							$('.error').html('Error al conectarse al HOST SECUNDARIO.').fadeIn().fadeOut(2000);
							window.location.href = "./cargarhosts.html";
						});
					} catch ( error ) {
						$('.error').html(error.message).fadeIn().fadeOut(2000);
						window.location.href = "./index.html";
					}
				},
				fail: function ( datahost ) {
					$('.spinner').addClass('hidden');
					$('.error').html('Error al conectarse al HOST PRINCIPAL: ' + JSON.stringify(datahost)).fadeIn().fadeOut(2000);
				}
			});
		}
	} catch (error) {
		$('.spinner').addClass('hidden');
		$('.error').html(error.message).fadeIn().fadeOut(2000);
	}
}
