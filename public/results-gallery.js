(function () {
  var jobs = null;
  var city = new URLSearchParams(location.search).get("city") || "All";
  var galleryEl = null;
  var rendering = false;

  function esc(value) {
    var amp = String.fromCharCode(38);
    return String(value)
      .replace(new RegExp(amp, "g"), amp + "amp;")
      .replace(/</g, amp + "lt;")
      .replace(/>/g, amp + "gt;")
      .replace(/"/g, amp + "quot;");
  }

  function servicePhrase(service) {
    var map = {
      "Window cleaning": "Window cleaning services",
      "Power washing": "Power washing services",
      "Post-construction cleaning": "Post construction cleaning services",
      "Floor stripping & waxing": "Floor cleaning services",
      "Floor buffing": "Floor cleaning services",
      "Carpet cleaning": "Carpet cleaning services",
      "Concrete sealing": "Concrete sealing services"
    };
    return map[service] || service + " services";
  }

  function venueWord(place) {
    var p = String(place).toLowerCase();
    if (/hospital|medical|children's medical|health|clinic/.test(p)) return "Hospital";
    if (/high school|middle school|elementary|college|university|campus|\bsmu\b|\btcu\b/.test(p)) return "School";
    if (/mall|galleria|marketplace|town center|shops at|shops of|stonebriar|northpark|golden triangle|shopping center/.test(p)) return "Mall";
    if (/farmers market|stockyards|texas live|sundance square|deep ellum|bishop arts|legacy west|entertainment district/.test(p)) return "Restaurant";
    return "";
  }

  function keywordPhrase(job) {
    var phrase = servicePhrase(job.service);
    var venue = venueWord(job.place);
    if (!venue) return phrase;
    var core = phrase.replace(/ services$/, "");
    return venue + " " + core.charAt(0).toLowerCase() + core.slice(1) + " services";
  }

  function tagLabel(job) {
    var venue = venueWord(job.place);
    if (venue) return venue + " cleaning";
    return servicePhrase(job.service).replace(/ services$/, "");
  }

  function host() {
    if (!galleryEl) {
      galleryEl = document.createElement("section");
      galleryEl.id = "bs-job-gallery";
      galleryEl.setAttribute("aria-label", "Finished jobs");
    }
    return galleryEl;
  }

  function place() {
    var el = host();
    var section = document.getElementById("before-after");
    if (section) {
      if (el.parentElement !== section) section.insertBefore(el, section.firstChild);
      Array.prototype.forEach.call(section.children, function (child) {
        if (child !== el) child.style.setProperty("display", "none", "important");
      });
    } else if (!el.isConnected) {
      (document.getElementById("main") || document.body).appendChild(el);
    }
    if (jobs && !rendering && !el.querySelector(".bs-job-grid")) render();
  }

  function render() {
    if (!jobs || rendering) return;
    rendering = true;
    var el = host();
    var cities = [];
    jobs.forEach(function (job) {
      if (cities.indexOf(job.city) === -1) cities.push(job.city);
    });
    cities.sort();
    var shown = city === "All" ? jobs : jobs.filter(function (job) { return job.city === city; });
    var filters = [
      '<button type="button" data-city="All" class="' + (city === "All" ? "on" : "") + '">All ' + jobs.length + "</button>",
    ];
    cities.forEach(function (name) {
      var count = jobs.filter(function (job) { return job.city === name; }).length;
      filters.push(
        '<button type="button" data-city="' + esc(name) + '" class="' + (city === name ? "on" : "") + '">' +
          esc(name) + " " + count + "</button>"
      );
    });
    var cards = shown
      .map(function (job) {
        var line = keywordPhrase(job) + " jobs we done in " + job.place;
        return (
          '<figure class="bs-job">' +
            '<img src="' + esc(job.src) + '" alt="' + esc(line) + '" loading="lazy" decoding="async">' +
            "<figcaption>" +
              '<span class="bs-svc">' + esc(tagLabel(job)) + "</span>" +
              '<p class="bs-where">' + esc(line) + "</p>" +
              '<p class="bs-loc">' + esc(job.place) + ", " + esc(job.city) + ", TX</p>" +
            "</figcaption>" +
          "</figure>"
        );
      })
      .join("");
    el.innerHTML =
      '<h2 class="bs-gallery-title">JOBS WE DONE</h2>' +
      '<p class="bs-lead">Every photo is a finished Blue Star job. The heading names the service and the place. Where We Serve lists every city.</p>' +
      '<div class="bs-filters">' + filters.join("") + "</div>" +
      '<div class="bs-job-grid" id="bs-job-grid">' + cards + "</div>";
    el.querySelectorAll(".bs-filters button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        city = btn.getAttribute("data-city");
        render();
      });
    });
    rendering = false;
    place();
  }

  function boot() {
    place();
    if (jobs) return;
    fetch("/gallery/jobs.json")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        jobs = data;
        render();
      })
      .catch(function () {});
  }

  var root = document.getElementById("main") || document.body;
  new MutationObserver(function () {
    place();
  }).observe(root, { childList: true, subtree: true });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
