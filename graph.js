document.addEventListener('DOMContentLoaded', function () {
    "use strict";
    var canvas = document.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var radius = 5;
    var targetMultiplier = 1.5;
    var points = [];
    var connections = [];
    var mouse = {
        down: false,
        dragged: false,
        dragThreshold: 3,
        button: undefined,
        point: undefined,
        target: false,
        target2: undefined,
        connection: undefined
    };
    var focused = undefined;

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.draw = function (color) {
        ctx.strokeStyle = ctx.fillStyle = (
            color ||
            (Object.is(this, focused) ? 'blue' : 'black')
        );
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
    };
    Point.prototype.copy = function (other) {
        this.x = other.x;
        this.y = other.y;
    };
    Point.prototype.distanceTo = function (other) {
        return Math.sqrt(
            Math.pow(Math.abs(other.x - this.x), 2) +
            Math.pow(Math.abs(other.y - this.y), 2)
        );
    };
    Point.prototype.collides = function (other) {
        return this.distanceTo(other) <= targetMultiplier * radius;
    };

    function Connection(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
    Connection.prototype.draw = function (color) {
        ctx.strokeStyle = (
            color ||
            (this.contains(focused) ? 'blue' : 'black')
        );
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.stroke();
    };
    Connection.prototype.equals = function (other) {
        return (
            (Object.is(other.p1, this.p1) && Object.is(other.p2, this.p2)) ||
            (Object.is(other.p1, this.p2) && Object.is(other.p2, this.p1))
        );
    };
    Connection.prototype.contains = function (point) {
        return Object.is(point, this.p1) || Object.is(point, this.p2);
    };

    function remove(array, object) {
        array.splice(array.findIndex(function (o) {
            return Object.is(o, object);
        }), 1);
    }

    function contains(array, object) {
        if (array === undefined) {
            return false;
        }
        return array.some(function (o) {
            return Object.is(o, object);
        });
    }

    function drawAll() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (focused !== undefined) {
            ctx.strokeStyle = ctx.fillStyle = 'black';
            ctx.strokeRect(10, 10, 100, 70);
            ctx.fillText('Point ' + points.findIndex(function (point) {
                return Object.is(point, focused);
            }), 20, 25, 80);
            ctx.fillText(
                focused.x + ', ' + focused.y,
                20,
                45,
                80
            );
            ctx.fillText(connections.reduce(
                function (accum, connection) {
                    if (connection.contains(focused)) {
                        return accum + 1;
                    }
                    return accum;
                },
                0
            ) + ' neighbors', 20, 65, 80);
        }
        connections.forEach(function (connection) {
            connection.draw();
        });
        points.forEach(function (point) {
            point.draw();
        });
    }

    function findTarget(point, exclude) {
        var targets = points.filter(function (p) {
            return !contains(exclude, point) && p.collides(point);
        });
        var distances;
        if (targets.length > 0) {
            distances = targets.map(function (target) {
                return point.distanceTo(target);
            });
            return targets[distances.indexOf(
                Math.min.apply(undefined, distances)
            )];
        }
        return undefined;
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawAll();
    }

    if (Array.prototype.find === undefined) {
        alert('Use something other than internet explorer. Edge works, as ' +
            'do blink/webkit or gecko based browsers.');
        return;
    }

    canvas.addEventListener('mousedown', function (event) {
        event.preventDefault();

        mouse.down = true;
        mouse.dragged = false;
        mouse.button = event.button;
        mouse.point = new Point(event.clientX, event.clientY);
        mouse.target = findTarget(mouse.point);

        if (mouse.button === 0) {
            if (mouse.target === undefined) {
                mouse.target = focused = mouse.point;
                points.push(mouse.point);
                mouse.point.draw();
            }
        }
    });

    canvas.addEventListener('mousemove', function (event) {
        var point = new Point(event.clientX, event.clientY);
        var connection;

        focused = findTarget(point);
        drawAll();

        if (mouse.down) {
            if (!mouse.dragged) {
                if (point.distanceTo(mouse.point) >= mouse.dragThreshold) {
                    mouse.dragged = true;
                }
            }

            if (mouse.dragged) {
                if (mouse.button === 0) {
                    mouse.target.copy(point);
                } else if (mouse.button === 2 && mouse.target !== undefined) {
                    connection = new Connection(mouse.target);
                    mouse.target2 = findTarget(point, [mouse.target]);
                    if (mouse.target2 !== undefined) {
                        mouse.connection = connection;
                        connection.p2 = mouse.target2;
                    } else {
                        delete mouse.connection;
                        connection.p2 = point;
                    }
                    connection.draw('red');
                }
            }
        }
    });

    canvas.addEventListener('mouseup', function () {
        var connectionIndex;

        mouse.down = false;

        if (!mouse.dragged) {
            if (mouse.button === 2 && mouse.target !== undefined) {
                remove(points, mouse.target);
                connections.slice().forEach(function (connection) {
                    if (connection.contains(mouse.target)) {
                        remove(connections, connection);
                    }
                });
                focused = undefined;
            }
        } else {
            if (mouse.button === 2 && mouse.connection !== undefined) {
                connectionIndex = connections.findIndex(function (c) {
                    return c.equals(mouse.connection);
                });
                if (connectionIndex === -1) {
                    connections.push(mouse.connection);
                } else {
                    connections.splice(connectionIndex, 1);
                }
                delete mouse.connection;
            }
        }
        drawAll();
    });

    canvas.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });

    resize();
    window.addEventListener('resize', resize);

    ctx.fillStyle = ctx.strokeStyle = 'black';
    ctx.font = '12px sans-serif';
});