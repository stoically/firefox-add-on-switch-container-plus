/*
  Forked from: https://gitlab.com/mjanetmars/switch-container

  This Source Code Form is subject to the terms of the Mozilla Public
 - License, v. 2.0. If a copy of the MPL was not distributed with this
 - file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* based on https://github.com/mdn/webextensions-examples/blob/master/apply-css/background.js */

/* enable / disable container button */

/* only enable it on http(s) urls */
const APPLICABLE_PROTOCOLS = ["http:", "https:", "about:blank", "about:newtab"];

/* checks if the url is applicable */
function protocolIsApplicable(url) {
  return APPLICABLE_PROTOCOLS.find(protocol => url.startsWith(protocol));
}



/* enable/disable button */
function initializePageAction(tab) {
  if (!tab.incognito && protocolIsApplicable(tab.url)) {
    browser.browserAction.enable(tab.id);
  } else {
    browser.browserAction.disable(tab.id);
  }
}

/* check if any tab changed */
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  if (changeInfo.url) {
    initializePageAction(tab);
  }
});

/* init by checking all tabs */
var currentTabs = browser.tabs.query({});
currentTabs.then((tabs) => {
  for (let tab of tabs) {
    initializePageAction( tab );
  }
});



/*
  Forked from https://github.com/andreicristianpetcu/Search-and-Switch-Containers

  License: GPL-3.0
*/
browser.omnibox.setDefaultSuggestion({
  description: `Search for containers and switch to them (e.g. "co personal" or "co banking")`
});

browser.omnibox.onInputChanged.addListener(async (text, addSuggestions) => {
  const contexts = await browser.contextualIdentities.query({});
  const result = [];
  contexts.push({
    name: "default",
    description: `Switch to container: default`
  });
  for (let context of contexts) {
    if (context.name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
      result.push({
        content: context.name,
        description: `Switch to container: ${context.name}`
      })
    }
  }
  addSuggestions(result);
});

browser.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const contexts = await browser.contextualIdentities.query({});
  const tabs = await browser.tabs.query({ currentWindow: true, active: true });
  contexts.push({
    cookieStoreId: 'firefox-default',
    name: 'default'
  });

  for (let context of contexts) {
    if (context.name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
      let tabCreateProperties = {
        cookieStoreId: context.cookieStoreId,
        index: tabs[0].index
      };
      if(tabs[0].url !== 'about:newtab' &&
         tabs[0].url !== 'about:blank' &&
         tabs[0].url !== 'about:home') {
        tabCreateProperties.url = tabs[0].url;
      } else {
        try {
          const parsedUrl = new URL(context.name);
          if (['http:', 'https:'].includes(parsedUrl.protocol) && psl.isValid(parsedUrl.hostname)) {
            tabCreateProperties.url = context.name;
          }
        } catch (error) {
          if (psl.isValid(context.name)) {
            tabCreateProperties.url = `http://${context.name}`;
          }
        }
        
      }
      await browser.tabs.create(tabCreateProperties);
      browser.tabs.remove(tabs[0].id);
      break
    }
  }
});
