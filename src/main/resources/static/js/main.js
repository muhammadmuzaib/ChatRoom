'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}


function onConnected() {
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    var messageElement = document.createElement('li');

    // JOIN/LEAVE messages remain the same
    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
        var eventText = document.createElement('p');
        eventText.textContent = message.content;
        messageElement.appendChild(eventText);

    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
        var eventText = document.createElement('p');
        eventText.textContent = message.content;
        messageElement.appendChild(eventText);

    } else if (message.type === 'CHAT') {
        if (message.sender === username) {
            messageElement.classList.add('chat-message', 'self');
        } else {
            messageElement.classList.add('chat-message', 'other');
        }

        var avatarElement = document.createElement('i');
        avatarElement.textContent = message.sender[0].toUpperCase();
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        var detailsWrapper = document.createElement('div');
        detailsWrapper.classList.add('message-details');

        var senderName = document.createElement('span');
        senderName.classList.add('sender-name');
        senderName.textContent = message.sender;

        var bubbleElement = document.createElement('div');
        bubbleElement.classList.add('bubble');
        bubbleElement.textContent = message.content;

        detailsWrapper.appendChild(senderName);
        detailsWrapper.appendChild(bubbleElement);

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(detailsWrapper);
    }

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)