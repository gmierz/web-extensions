# web-extensions

A collection of web-extensions for Firefox.

## slack_mods

This web extension will turn Slack messages that are directed to you, or made by you to a light-blue color to make them easier to find. Follow these instructions to make it work for you:

1. Clone this repository locally.
1. Open `slack_mods_main.js` and change the `username` to yours. Note that the `@` symbol is not required. Feel free to change the color as well if you don't like it (default is a light blue).
1. Save the file afte rmaking the changes.
1. Go to `about:debugging` in Firefox.
1. Click `Load Temporary Add-on` and point it to a file in the `slack_mods` folder (any file).
1. Open Slack and wait a couple seconds before it updates the backgrounds.

Note that some code exists for a future add-on options page but it hasn't been implemented.

## success_rates

This web-extension works on all treeherder pages and shows the SETA and Code Coverage scheduling success rate given the revisions that are listed in the treeherder view. When more revisions are addded to the view, the success rate will recompute itself.

Instructions for setup: 
1. Clone this repository locally.
2. Go to `about:debugging` in Firefox.
3. Click `Load Temporary Add-on` and point it to a file in the `success_rates` folder (any file).
4. Now it's loaded so you can go to treeherder on mozilla-inbound or autoland to find success rate scores. i.e. try this [link](https://treeherder.mozilla.org/#/jobs?repo=mozilla-inbound&searchStr=decisionkjhk&fromchange=693c18f60a0fc7dcac8f5162de4f248b0570e27e).

Notes:
1. When there is no fixed-by-commit data found for a requested range, 'No data found' will be displayed at the top.
2. Sometimes there are unavoidable network errors that can be seen in the log - a refresh will usually solve these. (The active data query can take a while as well).

## tuid_annotate

Same instructions as success_rates, but you should test it out on a phabricator review such as: https://phabricator.services.mozilla.com/D22454
