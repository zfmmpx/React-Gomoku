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

export { Board }