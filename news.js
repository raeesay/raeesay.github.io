function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderItem(item) {
  const li = document.createElement('li');

  const dateSpan = document.createElement('span');
  dateSpan.className = 'news-date';
  dateSpan.textContent = formatDate(item.date);

  const textDiv = document.createElement('div');
  if (item.url && item.linkText && item.text.includes(item.linkText)) {
    const [before, after] = item.text.split(item.linkText);
    textDiv.appendChild(document.createTextNode(before));
    const a = document.createElement('a');
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = item.linkText;
    textDiv.appendChild(a);
    textDiv.appendChild(document.createTextNode(after));
  } else {
    textDiv.textContent = item.text;
  }

  li.appendChild(dateSpan);
  li.appendChild(textDiv);
  return li;
}

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('news-list');
  if (!list) return;

  fetch('news.json')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load news.json');
      return res.json();
    })
    .then((items) => {
      items.sort((a, b) => (a.date < b.date ? 1 : -1));
      list.innerHTML = '';
      items.forEach((item) => list.appendChild(renderItem(item)));
    })
    .catch(() => {
      list.innerHTML = '<li><span class="placeholder">Could not load news.json</span></li>';
    });
});
