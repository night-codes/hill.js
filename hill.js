function getTextWidthDOM(text, font) {
	var span = document.querySelector('#widthchecker');
	if (!span) {
		span = document.createElement('span');
		span.style.cssText = 'position:absolute;left:-3000px;font:' + font + ';float:left;white-space:nowrap;';
		span.setAttribute('id', 'widthchecker');
		document.body.appendChild(span);
	}
	span.textContent = text;
	return {
		width: span.clientWidth,
		height: span.clientHeight,
	};
}
Number.prototype.fix6 = function () {
	return Number(this.toFixed(6));
};

function extend(target) {
	if (!arguments[1]) {
		return target;
	}
	for (var i = 1; i < arguments.length; i++) {
		var source = arguments[i];
		for (var prop in source) {
			if (source.hasOwnProperty(prop)) {
				target[prop] = source[prop];
			}
		}
	}
	return target;
};

// Hill.js
function Hill(canvas, series, options, geometry) {
	var hill = this;
	if (typeof canvas === 'string') {
		canvas = document.querySelector(canvas)
	}
	if (canvas.get && !canvas.getContext) {
		canvas = canvas.get(0);
	}
	if (!canvas || !canvas.getContext) {
		throw "Canvas not found!";
	}
	if (!Array.isArray(series)) {
		throw "Series must be array!";
	}
	this.canvas = canvas;
	this.pixelRatio = window && window.devicePixelRatio || 1;
	this.ctx = canvas.getContext("2d");
	this.series = series;
	this.drawSeries = [];
	this.options = extend({
		type: 'line', // 'line', 'column', 'bar', 'candlestick', 'columnrange', 'columnbar'
		YAxisMinSize: 60,
		XAxisMinStep: 1,
		XAxisMinSize: 80,
		drawYAxis: true,
		drawXAxis: true,
		from: 0,
		to: 0,
		lineWidth: 1,
		dotInterval: 1,
		gridFontColor: "#444444", // цвет подписей сетки
		gridColor: "#999999", // цвет сетки
		strokeStyle: "#eeeeee", // стиль обводки
		fillStyle: "#ffffff", // стиль заливки
		indentTop: 40,
		indentBottom: 40,
		infoX: function (n) {
			return n
		},
		infoY: function (n) {
			return Number(n.toFixed(4))
		},
		ft: {
			f: 0.3,
			t: 0.5
		}
	}, options);
	this.geometry = extend({
		x: 0,
		y: 0,
		width: this.canvas.clientWidth,
		height: this.canvas.clientHeight,
	}, geometry);
	this.buffer = document.createElement('canvas');
	this.buffer.ctx = this.buffer.getContext('2d');
	this.lastSizes = {
		height: 0,
		width: 0
	}
	this.hht = 1;
	this.center = (this.geometry.height - 30) / 2;

	// функция рассчета точки по индексу данных
	this.getX = function (lineIdx, i) {
		return 0;
	}

	// функция рассчета точки по индексу данных с округлением по Round
	this.getXRound = function (lineIdx, i) {
		return 0;
	}

	// функция рассчета индекса данных по точке (обратная getX() )
	this.setX = function (lineIdx, i) {
		return 0;
	}

	// функция смещения координаты по сетке
	this.roundX = function (lineIdx, x) {
		var line = hill.drawSeries[lineIdx];
		return hill.getXRound(lineIdx, hill.setX(lineIdx, x));
	}

	// Получить значения точки по координате
	hill.getEl = function (lineIdx, x) {
		var line = hill.drawSeries[lineIdx];
		var dataIdx = hill.setX(lineIdx, x);
		var realX = hill.getXRound(lineIdx, dataIdx);
		return {
			"el": hill.drawSeries[lineIdx].data[realX] || null,
			"real-x": realX,
			"x": x,
			"dataIdx": dataIdx,
		};
	}

	// подгонка буфера под геометрию графика
	this.resizeCanvas = function () {
		hill.ctx.canvas.width = hill.canvas.clientWidth * hill.pixelRatio;
		hill.ctx.canvas.height = hill.canvas.clientHeight * hill.pixelRatio;
		if (hill.pixelRatio !== 1) {
			hill.ctx.scale(hill.pixelRatio, hill.pixelRatio);
		}
	}

	// подгонка буфера под геометрию графика
	this.resizeBuffer = function () {
		if (hill.lastSizes.width != hill.geometry.width || hill.lastSizes.height != hill.geometry.height) {
			hill.buffer.width = hill.geometry.width * hill.pixelRatio;
			hill.buffer.height = hill.geometry.height * hill.pixelRatio;
			if (hill.pixelRatio !== 1) {
				hill.buffer.ctx.scale(hill.pixelRatio, hill.pixelRatio);
			}
			hill.lastSizes.width = hill.geometry.width;
			hill.lastSizes.height = hill.geometry.height;
		}
		hill.buffer.ctx.lineWidth = hill.options.lineWidth;
	}

	// нормализация данных для построения
	this.updateData = function () {
		var series = [];
		var opt = hill.options;
		hill.max = -Math.pow(10, 100);
		hill.min = Math.pow(10, 100);
		hill.series.forEach(function (lineIn, i) {
			var line = extend({
				type: 'line',
				fillEmpty: false,
				allowZero: true,
				strokeStyle: "#2B4D8C",
				fillStyle: null,
				strokeStyle2: "#7C272A",
				fillStyle2: null,
				strokeStyle3: "#4B4B4B",
				fillStyle3: null,
				dotInterval: opt.dotInterval,
				type: opt.type,
			}, lineIn, {
				data: []
			})

			if (typeof line.lineWidth !== 'number') {
				line.lineWidth = opt.lineWidth;
			}
			if (typeof line.ft === 'undefined') {
				line.ft = opt.ft;
			}
			if (typeof line.dotInterval !== 'number') {
				line.dotInterval = line.lineWidth;
			}
			if (line.type === 'column' || line.type === 'columnbar' || line.type === 'columnrange') {
				line.dotInterval = Math.max(line.dotInterval, 6);
			} else if (line.type === 'candlestick' || line.type === 'bar') {
				line.dotInterval = Math.max(line.dotInterval, 13);
			}
			line.dotInterval = Math.round(line.dotInterval)

			for (var k in lineIn.data) {
				var point = lineIn.data[k];
				if (k >= opt.from - 1 - line.dotInterval && k <= opt.to + 1 + line.dotInterval) {
					if (typeof point === 'number') {
						point = {
							max: point,
							min: point,
							actual: point,
						}
					} else if (Array.isArray(point)) {
						if (point.length === 1) {
							point = {
								max: point[0],
								min: point[0],
								actual: point[0],
							}
						} else {
							point = {
								max: Math.max.apply(null, point),
								min: Math.min.apply(null, point),
								actual: point[point.length - 1]
							}
						}
					}
					if (line.allowZero || point.actual != 0) {
						if (line.type === 'column' || line.type === 'line') {
							hill.max = Math.max(point.actual, hill.max);
							hill.min = Math.min(point.actual, hill.min);
						} else {
							hill.max = Math.max(point.max, hill.max);
							hill.min = Math.min(point.min, hill.min);
						}
						line.data[k] = point;
					}
				}
			}
			line.step = (opt.to - opt.from) / Math.round(hill.geometry.width / line.dotInterval);
			line.roundedFrom = Math.ceil(opt.from - opt.from % line.step);
			line.drawbias = (line.roundedFrom - opt.from) / line.step;
			line.bias = line.roundedFrom / line.step;
			series.push(line);
		});

		hill.hht = (hill.geometry.height - hill.options.indentTop - hill.options.indentBottom) / (hill.max - hill.min);
		hill.center = (hill.geometry.height - hill.options.indentBottom) + hill.hht * hill.min;

		hill.getX = function (lineIdx, i) {
			var line = series[lineIdx];
			return ((Math.ceil((i / line.step)) - line.bias + line.drawbias) * line.dotInterval).fix6();
		}
		hill.getXRound = function (lineIdx, i) {
			var line = series[lineIdx];
			return ((Math.round((i / line.step)) - line.bias + line.drawbias) * line.dotInterval).fix6();
		}
		hill.setX = function (lineIdx, x) {
			var line = series[lineIdx];
			return Math.round((x / line.dotInterval + line.bias - line.drawbias) * line.step);
		}

		if (typeof hill.options.afterNormalize === 'function') {
			hill.options.afterNormalize();
		}
		hill.drawSeries = [];
		series.forEach(function (line, lineIdx) {
			var lastActual = null;
			var opt = hill.options;
			var points = line.data;
			var els = {};

			for (var i = line.roundedFrom - 1; i <= opt.to; i++) {
				var elIndex = hill.getX(lineIdx, i);

				if (typeof points[i] !== 'undefined' && (points[i].actual !== 0 || line.allowZero)) {
					if (!els[elIndex]) {
						els[elIndex] = {
							actual: points[i].actual.fix6(),
							max: Math.max(points[i].max, points[i].actual),
							min: Math.min(points[i].min, points[i].actual),
							open: (typeof points[i].open === 'number') ? points[i].open : ((typeof lastActual === 'number') ? lastActual : points[i].actual)
						}
					} else {
						els[elIndex] = {
							actual: points[i].actual.fix6(),
							max: Math.max(els[elIndex].max, points[i].max, points[i].actual),
							min: Math.min(els[elIndex].min, points[i].min, points[i].actual),
							open: (typeof els[elIndex].open === 'number') ? els[elIndex].open : ((typeof lastActual === 'number') ? lastActual : els[elIndex].actual)
						}
					}
					els[elIndex].max = Math.max(els[elIndex].max, els[elIndex].open).fix6();
					els[elIndex].min = Math.min(els[elIndex].min, els[elIndex].open).fix6();
					lastActual = points[i].actual.fix6()
				} else {
					if (!els[elIndex] && !line.fillEmpty) {
						els[elIndex] = null;
					}
					lastActual = null;
				}

			}

			var ln = {};
			for (key in line) {
				ln[key] = line[key];
			}
			ln.data = els;
			hill.drawSeries.push(ln);
		})
	}; // this.updateData

	// отрисовка графика по нормализованным данным
	this.draw = function () {
		var ctx = hill.buffer.ctx;
		hill.resizeBuffer();
		ctx.fillStyle = hill.options.fillStyle;
		ctx.fillRect(0, 0, hill.geometry.width, hill.geometry.height);
		ctx.fill();

		if (hill.options.drawYAxis) hill.drawYAxis()
		if (hill.options.drawXAxis) hill.drawXAxis()
			// рисуем график
		hill.drawSeries.forEach(function (line) {
			window.hilldraws[line.type](hill, line);
		});
		hill.ctx.drawImage(hill.buffer, hill.geometry.x, hill.geometry.y, hill.geometry.width, hill.geometry.height);


		// рисуем рамку, если задан стиль рамки
		if (hill.options.strokeStyle) {
			hill.ctx.strokeStyle = hill.options.strokeStyle;
			hill.ctx.strokeRect(hill.geometry.x, hill.geometry.y, hill.geometry.width, hill.geometry.height);
		}
	}; // this.draw

	this.redraw = function () {
		if (typeof hill.options.beforeUpdate === 'function') {
			hill.options.beforeUpdate();
		}
		hill.updateData();
		if (typeof hill.options.afterUpdate === 'function') {
			hill.options.afterUpdate();
		}
		hill.draw();
		if (typeof hill.options.afterDraw === 'function') {
			hill.options.afterDraw();
		}
	};

	this.getY = function (y) {
		return Math.round(hill.center - y * hill.hht);
	}
	this.setY = function (y) {
		return (hill.center - y) / hill.hht;
	}

	// отрисовка сетки Y
	this.drawYAxis = function () {
		var ctx = hill.buffer.ctx;
		var opt = hill.options;
		var minSize = opt.YAxisMinSize;
		var gridSize = 0.00005;

		ctx.font = "bold 10px 'Open Sans', sans-serif";
		ctx.textBaseline = "middle";
		ctx.textAlign = "end";

		for (i = 0; i < 100; i++) {
			gridSize = Number((Math.pow(10, i) / 100000).toFixed(6));
			if (gridSize * hill.hht >= minSize) break;
			gridSize *= 2;
			if (gridSize * hill.hht >= minSize) break;
			gridSize *= 1.25;
			if (gridSize * hill.hht >= minSize) break;
			gridSize *= 2;
			if (gridSize * hill.hht >= minSize) break;
			gridSize *= 1.25;
			if (gridSize * hill.hht >= minSize) break;
		}

		var gridMin = hill.min - (hill.min % gridSize) - gridSize;
		var gridMax = hill.max + gridSize;

		for (var j = gridMin; j <= gridMax; j += gridSize) {
			if (j >= hill.min + 10 / hill.hht && j <= hill.max - 10 / hill.hht) {
				var label = opt.infoY(j);
				var labelWIdth = getTextWidthDOM(label, ctx.font).width;
				ctx.lineWidth = 1;
				ctx.fillStyle = opt.gridFontColor;
				ctx.fillText(label, hill.geometry.width - 10, hill.getY(j));
				ctx.fillStyle = opt.gridColor;
				ctx.fillRect(0, hill.getY(j) - 1, hill.geometry.width - labelWIdth - 20, 1);
			}
		}
	}; // this.draw

	// отрисовка сетки X
	this.drawXAxis = function () {

		var ctx = hill.buffer.ctx;
		ctx.font = "bold 10px 'Open Sans', sans-serif";
		ctx.textBaseline = "middle";
		ctx.textAlign = "end";

		var opt = hill.options;
		var step = hill.geometry.width / (opt.to - opt.from);
		var gridSize = step * opt.XAxisMinStep;
		while (gridSize < opt.XAxisMinSize) {
			gridSize *= 2;
		}

		var offset = opt.from * step % gridSize;

		for (var j = -offset; j <= hill.geometry.width - 20; j += gridSize) {
			var label = opt.infoX(hill.setX(0, j));
			var labelSize = getTextWidthDOM(label, ctx.font);
			ctx.lineWidth = 1;
			ctx.fillStyle = opt.gridFontColor;
			ctx.fillText(label, j + labelSize.width / 2 - 1, hill.geometry.height - 10);
			ctx.fillStyle = opt.gridColor;
			ctx.fillRect(j - 1, 0, 1, hill.geometry.height - labelSize.height - 20);
		}
	}; // this.draw

	this.resizeCanvas();
}


function gradient(a, b) {
	return (b.y - a.y) / (b.x - a.x);
}

window.hilldraws = {}
window.hilldraws.line = function (hill, line) {
	var ctx = hill.buffer.ctx;
	if (line.fillStyle) {
		ctx.fillStyle = line.fillStyle;
		if (line.fillStyle2) {
			var bg = ctx.createLinearGradient(0, 0, 0, hill.geometry.height * 1.4);
			bg.addColorStop(0, line.fillStyle);
			bg.addColorStop(1, line.fillStyle2);
			ctx.fillStyle = bg;
		}
	}

	ctx.strokeStyle = line.strokeStyle;
	ctx.lineWidth = line.lineWidth;

	var points = line.data;
	var indexes = Object.keys(line.data).map(function (el) {
		return Number(el);
	}).sort(function (a, b) {
		return a - b;
	});

	var m = 0;
	var dx1 = 0;
	var dy1 = 0;
	var closed = true;
	var startX = 0; //0;

	var preP = {
		x: 0,
		y: hill.geometry.height
	};


	function openPath(ctx, startP) {
		if (closed) {
			ctx.beginPath();
			ctx.moveTo(startP.x, hill.getY(startP.y));
			preP = startP;
			startX = startP.x;
			closed = false;
		}
	}

	function closePath(ctx) {
		if (!closed) {
			ctx.stroke();
			ctx.lineTo(preP.x, hill.getY(preP.y));
			ctx.lineTo(preP.x, hill.geometry.height);
			ctx.lineTo(startX, hill.geometry.height);
			ctx.closePath();
			ctx.fill();
			closed = true;
		}
	}

	indexes.forEach(function (i, j) {
		if (points[i]) {
			var curP = {
				x: i,
				y: Number(points[i].actual)
			};
			openPath(ctx, curP);

			if (indexes[j + 1] && points[indexes[j + 1]]) {
				nexP = {
					x: indexes[j + 1],
					y: Number(points[indexes[j + 1]].actual)
				};
				m = gradient(preP, nexP);
				dx2 = (nexP.x - curP.x) * -line.ft.f;
				dy2 = dx2 * m * line.ft.t;
			} else {
				dx2 = 0;
				dy2 = 0;
			}
			if (curP.x < 0) {
				ctx.moveTo(curP.x, hill.getY(curP.y));
			}
			ctx.bezierCurveTo(
				preP.x - dx1,
				hill.getY((preP.y - dy1)),
				curP.x + dx2,
				hill.getY((curP.y + dy2)),
				curP.x,
				hill.getY(curP.y)
			);

			dx1 = dx2;
			dy1 = dy2;
			preP = curP;
		} else if (points[i] === null) {
			closePath(ctx, preP)
		}
	});
	closePath(ctx, preP)
}

window.hilldraws.column = function (hill, line) {
	var ctx = hill.buffer.ctx;
	ctx.fillStyle = line.fillStyle || line.strokeStyle;

	var points = line.data;
	var indexes = Object.keys(line.data).map(function (el) {
		return Number(el);
	}).sort(function (a, b) {
		return a - b;
	});

	var width;
	var prev;
	indexes.forEach(function (current, j) {
		if (points[current] !== null && prev) {
			width = current - prev;
			var rect = [current - (width / 2) + 1.2, hill.getY(Number(points[current].actual)), width - 2.4, hill.getY(hill.min) - hill.getY(Number(points[current].actual))];
			ctx.fillRect.apply(ctx, rect);
			if (line.strokeStyle) {
				ctx.lineWidth = 1;
				ctx.strokeStyle = line.strokeStyle;
				ctx.strokeRect.apply(ctx, rect);
			}
		}
		prev = current;
	});
}

window.hilldraws.columnrange = function (hill, line) {
	var ctx = hill.buffer.ctx;
	ctx.fillStyle = line.fillStyle || line.strokeStyle;

	var points = line.data;
	var indexes = Object.keys(line.data).map(function (el) {
		return Number(el);
	}).sort(function (a, b) {
		return a - b;
	});

	var width;
	var prev;
	indexes.forEach(function (current, j) {
		if (points[current] !== null && prev) {
			width = current - prev;
			var height = Math.max(Math.abs(hill.getY(points[current].max) - hill.getY(points[current].min)), 1);
			var rect = [current - (width / 2) + 1.2, hill.getY(points[current].max), width - 2.4, height, 1];
			ctx.fillRect.apply(ctx, rect);
			if (line.strokeStyle) {
				ctx.lineWidth = 1;
				ctx.strokeStyle = line.strokeStyle;
				ctx.strokeRect.apply(ctx, rect);
			}
		}
		prev = current;
	});
}

window.hilldraws.columnbar = function (hill, line) {
	var ctx = hill.buffer.ctx;

	var points = line.data;
	var indexes = Object.keys(line.data).map(function (el) {
		return Number(el);
	}).sort(function (a, b) {
		return a - b;
	});

	var width;
	var prev;
	indexes.forEach(function (current, j) {
		ctx.fillStyle = line.fillStyle || line.strokeStyle;
		if (points[current] !== null && prev) {
			width = current - prev;
			var top = hill.getY(Math.max(points[current].open, points[current].actual));
			var height = Math.max(Math.abs(hill.getY(points[current].open) - hill.getY(points[current].actual)), 1);
			if (points[current].open > points[current].actual) {
				ctx.fillStyle = line.fillStyle2 || line.strokeStyle2;
			}

			var rect = [current - (width / 2) + 1.2, top, width - 2.4, height, 1];
			ctx.fillRect.apply(ctx, rect);
			if (line.strokeStyle) {
				ctx.lineWidth = 1;
				ctx.strokeStyle = line.strokeStyle;
				if (points[current].open > points[current].actual) {
					ctx.strokeStyle = line.strokeStyle2 || line.strokeStyle;
				}
				ctx.strokeRect.apply(ctx, rect);
			}
		}
		prev = current;
	});
}


window.hilldraws.candlestick = function (hill, line) {
	var ctx = hill.buffer.ctx;
	ctx.fillStyle = line.fillStyle || line.strokeStyle;

	var points = line.data;
	var indexes = Object.keys(line.data).map(function (el) {
		return Number(el);
	}).sort(function (a, b) {
		return a - b;
	});

	var width;
	var prev;
	indexes.forEach(function (current, j) {
		var pc = points[current];
		if (pc !== null && prev) {
			width = current - prev;
			var top = hill.getY(Math.max(pc.open, pc.actual));
			var height = Math.max(Math.abs(hill.getY(pc.open) - hill.getY(pc.actual)), 1);
			if (pc.open > pc.actual) {
				ctx.fillStyle = line.fillStyle2 || line.strokeStyle2;
			} else if (pc.open < pc.actual) {
				ctx.fillStyle = line.fillStyle || line.strokeStyle;
			}
			var top2 = hill.getY(Math.max(pc.max, pc.min));
			var height2 = Math.max(Math.abs(hill.getY(pc.max) - hill.getY(pc.min)), 1);

			var bigWidth = Math.round(width * 0.65);
			var smallWidth = Math.round(width * 0.05);
			ctx.fillRect(current - bigWidth / 2, top, bigWidth, height, 1);
			ctx.fillRect(current - smallWidth / 2, top2, smallWidth, height2, 1);
		}
		prev = current;
	});
}

window.hilldraws.bar = function (hill, line) {
	var ctx = hill.buffer.ctx;
	ctx.fillStyle = line.fillStyle || line.strokeStyle;

	var points = line.data;
	var indexes = Object.keys(line.data).map(function (el) {
		return Number(el);
	}).sort(function (a, b) {
		return a - b;
	});


	var width;
	var prev;
	indexes.forEach(function (current, j) {
		var pc = points[current];
		if (pc !== null && prev) {
			width = current - prev;
			if (pc.open > pc.actual) {
				ctx.fillStyle = line.fillStyle2 || line.strokeStyle2;
			} else if (pc.open < pc.actual) {
				ctx.fillStyle = line.fillStyle || line.strokeStyle;
			}

			var height = Math.max(Math.abs(hill.getY(pc.max) - hill.getY(pc.min)), 1);

			var bigWidth = Math.max(6, Math.round(width * 0.4));
			var smallWidth = Math.min(3, Math.round(width * 0.13));
			ctx.fillRect(current - bigWidth + smallWidth / 2, hill.getY(pc.open) - 0.8, bigWidth, 1.6, 1);
			ctx.fillRect(current - smallWidth / 2, hill.getY(pc.actual) - 0.8, bigWidth, 1.6, 1);
			ctx.fillRect(current - smallWidth / 2, hill.getY(pc.max), smallWidth, height, 1);
		}
		prev = current;
	});
}
