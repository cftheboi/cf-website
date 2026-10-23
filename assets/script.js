
const menuButton = document.querySelector('.menu-toggle');

// Shared bilingual SEO/GEO signals for crawlers that render JavaScript.
(function addDiscoveryMetadata() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const pairs = {
    'index.html': ['https://cfchan.hk/', 'https://cfchan.hk/home-zh.html'],
    'home.html': ['https://cfchan.hk/', 'https://cfchan.hk/home-zh.html'],
    'home-zh.html': ['https://cfchan.hk/', 'https://cfchan.hk/home-zh.html'],
    'about.html': ['https://cfchan.hk/about.html', 'https://cfchan.hk/about-zh.html'],
    'about-zh.html': ['https://cfchan.hk/about.html', 'https://cfchan.hk/about-zh.html'],
    'blog.html': ['https://cfchan.hk/blog.html', 'https://cfchan.hk/blog-zh.html'],
    'blog-zh.html': ['https://cfchan.hk/blog.html', 'https://cfchan.hk/blog-zh.html'],
    'projects.html': ['https://cfchan.hk/projects.html', 'https://cfchan.hk/projects-zh.html'],
    'projects-zh.html': ['https://cfchan.hk/projects.html', 'https://cfchan.hk/projects-zh.html'],
    'apps.html': ['https://cfchan.hk/apps.html', 'https://cfchan.hk/apps-zh.html'],
    'apps-zh.html': ['https://cfchan.hk/apps.html', 'https://cfchan.hk/apps-zh.html'],
    'contact.html': ['https://cfchan.hk/contact.html', 'https://cfchan.hk/contact-zh.html'],
    'contact-zh.html': ['https://cfchan.hk/contact.html', 'https://cfchan.hk/contact-zh.html']
  };
  const urls = pairs[page] || pairs['index.html'];
  [['en-HK', urls[0]], ['zh-Hant-HK', urls[1]], ['x-default', urls[0]]].forEach(([lang, href]) => {
    if (document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = lang;
    link.href = href;
    document.head.appendChild(link);
  });

  if (!document.querySelector('script[data-entity-schema]')) {
    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.dataset.entitySchema = 'true';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': 'https://cfchan.hk/#person',
      name: 'Chan Chak Fung',
      alternateName: ['CF Chan', '陳澤鋒'],
      jobTitle: ['Entrepreneur', 'Applied AI Practitioner', 'Technology Commentator', 'Low-Altitude Economy Practitioner'],
      url: 'https://cfchan.hk/',
      image: 'https://cfchan.hk/assets/portrait.jpeg',
      sameAs: ['https://cfchan.substack.com/'],
      knowsAbout: ['Applied AI', 'AI Agents', 'AI Business Workflow', 'Emerging Technology', 'Low-Altitude Economy', 'Drones', 'Entrepreneurship', 'Business Transformation', 'Technology Strategy'],
      address: { '@type': 'PostalAddress', addressLocality: 'Hong Kong', addressCountry: 'HK' }
    });
    document.head.appendChild(schema);
  }
}());

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
}, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
// Safety net: never leave content hidden if the observer misses an element (e.g. restored scroll position, tall sections).
window.addEventListener('load', () => setTimeout(() => {
  document.querySelectorAll('.reveal:not(.visible)').forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
  });
}, 1200));

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
  // Prefer the same-origin Netlify proxy. If the site is hosted somewhere that
  // ignores Netlify redirects, use rss2json as a CORS-friendly fallback.
  let xmlText = '';
  try {
    const res = await fetch('/substack-feed', { headers: { Accept: 'application/rss+xml, application/xml, text/xml' } });
    if (!res.ok) throw new Error(`Feed proxy returned ${res.status}`);
    xmlText = await res.text();
    if (!/<(?:rss|feed)[\s>]/i.test(xmlText)) throw new Error('Feed proxy did not return RSS');
  } catch {
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://cfchan.substack.com/feed');
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`RSS fallback returned ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('RSS fallback returned invalid data');
    return data.items.slice(0, limit).map(item => normaliseSubstackPost({
      title: item.title,
      canonical_url: item.link || item.guid,
      post_date: item.pubDate,
      cover_image: item.thumbnail || item.enclosure?.link || '',
      description: item.description || item.content || '',
      postTags: item.categories || []
    }));
  }
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (xml.querySelector('parsererror')) throw new Error('Invalid RSS XML');
  const items = Array.from(xml.querySelectorAll('item')).slice(0, limit);
  if (!items.length) throw new Error();
  return items.map(item => {
    const get = tag => item.querySelector(tag)?.textContent?.trim() || '';
    return normaliseSubstackPost({
      title: get('title'),
      canonical_url: get('guid') || get('link'),
      post_date: get('pubDate'),
      cover_image: item.querySelector('enclosure')?.getAttribute('url') || '',
      description: get('description'),
      postTags: Array.from(item.querySelectorAll('category')).map(c => c.textContent.trim())
    });
  });
}

function normaliseSubstackPost(post) {
  const decodeBox = document.createElement('textarea');
  decodeBox.innerHTML = String(post.description || '').replace(/<[^>]+>/g, ' ');
  const desc = decodeBox.value.replace(/\s+/g, ' ').trim();
  const parsedDate = post.post_date ? new Date(post.post_date) : null;
  return {
    title: post.title || '',
    canonical_url: post.canonical_url || 'https://substack.com/@cfchan',
    post_date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : '',
    cover_image: post.cover_image || '',
    subtitle: desc.slice(0, 160),
    description: desc,
    wordcount: desc ? Math.ceil(desc.split(/\s+/).length * 5) : 0,
    postTags: post.postTags || []
  };
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
      const visual = post.cover_image
        ? `<div class="post-visual post-visual-img" style="background-image:url('${post.cover_image}')"></div>`
        : `<div class="post-visual ${vis.cls}"><span>${vis.label}</span></div>`;
      return `<a class="post-card" data-category="${cats.join(' ')}" href="${post.canonical_url}" target="_blank" rel="noopener">${visual}<p>${vis.display}${mins ? ' · ' + mins : ''} · ${date}</p><h3>${post.title}</h3></a>`;
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
    if (/drone|lae|low.?altitude|uav|unmanned/.test(tl))                        cats.add('lae');
    if (/robot|vision|sensor|iot|inspection|autonom|hardware|embedded/.test(tl)) cats.add('real-world');
    if (/ai|machine.?learning|llm|gpt|automat/.test(tl))                        cats.add('applied-ai');
    if (/entrepreneur|startup|business|strategy|management|tech|technology|software|digital|innovation/.test(tl)) cats.add('tech-business');
    if (/social|society|philosophy|culture|education/.test(tl))                 cats.add('future-society');
  });

  // Low-Altitude Economy — checked first so LAE posts aren't also bucketed as "AI in the Real World"
  const isLae = /\b(low.altitude|lae|drone|uav|suas?|unmanned|airspace)\b/.test(t) || /低空經濟|無人機|飛行器|空域/.test(t);
  if (isLae) cats.add('lae');

  // AI in the Real World — physical/hardware application of AI (computer vision, robotics, IoT, inspection)
  if (!isLae && (/\b(robot\w*|computer vision|sensor\w*|\biot\b|inspection|autonom\w*|physical\w*|hardware|hydraulic|embedded|camera\w*)\b/.test(t)
      || /機器人|感測器|傳感器|物聯網|巡檢|自動駕駛|實體|硬件/.test(t))) cats.add('real-world');

  // Applied AI — business/software application of AI
  if (/\b(ai|a\.i\.|artificial intelligence|llm|chatgpt|gpt|machine learning|automat\w*|generat\w*|generative|intelligent|workflow|adopt\w*|productiv\w*)\b/.test(t)
      || /人工智能|機器學習|自動化|生成式?|大語言|語言模型|智能系統|ai能|ai可|工作流程|生產力/.test(t)) cats.add('applied-ai');

  // Technology & Business — entrepreneurship, strategy, general technology/digital
  if (/\b(entrepreneur\w*|startup|sales|growth|venture|gig economy|business development|business|transform\w*|strateg\w*|management|consulting|corporate|enterprise|revenue|tech\w*|web3|blockchain|bim|digital|innovation|apps?|software|platform|data|personal|own\w*)\b/.test(t)
      || /創業|初創|企業家|商業模式|銷售|商業|業務|策略|管理|諮詢|企業|科技|技術|軟體|軟件|應用程式|數碼|數位|創新|平台|個人化?|app/.test(t)) cats.add('tech-business');

  // Future Society — society, culture, ethics, future of work
  if (/\b(social|society|philosoph\w*|culture|youth|community|future|human\w*|thinker\w*|education|critical|everyone|people|learn\w*|ethic\w*)\b/.test(t)
      || /社會|未來|哲學|文化|教育|培養|思考者?|人類|每個人|時代|批判/.test(t)) cats.add('future-society');

  return cats.size ? [...cats] : ['tech-business'];
}

function catVisual(cat) {
  return {
    'applied-ai':     { cls: 'visual-ai',     label: 'AI',       display: 'APPLIED AI' },
    'real-world':     { cls: 'visual-tech',   label: '⌁',        display: 'AI IN THE REAL WORLD' },
    lae:              { cls: 'visual-lae',    label: 'HK\n低空', display: 'LOW ALTITUDE ECONOMY' },
    'tech-business':  { cls: 'visual-change', label: '→',        display: 'TECHNOLOGY & BUSINESS' },
    'future-society': { cls: 'visual-social', label: '人',       display: 'FUTURE SOCIETY' },
  }[cat] || { cls: 'visual-change', label: '→', display: 'TECHNOLOGY & BUSINESS' };
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

// Download disclaimer: links with [data-disclaimer] show a confirmation dialog before downloading.
(function setupDownloadDisclaimer() {
  const links = document.querySelectorAll('a[data-disclaimer]');
  if (!links.length) return;

  const zh = document.documentElement.lang.startsWith('zh');
  const text = zh ? {
    title: '免責聲明',
    body: ['此程式為<strong>試用版應用程式</strong>，旨在展示 Vibe Coding（氛圍編程）的強大威力，僅供示範及試用。',
           '程式按「現狀」提供，不附帶任何保證。下載及使用本程式所引致的任何損害或損失（包括但不限於電腦損壞、資料遺失或系統故障），陳澤鋒及本網站概不負責。',
           '下載即表示你明白並同意自行承擔使用風險。'],
    cancel: '取消',
    accept: '我明白，繼續下載'
  } : {
    title: 'Disclaimer',
    body: ['This is a <strong>trial app</strong> built to demonstrate the power of vibe coding. It is provided for demonstration and trial use only.',
           'The software is provided "as is" without warranty of any kind. The author and this website accept no liability for any damage or loss — including but not limited to damage to your computer, loss of data or system failure — arising from downloading or using it.',
           'By downloading, you acknowledge and accept that you use it at your own risk.'],
    cancel: 'Cancel',
    accept: 'I understand, download'
  };

  const dialog = document.createElement('dialog');
  dialog.className = 'disclaimer-dialog';
  dialog.setAttribute('aria-labelledby', 'disclaimer-title');
  dialog.innerHTML = `<form method="dialog">
    <h2 id="disclaimer-title">${text.title}</h2>
    ${text.body.map((p) => `<p>${p}</p>`).join('')}
    <div class="disclaimer-actions">
      <button type="button" class="disclaimer-cancel">${text.cancel}</button>
      <button type="button" class="disclaimer-accept">${text.accept}</button>
    </div>
  </form>`;
  document.body.appendChild(dialog);

  let pending = null;
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      pending = link;
      dialog.showModal();
    });
  });

  dialog.querySelector('.disclaimer-cancel').addEventListener('click', () => dialog.close());
  dialog.querySelector('.disclaimer-accept').addEventListener('click', () => {
    const link = pending;
    dialog.close();
    if (!link) return;
    const a = document.createElement('a');
    a.href = link.href;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
  // Click on the backdrop closes the dialog.
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
}());

// Lightweight internal page transitions, including mobile and back navigation.
(function setupPageTransitions() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes page-enter{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    body{animation:page-enter .34s cubic-bezier(.22,1,.36,1) both}
    body.page-leaving{opacity:0;transform:translateY(-6px);transition:opacity .2s ease,transform .2s ease;pointer-events:none}
    @media(max-width:620px){body{animation-duration:.28s}body.page-leaving{transition-duration:.17s}}
    @media(prefers-reduced-motion:reduce){body{animation:none}body.page-leaving{opacity:1;transform:none;transition:none}}
  `;
  document.head.appendChild(style);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let navigating = false;

  window.addEventListener('pageshow', () => {
    navigating = false;
    document.body.classList.remove('page-leaving');
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || navigating || reducedMotion.matches) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if ((link.target && link.target !== '_self') || link.hasAttribute('download')) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || !/^https?:$/.test(destination.protocol)) return;
    if (destination.pathname === window.location.pathname &&
        destination.search === window.location.search && destination.hash) return;

    event.preventDefault();
    navigating = true;
    document.body.classList.add('page-leaving');
    window.setTimeout(() => window.location.assign(destination.href), 200);
  });
}());
