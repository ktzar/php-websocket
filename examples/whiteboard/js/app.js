/**
 * PHP WebSocket library
 *
 * This file implements the main logic of the chat example
 */

/**
 * @namespace
 */
var Chat = Chat || {};
var Whiteboard;

/**
 * The main function.
 */
$(function() {

	// ui manager
	var ui          = new Chat.Ui(),
		clients     = {},
		connected   = false,
		socket      = null,
		host        = window.socket_host,
		WSocket     = window.MozWebSocket || window.WebSocket,
		myself      = null,
		setSettings, send, connect, close, onOpen, onMessage, onClose, say;

	/**
	 * Get Ui object
	 */
	Chat.getUi = function() {
		return ui;
	};

	/**
	 * Set the settings. Callback from popup dialog
	 */
	setSettings = function() {
		// vars
		var dlgEl = ui.getDlgEl(),
			nameEl = dlgEl.find('#nickname'),
			name = nameEl.val(),
			avatar = dlgEl.find('.avatar-select .active').index() + 1;

		// check that name is given
		if (!name.length) {
			nameEl.parents('.clearfix').addClass('error');
			nameEl.focus();
			return false;
		} else {
			nameEl.parents('.clearfix').removeClass('error');
		}

		// the data packet
		var packet = {
			avatar:     avatar,
			name:       name
		};

		// update myself
		myself.update(packet);

		// hide
		dlgEl.modal('hide');

		// connect or change
		if (connected) {
			packet.action = 'update';
			send(packet);
		} else {
			packet.action = 'connect';
			connect(packet);
		}

		return false;
	};

	/**
	 * Send packet to the server
	 *
	 * @param {Object} packet
	 */
	send = function(packet) {
		if (connected) {
			try {
				var json = JSON.stringify(packet);
				socket.send(json);
			} catch(ex) {
			}
		}
	};

	/**
	 * On open socket connection
	 *
	 * @param {Object} msg
	 */
	onOpen = function(msg){
		connected = true;
		ui.setConnected(true);
	};

	/**
	 * On messaged received
	 *
	 * @param {Objetc} msg
	 */
	onMessage = function(msg){
        console.log(msg.data);
		var data    = $.parseJSON(msg.data),
			id      = data.id;
		if (data.action == 'line') {
            Whiteboard.drawLine(data.message.initX,data.message.initY,data.message.endX,data.message.endY);
			//clients[id].say(data.message);
		}
    }

	/**
	 * On close socket
	 *
	 * @param {Object} msg
	 */
	onClose = function(msg) {
		connected = false;
		ui.setConnected(false);
		for(var k in clients) {
			if (clients.hasOwnProperty(k)) {
				clients[k].disconnect();
			}
		}
		clients = {};
		ui.getListEl().find('.client').remove();
		return false;
	};

	/**
	 * connect with the server
	 *
	 * @param {Object} packet
	 */
	connect = function(packet) {
		socket = new WSocket(host);
		socket.onopen = onOpen;
		socket.onmessage = onMessage;
		socket.onclose = onClose;
	};

	/**
	 * Close the connection
	 */
	close = function() {
		if (socket) socket.close();
		ui.getDlgEl().modal('hide');
	};


    sendLine = function(initX,initY,endX,endY) {
        message = {initX:initX,initY:initY,endX:endX,endY:endY};
        send({
            action: 'line',
            message: message
        });
    }

	// this client.
	myself = new Chat.Client({
		id      : 1,
		avatar  : 1,
		myself  : true
	});

	// show dialog first thing
	ui.getDlgEl().find('a.save').click(setSettings);
	ui.getDlgEl().find('form').submit(setSettings);
	ui.getDlgEl().find('a.disconnect').click(close);
	ui.showDetails();


    Whiteboard = {
        dragging:       false,
        prevPosition:   false,
        canvas:     false,
        drawLine: function(startX,startY,endX,endY){
            console.log(startX,startY,endX,endY)
            Whiteboard.canvas.beginPath();  
            Whiteboard.canvas.moveTo(startX,startY);  
            Whiteboard.canvas.lineTo(endX,endY);  
            Whiteboard.canvas.stroke();  
        }
    };
    var canvas = document.getElementById('whiteboard');


    if(canvas.getContext) {
        Whiteboard.canvas = canvas.getContext('2d');
    }else{
        Whiteboard.canvas = false;
    }
	// send the message
	$('#whiteboard').mousedown(function(e){
        Whiteboard.dragging = true;
    }).mouseup(function(e){
        Whiteboard.dragging = false;
    }).mousemove(function(e){
        if (Whiteboard.canvas && Whiteboard.dragging) {
            whiteboard_pos = $(this).offset();
            position = {x:e.pageX-whiteboard_pos.left, y:e.pageY-whiteboard_pos.top}
            if (Whiteboard.prevPosition) {
                Whiteboard.drawLine(Whiteboard.prevPosition.x,Whiteboard.prevPosition.y,position.x,position.y);
                sendLine(Whiteboard.prevPosition.x,Whiteboard.prevPosition.y,position.x,position.y);
            }
            Whiteboard.prevPosition = position;

        }else{
            Whiteboard.prevPosition = false;
        }
	});
});
