document.getElementById('toggle').onclick = function () {
    var $ele = document.getElementById('male')
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { isSelected: $ele.checked }, function (response) {
            if (typeof response != 'undefined') {
                console.log("success")
            } else {
                // alert("response为空=>" + response);
            }
        });
    });
}