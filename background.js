const listener = (tabId, info, tab) => {
  if ( (info.status === 'complete') && (tab.url.indexOf('https://www.youtube.com/') !== -1) && (tab.url.indexOf('/videos') !== -1)) {
    chrome.scripting.executeScript({
      target: {tabId: tabId},
      files: ['content.js']
    });
  }
};

chrome.tabs.onUpdated.addListener(listener);