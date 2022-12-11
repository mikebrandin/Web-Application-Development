// Mike Brandin - 9/24/22 - CPSC 3750 Project 2: Tic Tac Toe
//global handle to board div and controls div
// so we dont have to look it up every time
let boardNode;
let controlsNode;
//if AI goes first, need to know what players mark is
let playerMark = "X";
let AIMark = "O";
let lastMove = "";
//holds the board buttons in nested arrays
//accessed like board[0][0] (top left button)
const board = [];
const buttonCount = 9;

//assoc array of the other buttons
//accessed like controls.aiFirst or controls.reload
const controls = {};

const tie = function () {//check for a tie
    let count = 0
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (board[i][j].innerHTML == playerMark || board[i][j].innerHTML == AIMark) count++
    if (count == buttonCount)
        return true
    else
        return false
}

const vert_win = function () {//check for a vertical win
    for (let j = 0; j < 3; j++)
        if (board[0][j].innerHTML == board[1][j].innerHTML && board[1][j].innerHTML == board[2][j].innerHTML && board[2][j].innerHTML == lastMove)
            return true
    return false
}

const horiz_win = function () {//check for a horizontal win
    for (let i = 0; i < 3; i++)
        if (board[i][0].innerHTML == board[i][1].innerHTML && board[i][1].innerHTML == board[i][2].innerHTML && board[i][2].innerHTML == lastMove)
            return true
    return false
}

const diag_win = function () {//check for a diagonal win
    if (board[0][0].innerHTML == board[1][1].innerHTML && board[1][1].innerHTML == board[2][2].innerHTML && board[2][2].innerHTML == lastMove)// \
        return true
    else if (board[2][0].innerHTML == board[1][1].innerHTML && board[1][1].innerHTML == board[0][2].innerHTML && board[0][2].innerHTML == lastMove)// /
        return true
    else
        return false
}

//no return or params
//picks an open button and sets it as the AIs mark
//always sets aiFirst button to disabled
const aiGo = () => {
    const empties = []
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (board[i][j].innerHTML != playerMark && board[i][j].innerHTML != AIMark) empties.push(board[i][j])

    let chosen = empties[Math.floor((Math.random() * 1000) % empties.length)]
    chosen.innerHTML = AIMark
    chosen.disabled = true

    lastMove = AIMark
}

//return X, O, or - if game is over
//returns false if game isnt over
const checkEnd = () => {

if (horiz_win() || vert_win() || diag_win())
    return lastMove
else if (tie())
    return "t"
else
    return false
}

//isnt an arrow function because this way it can use 'this' 
//to reference the button clicked.
//
//always sets aiFirst button to disabled
//sets button state (disabled and inner html)
//checks for end state (and possible ends game)
//calls aiGo
//checks for end state (and possible ends game)
const boardOnClick = function(){
    //put a playermark there
    controls.CPUButton.disabled = true
    this.innerHTML = playerMark
    this.disabled = true
    lastMove = playerMark

    //check if the game is over
    let gameover = checkEnd()
    if (gameover){
        return endGame(gameover)
    }

    //make the ai go
    aiGo()

    //check if game is over
    gameover = checkEnd()
    if (gameover){
        return endGame(gameover)
    }
}

//changes playerMark global (??? instructions say Player is always x), calls aiGo
const aiFirstOnClick = () => {
    controls.CPUButton.disabled = true
    lastMove = playerMark
    aiGo()
}

//takes in the return of checkEnd (X,O,-) if checkEnd isnt false
//disables all board buttons, shows message of who won (or cat game) in the control node
//using a new div and innerHTML
const endGame = (state)=>{
    controls.CPUButton.disabled = true

    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            board[i][j].disabled = true
    
    const winElem = document.createElement('div')
    if (state == AIMark || state == playerMark)
        winElem.innerHTML = "Player " + state + " wins!"
    else
        winElem.innerHTML = "Tie game!"
    
    controlsNode.appendChild(winElem)
    controls.winElem = winElem
    return state
}

const reload = function () {
    window.location.reload();
}

//called when page finishes loading
//populates the boardNode and controlsNode with getElementById calls
//builds out buttons and saves them in the board global array
//and adds them into the boardNode
//builds out buttons and saves them in control assoc array
//and adds them into controlsNode
//attaches the functions above as button.onclick as appropriate
const load = ()=>{
    boardNode = document.getElementById("board")
    controlsNode = document.getElementById("controls")

    for (let i = 0; i < 3; i++){
        //rows
        board[i] = []
        const div = document.createElement("div")
        boardNode.appendChild(div)
        //columns
        for (let j = 0; j < 3; j++){
            const button = document.createElement("button")
            button.innerHTML = "\u00A0\u00A0"
            button.i = i
            button.j = j
            button.onclick = boardOnClick
            board[i][j] = button
            div.appendChild(button)
        }
    }

    const CPUButton = document.createElement('button') // computer played unit goes first
    CPUButton.innerHTML = "CPU First"
    CPUButton.onclick = aiFirstOnClick
    controlsNode.appendChild(CPUButton)
    controls.CPUButton = CPUButton
    
    const ngButton = document.createElement('button') // reload page
    ngButton.innerHTML = "New Game"
    ngButton.onclick = reload
    controlsNode.appendChild(ngButton)
    controls.ngButton = ngButton
}

//this says 'when the page finishes loading call my load function'
window.addEventListener("load", load); 