import { getValueFromStorage, getVideoId, setValueToStorage } from './utils.js';

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    tab.url.includes('youtube.com/watch')
  ) {
    const videoId = getVideoId(tab);
    try {
      const result = await getValueFromStorage(videoId, null);

      if (!result || result.isTitlePause == null) {
        setValueToStorage({ ...result, isTitlePause: false }, videoId);
      }

      chrome.tabs.sendMessage(tabId, {
        type: 'NEW',
        videoId: videoId,
        settings: {
          isTitlePause: result ? result.isTitlePause : false
        }
      });
    } catch (error) {
      // An error occurred
      console.error(error.message);
    }
  }
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === 'sync' && !!changes) {
    // Send a message to the options page
    chrome.runtime.sendMessage({ type: 'refreshOptionsPage' });
  }
});
