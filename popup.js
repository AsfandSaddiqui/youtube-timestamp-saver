import {
  getCurrentActiveTab,
  getValueFromStorage,
  getVideoId,
  setValueToStorage
} from './utils.js';
let checkbox;

// adding a new bookmark row to the popup
const addNewBookmark = (bookmarkElement, bookmark) => {
  const title = document.createElement('div');
  const newElement = document.createElement('div');
  const controlElement = document.createElement('div');

  title.textContent = bookmark.desc;
  title.className = 'bookmark-title';
  title.title = bookmark.desc;

  controlElement.className = 'bookmark-controls';
  newElement.id = 'bookmark-' + bookmark.time;
  newElement.className = 'bookmark';
  newElement.setAttribute('timestamp', bookmark.time);

  setBookmarkAttributes(controlElement, onPlay, 'play');
  setBookmarkAttributes(controlElement, onDelete, 'delete');

  newElement.appendChild(title);
  newElement.appendChild(controlElement);
  bookmarkElement.appendChild(newElement);
};

const viewBookmarks = (currentBookmarks = []) => {
  const bookmarkElement = document.getElementById('bookmarks');
  bookmarkElement.innerHTML = '';
  if (currentBookmarks.length > 0) {
    currentBookmarks.forEach(bookmark => {
      addNewBookmark(bookmarkElement, bookmark);
    });
  } else {
    bookmarkElement.innerHTML = '<div class="row">No bookmarks</div>';
  }
};

const onPlay = async e => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp');
  const activeTab = await getCurrentActiveTab();

  chrome.tabs.sendMessage(activeTab.id, {
    type: 'PLAY',
    value: bookmarkTime
  });
};

const onDelete = async e => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp');
  const activeTab = await getCurrentActiveTab();
  const bookmarkElementToDelete = document.getElementById(
    'bookmark-' + bookmarkTime
  );
  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  chrome.tabs.sendMessage(
    activeTab.id,
    {
      type: 'DELETE',
      value: bookmarkTime
    },
    viewBookmarks
  );
};

const setBookmarkAttributes = (controlParentElement, eventListner, src) => {
  const controlElement = document.createElement('img');
  controlElement.src = 'assets/' + src + '.png';
  controlElement.title = src;
  controlElement.style='width:16px; height:16px'

  controlElement.addEventListener('click', eventListner);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener('DOMContentLoaded', async () => {
  const activeTab = await getCurrentActiveTab();
  const currentVideo = getVideoId(activeTab);
  const optionButton = document.getElementById('option');

  if (currentVideo && activeTab.url.includes('youtube.com/watch')) {
    const data = await getValueFromStorage(currentVideo, null);
    const bookmarks = data?.bookmarks ? data.bookmarks : [];
    viewBookmarks(bookmarks);

    checkbox = document.querySelector('input[type="checkbox"]');
    checkbox.checked = data?.isTitlePause ? data?.isTitlePause : false;
    checkbox.addEventListener('change', () =>
      toggleCheckbox(data, currentVideo)
    );
  } else {
    const container = document.getElementsByClassName('container')[0];
    container.innerHTML =
      '<div class="title">This is not a youtube video page</div>';
    container.className = 'non-yt-container';
  }

  optionButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage(() => {});
  });

});

const toggleCheckbox = async (data, currentVideo) => {
  if (checkbox.checked) {
    setValueToStorage({ ...data, isTitlePause: true }, currentVideo);
  } else {
    setValueToStorage({ ...data, isTitlePause: false }, currentVideo);
  }
};
