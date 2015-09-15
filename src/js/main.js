import reqwest from 'reqwest';
import iframeMessenger from 'guardian/iframe-messenger';

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function highlightBorders({ids, description}) {
	ids.forEach(id => {
		var path = document.getElementById(id);
		path.setAttribute('stroke', 'black');
	})
}

export function init() {
	var testMode = /test/.test(document.location.search);
	var urlModifier = testMode ? '-test' : '';
	var url = `https://interactive.guim.co.uk/docsdata${urlModifier}/1JupyfRx5ncRlwnGWcMhv8JO62O-209DuKyPKwgCIcAU.json`;
	var bordersListEl = document.querySelector('.borders-list');
	reqwest({
		url: url
	}).then(response => {
		var borderControls = response.sheets.Sheet1.map(borderControl => {
			return {
				ids: borderControl.border_ids.trim().split(',').map(id => id.trim()),
				name: borderControl.name,
				desc: borderControl.description
			};
		})

		borderControls.forEach(highlightBorders);
		bordersListEl.innerHTML = borderControls.map(border =>
			`<li pathids="${border.ids}"><p><span>${border.name}</span>${border.desc}</p></li>`
		).join('');
		iframeMessenger.resize();

		var bordersEls = [...bordersListEl.querySelectorAll('li')];
		bordersEls.forEach(el => {
			el.addEventListener('mouseenter', evt => {
				evt.target.getAttribute('pathids').split(',').forEach(id =>
					document.getElementById(id).setAttribute('class', 'border-highlight')
				)
			})
			el.addEventListener('mouseleave', evt => {
				var highlighted = [...document.querySelectorAll('.border-highlight')];
				highlighted.forEach(el => el.removeAttribute('class'))
			})

		})
	});

	var onResize = evt => {
		iframeMessenger.resize();
	}
	window.addEventListener('resize', debounce(onResize))

	if (testMode) { // debug / testing features
		var debugEl = document.createElement('div');
		document.querySelector('.key').innerHTML = '';
		debugEl.className = 'debug';
		debugEl.innerHTML = 'TEST MODE';
		document.querySelector('.map').appendChild(debugEl);
		var lastEl;
		document.getElementById('borders').addEventListener('mouseover', evt => {
			if (/path/i.test(evt.toElement.tagName)) {
				debugEl.innerHTML = evt.toElement.id;
				if (lastEl) lastEl.removeAttribute('stroke');
				evt.toElement.setAttribute('stroke', 'hotpink');
				lastEl = evt.toElement;
			}
		})
	}
}
