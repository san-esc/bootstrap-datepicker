/* 
 * bootstrap datepicker
 *
 * Licensed under the Apache License v2.0 (https://www.apache.org/licenses/LICENSE-2.0)
 */
 
(function(global) {
	function createElementFromHtml(html) {
		let template = document.createElement('template');
		template.innerHTML = html;

		return template.content;
	}

	function isLeapYear(year) {
		return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
	}

	function getDaysInMonth(year, month) {
		return [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
	}

	function parseDateFormat(format) {
		let separator = format.match(/[.\/\-\s].*?/),
			parts = format.split(/\W+/);
		if (!separator || !parts || parts.length === 0){
			throw new Error("Invalid date format.");
		}
		return {separator: separator, parts: parts};
	}
	
	function parseTimeFormat(format) {
		let separator = ':',
			parts = format.split(/:/);
		if (!parts || parts.length === 0){
			throw new Error("Invalid time format.");
		}
		return {separator: separator, parts: parts};
	}

	function parseDateTime(dateStr, dateFormat, timeFormat, separator) {
		let dateParts, 
			timeParts,
			date = new Date(),
			val;

		if (timeFormat) {
			let parts = dateStr.split(separator);

			dateParts = parts[0].split(dateFormat.separator);

			if (parts.length > 1) {
				timeParts = parts[1].split(timeFormat.separator);
			}
		} else {
			dateParts = dateStr.split(dateFormat.separator);
		}		

		date.setMilliseconds(0);
		if (dateParts.length === dateFormat.parts.length) {
			let year = date.getFullYear(), day = date.getDate(), month = date.getMonth();
			for (let i=0, cnt = dateFormat.parts.length; i < cnt; i++) {
				val = parseInt(dateParts[i], 10)||1;
				switch(dateFormat.parts[i]) {
					case 'dd':
					case 'd':
						day = val;
						date.setDate(val);
						break;
					case 'mm':
					case 'm':
						month = val - 1;
						date.setMonth(val - 1);
						break;
					case 'yy':
						year = 2000 + val;
						date.setFullYear(2000 + val);
						break;
					case 'yyyy':
						year = val;
						date.setFullYear(val);
						break;
				}
			}
			date = new Date(year, month, day, 0 ,0 ,0);
		}

		if (timeFormat && timeParts) {
			if (timeParts.length === timeFormat.parts.length) {
				for (let i=0, cnt = timeFormat.parts.length; i < cnt; i++) {
					val = parseInt(timeParts[i], 10)||1;
					switch(timeFormat.parts[i]) {
						case 'HH':
						case 'H':
							date.setHours(val);
							break;
						case 'mm':
						case 'm':
							date.setMinutes(val);
							break;
						case 's':
						case 'ss':
							date.setSeconds(val);
							break;
					}
				}
			}
		} else {
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
		}

		return date;
	}
	
	function formatDate(date, format) {
		let val = {
			d: date.getDate(),
			m: date.getMonth() + 1,
			yy: date.getFullYear().toString().substring(2),
			yyyy: date.getFullYear()
		};
		val.dd = (val.d < 10 ? '0' : '') + val.d;
		val.mm = (val.m < 10 ? '0' : '') + val.m;
		let parts = [];
		for (let i=0, cnt = format.parts.length; i < cnt; i++) {
			parts.push(val[format.parts[i]]);
		}
		return parts.join(format.separator);
	}

	function formatTime(date, format) {
		let val = {
			H: date.getHours(),
			m: date.getMinutes(),
			s: date.getSeconds()
		};

		val.HH = (val.H < 10 ? '0' : '') + val.H;
		val.mm = (val.m < 10 ? '0' : '') + val.m;
		val.ss = (val.s < 10 ? '0' : '') + val.s;

		let parts = [];
		for (let i=0, cnt = format.parts.length; i < cnt; i++) {
			parts.push(val[format.parts[i]]);
		}
		return parts.join(format.separator);
	}

	const modes = [
		{
			clsName: 'days',
			navFnc: 'Month',
			navStep: 1
		},
		{
			clsName: 'months',
			navFnc: 'FullYear',
			navStep: 1
		},
		{
			clsName: 'years',
			navFnc: 'FullYear',
			navStep: 10
	}];

	const headTemplate =
		 '<thead>'+
			'<tr>'+
				'<th class="prev"></th>'+
				'<th colspan="5" class="switch"></th>'+
				'<th class="next"></th>'+
			'</tr>'+
		'</thead>';
	
	const contTemplate = '<tbody><tr><td colspan="7"></td></tr></tbody>';

	const timeTemplate =
		'<div class="datepicker-time">' +
			'<dl>' +
				'<dt class="hours"></dt>' + 
				'<dd><input type="range" max="23" class="datepicker-slider hours" /></dd>' +
				'<dt class="minutes"></dt>' + 
				'<dd><input type="range" max="59" class="datepicker-slider minutes" /></dd>' +
				'<dt class="seconds"></dt>' + 
				'<dd><input type="range" max="59" class="datepicker-slider seconds" /></dd>' +
			'</dt>' +
		'</div>';

	const buttonsTemplate =
		 '<div class="datepicker-buttonpane">' +
			'<button class="datepicker-button btn now"></button>' +
			'<button class="datepicker-button btn done"></button>' +
		'</div>';
	
	const pickerTemplate = 
		'<div class="datepicker dropdown-menu">'+
			'<div class="datepicker-days">'+
				'<table class=" table-condensed">'+
					headTemplate+
					'<tbody></tbody>'+
				'</table>'+
			'</div>'+
			'<div class="datepicker-months">'+
				'<table class="table-condensed">'+
					headTemplate+
					contTemplate+
				'</table>'+
			'</div>'+
			'<div class="datepicker-years">'+
				'<table class="table-condensed">'+
					headTemplate+
					contTemplate+
				'</table>'+
			'</div>'+
		'</div>';

	class Datepicker {
		constructor(element, options) {
			let defaults = Datepicker.defaults;
			options = options || {}

			this.element = element;
			
			this.format = parseDateFormat(
				element.dataset.dateFormat || options.dateFormat || defaults.dateFormat);
			this.timeFormat = options.showTime && parseTimeFormat(
				element.dataset.timeFormat || options.timeFormat || defaults.timeFormat);

			this.language = Datepicker.languages[options.language || defaults.language];

			this.isInput = this.element.nodeName.toLowerCase() === 'input';
			this.component = this.element.classList.contains('date') 
				? this.element.querySelector('.add-on')
				: false;
			
			if (this.isInput) {
				this.element.addEventListener('focus', this.show.bind(this));
				this.element.addEventListener('keyup', this.update.bind(this));
			} else {
				if (this.component){
					this.component.addEventListener('click', this.show.bind(this));
				} else {
					this.element.addEventListener('click', this.show.bind(this));
				}
			}
		
			this.minViewMode = options.minViewMode || 0;
			if (typeof this.minViewMode === 'string') {
				switch (this.minViewMode) {
					case 'months':
						this.minViewMode = 1;
						break;
					case 'years':
						this.minViewMode = 2;
						break;
					default:
						this.minViewMode = 0;
						break;
				}
			}
			this.viewMode = options.viewMode || 0;
			if (typeof this.viewMode === 'string') {
				switch (this.viewMode) {
					case 'months':
						this.viewMode = 1;
						break;
					case 'years':
						this.viewMode = 2;
						break;
					default:
						this.viewMode = 0;
						break;
				}
			}
			this.startViewMode = this.viewMode;
			this.weekStart = options.weekStart || 0;
			this.weekEnd = this.weekStart === 0 ? 6 : this.weekStart - 1;
			this.onRender = options.onRender || defaults.onRender;
			this.showTime = options.showTime || defaults.showTime;
			this.showButtons = options.showButtons || defaults.showButtons;
			this.separator = options.separator || defaults.separator;
			this.autoclose = options.autoclose;
		}

		initPicker() {
			this.picker = createElementFromHtml(pickerTemplate).firstElementChild;
			document.body.append(this.picker);

			this.fillDow();
			this.fillMonths();
			
			if (this.showTime) this.fillTime();
			if (this.showButtons) this.fillButtons();
			
			this.picker.addEventListener('click', this.onClick.bind(this));
			this.picker.addEventListener('input', this.onInput.bind(this));

			window.addEventListener('resize', this.place.bind(this));
			
			let self = this;
			document.addEventListener('mousedown', ev => {
				if (ev.target.closest('.datepicker') === null) {				
					self.hide();
				}
			});
		}
			
		show(e) {
			if (!this.picker) {
				this.initPicker();
				this.update();
				this.showMode();
			}

			this.picker.style.display = 'block';
			this.height = this.component ? this.component.offsetHeight : this.element.offsetHeight;
			this.place();
			
			if (e) {
				e.stopPropagation();
				e.preventDefault();
			}
			
			this.element.dispatchEvent(new CustomEvent('show', { 
				detail: { date: this.date } 
			}));
		}
		
		hide() {
			this.picker.style.display = '';
			this.viewMode = this.startViewMode;
			this.showMode();
			
			this.element.dispatchEvent(new CustomEvent('hide', { 
				detail: { date: this.date } 
			}));
		}
		
		set() {
			let formated = formatDate(this.date, this.format);

			if (this.showTime) {
				formated += this.separator + formatTime(this.date, this.timeFormat);
			}

			if (!this.isInput) {
				if (this.component){
					this.element.querySelector('input').value = formated;
				}
				this.element.dataset.date = formated;
			} else {
				this.element.value = formated;
			}
		}
		
		setDate(newDate) {
			if (typeof newDate === 'string') {
				this.date = parseDateTime(newDate, this.format, this.timeFormat, this.separator);
			} else {
				this.date = new Date(newDate);
				this.date.setMilliseconds(0);
			}

			this.viewDate = new Date(this.date);
			this.viewDate.setDate(Math.min(28, this.date.getDay()));
			
			this.fill();
			this.set();
		}

		getDate () {
			return this.date;
		}

		place() {
			let target = this.component ? this.component : this.element;
			let rect = target.getBoundingClientRect();

			this.picker.style.top = rect.top + this.height + 'px';
			this.picker.style.left = rect.left + 'px';
		}
		
		update(newDate) {
			this.date = parseDateTime(
				typeof newDate === 'string' ? newDate : (this.isInput ? this.element.value : this.element.dataset.date),
				this.format,
				this.timeFormat,
				this.separator
			);
			this.viewDate = new Date(this.date);
			this.viewDate.setDate(1);

			this.fill();
		}
		
		fillDow() {
			let dowCnt = this.weekStart;
			let html = '<tr>';
			while (dowCnt < this.weekStart + 7) {
				html += '<th class="dow">'+this.language.daysShort[(dowCnt++)%7]+'</th>';
			}
			html += '</tr>';
			this.picker.querySelector('.datepicker-days thead')
				.append(createElementFromHtml(html));
		}
		
		fillMonths() {
			let html = '';
			let i = 0
			while (i < 12) {
				html += '<span class="month">'+this.language.monthsShort[i++]+'</span>';
			}
			this.picker.querySelector('.datepicker-months td')
				.append(createElementFromHtml(html));
		}

		fillTime() {
			let timePicker = createElementFromHtml(timeTemplate).firstElementChild;

			this.picker.querySelector('.datepicker-days').append(timePicker);

			timePicker.querySelector('dt.hours').textContent = this.language.hours;
			timePicker.querySelector('dt.minutes').textContent = this.language.minutes;
			timePicker.querySelector('dt.seconds').textContent = this.language.seconds;
		}

		fillButtons() {
			let buttonPane = createElementFromHtml(buttonsTemplate).firstElementChild;
			this.picker.querySelector('.datepicker-days').append(buttonPane);

			buttonPane.querySelector('button.now').textContent = this.language.now;
			buttonPane.querySelector('button.done').textContent = this.language.done;
			buttonPane.style.display = 'block';
		}
		
		fill() {
			let d = new Date(this.viewDate),
				year = d.getFullYear(),
				month = d.getMonth(),
				hours = this.date.getHours(),
				minutes = this.date.getMinutes(),
				seconds = this.date.getSeconds(),
				currentDate = this.date.valueOf();

			this.picker.querySelector('.datepicker-days .switch')
				.textContent = this.language.months[month] + ' ' + year;
			
			let prevMonth = new Date(year, month-1, 28, hours, minutes, seconds, 0),
				day = getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
			prevMonth.setDate(day);
			prevMonth.setDate(day - (prevMonth.getDay() - this.weekStart + 7)%7);
			let nextMonth = new Date(prevMonth);
			nextMonth.setDate(nextMonth.getDate() + 42);
			nextMonth = nextMonth.valueOf();
			let html = [];
			let clsName,
				prevY,
				prevM;
			while(prevMonth.valueOf() < nextMonth) {
				if (prevMonth.getDay() === this.weekStart) {
					html.push('<tr>');
				}
				clsName = this.onRender(prevMonth);
				prevY = prevMonth.getFullYear();
				prevM = prevMonth.getMonth();
				if ((prevM < month &&  prevY === year) ||  prevY < year) {
					clsName += ' old';
				} else if ((prevM > month && prevY === year) || prevY > year) {
					clsName += ' new';
				}
				if (prevMonth.valueOf() === currentDate) {
					clsName += ' active';
				}
				html.push('<td class="day '+clsName+'">'+prevMonth.getDate() + '</td>');
				if (prevMonth.getDay() === this.weekEnd) {
					html.push('</tr>');
				}
				prevMonth.setDate(prevMonth.getDate()+1);
			}

			let daysCont = this.picker.querySelector('.datepicker-days tbody');
			daysCont.innerHTML = null;
			daysCont.append(createElementFromHtml(html.join('')));

			let currentYear = this.date.getFullYear();
			
			this.picker.querySelector('.datepicker-months .switch')
				.textContent = year;

			let months = this.picker.querySelector('.datepicker-months')
				.querySelectorAll('span');

			months.forEach(element => element.classList.remove('active'));
				
			if (currentYear === year) {
				months[this.date.getMonth()].classList.add('active');
			}
			
			html = '';
			year = parseInt(year/10, 10) * 10;

			this.picker.querySelector('.datepicker-years .switch')
				.textContent = year + '-' + (year + 9);

			let yearCont = this.picker.querySelector('.datepicker-years')
				.querySelector('td');

			year -= 1;
			for (let i = -1; i < 11; i++) {
				html += '<span class="year'+(i === -1 || i === 10 ? ' old' : '')+(currentYear === year ? ' active' : '')+'">'+year+'</span>';
				year += 1;
			}
			yearCont.innerHTML = null;
			yearCont.append(createElementFromHtml(html));

			if (this.showTime) {
				let sliders = this.picker.querySelectorAll('.datepicker-slider');
				sliders[0].value = this.date.getHours();
				sliders[1].value = this.date.getMinutes();
				sliders[2].value = this.date.getSeconds();
			}
		}
		
		onClick(e) {
			e.stopPropagation();
			e.preventDefault();
			let target = e.target.closest('span, td, th, button');
			if (target !== null) {
				switch(target.nodeName.toLowerCase()) {
					case 'th':
						switch(target.className) {
							case 'switch':
								this.showMode(1);
								break;
							case 'prev':
							case 'next':
								this.viewDate['set'+modes[this.viewMode].navFnc].call(
									this.viewDate,
									this.viewDate['get'+modes[this.viewMode].navFnc].call(this.viewDate) + 
									modes[this.viewMode].navStep * (target.className === 'prev' ? -1 : 1)
								);
								this.fill();
								this.set();
								break;
						}
						break;
					case 'span':
						if (target.classList.contains('month')) {
							let month = Array.prototype.indexOf.call(target.parentNode.children, target);
							this.viewDate.setMonth(month);
						} else {
							let year = parseInt(target.textContent, 10)||0;
							this.viewDate.setFullYear(year);
						}

						if (this.viewMode !== 0 && this.viewMode === this.minViewMode) {
							this.date = new Date(this.viewDate);
							this.element.dispatchEvent(new CustomEvent('changeDate', {
								detail: {
									date: this.date,
									viewMode: modes[this.viewMode].clsName
								}								
							}));

							if (this.autoclose) {
								this.hide();
							}
						}
						this.showMode(-1);
						this.fill();
						this.set();
						break;
					case 'td':
						if (target.classList.contains('day') && !target.classList.contains('disabled')){
							let day = parseInt(target.textContent, 10)||1;
							let month = this.viewDate.getMonth();
							if (target.classList.contains('old')) {
								month -= 1;
							} else if (target.classList.contains('new')) {
								month += 1;
							}
							let year = this.viewDate.getFullYear();
							let hours = this.date.getHours();
							let mins = this.date.getMinutes();
							let secs = this.date.getSeconds();

							this.date = new Date(year, month, day, hours, mins, secs, 0);
							this.viewDate = new Date(year, month, Math.min(28, day), hours, mins, secs, 0);
							this.fill();
							this.set();

							this.element.dispatchEvent(new CustomEvent('changeDate', {
								detail: {
									date: this.date,
									viewMode: modes[this.viewMode].clsName
								}
							}));

							if (this.autoclose) {
								this.hide();
							}
						}
						break;
					case 'button':
						if (target.classList.contains('done')) {
							this.hide();
						} else if (target.classList.contains('now')) {
							this.setDate(new Date());
						}

						break;
				}
			}
		}

		onInput (e) {
			if (e.target.type === 'range') {
				let slider = e.target,
					value = parseInt(slider.value);

				if (slider.classList.contains('hours')) {
					this.date.setHours(value);
				} else if (slider.classList.contains('minutes')) {
					this.date.setMinutes(value);
				} else if (slider.classList.contains('seconds')) {
					this.date.setSeconds(value);
				}
	
				this.set();
			}			
		}

		mousedown(e) {
			e.stopPropagation();
			e.preventDefault();
		}
		
		showMode(dir) {
			if (dir) {
				this.viewMode = Math.max(this.minViewMode, Math.min(2, this.viewMode + dir));
			}
			
			this.picker.childNodes.forEach(item => item.style.display = null);			
			
			this.picker.querySelector('.datepicker-'+modes[this.viewMode].clsName)
				.style.display = 'block';
		}

		static defaults = {
			dateFormat: 'mm/dd/yyyy',
			timeFormat: 'HH:mm:ss',
			language: 'en',
			separator: ' ',
			autoclose: false,
			showTime: false,
			showButtons: false,
			onRender: function(date) {
				return '';
			}
		}

		static languages = {
			en: {
				days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
				daysShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
				months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
				hours: 'Hours',
				minutes: 'Minutes',
				seconds: 'Seconds',
				now: 'Now',
				done: 'Done'
			}
		}
	}
	
	if (global.jQuery) {
		const $ = global.jQuery;

		$.fn.datepicker = function(option, val) {
			if (typeof(option) === 'string') {
				if (option === 'getDate') {
					return $(this[0]).data('datepicker')[option]();
				} else {
					return this.each(function () {
						$(this).data('datepicker')[option](val);
					});
				}
			} else {
				return this.each(function () {
					let $this = $(this),
						data = $this.data('datepicker'),
						options = typeof option === 'object' && option;
					if (!data) {
						$this.data('datepicker', (data = new Datepicker(this, options)));
					}
				});
			}
		};

		$.fn.datepicker.defaults = Datepicker.defaults;
		$.fn.datepicker.languages = Datepicker.languages;
		$.fn.datepicker.Constructor = Datepicker;
	}

	global.Datepicker = Datepicker;
}(this));