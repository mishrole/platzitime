chrome.tabs.onUpdated.addListener((tabId, _change, tab) => {
  if (tab.url && tab.url.includes("platzi.com/cursos")) {
    if (tab.active) {
      const courseId = tab.url.split("/").filter(x => x.length > 0).pop();

      chrome.tabs.sendMessage(tabId, {
        type: "NEW",
        courseId: courseId,
        mainTitle: tab.title,
        url: tab.url
      });
    }
  }
});