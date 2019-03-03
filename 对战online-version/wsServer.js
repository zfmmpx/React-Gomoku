var app = require("http").createServer()
var io = require('socket.io')(app)

var PORT = 3099

var clientCount = 0

// 用来存储客户端socket
var socketMap = {}

app.listen(PORT)


io.on('connection', function(socket) {
	clientCount = clientCount + 1
	socket.nickname = 'player' + clientCount
	socket.clientNum = clientCount
	socketMap[clientCount] = socket

	// 聊天室
	io.emit('enter', socket.nickname + ' comes in')
	socket.on('message', str => {
		io.emit('message', socket.nickname + ' says: ' + str)
	})
	socket.on('disconnect', () => {
		io.emit('leave', socket.nickname + ' left')
	})

	// 游戏开始，
	if (socket.clientNum % 2 === 1) {
		socket.emit('waiting', { str: '等待其他玩家...', myNickname: socket.nickname })
	} else {
		if (socketMap[socket.clientNum - 1]) {
			// 决定谁先手，初始化各自的nickname
			socketMap[(socket.clientNum - 1)].emit(
				'start',
				{
					myTurn: true,
					myNickname: socketMap[(socket.clientNum - 1)].nickname,
					hisNickname: socket.nickname,
				}
			)
			socket.emit(
				'start',
				{
					myTurn: false,
					myNickname: socket.nickname,
					hisNickname: socketMap[(socket.clientNum - 1)].nickname,
				},
			)
		} else {
      socket.emit('leave')
		}
	}
	// 设置昵称
	socket.on('setNickname', str => {
		io.emit('message', socket.nickname + '把他的昵称改为：' + str)
		socket.nickname = str
		if (socket.clientNum % 2 === 1) {
			socket.emit('changeMyNickname', str)
			socketMap[(socket.clientNum + 1)].emit('changeHisNickname', str)
		} else if (socketMap[socket.clientNum - 1]) {
			socket.emit('changeMyNickname', str)
			socketMap[(socket.clientNum - 1)].emit('changeHisNickname', str)
		}
	})

	// 轮流下子
	socket.on('switchPlayer', bool => {
		if (socket.clientNum % 2 === 1) {
			socket.emit('switchPlayer', !bool)
			socketMap[(socket.clientNum + 1)].emit('switchPlayer', bool)
		} else if (socketMap[socket.clientNum - 1]) {
			socket.emit('switchPlayer', !bool)
			socketMap[(socket.clientNum - 1)].emit('switchPlayer', bool)
		}
	})
	// 将自己的下子同步给对手
	socket.on('click', data => {
		if (socket.clientNum % 2 === 1) {
			if (socketMap[socket.clientNum + 1]) {
				socketMap[socket.clientNum + 1].emit('click', data)
			}
		} else {
			if (socketMap[socket.clientNum - 1]) {
				socketMap[socket.clientNum - 1].emit('click', data)
			}
		}
	})
	// 跳到某一步
	socket.on('jump', data => {
		if (socket.clientNum % 2 === 1) {
			if (socketMap[socket.clientNum + 1]) {
				socketMap[socket.clientNum + 1].emit('jump', data)
			}
		} else {
			if (socketMap[socket.clientNum - 1]) {
				socketMap[socket.clientNum - 1].emit('jump', data)
			}
		}
	})
	// 掉线
	socket.on('disconnect', function () {
    if(socket.clientNum % 2 === 1) {
      if (socketMap[socket.clientNum + 1]) {
        socketMap[socket.clientNum + 1].emit('playerDisconnect')
      }
    } else {
      if (socketMap[socket.clientNum - 1]) {
        socketMap[socket.clientNum - 1].emit('playerDisconnect')
      }
    }
    delete(socketMap[socket.clientNum])
  })

})

console.log('websocket server listening on port ' + PORT)


