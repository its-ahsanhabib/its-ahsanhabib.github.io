/* global variables */
var classicLayout = false;
var portfolioKeyword;
var detailSection = null; // 'portfolio' or 'blog' while a detail overlay URL is active
var mapCanvas;


// ==============================
// PROJECTS (data-driven from portfolio.json)
// ------------------------------
// Every project lives in portfolio.json. The grid cards and the project
// detail view are both rendered from it — no per-project HTML file needed.
// See PORTFOLIO.md for the entry format.
// ==============================

var projectsRequest = null;

function getProjects() {
	if (!projectsRequest) {
		projectsRequest = $.getJSON('portfolio.json').then(sortProjects);
	}
	return projectsRequest;
}

// Featured first, then newest year first. Projects without a year go last.
// Ties keep their order from portfolio.json.
function sortProjects(data) {
	return $.map(data || [], function (item, i) { return { item: item, i: i }; })
		.sort(function (a, b) {
			var fa = a.item.featured ? 1 : 0, fb = b.item.featured ? 1 : 0;
			if (fa !== fb) return fb - fa;
			var ya = a.item.year || 0, yb = b.item.year || 0;
			if (ya !== yb) return yb - ya;
			return a.i - b.i;
		})
		.map(function (x) { return x.item; });
}

// Accepts "smart-cane", "portfolio-item-04" or the legacy "portfolio-item-04.html".
function projectIdFromUrl(url) {
	return String(url || '').split('/').pop().replace(/\.html?$/i, '');
}

function escapeHtml(s) {
	return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
		return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
	});
}

function loadPortfolioItems() {
	var $grid = $('#portfolio-grid');
	if (!$grid.length) return;

	getProjects().done(function (projects) {
		$grid.empty();

		$.each(projects, function (index, item) {
			var classes = (item.categories || []).join(' ') + (item.featured ? ' is-featured' : '');
			var title = escapeHtml(item.title);
			var year = item.year ? '<span class="project-year">' + escapeHtml(item.year) + '</span>' : '';
			var badge = item.featured ? '<span class="project-badge">Featured</span>' : '';

			$grid.append(
				'<div class="media-cell hentry ' + escapeHtml(classes) + '">' +
					'<div class="media-box">' +
						'<img src="' + escapeHtml(item.cover) + '" alt="' + title + '">' +
						badge +
						'<div class="mask"></div>' +
						'<a href="' + escapeHtml(item.id) + '" class="ajax" title="' + title + '"></a>' +
					'</div>' +
					'<div class="media-cell-desc">' +
						'<h3>' + title + year + '</h3>' +
						'<p class="category">' + escapeHtml(item.summary) + '</p>' +
					'</div>' +
				'</div>'
			);
		});

		// Hide filter buttons that no project uses
		$('#filters a[data-filter]').each(function () {
			var f = $(this).attr('data-filter');
			$(this).parent().toggle(f === '*' || $grid.children(f).length > 0);
		});

		if ($.fn.isotope) {
			$grid.imagesLoaded(function () {
				$grid.isotope('reloadItems').isotope({ ready: true });
			});
		}
	});
}

function renderBlock(b) {
	switch (b.type) {
		case 'image':
			return '<p><img src="' + escapeHtml(b.src) + '" alt="' + escapeHtml(b.alt || 'project') + '"></p>' +
				(b.caption ? '<h5>' + escapeHtml(b.caption) + '</h5>' : '');
		case 'video':
			return '<p><video controls preload="metadata" playsinline src="' + escapeHtml(b.src) + '"' +
				(b.poster ? ' poster="' + escapeHtml(b.poster) + '"' : '') + '></video></p>' +
				(b.caption ? '<h5>' + escapeHtml(b.caption) + '</h5>' : '');
		case 'youtube':
			return '<p><iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/' + escapeHtml(b.id) +
				'" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe></p>';
		case 'embed':
			return '<p><iframe width="560" height="315" src="' + escapeHtml(b.src) + '" frameborder="0" allowfullscreen loading="lazy"></iframe></p>';
		case 'heading':
			return '<h5>' + escapeHtml(b.text) + '</h5>';
		case 'text':
			return b.html || ''; // trusted: written by the site owner in portfolio.json
		default:
			return '';
	}
}

function renderProject(item, prev, next) {
	var nav = function (extra) {
		return '<div class="portfolio-nav' + extra + '">' +
			'<a class="prev ajax" href="' + escapeHtml(prev.id) + '" title="' + escapeHtml(prev.title) + '"></a>' +
			'<a class="back" href="#/portfolio" title="Back to portfolio"></a>' +
			'<a class="next ajax" href="' + escapeHtml(next.id) + '" title="' + escapeHtml(next.title) + '"></a>' +
			'</div>';
	};

	// Optional facts row: "meta": {"Client": "...", "Role": "...", "Tech": "..."}
	var meta = '';
	if (item.year || item.meta) {
		var rows = [];
		if (item.year) rows.push(['Year', item.year]);
		$.each(item.meta || {}, function (k, v) { rows.push([k, v]); });
		meta = '<ul class="project-meta">' + $.map(rows, function (r) {
			return '<li><span>' + escapeHtml(r[0]) + '</span>' + escapeHtml(r[1]) + '</li>';
		}).join('') + '</ul>';
	}

	// Optional buttons: "links": [{"label": "GitHub", "url": "https://..."}]
	var links = '';
	if (item.links && item.links.length) {
		links = '<p class="project-links">' + $.map(item.links, function (l) {
			return '<a class="button" href="' + escapeHtml(l.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(l.label) + '</a>';
		}).join(' ') + '</p>';
	}

	// Consecutive heading/text blocks are grouped into one centered text column.
	var body = '', group = '';
	$.each(item.blocks || [], function (i, b) {
		var isText = b.type === 'heading' || b.type === 'text';
		if (isText) { group += renderBlock(b); return; }
		if (group) { body += '<div class="mini-text">' + group + '</div>'; group = ''; }
		body += renderBlock(b);
	});
	if (group) body += '<div class="mini-text">' + group + '</div>';

	return '<div class="portfolio-single page-layout"><div class="layout-medium"><article class="hentry">' +
		'<header class="entry-header">' + nav('') +
		'<h1 class="entry-title">' + escapeHtml(item.title) + '</h1>' + meta +
		'</header>' +
		'<div class="entry-content">' + body + links + nav(' bottom') + '</div>' +
		'</article></div></div>';
}

// Resolves with the rendered HTML for a project id, or rejects if unknown.
function getProjectHtml(url) {
	var id = projectIdFromUrl(url);
	return getProjects().then(function (projects) {
		for (var i = 0; i < projects.length; i++) {
			if (projects[i].id === id) {
				var n = projects.length;
				return renderProject(projects[i], projects[(i - 1 + n) % n], projects[(i + 1) % n]);
			}
		}
		return $.Deferred().reject().promise();
	});
}


// Home: small tiles for the first featured projects (same order as the portfolio grid)
var HOME_FEATURED_COUNT = 3;

function renderHomeFeatured() {
	var $tiles = $('#home-featured');
	if (!$tiles.length) return;
	getProjects().done(function (projects) {
		var featured = $.grep(projects, function (p) { return p.featured; }).slice(0, HOME_FEATURED_COUNT);
		$tiles.html($.map(featured, function (p) {
			return '<a class="hv-tile" href="#/portfolio/' + escapeHtml(p.id) + '" title="' + escapeHtml(p.title) + '">' +
				'<span class="hv-tile-img" style="background-image:url(\'' + escapeHtml(p.cover) + '\')"></span>' +
				'<span class="hv-tile-title">' + escapeHtml(p.title) + '</span></a>';
		}).join(''));
	});
}

// ==============================
// BLOG / WRITING (data-driven from blog.json)
// ------------------------------
// Post list in #blog-list; a post opens in the same overlay as projects at #/blog/<id>.
// Each entry: id, title, date (YYYY-MM-DD), lang, summary, cover?, html OR text, source?
// See BLOG.md for the format.
// ==============================
var postsRequest = null;
var BLOG_PAGE_SIZE = 12;
var blogShown = 0;
var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getPosts() {
	if (!postsRequest) {
		postsRequest = $.getJSON('blog.json').then(function (data) {
			return (data || []).slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
		});
	}
	return postsRequest;
}

function formatPostDate(iso) {
	var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
	return m ? (+m[3]) + ' ' + MONTH_NAMES[+m[2] - 1] + ' ' + m[1] : '';
}

// "text" (plain, blank line = new paragraph, newline = line break) or trusted "html"
function postBodyHtml(p) {
	if (p.html) return p.html;
	return $.map(String(p.text || '').split(/\n\s*\n/), function (para) {
		return para.trim() ? '<p>' + escapeHtml(para.trim()).replace(/\n/g, '<br>') + '</p>' : null;
	}).join('');
}

function renderBlogList(reset) {
	var $list = $('#blog-list');
	if (!$list.length) return;
	getPosts().done(function (posts) {
		if (reset) { $list.empty(); blogShown = 0; }
		var next = posts.slice(blogShown, blogShown + BLOG_PAGE_SIZE);
		$list.append($.map(next, function (p) {
			var lang = p.lang ? ' lang="' + escapeHtml(p.lang) + '"' : '';
			return '<a class="blog-card' + (p.cover ? ' has-cover' : '') + '" href="#/blog/' + escapeHtml(p.id) + '">' +
				(p.cover ? '<span class="blog-card-img" style="background-image:url(\'' + escapeHtml(p.cover) + '\')"></span>' : '') +
				'<span class="blog-card-body">' +
				'<span class="blog-card-date">' + escapeHtml(formatPostDate(p.date)) + '</span>' +
				'<span class="blog-card-title"' + lang + '>' + escapeHtml(p.title) + '</span>' +
				'<span class="blog-card-summary"' + lang + '>' + escapeHtml(p.summary || '') + '</span>' +
				'<span class="blog-card-more">Read &rarr;</span>' +
				'</span></a>';
		}).join(''));
		blogShown += next.length;
		$('#blog-more').toggle(blogShown < posts.length);
		$('#blog-count').text(posts.length);
	});
}

function getPostHtml(url) {
	var id = projectIdFromUrl(url);
	return getPosts().then(function (posts) {
		for (var i = 0; i < posts.length; i++) {
			if (String(posts[i].id) === id) {
				var p = posts[i], n = posts.length;
				var prev = posts[(i - 1 + n) % n], next = posts[(i + 1) % n];
				var lang = p.lang ? ' lang="' + escapeHtml(p.lang) + '"' : '';
				var nav = function (extra) {
					return '<div class="portfolio-nav' + extra + '">' +
						'<a class="prev" href="#/blog/' + escapeHtml(prev.id) + '" title="' + escapeHtml(prev.title) + '"></a>' +
						'<a class="back" href="#/blog" title="All posts"></a>' +
						'<a class="next" href="#/blog/' + escapeHtml(next.id) + '" title="' + escapeHtml(next.title) + '"></a>' +
						'</div>';
				};
				var source = p.source ? '<p class="post-source">Originally published on <a href="' + escapeHtml(p.source) +
					'" target="_blank" rel="noopener noreferrer">' + escapeHtml(p.source.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]) + '</a></p>' : '';
				return '<div class="portfolio-single page-layout blog-post"><div class="layout-medium"><article class="hentry">' +
					'<header class="entry-header">' + nav('') +
					'<h1 class="entry-title"' + lang + '>' + escapeHtml(p.title) + '</h1>' +
					'<p class="post-date">' + escapeHtml(formatPostDate(p.date)) + '</p>' +
					'</header>' +
					'<div class="entry-content post-body"' + lang + '>' + postBodyHtml(p) + '</div>' +
					source + nav(' bottom') +
					'</article></div></div>';
			}
		}
		return $.Deferred().reject().promise();
	});
}

$(document).ready(function () {
	loadPortfolioItems();
	renderHomeFeatured();
	renderBlogList(true);
	$(document).on('click', '#blog-more', function (e) { e.preventDefault(); renderBlogList(false); });
});


// Smart Section Navigation: Instant home skip + robust edge detection for content sections
(function () {
	var sections = ['#/home', '#/about', '#/resume', '#/portfolio', '#/blog', '#/contact'];
	var isTransitioning = false;

	// Shared decision logic used by both mouse-wheel and touch-swipe input.
	// delta > 0 means "scroll down / swipe up" intent, delta < 0 means the reverse -
	// same sign convention as a wheel event's deltaY.
	function evaluateScroll(delta, downThreshold, upThreshold) {
		if (isTransitioning) return;
		if ($('html').hasClass('p-overlay-on')) return; // reading a project/post: let it scroll normally

		var currentHash = window.location.hash || '#/home';

		if (currentHash.indexOf('?') !== -1) {
			currentHash = currentHash.split('?')[0];
		}

		var currentIndex = sections.indexOf(currentHash);
		if (currentIndex === -1) currentIndex = 0;

		// 1. HOME SECTION: Jump immediately on scroll down
		if (currentHash === '#/home' || currentIndex === 0) {
			if (delta > downThreshold) {
				triggerTransition(sections[1]); // Move to #/about
			}
			return;
		}

		// 2. CONTENT SECTIONS (#/about, #/resume, etc.)
		// Get the active page section element
		var $activePage = $('.pt-page.page-current');
		if (!$activePage.length) {
			// currentHash looks like "#/about" - build a valid ID selector ("#about")
			var pageId = currentHash.replace('#/', '');
			if (pageId) {
				$activePage = $('#' + pageId);
			}
		}

		var activeEl = $activePage[0];

		if (!activeEl) return;

		// Check scroll metrics of the section container AND the inner content
		var scrollTop = activeEl.scrollTop;
		var scrollHeight = activeEl.scrollHeight;
		var clientHeight = activeEl.clientHeight;

		// Fallback check in case inner child div (.content) holds the scrollbar
		var $content = $activePage.find('.content');
		if ($content.length && scrollHeight <= clientHeight) {
			scrollTop = $content[0].scrollTop;
			scrollHeight = $content[0].scrollHeight;
			clientHeight = $content[0].clientHeight;
		}

		// Determine if section is scrolled to the edges (with a 20px buffer zone)
		var isAtBottom = (scrollHeight - scrollTop - clientHeight) <= 20 || (scrollHeight <= clientHeight + 10);
		var isAtTop = scrollTop <= 20;

		// Scroll Down -> Jump to Next Section
		if (delta > downThreshold && isAtBottom && currentIndex < sections.length - 1) {
			triggerTransition(sections[currentIndex + 1]);
		}
		// Scroll Up -> Jump to Previous Section
		else if (delta < upThreshold && isAtTop && currentIndex > 0) {
			triggerTransition(sections[currentIndex - 1]);
		}
	}

	$(window).on('wheel deltaX deltaY', function (event) {
		evaluateScroll(event.originalEvent.deltaY, 20, -25);
	});

	// TOUCH SWIPE: wheel events don't fire on touchscreens, so mirror the same
	// edge-triggered section jump for a vertical swipe gesture.
	var touchStartY = null;
	var TOUCH_SWIPE_THRESHOLD = 40;

	$(window).on('touchstart', function (event) {
		var touch = event.originalEvent.touches && event.originalEvent.touches[0];
		touchStartY = touch ? touch.clientY : null;
	});

	$(window).on('touchend', function (event) {
		if (touchStartY === null) return;

		var touch = event.originalEvent.changedTouches && event.originalEvent.changedTouches[0];
		if (!touch) { touchStartY = null; return; }

		// Swiping up (finger moves toward top) means "reveal more below", the
		// same intent as a positive wheel deltaY.
		var delta = touchStartY - touch.clientY;
		touchStartY = null;

		if (Math.abs(delta) < TOUCH_SWIPE_THRESHOLD) return;

		evaluateScroll(delta, TOUCH_SWIPE_THRESHOLD - 1, -(TOUCH_SWIPE_THRESHOLD - 1));
	});

	function triggerTransition(targetHash) {
		isTransitioning = true;

		// Update hash for jquery.address navigation
		window.location.hash = targetHash;

		// Cooldown timer matching template transition speed
		setTimeout(function () {
			isTransitioning = false;
		}, 900);
	}
})();




(function ($) {
	"use strict";


	/* DOCUMENT LOAD */
	$(function () {


		// ------------------------------
		// start loader
		showLoader();
		// ------------------------------


		// ------------------------------
		// HOME TEXT TYPE EFFECT 
		var typist;
		typist = document.querySelector("#typist-element");
		new Typist(typist, {
			letterInterval: 60,
			textInterval: 3000
		});
		// ------------------------------



		// ------------------------------
		// HEADER FUNCTIONS
		$('.search-toggle').on("click", function () {
			$('html').toggleClass('is-search-toggled-on');
			$(".search-box input").trigger("focus");
		});

		$('.menu-toggle').on("click", function () {
			$('html').toggleClass('is-menu-toggled-on');
		});
		// ------------------------------



		// ------------------------------
		// remove click delay on touch devices
		FastClick.attach(document.body);
		// ------------------------------



		// ------------------------------
		// ONE PAGE LAYOUT FUNCTIONS
		if ($('html').hasClass('one-page-layout')) {

			// ------------------------------
			// PORTFOLIO DETAILS
			// if url contains a portfolio detail url
			portfolioKeyword = $('section.portfolio').attr('id');
			var detailUrl = giveDetailUrl();
			// ------------------------------


			// ------------------------------
			// LAYOUT DETECT
			classicLayout = $('html').attr('data-classic-layout') === 'true';
			classicLayout = classicLayout || ($('html').attr('data-mobile-classic-layout') === 'true' && ($(window).width() < 1025));
			classicLayout = classicLayout || !Modernizr.cssanimations;

			if (classicLayout) { // CLASSIC LAYOUT
				$('html').addClass('classic-layout');
				setActivePage();
				$.address.change(function () {
					setActivePage();
					$('html').removeClass('is-menu-toggled-on');
				});
			} else { // MODERN LAYOUT
				$('html').addClass('modern-layout');
				$.address.change(function () {
					setActivePage();
					$('html').removeClass('is-menu-toggled-on');
				});
			}

			// don't change hash tag if isAnimating
			$('.nav-menu a').on("click", function () {
				if (window.isAnimating) {
					return false;
				}
			});

			// FULL BROWSER BACK BUTTON SUPPORT 
			$.address.change(function () {
				var detailUrl = giveDetailUrl();
				if (detailUrl != -1) {
					showProjectDetails(detailUrl);
				} else {
					var cur = $.address.path();
					if (cur.indexOf("/" + portfolioKeyword) === 0) {
						hideProjectDetails(true, false, portfolioKeyword);
					} else if (cur.indexOf("/blog") === 0) {
						hideProjectDetails(true, false, 'blog');
					}
				}
			});
		}
		// ------------------------------	




		// ------------------------------
		// SETUP
		setup();
		// ------------------------------



		// ------------------------------
		// PORTFOLIO DETAILS
		// Show details
		$(".one-page-layout a.ajax").live('click', function () {

			var url = $(this).attr('href');
			var baseUrl = $.address.baseURL();

			if (url.indexOf(baseUrl) !== -1) { // full url
				var total = url.length;
				detailUrl = url.slice(baseUrl.length + 1, total);
				$.address.path('/' + detailUrl);
			} else { // relative url
				detailUrl = url;
				$.address.path(portfolioKeyword + '/' + detailUrl);
			}

			return false;

		});
		// ------------------------------



		// ------------------------------
		// FORM VALIDATION
		// comment form validation fix
		$('#commentform').addClass('validate-form');
		$('#commentform').find('input,textarea').each(function (index, element) {
			if ($(this).attr('aria-required') === "true") {
				$(this).addClass('required');
			}
			if ($(this).attr('name') === "email") {
				$(this).addClass('email');
			}
		});

		// validate form
		if ($('.validate-form').length) {
			$('.validate-form').each(function () {
				$(this).validate();
			});
		}
		// ------------------------------


		// ------------------------------
		// FILL SKILL BARS
		fillBars();
		// ------------------------------




		// ------------------------------
		// GOOGLE MAP
		/*
			custom map with google api
			check out the link below for more information about api usage
			https://developers.google.com/maps/documentation/javascript/examples/marker-simple
		*/
		// When the window has finished loading create our google map below

		// Replace the old google.maps snippet with this:
		var mapContainer = document.getElementById('map-canvas');

		if (mapContainer && typeof L !== 'undefined') {
			var lat = mapContainer.getAttribute('data-latitude') || 23.810331;
			var lng = mapContainer.getAttribute('data-longitude') || 90.412521;
			var zoom = parseInt(mapContainer.getAttribute('data-zoom')) || 13;

			var map = L.map('map-canvas').setView([lat, lng], zoom);

			// OpenStreetMap tiles: free, no API key (CARTO basemaps now require one).
			// Darkened to match the site with the .map-tiles-dark filter in css/main.css.
			L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
				opacity: 0.7, // Set opacity between 0.0 and 1.0
				maxZoom: 19,
				className: 'map-tiles-dark'
			}).addTo(map);

			L.marker([lat, lng]).addTo(map);
		}
		// ------------------------------




		// ------------------------------
		/* jQuery Ajax Mail Send Script */
		var contactForm = $('#contact-form');
		var $alert = $('.site-alert');
		var $submit = contactForm.find('.submit');

		contactForm.submit(function () {
			if (contactForm.valid()) {
				NProgress.start();
				$submit.addClass("active loading");
				var formValues = contactForm.serialize();

				$.post(contactForm.attr('action'), formValues, function (data) {
					if (data == 'success') {
						contactForm.clearForm();
					}
					else {
						$alert.addClass('error');
					}
					NProgress.done();
					$alert.show();
					setTimeout(function () { $alert.hide(); }, 6000)
				});
			}
			return false
		});

		$.fn.clearForm = function () {
			return this.each(function () {
				var type = this.type, tag = this.tagName.toLowerCase();
				if (tag == 'form')
					return $(':input', this).clearForm();
				if (type == 'text' || type == 'password' || tag == 'textarea')
					this.value = '';
				else if (type == 'checkbox' || type == 'radio')
					this.checked = false;
				else if (tag == 'select')
					this.selectedIndex = -1;
			});
		};
		// ------------------------------



		// ------------------------------
		/* SOCIAL FEED WIDGET */
		var socialFeed = $('.social-feed');
		if (socialFeed.length) {
			socialFeed.each(function () {
				$(this).socialstream({
					socialnetwork: $(this).data("social-network"),
					limit: $(this).data("limit"),
					username: $(this).data("username")
				});
			});
		}
		// ------------------------------




		// ------------------------------
		// PARALLAX BG VIDEO
		var video_parallax = $(".home-section");
		video_parallax.each(function (index, element) {
			if ($(this).data('parallax-video')) {
				$(this).jarallax({
					speed: 0,
					zIndex: 1,
					videoSrc: $(this).data('parallax-video')
				});
			}
		});
		// ------------------------------



	});
	// DOCUMENT READY




	// WINDOW ONLOAD
	window.onload = function () {

		hideLoader();

	};
	// WINDOW ONLOAD	





	// ------------------------------
	// ------------------------------
	// FUNCTIONS
	// ------------------------------
	// ------------------------------


	// ------------------------------
	// SETUP : plugins
	function setup() {

		// MASONRY
		setupMasonry();

		// ------------------------------
		// LIGHTBOX
		setupLightbox();
		// ------------------------------


		// ------------------------------
		// TABS
		$('.tabs').each(function () {
			if (!$(this).find('.tab-titles li a.active').length) {
				$(this).find('.tab-titles li:first-child a').addClass('active');
				$(this).find('.tab-content > div:first-child').show();
			} else {
				$(this).find('.tab-content > div').eq($(this).find('.tab-titles li a.active').parent().index()).show();
			}
		});

		$('.tabs .tab-titles li a').on("click", function () {
			if ($(this).hasClass('active')) { return; }
			$(this).parent().siblings().find('a').removeClass('active');
			$(this).addClass('active');
			$(this).parents('.tabs').find('.tab-content > div').hide().eq($(this).parent().index()).show();
			return false;
		});
		// ------------------------------


		// ------------------------------
		// TOGGLES
		var toggleSpeed = 300;
		$('.toggle h4.active + .toggle-content').show();

		$('.toggle h4').on("click", function () {
			if ($(this).hasClass('active')) {
				$(this).removeClass('active');
				$(this).next('.toggle-content').stop(true, true).slideUp(toggleSpeed);
			} else {

				$(this).addClass('active');
				$(this).next('.toggle-content').stop(true, true).slideDown(toggleSpeed);

				//accordion
				if ($(this).parents('.toggle-group').hasClass('accordion')) {
					$(this).parent().siblings().find('h4').removeClass('active');
					$(this).parent().siblings().find('.toggle-content').stop(true, true).slideUp(toggleSpeed);
				}

			}
			return false;
		});
		// ------------------------------



		// ------------------------------
		// RESPONSIVE VIDEOS
		if ($('iframe,video').length) {
			$("html").fitVids();
		}
		// ------------------------------



		// ------------------------------
		// UNIFORM
		$("select:not([multiple]), input:checkbox, input:radio, input:file").uniform();
		var ua = navigator.userAgent.toLowerCase();
		var isAndroid = ua.indexOf("android") > -1;
		if (isAndroid) {
			$('html').addClass('android');
		}
		// ------------------------------


	}
	// setup()
	// ------------------------------




	// ------------------------------
	// MAP	
	function initializeMap() {
		var latitude = mapCanvas.data("latitude");
		var longitude = mapCanvas.data("longitude");
		var zoom = mapCanvas.data("zoom");
		var marker_image = mapCanvas.data("marker-image");

		// Basic options for a simple Google Map
		// For more options see: https://developers.google.com/maps/documentation/javascript/reference#MapOptions
		var mapOptions = {

			// How zoomed in you want the map to start at (always required)
			zoom: zoom,

			// disable zoom controls
			disableDefaultUI: true,

			// The latitude and longitude to center the map (always required)
			center: new google.maps.LatLng(latitude, longitude),

			// How you would like to style the map. 
			// This is where you would paste any style found on Snazzy Maps.
			styles: [{ "featureType": "administrative.locality", "elementType": "all", "stylers": [{ "hue": "#2c2e33" }, { "saturation": 7 }, { "lightness": 19 }, { "visibility": "on" }] }, { "featureType": "landscape", "elementType": "all", "stylers": [{ "hue": "#ffffff" }, { "saturation": -100 }, { "lightness": 100 }, { "visibility": "simplified" }] }, { "featureType": "poi", "elementType": "all", "stylers": [{ "hue": "#ffffff" }, { "saturation": -100 }, { "lightness": 100 }, { "visibility": "off" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "hue": "#bbc0c4" }, { "saturation": -93 }, { "lightness": 31 }, { "visibility": "simplified" }] }, { "featureType": "road", "elementType": "labels", "stylers": [{ "hue": "#bbc0c4" }, { "saturation": -93 }, { "lightness": 31 }, { "visibility": "on" }] }, { "featureType": "road.arterial", "elementType": "labels", "stylers": [{ "hue": "#bbc0c4" }, { "saturation": -93 }, { "lightness": -2 }, { "visibility": "simplified" }] }, { "featureType": "road.local", "elementType": "geometry", "stylers": [{ "hue": "#e9ebed" }, { "saturation": -90 }, { "lightness": -8 }, { "visibility": "simplified" }] }, { "featureType": "transit", "elementType": "all", "stylers": [{ "hue": "#e9ebed" }, { "saturation": 10 }, { "lightness": 69 }, { "visibility": "on" }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "hue": "#e9ebed" }, { "saturation": -78 }, { "lightness": 67 }, { "visibility": "simplified" }] }]
		};

		// Get the HTML DOM element that will contain your map 
		// We are using a div with id="map" seen below in the <body>
		var mapElement = document.getElementById('map-canvas');
		//var mapElement = $('#map-canvas');
		//var myLatlng = new google.maps.LatLng(mapElement.data("latitude"),mapElement.data("longitude"));

		// Create the Google Map using our element and options defined above
		var map = new google.maps.Map(mapElement, mapOptions);

		//CREATE A CUSTOM PIN ICON
		var marker_image = marker_image;
		var pinIcon = new google.maps.MarkerImage(marker_image, null, null, null, new google.maps.Size(120, 90));

		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(latitude, longitude),
			map: map,
			icon: pinIcon,
			title: 'Hey, I am here'
		});
	}
	// MAP
	// ------------------------------




	// ------------------------------
	// MASONRY - ISOTOPE
	function setupMasonry() {

		var masonry = $('.masonry, .gallery');
		if (masonry.length) {
			masonry.each(function (index, el) {

				// call isotope
				refreshMasonry();
				$(el).imagesLoaded(function () {
					$(el).isotope({
						layoutMode: $(el).data('layout') ? $(el).data('layout') : 'masonry'
					});
					// set columns
					refreshMasonry();
				});

				if (!$(el).data('isotope')) {
					// filters
					var filters = $(el).siblings('.filters');
					if (filters.length) {
						filters.find('a').on("click", function () {
							var selector = $(this).attr('data-filter');
							$(el).isotope({ filter: selector });
							$(this).parent().addClass('current').siblings().removeClass('current');
							return false;
						});
					}
				}

			}); //each
		}
	}
	$(window).on('resize debouncedresize', function () {
		refreshMasonry();
	});
	// ------------------------------

	// ------------------------------
	// REFRSH MASONRY - ISOTOPE
	function refreshMasonry() {

		var masonry = $('.masonry');
		if (masonry.length) {
			masonry.each(function (index, el) {

				// check if isotope initialized
				if ($(el).data('isotope')) {

					var itemW = $(el).data('item-width');
					var containerW = $(el).width();
					var items = $(el).children('.hentry');
					var columns = Math.round(containerW / itemW);

					// set the widths (%) for each of item
					items.each(function (index, element) {
						var multiplier = $(this).hasClass('x2') && columns > 1 ? 2 : 1;
						var itemRealWidth = (Math.floor(containerW / columns) * 100 / containerW) * multiplier;
						$(this).css('width', itemRealWidth + '%');
					});

					var columnWidth = Math.floor(containerW / columns);

					$(el).isotope('option', { masonry: { columnWidth: columnWidth } });
					$(el).isotope('layout');
				}

			}); //each
		}
	}
	// ------------------------------






	// ------------------------------
	// LIGHTBOX - applied to porfolio and gallery post format
	function setupLightbox() {

		if ($(".lightbox, .gallery").length) {

			$('.media-box, .gallery').each(function (index, element) {
				var $media_box = $(this);
				$media_box.magnificPopup({
					delegate: '.lightbox, .gallery-item a',
					type: 'image',
					image: {
						markup: '<div class="mfp-figure">' +
							'<div class="mfp-close"></div>' +
							'<div class="mfp-img"></div>' +
							'</div>' +
							'<div class="mfp-bottom-bar">' +
							'<div class="mfp-title"></div>' +
							'<div class="mfp-counter"></div>' +
							'</div>', // Popup HTML markup. `.mfp-img` div will be replaced with img tag, `.mfp-close` by close button

						cursor: 'mfp-zoom-out-cur', // Class that adds zoom cursor, will be added to body. Set to null to disable zoom out cursor. 
						verticalFit: true, // Fits image in area vertically
						tError: '<a href="%url%">The image</a> could not be loaded.' // Error message
					},
					gallery: {
						enabled: true,
						tCounter: '<span class="mfp-counter">%curr% / %total%</span>' // markup of counter
					},
					iframe: {
						markup: '<div class="mfp-iframe-scaler">' +
							'<div class="mfp-close"></div>' +
							'<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>' +
							'<div class="mfp-title">Some caption</div>' +
							'</div>'
					},
					mainClass: 'mfp-zoom-in',
					tLoading: '',
					removalDelay: 300, //delay removal by X to allow out-animation
					callbacks: {
						markupParse: function (template, values, item) {
							var title = "";
							if (item.el.parents('.gallery-item').length) {
								title = item.el.parents('.gallery-item').find('.gallery-caption').text();
							} else {
								title = item.el.attr('title') == undefined ? "" : item.el.attr('title');
							}
							//return title;
							values.title = title;
						},
						imageLoadComplete: function () {
							var self = this;
							setTimeout(function () {
								self.wrap.addClass('mfp-image-loaded');
							}, 16);
						},
						close: function () {
							this.wrap.removeClass('mfp-image-loaded');
						},
						beforeAppend: function () {
							var self = this;
							this.content.find('iframe').on('load', function () {
								setTimeout(function () {
									self.wrap.addClass('mfp-image-loaded');
								}, 16);
							});
						}
					},
					closeBtnInside: false,
					closeOnContentClick: true,
					midClick: true
				});
			});
		}
	}
	// ------------------------------


	// ------------------------------
	// FILL PROGRESS BARS
	function fillBars() {
		$('.bar').each(function () {
			var bar = $(this);
			var percent = bar.attr('data-percent');
			bar.find('.progress').css('width', percent + '%').html('<span>' + percent + '</span>');
		});
	}
	// ------------------------------	




	// ------------------------------
	// AJAX PORTFOLIO DETAILS
	var pActive;

	function showProjectDetails(url) {

		showLoader();

		var p = $('.p-overlay:not(.active)').first();
		pActive = $('.p-overlay.active');

		// fill data: render from portfolio.json; fall back to fetching an HTML page
		var fill = function (done) {
			(detailSection === 'blog' ? getPostHtml(url) : getProjectHtml(url))
				.done(function (html) { p.empty().html(html); done(); })
				.fail(function () { p.empty().load(url + ' .portfolio-single', done); });
		};

		fill(function () {
			NProgress.set(0.5);

			// wait for images to be loaded
			p.imagesLoaded(function () {

				// for galleries in ajax pulled content
				setupMasonry();

				if (pActive.length) {
					hideProjectDetails();
				}

				hideLoader();

				$('html').addClass('p-overlay-on');

				$("body").scrollTop(0);

				// setup plugins
				setup();

				if (classicLayout) {
					p.show();
				} else {
					p.removeClass('animate-in animate-out').addClass('animate-in').show();
				}

				p.addClass('active');

			});
		});
	}

	function hideProjectDetails(forever, safeClose, section) {

		$("body").scrollTop(0);

		// close completely by back link.
		if (forever) {
			pActive = $('.p-overlay.active');

			$('html').removeClass('p-overlay-on');

			if (!safeClose) {
				// remove detail url (back to the section the detail belonged to)
				$.address.path(section || portfolioKeyword);
			}
		}

		pActive.removeClass('active');

		if (classicLayout) {
			pActive.hide().empty();
		} else {
			pActive.removeClass('animate-in animate-out').addClass('animate-out').show();
			setTimeout(function () { pActive.hide().removeClass('animate-out').empty(); }, 10)
		}
	}

	// Detail views open in the overlay: #/portfolio/<id> (projects) and #/blog/<id> (posts).
	// Sets detailSection to the matching section id.
	function giveDetailUrl() {

		var address = $.address.value();
		var keys = [portfolioKeyword, 'blog'];

		for (var i = 0; i < keys.length; i++) {
			var k = keys[i];
			if (k && address.indexOf("/" + k + "/") === 0 && address.length > k.length + 2) {
				detailSection = k;
				return address.slice(k.length + 2);
			}
		}
		return -1;
	}
	// ------------------------------



	// ------------------------------
	// AJAX LOADER
	function showLoader() {
		NProgress.start();
	}
	function hideLoader() {
		NProgress.done();
	}
	// ------------------------------





	// ------------------------------
	// CHANGE PAGE
	function setActivePage() {

		var path = $.address.path();
		path = path.slice(1, path.length);
		path = giveDetailUrl() != -1 ? detailSection : path;


		if (path == "") {  // if hash tag doesnt exists - go to first page
			var firstPage = $('.nav-menu li').first().find('a').attr('href');
			path = firstPage.slice(2, firstPage.length);


			if (classicLayout) {
				$('#' + path).addClass('page-current').siblings().removeClass('page-current');
			} else {
				$('#' + path).addClass('page-current');
			}

			setCurrentMenuItem();

			//$.address.path(path);
			return false;
		}
		else { // show page change animation

			// change page only if url doesn't target portfolio single page
			if (giveDetailUrl() == -1) {

				if (classicLayout) {
					$('#' + path).addClass('page-current').siblings().removeClass('page-current');
					setCurrentMenuItem();
				} else {
					if (!($('.page-current').length)) { // first load - don't animate page change
						$('#' + path).addClass('page-current');
						current = $('#' + path).index();
						setCurrentMenuItem();
					} else { // animate page change

						//console.log(giveDetailUrl());
						PageTransitions.nextPage($('#' + path).index());

					}
				}

			}


		}

		/*if(path.indexOf(portfolioKeyword) != -1) {
		} */

		// refresh masonry layouts
		refreshMasonry();
		setTimeout(function () { refreshMasonry(); }, 100);

	}
	// ------------------------------



	// ------------------------------
	// SET CURRENT MENU ITEM
	function setCurrentMenuItem() {
		var activePageId = $('.pt-page.page-current').attr('id');
		// set default nav menu
		$('.nav-menu a[href$=' + activePageId + '], .mobile-nav a[href$=' + activePageId + ']').parent().addClass('current_page_item').siblings().removeClass('current_page_item');
	}
	// ------------------------------



	// ------------------------------
	// PAGE TRANSITIONS : modern layout
	var current = 0;
	var inClass, outClass;
	window.nextAnimation = $('html').data("next-animation");
	window.prevAnimation = $('html').data("prev-animation");
	window.randomize = $('html').data("random-animation");
	window.isAnimating = false;
	var PageTransitions = (function () {

		var $main = $('#main'),
			$pages = $main.children('.pt-page'),
			$menuLinks = $('.nav-menu a'),
			animcursor = 1,
			endCurrPage = false,
			endNextPage = false,
			animEndEventNames = {
				'WebkitAnimation': 'webkitAnimationEnd',
				'OAnimation': 'oAnimationEnd',
				'msAnimation': 'MSAnimationEnd',
				'animation': 'animationend'
			},
			// animation end event name
			animEndEventName = animEndEventNames[Modernizr.prefixed('animation')],
			// support css animations
			support = Modernizr.cssanimations;


		// init()
		function init() {

			//$pages.each( function() {
			//var $page = $( this );
			//$page.attr('data-org-class-list', $page.attr( 'class' ) );
			//} );
		}
		// end init()

		// PAGE CHANGE FN
		function nextPage(nextPageIndex) {

			// DO NOTHING : if nextPage is same with the current page
			if (nextPageIndex === current) {
				return;
			}

			var animation = nextPageIndex > current ? nextAnimation : prevAnimation;

			// random animation
			if (randomize) {
				if (animcursor > 67) {
					animcursor = 1;
				}
				animation = animcursor;
				++animcursor;
			}

			if (window.isAnimating) {
				return false;
			}

			window.isAnimating = true;

			var $currPage = $pages.eq(current);

			current = nextPageIndex;

			var $nextPage = $pages.eq(current).addClass('page-current');


			switch (animation) {

				case 1:
					outClass = 'pt-page-moveToLeft';
					inClass = 'pt-page-moveFromRight';
					break;
				case 2:
					outClass = 'pt-page-moveToRight';
					inClass = 'pt-page-moveFromLeft';
					break;
				case 3:
					outClass = 'pt-page-moveToTop';
					inClass = 'pt-page-moveFromBottom';
					break;
				case 4:
					outClass = 'pt-page-moveToBottom';
					inClass = 'pt-page-moveFromTop';
					break;
				case 5:
					outClass = 'pt-page-fade';
					inClass = 'pt-page-moveFromRight pt-page-ontop';
					break;
				case 6:
					outClass = 'pt-page-fade';
					inClass = 'pt-page-moveFromLeft pt-page-ontop';
					break;
				case 7:
					outClass = 'pt-page-fade';
					inClass = 'pt-page-moveFromBottom pt-page-ontop';
					break;
				case 8:
					outClass = 'pt-page-fade';
					inClass = 'pt-page-moveFromTop pt-page-ontop';
					break;
				case 9:
					outClass = 'pt-page-moveToLeftFade';
					inClass = 'pt-page-moveFromRightFade';
					break;
				case 10:
					outClass = 'pt-page-moveToRightFade';
					inClass = 'pt-page-moveFromLeftFade';
					break;
				case 11:
					outClass = 'pt-page-moveToTopFade';
					inClass = 'pt-page-moveFromBottomFade';
					break;
				case 12:
					outClass = 'pt-page-moveToBottomFade';
					inClass = 'pt-page-moveFromTopFade';
					break;
				case 13:
					outClass = 'pt-page-moveToLeftEasing pt-page-ontop';
					inClass = 'pt-page-moveFromRight';
					break;
				case 14:
					outClass = 'pt-page-moveToRightEasing pt-page-ontop';
					inClass = 'pt-page-moveFromLeft';
					break;
				case 15:
					outClass = 'pt-page-moveToTopEasing pt-page-ontop';
					inClass = 'pt-page-moveFromBottom';
					break;
				case 16:
					outClass = 'pt-page-moveToBottomEasing pt-page-ontop';
					inClass = 'pt-page-moveFromTop';
					break;
				case 17:
					outClass = 'pt-page-scaleDown';
					inClass = 'pt-page-moveFromRight pt-page-ontop';
					break;
				case 18:
					outClass = 'pt-page-scaleDown';
					inClass = 'pt-page-moveFromLeft pt-page-ontop';
					break;
				case 19:
					outClass = 'pt-page-scaleDown';
					inClass = 'pt-page-moveFromBottom pt-page-ontop';
					break;
				case 20:
					outClass = 'pt-page-scaleDown';
					inClass = 'pt-page-moveFromTop pt-page-ontop';
					break;
				case 21:
					outClass = 'pt-page-scaleDown';
					inClass = 'pt-page-scaleUpDown pt-page-delay300';
					break;
				case 22:
					outClass = 'pt-page-scaleDownUp';
					inClass = 'pt-page-scaleUp pt-page-delay300';
					break;
				case 23:
					outClass = 'pt-page-moveToLeft pt-page-ontop';
					inClass = 'pt-page-scaleUp';
					break;
				case 24:
					outClass = 'pt-page-moveToRight pt-page-ontop';
					inClass = 'pt-page-scaleUp';
					break;
				case 25:
					outClass = 'pt-page-moveToTop pt-page-ontop';
					inClass = 'pt-page-scaleUp';
					break;
				case 26:
					outClass = 'pt-page-moveToBottom pt-page-ontop';
					inClass = 'pt-page-scaleUp';
					break;
				case 27:
					outClass = 'pt-page-scaleDownCenter';
					inClass = 'pt-page-scaleUpCenter pt-page-delay400';
					break;
				case 28:
					outClass = 'pt-page-rotateRightSideFirst';
					inClass = 'pt-page-moveFromRight pt-page-delay200 pt-page-ontop';
					break;
				case 29:
					outClass = 'pt-page-rotateLeftSideFirst';
					inClass = 'pt-page-moveFromLeft pt-page-delay200 pt-page-ontop';
					break;
				case 30:
					outClass = 'pt-page-rotateTopSideFirst';
					inClass = 'pt-page-moveFromTop pt-page-delay200 pt-page-ontop';
					break;
				case 31:
					outClass = 'pt-page-rotateBottomSideFirst';
					inClass = 'pt-page-moveFromBottom pt-page-delay200 pt-page-ontop';
					break;
				case 32:
					outClass = 'pt-page-flipOutRight';
					inClass = 'pt-page-flipInLeft pt-page-delay500';
					break;
				case 33:
					outClass = 'pt-page-flipOutLeft';
					inClass = 'pt-page-flipInRight pt-page-delay500';
					break;
				case 34:
					outClass = 'pt-page-flipOutTop';
					inClass = 'pt-page-flipInBottom pt-page-delay500';
					break;
				case 35:
					outClass = 'pt-page-flipOutBottom';
					inClass = 'pt-page-flipInTop pt-page-delay500';
					break;
				case 36:
					outClass = 'pt-page-rotateFall pt-page-ontop';
					inClass = 'pt-page-scaleUp';
					break;
				case 37:
					outClass = 'pt-page-rotateOutNewspaper';
					inClass = 'pt-page-rotateInNewspaper pt-page-delay500';
					break;
				case 38:
					outClass = 'pt-page-rotatePushLeft';
					inClass = 'pt-page-moveFromRight';
					break;
				case 39:
					outClass = 'pt-page-rotatePushRight';
					inClass = 'pt-page-moveFromLeft';
					break;
				case 40:
					outClass = 'pt-page-rotatePushTop';
					inClass = 'pt-page-moveFromBottom';
					break;
				case 41:
					outClass = 'pt-page-rotatePushBottom';
					inClass = 'pt-page-moveFromTop';
					break;
				case 42:
					outClass = 'pt-page-rotatePushLeft';
					inClass = 'pt-page-rotatePullRight pt-page-delay180';
					break;
				case 43:
					outClass = 'pt-page-rotatePushRight';
					inClass = 'pt-page-rotatePullLeft pt-page-delay180';
					break;
				case 44:
					outClass = 'pt-page-rotatePushTop';
					inClass = 'pt-page-rotatePullBottom pt-page-delay180';
					break;
				case 45:
					outClass = 'pt-page-rotatePushBottom';
					inClass = 'pt-page-rotatePullTop pt-page-delay180';
					break;
				case 46:
					outClass = 'pt-page-rotateFoldLeft';
					inClass = 'pt-page-moveFromRightFade';
					break;
				case 47:
					outClass = 'pt-page-rotateFoldRight';
					inClass = 'pt-page-moveFromLeftFade';
					break;
				case 48:
					outClass = 'pt-page-rotateFoldTop';
					inClass = 'pt-page-moveFromBottomFade';
					break;
				case 49:
					outClass = 'pt-page-rotateFoldBottom';
					inClass = 'pt-page-moveFromTopFade';
					break;
				case 50:
					outClass = 'pt-page-moveToRightFade';
					inClass = 'pt-page-rotateUnfoldLeft';
					break;
				case 51:
					outClass = 'pt-page-moveToLeftFade';
					inClass = 'pt-page-rotateUnfoldRight';
					break;
				case 52:
					outClass = 'pt-page-moveToBottomFade';
					inClass = 'pt-page-rotateUnfoldTop';
					break;
				case 53:
					outClass = 'pt-page-moveToTopFade';
					inClass = 'pt-page-rotateUnfoldBottom';
					break;
				case 54:
					outClass = 'pt-page-rotateRoomLeftOut pt-page-ontop';
					inClass = 'pt-page-rotateRoomLeftIn';
					break;
				case 55:
					outClass = 'pt-page-rotateRoomRightOut pt-page-ontop';
					inClass = 'pt-page-rotateRoomRightIn';
					break;
				case 56:
					outClass = 'pt-page-rotateRoomTopOut pt-page-ontop';
					inClass = 'pt-page-rotateRoomTopIn';
					break;
				case 57:
					outClass = 'pt-page-rotateRoomBottomOut pt-page-ontop';
					inClass = 'pt-page-rotateRoomBottomIn';
					break;
				case 58:
					outClass = 'pt-page-rotateCubeLeftOut pt-page-ontop';
					inClass = 'pt-page-rotateCubeLeftIn';
					break;
				case 59:
					outClass = 'pt-page-rotateCubeRightOut pt-page-ontop';
					inClass = 'pt-page-rotateCubeRightIn';
					break;
				case 60:
					outClass = 'pt-page-rotateCubeTopOut pt-page-ontop';
					inClass = 'pt-page-rotateCubeTopIn';
					break;
				case 61:
					outClass = 'pt-page-rotateCubeBottomOut pt-page-ontop';
					inClass = 'pt-page-rotateCubeBottomIn';
					break;
				case 62:
					outClass = 'pt-page-rotateCarouselLeftOut pt-page-ontop';
					inClass = 'pt-page-rotateCarouselLeftIn';
					break;
				case 63:
					outClass = 'pt-page-rotateCarouselRightOut pt-page-ontop';
					inClass = 'pt-page-rotateCarouselRightIn';
					break;
				case 64:
					outClass = 'pt-page-rotateCarouselTopOut pt-page-ontop';
					inClass = 'pt-page-rotateCarouselTopIn';
					break;
				case 65:
					outClass = 'pt-page-rotateCarouselBottomOut pt-page-ontop';
					inClass = 'pt-page-rotateCarouselBottomIn';
					break;
				case 66:
					outClass = 'pt-page-rotateSidesOut';
					inClass = 'pt-page-rotateSidesIn pt-page-delay200';
					break;
				case 67:
					outClass = 'pt-page-rotateSlideOut';
					inClass = 'pt-page-rotateSlideIn';
					break;

			}

			$currPage.addClass(outClass).on(animEndEventName, function () {
				$currPage.off(animEndEventName);
				endCurrPage = true;
				if (endNextPage) {
					onEndAnimation($currPage, $nextPage);
				}
			});

			$nextPage.addClass(inClass).on(animEndEventName, function () {
				$nextPage.off(animEndEventName);
				endNextPage = true;
				if (endCurrPage) {
					onEndAnimation($currPage, $nextPage);
				}
			});

			if (!support) {
				onEndAnimation($currPage, $nextPage);
			}

		}

		function onEndAnimation($outpage, $inpage) {
			endCurrPage = false;
			endNextPage = false;
			resetPage($outpage, $inpage);
			window.isAnimating = false;
			setCurrentMenuItem();
		}

		function resetPage($outpage, $inpage) {
			//$outpage.attr( 'class', $outpage.attr( 'data-org-class-list' ) );
			//$inpage.attr( 'class', $inpage.attr( 'data-org-class-list' ) + ' page-current' );
			$outpage.removeClass(outClass);
			$inpage.removeClass(inClass);
			//console.log("inClass = " + inClass);
			$pages.eq(current).siblings().removeClass('page-current');
		}

		init();

		return {
			init: init,
			nextPage: nextPage
		};

	})();
	window.nextPage = function (index) {
		return new PageTransitions.nextPage(index);
	};
	// ------------------------------





})(jQuery);