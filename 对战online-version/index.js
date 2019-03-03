let socket = io('ws://localhost:3099')

// import Board from './Board.js'


// 用户储存全局变量
let gameVars = {
  elmGame: undefined,
  myTurn: undefined,
  myNickname: undefined,
  hisNickname: undefined,
  myFirstStep: undefined,
}
const showMessage = (str, type) => {
  const div = document.createElement('div')
  div.classList.add('message')
  const chartRoom = document.getElementById('game-chart-room')
  const root = document.getElementById('root')
  div.innerHTML = str
  if (type === 'enter') {
    div.style.color = 'blue'
  } else if (type === 'leave') {
    div.style.color = 'red'
  }
  // document.body.insertBefore(div, root)
  chartRoom.appendChild(div)
}

// 聊天室
socket.on('enter', data => {
  showMessage(data, 'enter')
})
socket.on('message', data => {
  showMessage(data, 'message')
})
socket.on('leave', data => {
  showMessage(data, 'leave')
})
socket.on('playerDisconnect', data => {
  document.getElementById('waiting').innerHTML = '<span style="color: red;">对方掉线</span>'
  window.location.reload()
})

// 游戏开始
socket.on('waiting', function({str, myNickname}) {
  gameVars.myNickname = myNickname
  document.getElementById('waiting').innerHTML = str
  document.getElementById('myNickname').innerHTML = gameVars.myNickname
})
socket.on('start', ({ myTurn, myNickname, hisNickname }) => {
  gameVars.myTurn = myTurn
  gameVars.myNickname = myNickname
  gameVars.hisNickname = hisNickname
  document.getElementById('myNickname').innerHTML = gameVars.myNickname
  if (myTurn) {
    document.getElementById('waiting').innerHTML = `游戏开始！你先下子.`
    document.getElementById('playerInfo').innerHTML = "你是 X 棋子。你先手"
    document.getElementById('warning').innerHTML = `<span style="color: red;">请等待${gameVars.hisNickname}下子...</span>`
    gameVars.myFirstStep = 0
  } else {
    document.getElementById('waiting').innerHTML = `游戏开始！请等待${gameVars.hisNickname}下子...`
    document.getElementById('playerInfo').innerHTML = "你是 O 棋子。你后手"
    document.getElementById('warning').innerHTML = `<span style="color: red;">请等待${gameVars.hisNickname}下子...</span>`
    gameVars.myFirstStep = 1
  }
})
// 设置昵称
socket.on('changeMyNickname', data => {
  gameVars.myNickname = data
  document.getElementById('myNickname').innerHTML = gameVars.myNickname
})
socket.on('changeHisNickname', data => {
  gameVars.hisNickname = data
  // document.getElementById('waiting').innerHTML = `Game Started! <br/> 等待${gameVars.hisNickname}下子...`
})

// 轮流下子
socket.on('switchPlayer', myTurn => {
  gameVars.myTurn = myTurn
  if (gameVars.myTurn) {
    document.getElementById('waiting').innerHTML = `轮到你下子.`
  } else {
    document.getElementById('waiting').innerHTML = `等待${gameVars.hisNickname}下子...`
  }
})
// 将自己的下子同步给对手
socket.on('click', data => {
  gameVars.elmGame.handleClick(data.x, data.y, true)
})
// 跳到某一步
socket.on('jump', data => {
  gameVars.elmGame.jumpTo(data, true)
})







function Square({value, onClick, className, isLastStep}) {
  return (
    <button
      className={`
        square
        ${className ? className : ''}
        ${isLastStep ? 'isLastStep' : ''}
      `}
      onClick={onClick}
    >
      {value}
    </button>
  )
}

class Board extends React.Component {
  renderSquare = (x, y, className) => {
    return (
      <Square
        value={this.props.squares[y][x].player}
        isLastStep={this.props.squares[y][x].isLastStep}
        onClick={() => {
          this.props.onClick(x,y)
        }}
        className={className}
      />
    )
  }


  render = () => {
    const { colNum, rowNum } = this.props
    return (
      <>
        {
          Array(rowNum).fill(null).map((y, yIndex) => (
            <div className="board-row">
              {
                Array(colNum).fill(null).map((x, xIndex) => {
                  if (xIndex === colNum - 1 && yIndex === rowNum - 1) {
                    return this.renderSquare(xIndex, yIndex, 'right bottom')
                  }
                  if (xIndex === colNum - 1) {
                    return this.renderSquare(xIndex, yIndex, 'right')
                  }
                  if (yIndex === rowNum - 1) {
                    return this.renderSquare(xIndex, yIndex, 'bottom')
                  }
                  if (xIndex !== colNum - 1) {
                    return this.renderSquare(xIndex, yIndex)
                  }
                })
              }
            </div>
          ))
        }
      </>
    )
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      history: [
        {
          squares: Array(props.rowNum).fill(null).map(o => Array(props.colNum).fill(null).map(o2 => ({ player: null }))),
        }
      ],
      stepNumber: 0,
      xIsNext: true,
    }
  }

  handleClick = (x, y, switchPlayer) => {
    if (!switchPlayer) {
      if (!gameVars.myTurn) {
        $('#warning').fadeIn().fadeOut()
        // alert("It's not your turn!")
        return
      } else {
        socket.emit('click', { x, y })
        socket.emit('switchPlayer', true)
      }
    }
    gameVars.myTurn = false

    const nextHistory = this.state.history.slice(0, this.state.stepNumber + 1)
    const current = nextHistory[nextHistory.length - 1]
    let squares = _.cloneDeep(current.squares)
    if (this.state.hasWinner || squares[y][x].player) {
      return
    }
    squares = squares.map(o => o.map(o2 => ({
      ...o2,
      isLastStep: false,
    })))
    squares[y][x] = this.state.xIsNext ? { player: "X", isLastStep: true } : { player: "O", isLastStep: true  }
    if (this.judge(x, y, squares, (this.state.xIsNext ? "X" : "O"))) {
      this.setState({
        hasWinner: squares[y][x].player,
        lastWinStep: nextHistory.length,
        lastWinner: squares[y][x].player,
        history: nextHistory.concat([
          {
            squares: squares
          }
        ]),
        stepNumber: nextHistory.length,
        xIsNext: !this.state.xIsNext
      })
      return
    }
    this.setState({
      lastWinStep: null,
      lastWinner: null,
      history: nextHistory.concat([
        {
          squares: squares
        }
      ]),
      stepNumber: nextHistory.length,
      xIsNext: !this.state.xIsNext
    })
  }

  jumpTo = (step, switchPlayer) => {
    if (!switchPlayer) {
      socket.emit('jump', step)
      if (step % 2 !== gameVars.myFirstStep) {
        socket.emit('switchPlayer', true)
      } else {
        socket.emit('switchPlayer', false)
      }
    }

    if (step === this.state.lastWinStep) {
      this.setState({
        hasWinner: this.state.lastWinner,
        stepNumber: step,
        xIsNext: (step % 2) === 0
      })
      return
    }
    this.setState({
      hasWinner: null,
      stepNumber: step,
      xIsNext: (step % 2) === 0
    })
  }

  judge = (x, y, squares, player) => {
    let horizontal = 0
    let vertical = 0
    let cross1 = 0
    let cross2 = 0
    const { rowNum, colNum, WIN: propsWin } = this.props
    const WIN = propsWin || 5
    const WINPlusOne = WIN + 1

    const gameData = squares

    //左右判断
    for (let i = x; i >= 0; i--) {
      if (gameData[y][i].player != player) {
          break
      }
      horizontal++
    }
    for (let i = x; i < colNum; i++) {
      if (gameData[y][i].player != player) {
          break
      }
      horizontal++
    }
    //上下判断
    for (let i = y; i >= 0; i--) {
      if (gameData[i][x].player != player) {
        break
      }
      vertical++
    }
    for (let i = y; i < rowNum; i++) {
      if (gameData[i][x].player != player) {
        break
      }
      vertical++
    }
    //左上右下判断
    for (let i = x, j = y; i >= 0 && j >= 0; i--, j--) {
      if (gameData[j][i].player != player) {
        break
      }
      cross1++
    }
    for (let i = x, j = y; i < colNum && j < rowNum; i++, j++) {
      if (gameData[j][i].player != player) {
        break
      }
      cross1++
    }
    //右上左下判断
    for (let i = x, j = y; i >= 0 && j < rowNum; i--, j++) {
      if (gameData[j][i].player != player) {
        break
      }
      cross2++
    }
    for (let i = x, j = y; i < colNum && j >= 0; i++, j--) {
      if (gameData[j][i].player != player) {
        break
      }
      cross2++
    }
    if (horizontal >= WINPlusOne || vertical >= WINPlusOne || cross1 >= WINPlusOne || cross2 >= WINPlusOne) {
        return squares[y][x].player
    }
    return false
  }

  render() {
    const { history, hasWinner } = this.state
    const current = history[this.state.stepNumber]

    const moves = history.map((step, move) => {
      const desc = move ?
        'Go to move #' + move :
        'Go to game start'
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}>{desc}</button>
        </li>
      )
    })

    let status
    if (hasWinner) {
      status = "Winner: " + this.state.hasWinner
    } else {
      status = "Next player: " + (this.state.xIsNext ? "X" : "O")
    }

    const { rowNum, colNum } = this.props

    return (
      <>
        <div id="waiting"></div>
        <div id="warning"></div>
        昵称：<span id="myNickname"></span>
        <div id="playerInfo"></div>
        <div className="game">
          <div>
            <div className="game-board">
              {hasWinner &&
                <div className="winner-mask">
                  <div className="message">
                    Winner is player {hasWinner}!
                  </div>
                </div>
              }
              <Board
                squares={current.squares}
                onClick={(i, j) => this.handleClick(i, j)}
                rowNum={rowNum}
                colNum={colNum}
              />
            </div>
          </div>
          <div id="game-chart-room">
            <div className="chart-item-room">
              <input id="nickname"></input>
              <button
                id="setNickname"
                onClick={() => {
                  const txt = document.getElementById('nickname').value;
                  if (txt) {
                    socket.emit('setNickname', txt)
                    document.getElementById('nickname').value = ''
                  }
                }}
              >设置昵称</button>
            </div>
            <div className="chart-item-room">
              <input id="sendText"></input>
              <button
                id="sendBtn"
                onClick={() => {
                  const txt = document.getElementById('sendText').value;
                  if (txt) {
                    socket.emit('message', txt)
                    document.getElementById('sendText').value = ''
                  }
                }}
              >发送</button>
            </div>
          </div>
          <div className="game-info">
            <div>{status}</div>
            <ol>{moves}</ol>
          </div>
        </div>
      </>
    )
  }
}

// ========================================

ReactDOM.render(
  <Game
    ref={ref => { if (ref) { gameVars.elmGame = ref }}}
    rowNum={19}
    colNum={19}
    WIN={5}
    socket={socket}
    gameVars={gameVars}
  />,
  document.getElementById("root"),
)

