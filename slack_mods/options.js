function saveOptions(e) {
  browser.storage.sync.set({
    colour: document.querySelector("#slack-user-color").value
  });
  e.preventDefault();
}

function restoreOptions() {
  var storageItem = browser.storage.managed.get('slack-user-colour');
  storageItem.then((res) => {
    document.querySelector("#managed-slack-user-color").innerText = res.colour;
  });

  var gettingItem = browser.storage.sync.get('slack-user-colour');
  gettingItem.then((res) => {
    document.querySelector("#slack-user-colour").value = res.colour || '#E2EDFF';
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);