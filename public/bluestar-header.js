(function () {
  var MAPS = "https://maps.app.goo.gl/qe9DeNRzbtZ6wmtP8";
  var PIN =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>';
  var CLOCK =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v4.2l2.6 1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function locChip() {
    var a = document.createElement("a");
    a.className = "bs-chip bs-loc";
    a.href = MAPS;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("data-bs-loc", "");
    a.setAttribute("aria-label", "Location: 105 W Marguerita Dr, Garland, TX 75040");
    a.innerHTML =
      '<span class="bs-pin">' +
      PIN +
      '</span><span class="bs-copy"><span class="bs-kicker">Location</span><span class="bs-main">Garland, TX</span><span class="bs-sub">105 W Marguerita Dr</span></span>';
    return a;
  }

  function hoursChip() {
    var el = document.createElement("div");
    el.className = "bs-chip bs-hours";
    el.setAttribute("data-bs-hours", "");
    el.setAttribute("aria-label", "Working hours: open 7 days, Monday through Sunday, nights and weekends");
    el.innerHTML =
      '<span class="bs-pin">' +
      CLOCK +
      '</span><span class="bs-copy"><span class="bs-kicker">Hours</span><span class="bs-main">Open 7 days</span><span class="bs-sub">Mon–Sun · nights & weekends</span></span>';
    return el;
  }

  function homeButtons() {
    var section = document.getElementById("how-it-works");
    if (!section) return;
    var wrap = section.querySelector("#bs-home-links");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "bs-home-links";
      wrap.innerHTML =
        '<a href="/results">JOBS WE DONE</a>' +
        '<a href="/areas">WHERE WE SERVE</a>';
      section.appendChild(wrap);
    }
    var cloud = section.querySelector('[data-framer-name="Top Cloud"]');
    var gap = cloud ? cloud.offsetTop : 0;
    if (gap > 70) {
      wrap.style.display = "flex";
      wrap.style.top = Math.max(12, Math.round((gap - 48) / 2)) + "px";
    } else {
      wrap.style.display = "none";
    }
  }

  function yellowLinks() {
    var section = document.getElementById("before-after");
    if (!section) return;
    var banners = section.querySelectorAll('[data-framer-name="Custom Quote Banner"]');
    var visible = null;
    for (var i = 0; i < banners.length; i++) {
      if (banners[i].offsetHeight > 20 && getComputedStyle(banners[i]).display !== "none") {
        visible = banners[i];
        break;
      }
    }
    if (!visible) return;
    var anchor = visible;
    var parent = visible.parentElement;
    if (
      parent &&
      parent !== section &&
      !parent.querySelector('[data-framer-name="Bottom Wave"]') &&
      parent.parentElement &&
      parent.parentElement.querySelector('[data-framer-name="Bottom Wave"]')
    ) {
      anchor = parent;
    }
    var bar = document.getElementById("bs-yellow-links");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "bs-yellow-links";
      bar.innerHTML =
        '<div class="bs-yl-copy"><span class="bs-yl-kicker">✦ Our work</span><strong>See the jobs we done and where we serve.</strong></div>' +
        '<div class="bs-yl-actions"><a href="/results">Jobs We Done</a><a href="/areas">Where We Serve</a></div>';
    }
    if (bar.previousElementSibling !== anchor) anchor.insertAdjacentElement("afterend", bar);
    bar.style.width = anchor.offsetWidth + "px";
    var wave = section.querySelector('[data-framer-name="Bottom Wave"]');
    var flow = anchor.parentElement;
    var end = bar.offsetTop + bar.offsetHeight + 20;
    if (flow && flow !== section) flow.style.minHeight = end + "px";
    var waveH = wave ? wave.offsetHeight : 0;
    var sectionEnd = (flow && flow !== section ? flow.offsetTop : 0) + end + waveH;
    if (section.offsetHeight < sectionEnd) section.style.height = sectionEnd + "px";
    if (wave) wave.style.top = section.offsetHeight - waveH + "px";
  }

  function credit() {
    var line = document.getElementById("bs-credit");
    if (!line) {
      line = document.createElement("div");
      line.id = "bs-credit";
      line.innerHTML =
        'Website Designed By <a href="https://digitalksco.com" target="_blank" rel="noopener noreferrer">Digi Talk Solutions</a> · <a href="https://digitalksco.com" target="_blank" rel="noopener noreferrer">Digitalksco.com</a>';
    }
    var root = document.querySelector("[data-framer-root]") || document.body;
    if (line.parentElement !== root) root.appendChild(line);
  }

  function apply() {
    homeButtons();
    yellowLinks();
    credit();
    document.querySelectorAll('a[href="./results"], a[href="/results"]').forEach(function (a) {
      if (a.closest("#bs-home-links") || !a.querySelector("p")) return;
      var parent = a.parentElement;
      if (!parent || parent.querySelector("[data-bs-areas]")) return;
      var clone = a.cloneNode(true);
      clone.href = "/areas";
      clone.setAttribute("data-bs-areas", "");
      var label = clone.querySelector("p");
      if (label) label.textContent = "Where We Serve";
      a.insertAdjacentElement("afterend", clone);
    });
    document.querySelectorAll('[data-framer-name="Left"]').forEach(function (left) {
      if (!left.querySelector("[data-bs-loc]")) left.appendChild(locChip());
    });
    document.querySelectorAll('[data-framer-name="Actions"]').forEach(function (actions) {
      if (!actions.querySelector("[data-bs-hours]")) actions.insertBefore(hoursChip(), actions.firstChild);
    });
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      apply();
    });
  }

  function boot() {
    apply();
    var root = document.getElementById("main") || document.body;
    new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
