/*
	This web extension modifies the message background to a light blue
	color when it is a message written by you (not implemented yet), and
	to a blue color when the message is to you. It makes it easier
	to search through Slack for your discussions.
*/

const dark_blue = "#C0DBFF";
const light_blue = "#E2EDFF";

const username = "sparky";
const allusers = "@here"

var checkForMessages = setInterval(function () {
	var messages = document.querySelectorAll('div .c-virtual_list__item');

	// Change the background of any messages which contain the username
	messages.forEach(function(el) {
		var found_fromusermsg = el.innerText.includes(username);
		var found_tousermsg = el.innerText.includes('@' + username) || el.innerText.includes(allusers);
		if (found_fromusermsg || found_tousermsg) {
			var style = el.getAttribute('style');
			var color = found_tousermsg ? dark_blue : light_blue;
			if (style.includes('background: ' + color)) {
				return;
			}

			el.setAttribute(
				'style',
				style + ' background: ' + color + ';'
			);
		}
	});

}, 2000);
