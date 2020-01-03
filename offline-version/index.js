function Square({ value, onClick, className, isLastStep }) {
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
					this.props.onClick(x, y)
				}}
				className={className}
			/>
		)
	}

	render = () => {
		const { colNum, rowNum } = this.props
		return (
			<>
				{Array(rowNum)
					.fill(null)
					.map((y, yIndex) => (
						<div className="board-row">
							{Array(colNum)
								.fill(null)
								.map((x, xIndex) => {
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
								})}
						</div>
					))}
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
					squares: Array(props.rowNum)
						.fill(null)
						.map(o =>
							Array(props.colNum)
								.fill(null)
								.map(o2 => ({ player: null }))
						)
				}
			],
			stepNumber: 0,
			xIsNext: true
		}
	}

	handleClick = (x, y) => {
		const nextHistory = this.state.history.slice(0, this.state.stepNumber + 1)
		const current = nextHistory[nextHistory.length - 1]
		let squares = _.cloneDeep(current.squares)
		if (this.state.hasWinner || squares[y][x].player) {
			return
		}
		squares = squares.map(o =>
			o.map(o2 => ({
				...o2,
				isLastStep: false
			}))
		)
		squares[y][x] = this.state.xIsNext
			? { player: 'X', isLastStep: true }
			: { player: 'O', isLastStep: true }
		if (this.judge(x, y, squares, this.state.xIsNext ? 'X' : 'O')) {
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

	jumpTo = step => {
		if (step === this.state.lastWinStep) {
			this.setState({
				hasWinner: this.state.lastWinner,
				stepNumber: step,
				xIsNext: step % 2 === 0
			})
			return
		}
		this.setState({
			hasWinner: null,
			stepNumber: step,
			xIsNext: step % 2 === 0
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
		if (
			horizontal >= WINPlusOne ||
			vertical >= WINPlusOne ||
			cross1 >= WINPlusOne ||
			cross2 >= WINPlusOne
		) {
			return squares[y][x].player
		}
		return false
	}

	render() {
		const { history, hasWinner } = this.state
		const current = history[this.state.stepNumber]

		const moves = history.map((step, move) => {
			const desc = move ? 'Go to move #' + move : 'Go to game start'
			return (
				<li key={move}>
					<button onClick={() => this.jumpTo(move)}>{desc}</button>
				</li>
			)
		})

		let status
		if (hasWinner) {
			status = 'Winner: ' + this.state.hasWinner
		} else {
			status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O')
		}

		const { rowNum, colNum } = this.props

		return (
			<div className="game">
				<div>
					<div className="game-board">
						{hasWinner && (
							<div className="winner-mask">
								<div className="message">Winner is player {hasWinner}!</div>
							</div>
						)}
						<Board
							squares={current.squares}
							onClick={(i, j) => this.handleClick(i, j)}
							rowNum={rowNum}
							colNum={colNum}
						/>
					</div>
				</div>
				<div className="game-info">
					<div>{status}</div>
					<ol>{moves}</ol>
				</div>
			</div>
		)
	}
}

// ========================================

ReactDOM.render(
	<Game rowNum={19} colNum={19} WIN={5} />,
	document.getElementById('root')
)
