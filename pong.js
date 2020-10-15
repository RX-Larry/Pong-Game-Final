"use strict";
/**
 * Student name: Lim Tzeyi
 * Student ID: 30512867
 */
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
/**
 * Create common constants for paddles.
 */
const PaddleConstants = new (class {
    constructor() {
        this.paddleWidth = 10;
        this.paddleHeight = 80;
        this.paddleColour = "#FFFFFF";
        this.paddleRx = 5;
    }
})();
/**
 * Create common constants for score display.
 */
const ScoreDisplayConstants = new (class {
    constructor() {
        this.playerScoreX = 150;
        this.playerScoreY = 100;
        this.cpuScoreX = 450;
        this.cpuScoreY = 100;
        this.scoreWidth = 30;
        this.scoreHeight = 30;
        this.scoreColour = "#FFFFFF";
        this.scoreFontSize = "40px";
    }
})();
/**
 * Create common constants for showing game over on the canvas.
 */
const ShowGameOverConstants = new (class {
    constructor() {
        this.ShowGameOverX = 155;
        this.ShowGameOverY = 300;
        this.ShowGameOverWidth = 30;
        this.ShowGameOverHeight = 30;
        this.ShowGameOverColour = "#FF0000";
        this.ShowGameOverFontSize = "50px";
    }
})();
/**
 *
 */
const ShowWinnerConstants = new (class {
    constructor() {
        this.ShowWinnerX = 190;
        this.ShowWinnerY = 500;
        this.ShowWinnerWidth = 30;
        this.ShowWinnerHeight = 30;
        this.ShowWinnerColour = "#FF0000";
        this.ShowWinnerFontSize = "50px";
    }
})();
/**
 * Create common constants for ball.
 */
const BallConstants = new (class {
    constructor() {
        this.BallSpeed = 2;
        this.BallY = 300;
        this.BallX = 300;
        this.BallRadius = 7;
        this.BallColour = "#FFFFFF";
    }
})();
function pong() {
    // Inside this function you will use the classes and functions
    // from rx.js
    // to add visuals to the svg element in pong.html, animate them, and make them interactive.
    // Study and complete the tasks in observable exampels first to get ideas.
    // Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
    // You will be marked on your functional programming style
    // as well as the functionality that you implement.
    // Document your code!
    /**
     * This function is used to set the attributes of an svg element
     * Code referred from https://tgdwyer.github.io/asteroids/
     * @param e takes in an element we want to modify the attributes of
     * @param o takes in a list or set of elements to set the attributes of e
     */
    const attr = (e, o) => {
        for (const k in o)
            e.setAttribute(k, String(o[k])); //iterates through each of the element in o and set the attribute values into element e.
    };
    /**
     * Create a class of constants to be used in our code
     * where it can only be read.
     */
    const Constants = new (class {
        constructor() {
            this.maxScore = 7;
            this.tickRate = 7; //specifies the tick rate of the program.
            this.pongObservable$ = rxjs_1.interval(this.tickRate); //create an observable with the specified tick rate for our whole program.
        }
    })();
    /**
     * Create constants which we can use the data
     * of our created canvas.
     */
    const svg = document.getElementById("canvas");
    const svgHeight = Number(svg.getAttribute("height"));
    const svgWidth = Number(svg.getAttribute("width"));
    /**
     * Create a constant which will later be used to
     * display a game over text when the game end on
     * the screen.
     */
    const GameOver = showGameOver(ShowGameOverConstants.ShowGameOverX, ShowGameOverConstants.ShowGameOverY);
    /**
     * Create a constant which will show who is the winner
     * on the canvas
     */
    const showWinner = showGameOver(ShowWinnerConstants.ShowWinnerX, ShowWinnerConstants.ShowWinnerY);
    /**
     * Initialise keyup event which will later be used in our
     * detection for key presses to move the player paddle.
     */
    const keyUp$ = rxjs_1.fromEvent(document, "keyup");
    /**
     * Create a constant to display the score for
     * player and cpu on the canvas.
     */
    const PLAYERSCORE = scoreDisplay(ScoreDisplayConstants.playerScoreX, ScoreDisplayConstants.playerScoreY);
    const CPUSCORE = scoreDisplay(ScoreDisplayConstants.cpuScoreX, ScoreDisplayConstants.cpuScoreY);
    /**
     * Create an initial state for the objects in
     * our canvas where the value will change as
     * we play the game.
     */
    const initialState = {
        ball: {
            pos: new Vec(svgHeight / 2, svgWidth / 2),
            vel: new Vec(-2, Math.floor(Math.random() * 3) + 2),
        },
        playerPaddle: {
            pos: new Vec(10, 250),
        },
        cpuPaddle: {
            //set the initial position of the cpu paddle.
            pos: new Vec(580, 250),
        },
        playerScore: 0,
        cpuScore: 0,
        gameOver: false,
    };
    /**
     * Create objects to be used in our game by taking
     * the values from our initial state array.
     */
    const ball = createBall(initialState.ball.pos.x, initialState.ball.pos.y);
    const player = createPaddle(initialState.playerPaddle.pos.x, initialState.playerPaddle.pos.y);
    const cpu = createPaddle(initialState.cpuPaddle.pos.x, initialState.cpuPaddle.pos.y);
    /**
     * Create an observable which detects when w or s key is pressed
     * and moves the player paddle up and down with w and s
     * respectively.
     * Code referred from https://tgdwyer.github.io/asteroids/.
     */
    const keyDown$ = rxjs_1.fromEvent(document, "keydown")
        .pipe(operators_1.filter(({ key }) => key === "w" || key === "s"), operators_1.filter(({ repeat }) => !repeat), operators_1.flatMap((d) => Constants.pongObservable$.pipe(operators_1.takeUntil(keyUp$.pipe(operators_1.filter(({ key }) => key === d.key))), operators_1.map((_) => d))), operators_1.map((d) => (d.key === "w" ? -2 : 2)))
        .subscribe((e) => animatePlayerPaddle(player, e));
    /**
     * Create an observable to run the mechanics of
     * our pong game.
     */
    Constants.pongObservable$
        .pipe(operators_1.scan(pongMechanics, initialState))
        .subscribe(updateView);
    /**
     * Create an observable to allod the cpu paddle
     * to follow the ball as it moves on the y axis.
     */
    Constants.pongObservable$
        .pipe(operators_1.map(() => ball.getAttribute("cy")))
        .subscribe((yCoord) => animateCpuPaddle(cpu, ball, Number(yCoord)));
    /**
     * Function used to allow the player paddle to move on the y-axis.
     * @param paddle an element e.g. the player's paddle.
     * @param unit a number to move the element by the specified amount.
     */
    function animatePlayerPaddle(paddle, unit) {
        attr(paddle, { y: Number(paddle.getAttribute("y")) + unit });
    }
    /**
     * Function used to allow the cpu paddle to move on the y-axis.
     * @param paddle an element e.g. the cpu's paddle.
     * @param elem an element we want param paddle to move together with on the y-axis.
     * @param unit a number to move the cpu paddle by the specified amount.
     */
    function animateCpuPaddle(paddle, elem, unit) {
        attr(paddle, { y: Number(elem.getAttribute("y")) + unit });
    }
    /**
     * Function used to take in a state of the current game and check if there is any
     * collisions, making the ball to move continously when no collision is detected
     * and checking if the max score is reached.
     * @param s a state you want to update the canvas objects with.
     */
    function pongMechanics(s) {
        //check if player or cpu obtained max score
        //if one of them obtained it, the game score state is set to true
        if (s.playerScore === Constants.maxScore ||
            s.cpuScore === Constants.maxScore) {
            return { ...s, gameOver: true };
        }
        //check if the ball hits the ceiling or floor
        //if it hits, the y direction is reverted back.f
        else if (s.ball.pos.y <= 0 || s.ball.pos.y >= svgHeight) {
            return {
                ...s,
                ball: {
                    ...s.ball,
                    vel: new Vec(s.ball.vel.x, -s.ball.vel.y),
                    pos: s.ball.pos.sub(s.ball.vel),
                },
            };
        }
        //check if player scored (ball passes the wall behind cpu)
        //if it passes then player's score is added with 1 and
        //cpu's score remains unchanged.
        else if (s.ball.pos.x >= svgWidth) {
            return {
                ...initialState,
                playerScore: s.playerScore + 1,
                cpuScore: s.cpuScore,
            };
        }
        //check if cpu scored (ball passes the wall behind player)
        //if it passed then cpu's score is added with 1 and
        //player's score remains unchanged.
        else if (s.ball.pos.x <= 0) {
            return {
                ...initialState,
                ball: {
                    ...initialState.ball,
                    vel: new Vec(3, Math.floor(Math.random() * 3) + 2),
                },
                playerScore: s.playerScore,
                cpuScore: s.cpuScore + 1,
            };
        }
        //check if the ball collided with player paddle
        //if it collides then the x direction of the ball
        //is inverted.
        else if (s.ball.pos.y >= Number(player.getAttribute("y")) &&
            s.ball.pos.y <=
                Number(player.getAttribute("y")) + PaddleConstants.paddleHeight &&
            s.ball.pos.x === s.playerPaddle.pos.x + PaddleConstants.paddleWidth) {
            return {
                ...s,
                ball: {
                    ...s,
                    vel: new Vec(-s.ball.vel.x, Math.floor(Math.random() * 3) + 2),
                    pos: s.ball.pos.sub(s.ball.vel),
                },
            };
        }
        //check if the ball collided with cpu paddle
        //if it collides then the x direction of the ball
        //is inverted.
        else if (s.ball.pos.y >= Number(cpu.getAttribute("y")) &&
            s.ball.pos.y <=
                Number(cpu.getAttribute("y")) + PaddleConstants.paddleHeight &&
            s.ball.pos.x === s.cpuPaddle.pos.x + PaddleConstants.paddleWidth) {
            return {
                ...s,
                ball: {
                    ...s,
                    vel: new Vec(-s.ball.vel.x, Math.floor(Math.random() * 3) + 2),
                    pos: s.ball.pos.sub(s.ball.vel),
                },
            };
        }
        //move the ball when there is no collision
        //by adding it's position with it's velocityD
        else {
            return {
                ...s,
                ball: {
                    ...s.ball,
                    pos: s.ball.pos.add(s.ball.vel),
                },
            };
        }
    }
    /**
     * Function which takes in a State and updates
     * objects in the canvas with the passed in
     * state.
     * @param s a state you want to update the canvas objects with.
     */
    function updateView(s) {
        //display the score for player and cpu on the canvas.
        PLAYERSCORE.textContent = `${s.playerScore}`;
        CPUSCORE.textContent = `${s.cpuScore}`;
        attr(ball, { cx: s.ball.pos.x + s.ball.vel.x });
        attr(ball, { cy: s.ball.pos.y + s.ball.vel.y });
        //check if the game is over.
        if (s.gameOver) {
            svg.removeChild(ball);
            const GameOverText = "Game Over";
            const playerWinText = "Player Win";
            const cpuWinText = "CPU Win";
            GameOver.textContent = `${GameOverText}`; //display "Game Over" on canvas.
            if (s.cpuScore === Constants.maxScore) {
                showWinner.textContent = `${cpuWinText}`;
            }
            else {
                showWinner.textContent = `${playerWinText}`;
            }
            keyDown$.unsubscribe(); //unsubscribe from the observable.
            rxjs_1.interval(5000).subscribe(restart); //waits for 5 secs then restart the game.
        }
    }
    /**
     * Function used to restart the game. Removes all the contents of
     * and objects from the canvas. Calls pong() to start the game again.
     */
    function restart() {
        svg.removeChild(player);
        svg.removeChild(cpu);
        PLAYERSCORE.textContent = "";
        CPUSCORE.textContent = "";
        GameOver.textContent = "";
        showWinner.textContent = "";
        pong();
    }
    /**
     * Function used to create a new paddle.
     * @param x a number to specify the starting x position on the canvas for paddle.
     * @param y a number to specify the starting y position on the canvas for paddle.
     */
    function createPaddle(x, y) {
        const svg = document.getElementById("canvas");
        const paddle = document.createElementNS(svg.namespaceURI, "rect");
        attr(paddle, {
            x: x,
            y: y,
            width: PaddleConstants.paddleWidth,
            height: PaddleConstants.paddleHeight,
            fill: PaddleConstants.paddleColour,
            rx: PaddleConstants.paddleRx,
        });
        svg.appendChild(paddle);
        return paddle;
    }
    /**
     * Function used to create a new ball.
     * @param cx a number to specify the starting x position on the canvas for ball.
     * @param cy a number to specify the starting y position on the canvas for ball.
     */
    function createBall(cx, cy) {
        const svg = document.getElementById("canvas");
        const ball = document.createElementNS(svg.namespaceURI, "circle");
        attr(ball, {
            cx: cx,
            cy: cy,
            r: BallConstants.BallRadius,
            fill: BallConstants.BallColour,
        });
        svg.appendChild(ball);
        return ball;
    }
    /**
     * Function used to display score on the canvas.
     * @param x a number to specify the x position on the canvas for displaying the score.
     * @param y a number to specify the y position on the canvas for displaying the score.
     */
    function scoreDisplay(x, y) {
        const svg = document.getElementById("canvas");
        const scoreDisplay = document.createElementNS(svg.namespaceURI, "text");
        attr(scoreDisplay, {
            x: x,
            y: y,
            width: ScoreDisplayConstants.scoreWidth,
            height: ScoreDisplayConstants.scoreHeight,
            fill: ScoreDisplayConstants.scoreColour,
            "font-size": ScoreDisplayConstants.scoreFontSize,
        });
        svg.appendChild(scoreDisplay);
        return scoreDisplay;
    }
    /**
     * Function used to show the Game Over text on the canvas.
     * @param x a number to specify the x position on the canvas for displaying game over text.
     * @param y a number to specify the y position on the canvas for displaying game over text.
     */
    function showGameOver(x, y) {
        const svg = document.getElementById("canvas");
        const displayText = document.createElementNS(svg.namespaceURI, "text");
        attr(displayText, {
            x: x,
            y: y,
            width: ShowGameOverConstants.ShowGameOverWidth,
            height: ShowGameOverConstants.ShowGameOverHeight,
            fill: ShowGameOverConstants.ShowGameOverColour,
            "font-size": ShowGameOverConstants.ShowGameOverFontSize,
        });
        svg.appendChild(displayText);
        return displayText;
    }
}
// the following simply runs your pong function on window load.  Make sure to leave it in place.
if (typeof window != "undefined")
    window.onload = () => {
        pong();
    };
/**
 *
 * Class used to create vectors for objects.
 * Code referred from https://tgdwyer.github.io/asteroids/.
 */
class Vec {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.add = (b) => new Vec(this.x + b.x, this.y + b.y);
        this.sub = (b) => this.add(b.scale(-1));
        this.scale = (s) => new Vec(this.x * s, this.y * s);
    }
}
Vec.velocity = new Vec(1, 1);
Vec.Zero = new Vec();
//# sourceMappingURL=pong.js.map