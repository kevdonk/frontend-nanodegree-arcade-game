const ROW_HEIGHT = 83;
const COL_WIDTH = 101;
const NUM_ROWS = 8;
const NUM_COLS = 8;
const OFFSET = 18;
const NUM_ENEMIES = 7;
const LOG_SPEED = [-200, 250, -150];
const NUM_LOGS = 16;
const LOG_STICKYNESS = 15;                          //leniency on logs to account for logs drifting apart 
                                                    //it's a feature, not a bug 
var reset = function() {
    player.reset();
}

//Entity class - base class
//properties common to Player and Enemy classes
//sprite - location of sprite image, loaded by load(urlOrArr) in resources.js
//x - x position
//y - y position
//update() - update position of object
var Entity = function(x, y, sprite) {  
    this.x = x;
    this.y = y;
    this.sprite = sprite;
}
//Draw entity on screen
Entity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}

//Return curren row
Entity.prototype.getRow = function() {
    return Math.abs(Math.floor(this.y / ROW_HEIGHT));
}

// Enemies our player must avoid
var Enemy = function() {
    x = -COL_WIDTH;   // initial x value is off (left of) the screen
    //y = rand()
    //y should be on the road (4-6) * 83 - 15    (where 83 = row height and 15 = enemy offset)
    var row = Math.floor(Math.random() * 3) + 4;
    y = ROW_HEIGHT * row - OFFSET;
    Entity.call(this, x, y,  'images/enemy-bug.png');  //call Entity constructor
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


// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function(x, y, sprite) {
    Entity.call(this, x , y, sprite);        //call Entity constructor
}

Player.prototype = Object.create(Entity.prototype); //set prototype delegation
Player.prototype.constructor = Player;              //set constructor delegation

//function to handle key presses from player
//bounds set for 8x8 grid of tiles with width 101, height 83
Player.prototype.handleInput = function(keyPressed)
{
    if(keyPressed == 'right' && this.x < 706)
            this.x += COL_WIDTH;
    if(keyPressed == 'left' && this.x > 100)
            this.x -= COL_WIDTH;
    if(keyPressed == 'down' && this.y < 580)
            this.y += ROW_HEIGHT;
    if(keyPressed == 'up' && this.y > 82)
            this.y -= ROW_HEIGHT;

}
Player.prototype.reset = function (){
    this.x = COL_WIDTH * 3;
    this.y = ROW_HEIGHT * (NUM_COLS - 1);
}
//check to see if player is riding a log (close to a log object)
Player.prototype.logRide = function(log) {
            if((player.x - log.x < (COL_WIDTH/2 + LOG_STICKYNESS) && player.y - log.y < (COL_WIDTH/2 + LOG_STICKYNESS)) && (player.x - log.x > -ROW_HEIGHT/2 && player.y - log.y > -ROW_HEIGHT/2))
                return true;
}

//Update condition of Player
Player.prototype.update = function (){

    //check for collision with enemies
    for(e in allEnemies) {
        if((player.x - allEnemies[e].x < COL_WIDTH/2 && player.y - allEnemies[e].y < COL_WIDTH/2) && (player.x - allEnemies[e].x > -ROW_HEIGHT/2 && player.y - allEnemies[e].y > -ROW_HEIGHT/2))
            reset();                                                                //reset if touching any enemy
    }

    if(player.getRow() == 1 || player.getRow() == 2 || player.getRow() == 3)        // if player is on the water
    {

        if(!logs.some(player.logRide)) {                                            //if player is not riding a log
                player.safe = false;                                                //they aren't safe
        }
        else
        {
            player.safe = true;
        }
    
    if(!player.safe)
        reset();
    }

    if(player.getRow() == 0)
        reset();

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
    logs[10] = new Log(0, 3);
    logs[11] = new Log(1, 3);
    logs[12] = new Log(2, 3);
    logs[13] = new Log(5, 3);
    logs[14] = new Log(6, 3);
    logs[15] = new Log(7, 3);



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
