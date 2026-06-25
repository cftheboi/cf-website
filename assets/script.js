
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuButton?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

document.getElementById('year')?.append(new Date().getFullYear());

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const snakeTimeline = document.querySelector('[data-snake-timeline]');
if (snakeTimeline) {
  const markers = [...snakeTimeline.querySelectorAll('.snake-marker')];
  const basePath = snakeTimeline.querySelector('.snake-path-base');
  const progressPath = snakeTimeline.querySelector('.snake-path-progress');
  const svg = snakeTimeline.querySelector('.snake-path');

  const drawSnake = () => {
    const box = snakeTimeline.getBoundingClientRect();
    const points = markers.map((marker) => {
      const markerBox = marker.getBoundingClientRect();
      return [markerBox.left - box.left + markerBox.width / 2, markerBox.top - box.top + markerBox.height / 2];
    });
    const pathData = points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    basePath.setAttribute('d', pathData);
    progressPath.setAttribute('d', pathData);
  };

  requestAnimationFrame(drawSnake);
  window.addEventListener('resize', drawSnake);
  if ('ResizeObserver' in window) new ResizeObserver(drawSnake).observe(snakeTimeline);
}

document.querySelectorAll('.blog-filter button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.blog-filter button.active')?.classList.remove('active');
    button.classList.add('active');
    const filter = button.dataset.filter;
    document.querySelectorAll('.post-card').forEach((post) => {
      const cats = (post.dataset.category || '').split(' ');
      post.classList.toggle('hidden', filter !== 'all' && !cats.includes(filter));
    });
  });
});

async function fetchSubstackRSS(limit) {
  // /substack-feed is a Netlify proxy (same-origin, no CORS). Falls back to direct RSS on localhost.
  let res;
  try {
    res = await fetch('/substack-feed');
    if (!res.ok) throw new Error();
  } catch {
    res = await fetch('https://cfchan.substack.com/feed');
    if (!res.ok) throw new Error();
  }
  const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
  const items = Array.from(xml.querySelectorAll('item')).slice(0, limit);
  if (!items.length) throw new Error();
  return items.map(item => {
    const get = tag => item.querySelector(tag)?.textContent?.trim() || '';
    const rawDesc = get('description');
    const desc = rawDesc.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;/g, '').trim();
    const cover = item.querySelector('enclosure')?.getAttribute('url') || '';
    const tags = Array.from(item.querySelectorAll('category')).map(c => c.textContent.trim());
    const pubDate = get('pubDate');
    return {
      title: get('title'),
      canonical_url: get('guid') || get('link'),
      post_date: pubDate ? new Date(pubDate).toISOString() : '',
      cover_image: cover,
      subtitle: desc.slice(0, 160),
      description: desc,
      wordcount: Math.ceil(desc.split(/\s+/).length * 5),
      postTags: tags
    };
  });
}

// Homepage insight grid — latest 3 from Substack
(async function loadInsights() {
  const grid = document.getElementById('insight-grid');
  if (!grid) return;
  try {
    const posts = await fetchSubstackRSS(3);
    const delays = ['', ' delay-1', ' delay-2'];
    grid.innerHTML = posts.map((post, i) => {
      const cat = detectCategory(post.postTags, post.title + ' ' + post.subtitle);
      const vis = catVisual(cat);
      const mins = post.wordcount ? Math.max(1, Math.round(post.wordcount / 200)) + ' MIN READ' : '';
      const art = post.cover_image
        ? `<div class="insight-art post-visual-img" style="background-image:url('${post.cover_image}')"></div>`
        : `<div class="insight-art ${vis.cls === 'visual-ai' ? 'art-one' : vis.cls === 'visual-lae' ? 'art-two' : 'art-three'}"><span>${vis.label}</span></div>`;
      return `<a class="insight-card reveal${delays[i]}" href="${post.canonical_url}" target="_blank" rel="noopener">${art}<p>${vis.display}${mins ? ' · ' + mins : ''}</p><h3>${post.title}</h3><span class="arrow">↗</span></a>`;
    }).join('');
    document.querySelectorAll('#insight-grid .reveal').forEach(el => revealObserver.observe(el));
  } catch {
    grid.innerHTML = `<a class="insight-card" href="https://substack.com/@cfchan" target="_blank" rel="noopener"><div class="insight-art art-one"><span>CF</span></div><p>SUBSTACK</p><h3>Read my latest writing on Substack</h3><span class="arrow">↗</span></a>`;
  }
})();

// Substack posts auto-loader
(async function loadSubstackPosts() {
  const grid = document.getElementById('post-grid');
  if (!grid) return;

  const skeleton = '<div class="post-card post-skeleton"><div class="post-visual skeleton-vis"></div><div class="skeleton-line s-short"></div><div class="skeleton-line s-long"></div><div class="skeleton-line s-med"></div></div>';
  grid.innerHTML = Array(12).fill(skeleton).join('');

  try {
    const posts = await fetchSubstackRSS(12);

    // Populate featured card with latest post
    const fp = posts[0];
    if (fp) {
      const fc = document.getElementById('featured-card');
      const fi = document.getElementById('featured-img');
      const fCat = catVisual(detectCategory(fp.postTags, fp.title + ' ' + fp.subtitle));
      const fDate = fp.post_date ? new Date(fp.post_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      const fMins = fp.wordcount ? Math.max(1, Math.round(fp.wordcount / 200)) + ' min read' : '';
      if (fc) fc.href = fp.canonical_url;
      if (fi) {
        fi.style.backgroundImage = fp.cover_image ? `url('${fp.cover_image}')` : '';
        fi.style.backgroundColor = fp.cover_image ? '' : 'var(--ink)';
      }
      const meta = document.getElementById('featured-meta');
      if (meta) meta.textContent = [fCat.display, fMins, fDate].filter(Boolean).join(' · ');
      const title = document.getElementById('featured-title');
      if (title) title.textContent = fp.title;
      const excerpt = document.getElementById('featured-excerpt');
      if (excerpt) excerpt.textContent = fp.description.slice(0, 160);
    }

    grid.innerHTML = posts.map(post => {
      const cats = detectCategories(post.postTags, post.title + ' ' + post.subtitle + ' ' + post.description);
      const vis = catVisual(cats[0]);
      const date = post.post_date ? new Date(post.post_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      const mins = post.wordcount ? Math.max(1, Math.round(post.wordcount / 200)) + ' MIN READ' : '';
      const excerpt = post.description.slice(0, 115).trim();
      const visual = post.cover_image
        ? `<div class="post-visual post-visual-img" style="background-image:url('${post.cover_image}')"></div>`
        : `<div class="post-visual ${vis.cls}"><span>${vis.label}</span></div>`;
      return `<a class="post-card" data-category="${cats.join(' ')}" href="${post.canonical_url}" target="_blank" rel="noopener">${visual}<p>${vis.display}${mins ? ' · ' + mins : ''} · ${date}</p><h3>${post.title}</h3>${excerpt ? `<small>${excerpt}</small>` : ''}</a>`;
    }).join('');

    const activeFilters = [...document.querySelectorAll('.blog-filter button.active')].map(b => b.dataset.filter);
    const showAll = activeFilters.includes('all') || !activeFilters.length;
    if (!showAll) {
      document.querySelectorAll('.post-card').forEach(p => {
        const cats = (p.dataset.category || '').split(' ');
        p.classList.toggle('hidden', !activeFilters.some(f => cats.includes(f)));
      });
    }
  } catch {
    grid.innerHTML = `<div class="posts-error"><p>Could not load posts.</p><a class="button" href="https://substack.com/@cfchan" target="_blank" rel="noopener">Read on Substack ↗</a></div>`;
  }
})();

function detectCategory(tags, text) {
  return detectCategories(tags, text)[0];
}
function detectCategories(tags, text) {
  const tagStr = (tags || []).join(' ');
  const t = (tagStr + ' ' + text).toLowerCase();
  const cats = new Set();

  // Map Substack RSS <category> tags directly
  (tags || []).forEach(tag => {
    const tl = tag.toLowerCase();
    if (/ai|machine.?learning|llm|gpt|automat/.test(tl))          cats.add('ai');
    if (/drone|lae|low.?altitude|uav|unmanned/.test(tl))          cats.add('lae');
    if (/entrepreneur|startup/.test(tl))                           cats.add('entrepreneurship');
    if (/business|strategy|management/.test(tl))                   cats.add('business');
    if (/social|society|philosophy|culture|education/.test(tl))    cats.add('social');
    if (/tech|technology|software|digital|innovation/.test(tl))    cats.add('tech');
  });

  // English patterns
  if (/\b(ai|a\.i\.|artificial intelligence|llm|chatgpt|gpt|machine learning|automat\w*|generat\w*|generative|intelligent)\b/.test(t)) cats.add('ai');
  if (/\b(low.altitude|lae|drone|uav|suas?|unmanned|airspace)\b/.test(t)) cats.add('lae');
  if (/\b(entrepreneur\w*|startup|sales|growth|venture|gig economy|business development)\b/.test(t)) cats.add('entrepreneurship');
  if (/\b(business|transform\w*|strateg\w*|management|consulting|corporate|enterprise|revenue)\b/.test(t)) cats.add('business');
  if (/\b(social|society|philosoph\w*|culture|youth|community|future|human\w*|thinker\w*|education|critical|everyone|people|learn\w*|ethic\w*)\b/.test(t)) cats.add('social');
  if (/\b(tech\w*|web3|blockchain|iot|bim|digital|innovation|apps?|software|platform|data|personal|own\w*)\b/.test(t)) cats.add('tech');

  // Chinese patterns
  if (/人工智能|機器學習|自動化|生成式?|大語言|語言模型|智能系統|ai能|ai可/.test(t)) cats.add('ai');
  if (/低空經濟|無人機|飛行器|空域/.test(t)) cats.add('lae');
  if (/創業|初創|企業家|商業模式|銷售/.test(t)) cats.add('entrepreneurship');
  if (/商業|業務|策略|管理|諮詢|企業/.test(t)) cats.add('business');
  if (/社會|未來|哲學|文化|教育|培養|思考者?|人類|每個人|時代|批判/.test(t)) cats.add('social');
  if (/科技|技術|軟體|軟件|應用程式|數碼|數位|創新|平台|個人化?|app/.test(t)) cats.add('tech');

  return cats.size ? [...cats] : ['business'];
}

function catVisual(cat) {
  return {
    ai:              { cls: 'visual-ai',     label: 'AI',       display: 'ARTIFICIAL INTELLIGENCE' },
    lae:             { cls: 'visual-lae',    label: 'HK\n低空', display: 'LOW ALTITUDE ECONOMY' },
    entrepreneurship:{ cls: 'visual-sales',  label: '↗',        display: 'ENTREPRENEURSHIP' },
    business:        { cls: 'visual-change', label: '→',        display: 'BUSINESS' },
    social:          { cls: 'visual-social', label: '人',       display: 'SOCIAL' },
    tech:            { cls: 'visual-tech',   label: '⌁',        display: 'TECHNOLOGY' },
  }[cat] || { cls: 'visual-change', label: '→', display: 'BUSINESS' };
}

// About page: collapsible accordion for sections after the bio
(function () {
  var sections = document.querySelectorAll('[data-accordion]');
  if (!sections.length) return;

  // Sort by data-acc-num so visual order matches numbers regardless of DOM order
  var sorted = Array.from(sections).sort(function (a, b) {
    return parseInt(a.dataset.accNum, 10) - parseInt(b.dataset.accNum, 10);
  });

  var wrapper = document.createElement('div');
  wrapper.className = 'about-accordion';
  sections[0].parentNode.insertBefore(wrapper, sections[0]);

  sorted.forEach(function (section) {
    var label = section.dataset.accordion;
    var num   = section.dataset.accNum;
    var id    = section.dataset.accId;
    var btnId = id + '-btn';

    var item = document.createElement('div');
    item.className = 'acc-item';

    var toggle = document.createElement('button');
    toggle.className = 'acc-toggle';
    toggle.id = btnId;
    toggle.setAttribute('type', 'button');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', id);

    var labelWrap = document.createElement('div');
    labelWrap.className = 'acc-label';

    var numSpan = document.createElement('span');
    numSpan.className = 'acc-num';
    numSpan.textContent = num;

    var textSpan = document.createElement('span');
    textSpan.textContent = label;

    labelWrap.appendChild(numSpan);
    labelWrap.appendChild(textSpan);

    var chevronWrap = document.createElement('span');
    chevronWrap.innerHTML = '<svg class="acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 8L10 13L15 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var chevron = chevronWrap.firstChild;

    toggle.appendChild(labelWrap);
    toggle.appendChild(chevron);

    var panel = document.createElement('div');
    panel.className = 'acc-panel';
    panel.id = id;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', btnId);

    var inner = document.createElement('div');
    inner.className = 'acc-panel-inner';

    inner.appendChild(section);
    panel.appendChild(inner);
    item.appendChild(toggle);
    item.appendChild(panel);
    wrapper.appendChild(item);

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      panel.classList.toggle('is-open', !isOpen);
      // Kick reveal animations for content now scrolling into view
      if (!isOpen) {
        setTimeout(function () {
          panel.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
            el.classList.add('visible');
          });
        }, 60);
      }
    });
  });
}());

const copyBtn = document.getElementById('copy-btn');
if (copyBtn) {
  const copyLabel = copyBtn.querySelector('.copy-label');
  const originalText = copyLabel ? copyLabel.textContent : 'Copy';
  const copiedText = copyBtn.dataset.copied || 'Copied!';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('chanfungcf@outlook.com').then(() => {
      copyBtn.classList.add('copied');
      if (copyLabel) copyLabel.textContent = copiedText;
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        if (copyLabel) copyLabel.textContent = originalText;
      }, 2200);
    });
  });
}
