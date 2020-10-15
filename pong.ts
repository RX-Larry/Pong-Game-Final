/**
 * Student name: Lim Tzeyi
 * Student ID: 30512867
 */

import { fromEvent, interval, Observable } from "rxjs";
import { map, filter, flatMap, takeUntil, merge, scan } from "rxjs/operators";

/**
 * Create common constants for paddles.
 */
const PaddleConstants = new (class {
  readonly paddleWidth = 10;
  readonly paddleHeight = 80;
  readonly paddleColour = "#FFFFFF";
  readonly paddleRx = 5;
})();

/**
 * Create common constants for score display.
 */
const ScoreDisplayConstants = new (class {
  readonly playerScoreX = 150;
  readonly playerScoreY = 100;
  readonly cpuScoreX = 450;
  readonly cpuScoreY = 100;
  readonly scoreWidth = 30;
  readonly scoreHeight = 30;
  readonly scoreColour = "#FFFFFF";
  readonly scoreFontSize = "40px";
})();

/**
 * Create common constants for showing game over on the canvas.
 */
const ShowGameOverConstants = new (class {
  readonly ShowGameOverX = 155;
  readonly ShowGameOverY = 300;
  readonly ShowGameOverWidth = 30;
  readonly ShowGameOverHeight = 30;
  readonly ShowGameOverColour = "#FF0000";
  readonly ShowGameOverFontSize = "50px";
})();

/**
 * Create common constants for showing winner on the canvas
 */
const ShowWinnerConstants = new (class {
  readonly ShowWinnerX = 190;
  readonly ShowWinnerY = 500;
  readonly ShowWinnerWidth = 30;
  readonly ShowWinnerHeight = 30;
  readonly ShowWinnerColour = "#FF0000";
  readonly ShowWinnerFontSize = "50px";
})();

/**
 * Create common constants for ball.
 */
const BallConstants = new (class {
  readonly BallSpeed = 2;
  readonly BallY = 300;
  readonly BallX = 300;
  readonly BallRadius = 7;
  readonly BallColour = "#FFFFFF";
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
  const attr = (e: Element, o: any) => {
    for (const k in o) e.setAttribute(k, String(o[k])); //iterates through each of the element in o and set the attribute values into element e.
  };

  /**
   * Create a type ball which specify the type
   * of it's characteristics.
   */
  type Ball = Readonly<{
    pos: Vec;
    vel: Vec;
  }>;

  /**
   * Create a type paddle which specify the type
   * of it's characteristics.
   */
  type Paddle = Readonly<{
    pos: Vec;
  }>;

  /**
   * Create a type state which specifies the type
   * of the objects in our pong game.
   */
  type State = Readonly<{
    ball: Ball;
    playerPaddle: Paddle;
    cpuPaddle: Paddle;
    playerScore: number;
    cpuScore: number;
    gameOver: Boolean;
  }>;

  /**
   * Create a class of constants to be used in our code
   * where it can only be read.
   */
  const Constants = new (class {
    readonly maxScore = 7;
    readonly tickRate = 7; //specifies the tick rate of the program.
    readonly pongObservable$ = interval(this.tickRate); //create an observable with the specified tick rate for our whole program.
  })();

  /**
   * Create constants which we can use the data
   * of our created canvas.
   */
  const svg = document.getElementById("canvas")!;
  const svgHeight = Number(svg.getAttribute("height"));
  const svgWidth = Number(svg.getAttribute("width"));

  /**
   * Create a constant which will later be used to
   * display a game over text when the game end on
   * the screen.
   */
  const GameOver = showGameOver(
    ShowGameOverConstants.ShowGameOverX,
    ShowGameOverConstants.ShowGameOverY
  );

  /**
   * Create a constant which will show who is the winner
   * on the canvas
   */
  const showWinner = showGameOver(
    ShowWinnerConstants.ShowWinnerX,
    ShowWinnerConstants.ShowWinnerY
  );

  /**
   * Initialise keyup event which will later be used in our
   * detection for key presses to move the player paddle.
   */
  const keyUp$ = fromEvent<KeyboardEvent>(document, "keyup");

  /**
   * Create a constant to display the score for
   * player and cpu on the canvas.
   */
  const PLAYERSCORE = scoreDisplay(
    ScoreDisplayConstants.playerScoreX,
    ScoreDisplayConstants.playerScoreY
  );

  const CPUSCORE = scoreDisplay(
    ScoreDisplayConstants.cpuScoreX,
    ScoreDisplayConstants.cpuScoreY
  );

  /**
   * Create an initial state for the objects in
   * our canvas where the value will change as
   * we play the game.
   */
  const initialState: State = {
    ball: {
      pos: new Vec(svgHeight / 2, svgWidth / 2), //set initial position of the ball.
      vel: new Vec(-2, Math.floor(Math.random() * 3) + 2), //set the initial speed of the ball.
    },
    playerPaddle: {
      pos: new Vec(10, 250), //set the initial position of the player's paddle.
    },
    cpuPaddle: {
      //set the initial position of the cpu paddle.
      pos: new Vec(580, 250),
    },
    playerScore: 0, //set initial score for player.
    cpuScore: 0, //set initial score for cpu.
    gameOver: false, //set game over to false when the game starts initially.
  };

  /**
   * Create objects to be used in our game by taking
   * the values from our initial state array.
   */
  const ball = createBall(initialState.ball.pos.x, initialState.ball.pos.y);
  const player = createPaddle(
    initialState.playerPaddle.pos.x,
    initialState.playerPaddle.pos.y
  );
  const cpu = createPaddle(
    initialState.cpuPaddle.pos.x,
    initialState.cpuPaddle.pos.y
  );

  /**
   * Create an observable which detects when w or s key is pressed
   * and moves the player paddle up and down with w and s
   * respectively.
   * Code referred from https://tgdwyer.github.io/asteroids/.
   */
  const keyDown$ = fromEvent<KeyboardEvent>(document, "keydown")
    .pipe(
      filter(({ key }) => key === "w" || key === "s"),
      filter(({ repeat }) => !repeat),
      flatMap((d) =>
        Constants.pongObservable$.pipe(
          takeUntil(keyUp$.pipe(filter(({ key }) => key === d.key))),
          map((_) => d)
        )
      ),
      map((d) => (d.key === "w" ? -2 : 2))
    )
    .subscribe((e) => animatePlayerPaddle(player, e));

  /**
   * Create an observable to run the mechanics of
   * our pong game.
   */
  Constants.pongObservable$
    .pipe(scan(pongMechanics, initialState))
    .subscribe(updateView);

  /**
   * Create an observable to allod the cpu paddle
   * to follow the ball as it moves on the y axis.
   */
  Constants.pongObservable$
    .pipe(map(() => ball.getAttribute("cy")))
    .subscribe((yCoord) => animateCpuPaddle(cpu, ball, Number(yCoord)));

  /**
   * Function used to allow the player paddle to move on the y-axis.
   * @param paddle an element e.g. the player's paddle.
   * @param unit a number to move the element by the specified amount.
   */
  function animatePlayerPaddle(paddle: Element, unit: number): void {
    attr(paddle, { y: Number(paddle.getAttribute("y")) + unit });
  }

  /**
   * Function used to allow the cpu paddle to move on the y-axis.
   * @param paddle an element e.g. the cpu's paddle.
   * @param elem an element we want param paddle to move together with on the y-axis.
   * @param unit a number to move the cpu paddle by the specified amount.
   */
  function animateCpuPaddle(
    paddle: Element,
    elem: Element,
    unit: number
  ): void {
    attr(paddle, { y: Number(elem.getAttribute("y")) + unit });
  }

  /**
   * Function used to take in a state of the current game and check if there is any
   * collisions, making the ball to move continously when no collision is detected
   * and checking if the max score is reached.
   * @param s a state you want to update the canvas objects with.
   */
  function pongMechanics(s: State): State {
    //check if player or cpu obtained max score
    //if one of them obtained it, the game score state is set to true
    if (
      s.playerScore === Constants.maxScore ||
      s.cpuScore === Constants.maxScore
    ) {
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
    else if (
      s.ball.pos.y >= Number(player.getAttribute("y")) &&
      s.ball.pos.y <=
        Number(player.getAttribute("y")) + PaddleConstants.paddleHeight &&
      s.ball.pos.x === s.playerPaddle.pos.x + PaddleConstants.paddleWidth
    ) {
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
    else if (
      s.ball.pos.y >= Number(cpu.getAttribute("y")) &&
      s.ball.pos.y <=
        Number(cpu.getAttribute("y")) + PaddleConstants.paddleHeight &&
      s.ball.pos.x === s.cpuPaddle.pos.x + PaddleConstants.paddleWidth
    ) {
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
  function updateView(s: State): void {
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
      } else {
        showWinner.textContent = `${playerWinText}`;
      }
      keyDown$.unsubscribe(); //unsubscribe from the observable.
      interval(5000).subscribe(restart); //waits for 5 secs then restart the game.
    }
  }

  /**
   * Function used to restart the game. Removes all the contents of
   * and objects from the canvas. Calls pong() to start the game again.
   */
  function restart(): void {
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
  function createPaddle(x: number, y: number): Element {
    const svg = document.getElementById("canvas")!;
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
  function createBall(cx: number, cy: number): Element {
    const svg = document.getElementById("canvas")!;
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
  function scoreDisplay(x: number, y: number): Element {
    const svg = document.getElementById("canvas")!;
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
  function showGameOver(x: number, y: number): Element {
    const svg = document.getElementById("canvas")!;
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
  constructor(public readonly x: number = 0, public readonly y: number = 0) {}
  static velocity = new Vec(1, 1);
  static Zero = new Vec();
  add = (b: Vec) => new Vec(this.x + b.x, this.y + b.y);
  sub = (b: Vec) => this.add(b.scale(-1));
  scale = (s: number) => new Vec(this.x * s, this.y * s);
}
