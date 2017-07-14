const starImage = chrome.extension.getURL('img/icon48.png'),

      getCache = () => {
        const cache = localStorage.getItem('ratings');
        return cache ? JSON.parse(cache) : [];
      },

      setCache = data => {
        localStorage.setItem('ratings', JSON.stringify(data));
      },
    
      getDocument = response => {
        return new DOMParser().parseFromString(response, 'text/html');
      },

      formattedElement = (rating, title) => {
        let str = `<p class="animated flipInX imdbRating"><img style="margin-top:-3px;vertical-align:middle;width:1em;height:1em" src="${starImage}"/>`;
            str += `<span style="color:white">&nbsp;${rating}</span></p>`;
        return $(str);
      },

      parsePage = (response, container, title, imdbTitle) => {
        const rateBox = getDocument(response).getElementsByClassName('ratingValue')[0],
              rating = rateBox ? rateBox.children[0].innerText : 'N/A',
              cacheEntry = {title, rating, date: new Date(), imdbTitle},
              cache = getCache();

        cache.push(cacheEntry);
        setCache(cache);
        $(container).append(formattedElement(rating, imdbTitle));
      },

      parseSearch = (response, container, longTitle, hasRating) => {
        const result = getDocument(response).getElementsByClassName('result_text')[0],
              title = '';

        if (result) {
          title = result.firstElementChild.href.split('/')[4];
          chrome.runtime.sendMessage({ title, type: 'page' }, response => parsePage(response, container, longTitle, title));
        }

        else
          if (!hasRating) $(container).append(formattedElement('N/A', title));
      },

      scan = () => {
        const containers = $('.ncgShowTitle').toArray().concat($('.ncgMovieTitle').toArray());

        for (let container of containers) {

          const hasRating = $(container).is(':has(p.imdbRating)'),
                title = hasRating? container.innerText.replace(/(\r\n|\n|\r)/gm, '').slice(0,-4) : container.innerText,
                cached = getCache().find(r => r.title === title);

          if (cached) {
            if (!hasRating)
              $(container).append(formattedElement(cached.rating, cached.imdbTitle));
            continue;
          }

          else
            chrome.runtime.sendMessage({ title, type: 'search' }, response => parseSearch(response, container, title, hasRating));
        }
      },

      isNew = date => {
        const diff = new Date().getTime() - new Date(date).getTime(),
              limit = 1000 * 3600;
        return Math.abs(diff) < limit;
      };

setCache(getCache().filter(r => isNew(r.date)));
$(document).ready(() => { setTimeout(scan, 2000) } );
$('#Aurelia').change(() => { setTimeout(scan, 400) });