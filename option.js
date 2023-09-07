// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === 'refreshOptionsPage') {
    // Reload the options page to fetch the latest data from sync storage
    location.reload();
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const bookmarks = [];
  let parseBookmark = {};

  // Elements reference
  const buttonElement = document.getElementById('search');
  const bookmarkElement = document.getElementById('bookmark-list');

  const getTime = t => {
    const date = new Date(0);
    date.setSeconds(t);
    return date.toISOString().slice(11, 19);
  };

  const secondsToTime = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${hours}h${minutes}m${remainingSeconds}s`;
  };

  const handleClick = event => {
    window.open(
      `https://www.youtube.com/watch?v=${event.videoId}&t=${secondsToTime(
        event.time
      )}`,
      '_blank'
    );
  };

  // render bookmarks in DOM
  const renderBookmarks = bookmarks => {
    bookmarks.forEach(bookmark => {
      const cardDiv = document.createElement('div');

      cardDiv.className = 'card';
      cardDiv.id = `bookmark-${bookmark.time}`;
      cardDiv.innerHTML = `
        <img src=${
          bookmark.thumbnail || '/assets/default-placeholder.png'
        } alt="Video Thumbnail">
        <div class="card-content">
          <h2 class="video-title">${bookmark.title || 'Video Title'}</h2>
          <p class="description">${bookmark.desc}</p>
          <p class="timestamp">${getTime(bookmark.time)}</p>
        </div>
      `;

      bookmarkElement.appendChild(cardDiv);

      const cardElement = document.getElementById(`bookmark-${bookmark.time}`);

      cardElement.addEventListener('click', () =>
        handleClick({
          ...bookmark,
          title: bookmark.title || '',
          thumbnail: bookmark.thumbnail || ''
        })
      );
    });
  };

  // get bookmarks from storage
  const getBookmarks = async () => {
    const result = await chrome.storage.sync.get();
    Object.keys(result).forEach(bookmark => {
      parseBookmark = JSON.parse(result[bookmark]);
      if (parseBookmark?.bookmarks?.length > 0) {
        parseBookmark?.bookmarks.forEach((parseMark, index) => {
          bookmarks.push({
            ...parseMark,
            videoId: bookmark,
            title: parseBookmark.title || '',
            thumbnail: parseBookmark.thumbnail || ''
          });
        });
      }
    });
    console.log(bookmarks);
    renderBookmarks(bookmarks);
  };

  const handleSearch = () => {
    const searchInput = document.getElementById('filter');
    const searchText = searchInput.value;

    bookmarkElement.innerHTML = '';

    if (searchText) {
      const filterBookmarks = bookmarks.filter(
        bookmark =>
          bookmark.desc.toLowerCase().includes(searchText.toLowerCase()) ||
          bookmark.title.toLowerCase().includes(searchText.toLowerCase())
      );
      renderBookmarks(filterBookmarks);
    } else {
      renderBookmarks(bookmarks);
    }
  };
  // listners
  buttonElement.addEventListener('click', handleSearch);

  // init methods()
  getBookmarks();
});
