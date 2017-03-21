document.addEventListener('DOMContentLoaded', function () {
    "use strict";
    var canvas = document.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var radius = 5;
    var targetMultiplier = 1.5;
    var points = [];
    var connections = [];
    var mouse = {
        dragged: false,
        dragThreshold: 3,
        button: undefined,
        point: undefined,
        target: false,
        target2: undefined,
        connection: undefined
    };

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.draw = function (color) {
        ctx.strokeStyle = color || 'black';
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
        ctx.strokeStyle = color || 'black';
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

    function drag(event) {
        var point = new Point(event.clientX, event.clientY);
        var connection;

        if (!mouse.dragged) {
            if (point.distanceTo(mouse.point) >= mouse.dragThreshold) {
                mouse.dragged = true;
            }
        }

        if (mouse.dragged) {
            if (mouse.button === 0) {
                mouse.target.copy(point);
                drawAll();
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
                drawAll();
                connection.draw('red');
            }
        }
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawAll();
    }

    if (Array.prototype.find === undefined) {
        alert('Use something other than internet explorer. Edge works, as do blink/webkit or gecko based browsers.');
        return;
    }

    ctx.fillStyle = 'black';

    canvas.addEventListener('mousedown', function (event) {
        event.preventDefault();

        canvas.addEventListener('mousemove', drag);

        mouse.dragged = false;
        mouse.button = event.button;
        mouse.point = new Point(event.clientX, event.clientY);
        mouse.target = findTarget(mouse.point);

        if (mouse.button === 0) {
            if (mouse.target === undefined) {
                mouse.target = mouse.point;
                points.push(mouse.point);
                mouse.point.draw();
            }
        }
    });

    canvas.addEventListener('mouseup', function () {
        var connectionIndex;
        canvas.removeEventListener('mousemove', drag);
        if (!mouse.dragged) {
            if (mouse.button === 2 && mouse.target !== undefined) {
                remove(points, mouse.target);
                connections.slice().forEach(function (connection) {
                    if (connection.contains(mouse.target)) {
                        remove(connections, connection);
                    }
                });
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
});