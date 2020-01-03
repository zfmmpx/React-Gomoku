var app = require('http').createServer();
var io = require('socket.io')(app);
var uuid = require('uuid');
var _ = require('lodash');

var PORT = 3099;

var clientCount = -1;

// 用来存储客户端socket
var socketMap = [];

app.listen(PORT);

io.on('connection', function(socket) {
  // clientCount = clientCount + 1
  socket.id = uuid();
  socketMap.push(socket);
  const socketIndex = _.indexOf(
    socketMap,
    _.find(socketMap, { id: socket.id }),
  );

  socket.nickname = 'player' + (socketIndex + 1);
  console.log('connect', socketMap.length, socketIndex);

  // 聊天室
  io.emit('enter', socket.nickname + ' comes in');
  socket.on('message', str => {
    io.emit('message', socket.nickname + ' says: ' + str);
  });
  socket.on('disconnect', () => {
    // io.emit('leave', socket.nickname + ' left')
  });

  // 游戏开始，
  if (socketIndex % 2 === 0) {
    socket.emit('waiting', {
      str: '等待其他玩家...',
      myNickname: socket.nickname,
    });
  } else {
    if (socketMap[socketIndex - 1]) {
      // 决定谁先手，初始化各自的nickname
      socketMap[socketIndex - 1].emit('start', {
        myTurn: true,
        myNickname: socketMap[socketIndex - 1].nickname,
        hisNickname: socket.nickname,
      });
      socket.emit('start', {
        myTurn: false,
        myNickname: socket.nickname,
        hisNickname: socketMap[socketIndex - 1].nickname,
      });
    } else {
      socket.emit('leave');
    }
  }
  // 设置昵称
  socket.on('setNickname', str => {
    io.emit('message', socket.nickname + '把他的昵称改为：' + str);
    socket.nickname = str;
    if (socketIndex % 2 === 0) {
      socket.emit('changeMyNickname', str);
      socketMap[socketIndex + 1].emit('changeHisNickname', str);
    } else if (socketMap[socketIndex - 1]) {
      socket.emit('changeMyNickname', str);
      socketMap[socketIndex - 1].emit('changeHisNickname', str);
    }
  });

  // 轮流下子
  socket.on('switchPlayer', bool => {
    if (socketIndex % 2 === 0) {
      socket.emit('switchPlayer', !bool);
      if (socketMap[socketIndex + 1])
        socketMap[socketIndex + 1].emit('switchPlayer', bool);
    } else if (socketMap[socketIndex - 1]) {
      socket.emit('switchPlayer', !bool);
      if (socketMap[socketIndex - 1])
        socketMap[socketIndex - 1].emit('switchPlayer', bool);
    }
  });
  // 将自己的下子同步给对手
  socket.on('click', data => {
    if (socketIndex % 2 === 0) {
      if (socketMap[socketIndex + 1]) {
        socketMap[socketIndex + 1].emit('click', data);
      }
    } else {
      if (socketMap[socketIndex - 1]) {
        socketMap[socketIndex - 1].emit('click', data);
      }
    }
  });
  // 跳到某一步
  socket.on('jump', data => {
    if (socketIndex % 2 === 0) {
      if (socketMap[socketIndex + 1]) {
        socketMap[socketIndex + 1].emit('jump', data);
      }
    } else {
      if (socketMap[socketIndex - 1]) {
        socketMap[socketIndex - 1].emit('jump', data);
      }
    }
  });
  // 掉线
  socket.on('disconnect', function() {
    console.log('disconnect', socketMap.length, socketIndex);
    io.emit('disconnect', `Player${socketIndex + 1}已离线`);
    if (socketIndex % 2 === 0) {
      if (socketMap[socketIndex + 1]) {
        socketMap[socketIndex + 1].emit('leave', `Player${socketIndex}已掉线`);
      }
    } else {
      if (socketMap[socketIndex - 1]) {
        socketMap[socketIndex - 1].emit('leave', `Player${socketIndex}已掉线`);
      }
    }
  });
});

console.log('websocket server listening on port ' + PORT);
