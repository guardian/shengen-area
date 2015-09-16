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

function highlightBorders({ids, description, open}) {
	ids.forEach(id => {
		var path = document.getElementById(id);
		path.setAttribute('stroke-width', 1.5);
		if (open) {
			path.setAttribute('stroke', '#298422');
		} else {
			path.setAttribute('stroke', '#c5230e');
		}
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
		var borderControls = response.sheets.borders.map(borderControl => {
			return {
				ids: borderControl.border_ids.trim().split(',').map(id => id.trim()),
				name: borderControl.name,
				desc: borderControl.description,
				open: !!borderControl.open
			};
		})

		borderControls.forEach(highlightBorders);
		bordersListEl.innerHTML = borderControls.map(border =>
			`<li pathids="${border.ids}"><p><span>${border.name}</span>${border.desc}</p></li>`
		).join('');

		var bordersEls = [].slice.call(bordersListEl.querySelectorAll('li'));

		bordersEls.forEach(el => {
			el.addEventListener('mouseenter', evt => {
				evt.target.getAttribute('pathids').split(',').forEach(id =>
					document.getElementById(id).setAttribute('class', 'border-highlight')
				)
			})
			el.addEventListener('mouseleave', evt => {
				var highlighted = [].slice.call(document.querySelectorAll('.border-highlight'));
				highlighted.forEach(el => el.removeAttribute('class'))
			})
		})

		var textNodes = [].slice.call(document.querySelectorAll('text'))
		var textNodesByName = {}; textNodes.forEach(node => textNodesByName[node.textContent] = node)

		var labelsToDisplay = response.sheets.labels.filter(label => label.display).map(label => label.country)
		var nodesToDisplay = textNodes
			.filter(node => labelsToDisplay.indexOf(node.textContent) !== -1)

		var hoverableCountries = [].slice.call(document.querySelectorAll('path[country]'))
		hoverableCountries
			.filter(node => labelsToDisplay.indexOf(node.getAttribute('country')) === -1)
			.forEach(node => {
				var text = node.getAttribute('country');
				var labelNode = textNodesByName[text];
				if (labelNode) {
					labelNode.style['pointer-events'] = 'none';
					node.addEventListener('mouseenter', evt =>  labelNode.style.display = 'block')
					node.addEventListener('mouseleave', evt => labelNode.style.display = 'none')
				}
			})

		nodesToDisplay.forEach(node => node.style.display = 'block')

		iframeMessenger.resize();
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
				if (lastEl) lastEl.setAttribute('class', '');
				evt.toElement.setAttribute('class', 'border-debug');
				lastEl = evt.toElement;
			}
		})
	}
}
