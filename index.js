'use strict';

let displayMode = 'realName';
const realNames = new Map();

async function loadRealName(username) {
  if (realNames.has(username)) return;
  realNames.set(username, username);
  
  try {
    const response = await chrome.runtime.sendMessage({action: "get-real-name", username});
    if (response?.cached) {
      realNames.set(username, response.cached);
      update();
      return;
    }

    const res = await fetch(`https://api.github.com/users/${username}`);
    const data = await res.json();
    
    if (data.name) {
      realNames.set(username, data.name);
      await chrome.runtime.sendMessage({
        action: "set-real-name", 
        username, 
        realName: data.name
      });
    }
    update();
  } catch (error) {
    console.error(`Error loading real name for ${username}:`, error);
  }
}

function formatName(username) {
  const realName = realNames.get(username);
  
  switch (displayMode) {
    case 'realName':
      return realName !== username ? realName : username;
    case 'userName':
      return username;
    case 'both':
      return realName !== username ? `${realName} (@${username})` : username;
    default:
      return username;
  }
}

// Initialize display mode
chrome.runtime.sendMessage({action: "get-display-mode"}, response => {
  displayMode = response.displayMode;
  update();
});

// Use MutationObserver instead of setInterval for better performance
const observer = new MutationObserver(() => {
  requestAnimationFrame(update);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

function updateList(list, filter, getUsername, shouldAt) {
  for (const element of list) {
    if (filter(element)) {
      const username = getUsername(element);
      loadRealName(username);
      element.textContent = shouldAt ? '@' + formatName(username) : formatName(username);
    }
  }
}

function update() {
  updateList(document.getElementsByClassName('author'), function (author) {
    return author.hasAttribute('href');
  }, function (author) {
    return /\/([^\/]+)$/.exec(author.getAttribute('href'))[1];
  });
  updateList(document.querySelectorAll("[data-ga-click*='target:actor']"), function (author) {
    return author.hasAttribute('href');
  }, function (author) {
    return /\/([^\/]+)$/.exec(author.getAttribute('href'))[1];
  });
  updateList(document.getElementsByClassName('user-mention'), function (mention) {
    return mention.hasAttribute('href');
  }, function (mention) {
    return /\/([^\/]+)$/.exec(mention.getAttribute('href'))[1];
  }, true);
  updateList(document.getElementsByClassName('commit-author'), function (author) {
    return true;
  }, function (author) {
    if (author.hasAttribute('data-user-name')) {
      return author.getAttribute('data-user-name');
    } else {
      var username = author.textContent;
      if (username.indexOf('author=') !== -1) {
        username = username.split('author=').pop();
      }
      author.setAttribute('data-user-name', username);
      return username;
    }
  });
  updateList(document.querySelectorAll('.opened-by a.tooltipped.tooltipped-s'), function (author) {
    return true;
  }, function (author) {
    if (author.hasAttribute('data-user-name')) {
      return author.getAttribute('data-user-name');
    } else {
      var username = author.textContent;
      author.setAttribute('data-user-name', username);
      return username;
    }
  });
  updateList(document.querySelectorAll('.author-name a[rel="author"], .author a[rel="author"]'), function (author) {
    return author.hasAttribute('href');
  }, function (author) {
    return /\/([^\/]+)$/.exec(author.getAttribute('href'))[1];
  });
  updateList(document.querySelectorAll('.opened-by a.muted-link'), function (author) {
    return true;
  }, function (author) {
    if (author.hasAttribute('data-user-name')) {
      return author.getAttribute('data-user-name');
    } else {
      var username = author.textContent;
      author.setAttribute('data-user-name', username);
      return username;
    }
  });
  updateList(document.querySelectorAll('.sidebar-assignee p span.text-bold'), function (author) {
    return true;
  }, function (author) {
    if (author.hasAttribute('data-user-name')) {
      return author.getAttribute('data-user-name');
    } else {
      var username = author.textContent;
      author.setAttribute('data-user-name', username);
      return username;
    }
  });
  updateList(document.querySelectorAll('a.assignee > .css-truncate-target'), function (author) {
    return /\/([^\/]+)$/.test(author.parentNode.getAttribute('href'));
  }, function (author) {
    if (!author.style.maxWidth) {
      author.style.maxWidth = '250px';
    }
    return /\/([^\/]+)$/.exec(author.parentNode.getAttribute('href'))[1];
  });
}

update();
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateDisplayMode') {
    displayMode = message.displayMode;
    update();
  }
});
