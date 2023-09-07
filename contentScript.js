(() => {
  let youtubeRightControls, youtubePlayer, isTitlePause;
  let currentVideo = '',
    currentVideoBookmarks = [];
  const currentVideoData = {};
  let bookmarkTitle = '';

  // listner for all emit messages
  chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
    const { type, value, videoId, settings } = obj;

    if (type === 'NEW') {
      currentVideo = videoId;
      isTitlePause = settings.isTitlePause;
      currentVideoData.id = videoId;
      newVideoLoaded();
    } else if (type === 'PLAY') {
      youtubePlayer.currentTime = value;
    } else if (type === 'DELETE') {
      currentVideoBookmarks = currentVideoBookmarks.filter(
        bookmark => bookmark.time != value
      );
      setValueToStorage(
        { ...currentVideoData, bookmarks: currentVideoBookmarks },
        currentVideo
      );

      response(currentVideoBookmarks);
    }
  });

  // reusable methods
  const getValueFromStorage = async (key, defaultResponse) => {
    const result = await chrome.storage.sync.get([key]);
    return result[key] ? JSON.parse(result[key]) : defaultResponse;
  };

  const setValueToStorage = (value, key) => {
    chrome.storage.sync.set({ [key]: JSON.stringify(value) });
  };

  // Methods
  const fetchCurrentVideoData = async () => {
    try {
      const data = await getValueFromStorage(currentVideo, {});
      currentVideoData['bookmarks'] = data.bookmarks;
      currentVideoData['isTitlePause'] = data.isTitlePause;

      return data;
    } catch (error) {
      console.log(error.message);
      sendReloadSignal();
    }
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists =
      document.getElementsByClassName('bookmark-btn')[0];
    const data = await fetchCurrentVideoData();
    currentVideoBookmarks = data.bookmarks ? data.bookmarks : [];
    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement('img');
      const iconWrapper = document.createElement('span');
      const bookmarkContainer = document.createElement('span');

      bookmarkContainer.className = 'ytp-button';
      iconWrapper.className = 'icon-wrapper';

      bookmarkBtn.src = chrome.runtime.getURL('assets/bookmark.png');
      bookmarkBtn.className = 'ytp-button ' + 'bookmark-btn';
      bookmarkBtn.title = 'Click to bookmark';

      youtubeRightControls =
        document.getElementsByClassName('ytp-right-controls')[0];
      youtubePlayer = document.getElementsByClassName('video-stream')[0];

      iconWrapper.appendChild(bookmarkBtn);
      bookmarkContainer.appendChild(iconWrapper);
      youtubeRightControls.insertBefore(
        bookmarkContainer,
        youtubeRightControls.firstChild
      );
      bookmarkContainer;
      bookmarkBtn.addEventListener('click', addNewBookmarkEventHandler);
    }
  };

  const getTime = t => {
    const date = new Date(0);
    date.setSeconds(t);

    return date.toISOString().slice(11, 19);
  };

  const addNewBookmarkEventHandler = async () => {
    // fetch latest bookmarks
    try {
      const data = await fetchCurrentVideoData();
      isTitlePause = data.isTitlePause;
      getCurrentVideoDetail();

      isTitlePause ? addBookmark() : openModal();
    } catch (error) {
      console.log(error.message);
      sendReloadSignal();
    }
  };

  const addBookmark = async () => {
    if (isTitlePause) {
      const bookmarkBtn = document.getElementsByClassName('bookmark-btn')[0];
      const saveBtnSrc = chrome.runtime.getURL('assets/bookmark.gif');
      const addbookmarkBtnSrc = chrome.runtime.getURL('assets/bookmark.png');

      bookmarkBtn.src = saveBtnSrc;
      setTimeout(() => {
        bookmarkBtn.src = addbookmarkBtnSrc;
      }, 1000);
    }
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc:
        bookmarkTitle != ''
          ? bookmarkTitle
          : `Bookmark at ${getTime(currentTime)}`
    };
    // fetch latest bookmarks
    const data = await fetchCurrentVideoData();
    // conacte old and new bookmarks
    const oldBookmarks = data.bookmarks ? data.bookmarks : [];
    const sortedBookmarks = [...oldBookmarks, newBookmark].sort(
      (a, b) => a.time - b.time
    );
    const updatedVideoData = { ...data, bookmarks: sortedBookmarks };

    // store updated bookmars
    currentVideoBookmarks = [...currentVideoBookmarks, newBookmark].sort(
      (a, b) => a.time - b.time
    );
    currentVideoData.bookmarks = updatedVideoData.bookmarks;
    currentVideoData.isTitlePause = updatedVideoData.isTitlePause;
    setValueToStorage(currentVideoData, currentVideo);

    bookmarkTitle = '';
  };

  const openModal = () => {
    youtubePlayer.pause();

    const modal = document.createElement('dialog');
    modal.id = 'dialog';
    modal.innerHTML = `
  <div class="input">
    <input type="text" class="name" id="bookmarkTitle" placeholder="Enter bookmark title" />
    <button class="accept" id="add-btn">Save</button>
  </div>`;

    document.body.appendChild(modal);
    const dialog = document.querySelector('dialog');
    dialog.showModal();

    // Reset the input value
    const inputField = document.getElementById('bookmarkTitle');
    inputField.value = '';
    inputField.focus();
    bookmarkTitle = '';

    // Close the modal when clicking anywhere on the screen
    document.getElementById('dialog').addEventListener('click', event => {
      if (event.target === dialog) closeModal();
    });

    // Close the modal when clicking anywhere on the screen
    document.getElementById('add-btn').addEventListener('click', () => {
      closeModal();
      addBookmark();
    });
    // close modal when pressing enter key
    document.addEventListener('keydown', handleKeyPress);
  };

  const closeModal = () => {
    const modal = document.getElementById('dialog');
    if (!modal) return;

    // get bookmark title from field
    getBookMarkTitle();

    modal.parentNode.removeChild(modal);

    // removing the listner from document
    document.removeEventListener('keydown', handleKeyPress);

    // resume the video
    youtubePlayer.play();
  };

  const handleKeyPress = event => {
    if (event.key === 'Enter') {
      closeModal();
      addBookmark();
    }
  };

  const getBookMarkTitle = () => {
    const inputField = document.getElementById('bookmarkTitle');
    bookmarkTitle = inputField?.value;
  };

  const getCurrentVideoDetail = () => {
    if(currentVideoData['title'] && currentVideoData['thumbnail']) return;

    const title = document.querySelector(
      '.title > .ytd-video-primary-info-renderer'
    ).innerText;
    const thumbnail = `http://img.youtube.com/vi/${currentVideo}/0.jpg`;

    currentVideoData['title'] = title;
    currentVideoData['thumbnail'] = thumbnail;
  };

  // runs if there is any context invalidate error occurs
  const sendReloadSignal = () => {
    window.location.reload();
  };
})();
