(function (exports) {
	// setImmediate
	function setImmediate(callback) {
		function onmessage() {
			callback();

			window.removeEventListener('message', onmessage);
		}

		window.addEventListener('message', onmessage);

		window.postMessage('*', '*');
	}

	// constructor
	function constructor(self) {
		// create elements
		var block = document.createElement('span');
		var plain = document.createElement('span');
		var caret = document.createElement('span');
		var style = document.createElement('span');
		var input = document.createElement('textarea');
		var output = document.createElement('span');

		// configure input
		input.setAttribute('wrap', 'off');
		input.setAttribute('spellcheck', 'false');

		// configure classnames
		block.className  = 'dacoda-block';
		style.className  = 'dacoda-style';
		plain.className  = 'dacoda-plain';
		input.className  = 'dacoda-input';
		caret.className  = 'dacoda-caret';
		output.className = 'dacoda-output';

		if (/iP(ad|hone);/.test(navigator.userAgent)) block.className += ' -ios';

		// elements
		var element = self.element = {
			block:  block,
			plain:  block.appendChild(plain),
				before: plain.appendChild(document.createTextNode('')),
				caret:  plain.appendChild(caret),
				after:  plain.appendChild(document.createTextNode('')),
			style:  block.appendChild(style),
				styleText: style.appendChild(document.createTextNode('')),
			input:  block.appendChild(input),
			output: block.appendChild(output),
				outputText: output.appendChild(document.createTextNode(''))
		};

		// values
		var current = self.current = {
			start: 0,
			end: 0,
			direction: 'none',
			value: '',
			timeout: 0
		};

		// states
		var is = self.is = {
			focused: false,
			active: false,
			keydown: false,
			pointerdown: false
		};

		// observables
		var observables = self.observables = {};

		// dispatchables
		var dispatchables = self.dispatchables = {
			// input events
			// ============
			input: function (event) {
				// set input
				element.outputText.nodeValue = element.styleText.nodeValue = current.value = input.value;

				onselection();

				callobservable('input', event);
			},
			focus: function (event) {
				if (!is.focused) {
					is.focused = true;

					caret.className += ' is-focused';
				}

				callobservable('focus', event);
			},
			blur: function (event) {
				if (is.focused) {
					is.focused = false;

					caret.className = caret.className.replace(' is-focused', '');
				}

				callobservable('blur', event);
			},
			scroll: function (event) {
				// match scroll position
				plain.scrollTop = style.scrollTop = input.scrollTop;
				plain.scrollLeft = style.scrollLeft = input.scrollLeft;

				callobservable('scroll', event);
			},
			// keyboard events
			// ===============
			keydown: function (event) {
				setImmediate(onafterkeydown);

				if (!is.keydown) {
					is.keydown = true;

					document.addEventListener('keyup', dispatchables.keyup);
				}

				callobservable('keydown', event);
			},
			keyup: function (event) {
				if (is.keydown) {
					is.keydown = false;

					document.removeEventListener('keyup', dispatchables.keyup);
				}

				callobservable('keyup', event);
			},
			// pointer events
			// ==============
			pointerdown: function (event) {
				setImmediate(onafterkeydown);

				if (!is.pointerdown) {
					is.pointerdown = true;

					window.addEventListener('mousemove', onafterkeydown);
					window.addEventListener('mouseup', dispatchables.pointerup);
				}

				callobservable('pointerdown', event);
			},
			pointerup: function (event) {
				onafterkeydown();

				if (is.pointerdown) {
					is.pointerdown = false;

					window.removeEventListener('mousemove', onafterkeydown);
					window.removeEventListener('onmouseup', dispatchables.pointerup);
				}

				callobservable('pointerup', event);
			}
		};

		function onafterkeydown() {
			if (
				is.start === input.selectionStart &&
				is.end === input.selectionEnd &&
				is.direction === input.selectionDirection
			) deactivate();
			else onselection();
		}

		function onselection() {
			// update current values
			current.start = input.selectionStart;
			current.end = input.selectionEnd;
			current.direction = input.selectionDirection;

			var index = current.direction === 'backward' ? current.start : current.end;

			// update before/after content
			element.before.nodeValue = current.value.slice(0, index);
			element.after.nodeValue  = current.value.slice(index);

			// activate caret
			activate();

			// deactivate caret after delay
			clearTimeout(current.timeout);

			current.timeout = setTimeout(deactivate, 500);
		}

		function callobservable(type, event) {
			if (observables[type]) {
				observables[type].forEach(function (observable) {
					observable.call(self, event);
				});
			}
		}

		function activate() {
			if (!is.active) {
				caret.className += ' is-active';

				is.active = true;
			}
		}

		function deactivate() {
			if (is.active) {
				caret.className = caret.className.replace(' is-active', '');

				is.active = false;
			}
		}

		var alias = {
			'pointerdown': 'mousedown',
			'pointerup': 'mouseup'
		};

		// bind each dispatchable to input
		for (var type in dispatchables) {
			input.addEventListener(alias[type] || type, dispatchables[type]);
		}
	}

	function observe(type) {
		var observables = this.observables;
		var thenable = {};

		thenable.then = function (onresolve) {
			(observables[type] = observables[type] || []).push(onresolve);

			return thenable;
		};

		return thenable;
	}

	function dispatch(type, event) {
		var dispatchable = this.dispatchables[type];

		if (dispatchable) dispatchable.call(this, event);
	}

	// Dacoda
	function Dacoda() { constructor(this); }

	Dacoda.prototype.observe  = observe;
	Dacoda.prototype.dispatch = dispatch;

	exports.Dacoda = Dacoda;
})(typeof exports === 'object' && exports || this);
