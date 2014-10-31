const ROW_HEIGHT = 83;
const COL_WIDTH = 101;
const NUM_ROWS = 8;
const NUM_COLS = 8;
const ENEMY_OFFSET = 18;
const NUM_ENEMIES = 7;
const LOG_SPEED = [-300, 250, -350];
const NUM_LOGS = 16;
const NUM_LIVES = 3;
const LOG_STICKYNESS = 15;                          //leniency on logs to account for logs drifting apart 
                                                    //it's a feature, not a bug 

//display Game Over and Score
var gameOver = function() {
    ctx.clearRect(0, 0, ctx.width, ctx.height);
    ctx.font = 'Bold 60px Verdana';
    ctx.fillStyle = '#000000';
    ctx.fillText('Game Over :(', 175, 250);
    ctx.font = 'Bold 70px Verdana';
    ctx.fillText('Score: ' + player.score, 225, 350);
}

//Entity class - base class
//properties common to Player and Enemy classes
//sprite - location of sprite image, loaded by load(urlOrArr) in resources.js
//x - x position
//y - y position
var Entity = function(x, y, sprite) {  
    this.x = x;
    this.y = y;
    this.sprite = sprite;
}
//Draw entity on screen
Entity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}

//Return current row
Entity.prototype.getRow = function() {
    return Math.abs(Math.floor(this.y / ROW_HEIGHT));
}

// Enemies our player must avoid
var Enemy = function() {
    x = -COL_WIDTH;   // initial x value is off (left of) the screen
    var row = Math.floor(Math.random() * 3) + 4;                //road is between rows 4 and 6
    y = ROW_HEIGHT * row - ENEMY_OFFSET;                        //offset enemy to appear nicely
    Entity.call(this, x, y,  'images/enemy-bug.png');           //call Entity constructor
    this.speed = (Math.floor(Math.random() * 5) + 1) * 100;
}

Enemy.prototype = Object.create(Entity.prototype);  //set prototype delegation
Enemy.prototype.constructor = Enemy;                //set constructor delegation

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += this.speed * dt;
    if(this.x > COL_WIDTH * NUM_COLS)               //if enemy goes off the screen
        Enemy.call(this);                           //call constructor again... not sure if this unneccessarily creates an extra object or
                                                    //just resets attributes
}

//Log constructor
//Parameters:
//x - starting x column 1 - 8
//y - starting y row (1, 2 or 3 are water rows)
var Log = function(x, y) {
    Entity.call(this, x * COL_WIDTH, y * ROW_HEIGHT, 'images/log-block.png')
    this.speed = LOG_SPEED[y-1];                      //logs in a row share the same speed
                                                      //index y-1 converts row number into index
}

Log.prototype = Object.create(Entity.prototype);    //set prototype delegation
Log.prototype.constructor = Log;                    //set constructor delegation

//Update log position
//Parameter: dt, a time delta between ticks to normalize game speed across systems
Log.prototype.update = function(dt) {
    this.x += this.speed * dt;
    if(this.x > COL_WIDTH * (NUM_COLS+1))           //logs travelling in either direction 
        this.x = -COL_WIDTH;                        //will reset after going off screen
    if(this.x < -COL_WIDTH * 2)
        this.x = COL_WIDTH * NUM_COLS;         
}


//Player()
//Paramaters x, y, and sprite are pass to Entity
var Player = function(x, y, sprite) {
    Entity.call(this, x , y, sprite);        //call Entity constructor
    this.life = NUM_LIVES;
    this.score = 0;
}

Player.prototype = Object.create(Entity.prototype); //set prototype delegation
Player.prototype.constructor = Player;              //set constructor delegation

//render player
//show score and lives
Player.prototype.render = function() {
    Entity.prototype.render.call(this);
    for(var i = 0; i < this.life; i++)
        ctx.drawImage(Resources.get('images/life.png'), i * 45, 685);
    ctx.fillStyle = "#111111";
    ctx.font = "Bold 20px Verdana";
    ctx.fillText("Score: " + this.score, 700, 725);
    
}

//move player and play sound
//Parameter: direction
Player.prototype.move = function(direction) {
    switch(direction) {
        case 'right':
            this.x += COL_WIDTH;
            break;
        case 'left':
            this.x -= COL_WIDTH;
            break;
        case 'down':
            this.y += ROW_HEIGHT;
            break;
        case 'up':
            this.y -= ROW_HEIGHT;
            break;
        default:
            break;
    }
    moveSound.play();
}

//Player dies
//remove a life and reset position 
Player.prototype.die = function() {
    dieSound.play();
    this.life--;
    this.reset();
    if(player.life == 0)                            //play sound if last life lost
        gameOverSound.play();
}

//Player gets across the map and scores a point
Player.prototype.scorePoint = function() {
    this.score++;
    pointSound.play();
    if(this.score%10 == 0)                            //applause every 10 points
        wellDoneSound.play();
    this.reset();
}

//function to handle key presses from player
//bounds set for 8x8 grid of tiles with width 101, height 83
Player.prototype.handleInput = function(keyPressed)
{
    if(player.life > 0) {                           //can only move when alive
        if(keyPressed == 'right' && this.x < 706) {
            this.move('right');
        }

        if(keyPressed == 'left' && this.x > 100) {
            this.move('left');
        }
        if(keyPressed == 'down' && this.y < 580) {
            this.move('down');
        }
        if(keyPressed == 'up' && this.y > 82) {
            this.move('up');
        }
    }



}

//Puts player at start position
Player.prototype.reset = function (){
    this.x = COL_WIDTH * 3;
    this.y = ROW_HEIGHT * (NUM_COLS - 1);
}
//Update condition of Player
Player.prototype.update = function (dt){


    //check for collision with enemies
    for(e in allEnemies) {
        if((player.x - allEnemies[e].x < COL_WIDTH/2 && player.y - allEnemies[e].y < COL_WIDTH/2) && (player.x - allEnemies[e].x > -ROW_HEIGHT/2 && player.y - allEnemies[e].y > -ROW_HEIGHT/2)) {
            player.die();                                                         //dies if touching any enemy
        }
    }

    if(player.getRow() == 1 || player.getRow() == 2 || player.getRow() == 3)        // if player is on the water
    {

        if(!logs.some(logRide)) {                                            //if player is not riding a log
                player.safe = false;                                                //they aren't safe
        }
        else
        {
            player.safe = true;
            player.x += LOG_SPEED[player.getRow()-1] * dt;
        }
    
    if(!player.safe) {
        player.die();
    }
    }

    if(player.getRow() == 0)
        player.scorePoint();

}
//check to see if player is riding a log (close to a log object)
var logRide = function(log) {
            if((player.x - log.x < (COL_WIDTH/2 + LOG_STICKYNESS) && player.y - log.y < (COL_WIDTH/2 + LOG_STICKYNESS)) && (player.x - log.x > -ROW_HEIGHT/2 && player.y - log.y > -ROW_HEIGHT/2))
                return true;
}

//Sound to be played
//Params:
//sound - path to sound file
//bufferSize - # of simultaneous instances to cache for quick loading

/*********                           Sounds in this game from http://www.soundjay.com/                   *********/
var Sound = function(sound, bufferSize) {                              
    this.buffer = [];
    this.index = 0;
    for(var i=0; i < bufferSize; i++)
        this.buffer.push(new Audio(sound));
}

Sound.prototype.play = function() {
    if(window.chrome) this.buffer[this.index].load();
    this.buffer[this.index].play();
    this.index = (this.index + 1) % this.buffer.length;
}

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var player = new Player(COL_WIDTH * 3, ROW_HEIGHT * (NUM_COLS - 1), 'images/donk.png');
var allEnemies = [];
for(var i = 0; i < NUM_ENEMIES; i++)
    allEnemies[i] = new Enemy();
var logs = [];
//first row of logs
logs[0] = new Log(1, 1);
logs[1] = new Log(0, 1);
logs[2] = new Log(3, 1);
logs[3] = new Log(4, 1);
logs[4] = new Log(6, 1);
logs[5] = new Log(7, 1);
//second row of logs
logs[6] = new Log(1, 2);
logs[7] = new Log(2, 2);
logs[8] = new Log(5, 2);
logs[9] = new Log(6, 2);    
//third row of logs
logs[10] = new Log(1, 3);
logs[11] = new Log(2, 3);
logs[12] = new Log(5, 3);
logs[13] = new Log(6, 3);
logs[14] = new Log(7, 3);

//sound objects
var moveSound = new Sound('sounds/move.mp3', 6);
var dieSound = new Sound('sounds/die.mp3', 2);
var pointSound = new Sound('sounds/point.mp3', 2);
var gameOverSound = new Sound('sounds/gameover.mp3', 1);
var wellDoneSound = new Sound('sounds/welldone.mp3', 1);



// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
