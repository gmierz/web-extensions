/*
	This web extension modifies the message background to a light blue
	color when it is a message written by you (not implemented yet), and
	to a blue color when the message is to you. It makes it easier
	to search through Slack for your discussions.
*/

const dark_blue = "#C0DBFF"; // Not used yet.

const light_blue = "#E2EDFF";
const username = "sparky";

var checkForMessages = setInterval(function () {
	var messages = document.querySelectorAll('div .c-virtual_list__item');

	// Change the background of any messages which contain the username
	messages.forEach(function(el) {
		var found = el.innerText.includes(username) || el.innerText.includes('@' + username);
		if (found) {
			var style = el.getAttribute('style');
			if (style.includes('background: ' + light_blue)) {
				return;
			}

			el.setAttribute(
				'style',
				style + ' background: ' + light_blue + ';'
			);
		}
	});

}, 2000);
