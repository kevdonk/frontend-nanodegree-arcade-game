var Engine = (function(global) {
    var doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        lastTime;

    canvas.width = 808;
    canvas.height = 747;
    doc.body.appendChild(canvas);

    function main() {
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        update(dt);
        render();

        lastTime = now;
        win.requestAnimationFrame(main);
    };

    function init() {
        reset();
        lastTime = Date.now();
        main();
    }

    function update(dt) {
        updateEntities(dt);
     //   checkCollisions();
    }

    function updateEntities(dt) {
        allEnemies.forEach(function(enemy) {
            enemy.update(dt);
        });
        logs.forEach(function(log) {
            log.update(dt);
        });
        player.update(dt);
    }

    function render() {
        if(player.life > 0)        {
            var rowImages = [
                    'images/grass-block.png',
                    'images/water-block.png',
                    'images/water-block.png',
                    'images/water-block.png',
                    'images/stone-block.png',
                    'images/stone-block.png',
                    'images/stone-block.png',
                    'images/grass-block.png'
                ],
                numRows = 8,
                numCols = 8,
                row, col;

            for (row = 0; row < numRows; row++) {
                for (col = 0; col < numCols; col++) {
                    ctx.drawImage(Resources.get(rowImages[row]), col * 101, row * 83);
                }
            }

            renderEntities();
        }
        else
            gameOver();
    }

    function renderEntities() {
        allEnemies.forEach(function(enemy) {
        enemy.render();
        });
        logs.forEach(function(log) {
            log.render();
        });
        player.render();
    }

    function reset() {
        // noop
    }

    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/log-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/donk.png',
        'images/life.png'
    ]);
    Resources.onReady(init);

    global.ctx = ctx;
})(this);
