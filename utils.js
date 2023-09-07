export const getCurrentActiveTab = async () => {
  let queryOptions = { active: true, lastFocusedWindow: true };

  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

export const getVideoId = tab => {
  const queryParameters = tab.url.split('?')[1];
  const urlParameters = new URLSearchParams(queryParameters);
  return urlParameters.get('v');
};

 export const getValueFromStorage = async (key, defaultResponse) => {
   const result = await chrome.storage.sync.get([key]);
    return result[key] ? JSON.parse(result[key]) : defaultResponse;
  };

 export const setValueToStorage = (value, key) => {
    chrome.storage.sync.set({[key]: JSON.stringify(value)});
  };
