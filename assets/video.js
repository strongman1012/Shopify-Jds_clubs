/* global YT, Vimeo */

if (!customElements.get('video-component')) {
  class Video extends HTMLElement {
    constructor() {
      super();
      this.autoplay = this.dataset.autoplay === 'true';
      this.background = this.dataset.background === 'true';
      this.naturalWidth = this.dataset.naturalWidth === 'true';
    }

    connectedCallback() {
      this.init();
    }

    init() {
      const url = this.dataset.videoUrl;

      if (url) {
        if (url.includes('youtu.be') || url.includes('youtube.com')) {
          if (url.includes('v=')) {
            this.videoId = url.split('v=').pop().split('&')[0];
          } else {
            this.videoId = url.split('?')[0].split('/').pop();
          }

          this.type = 'youtube';
          this.initYouTube();
        } else if (url.includes('vimeo.com')) {
          this.videoId = url.split('?')[0].split('/').pop();
          this.type = 'vimeo';
          this.initVimeo();
        }
      } else {
        this.type = 'tag';
        this.initVideoTag();
      }

      // Allow for videos which haven't played to play on tap
      if (this.background) {
        this.closest('.video-section').addEventListener('click', this.play.bind(this));
      }
    }

    /**
     * Loads a player API script.
     * @param {string} src - Url of script to load.
     */
    loadScript(src) {
      if (document.querySelector(`script[src="${src}"]`)) return;

      const s = document.createElement('script');
      s.src = src;
      s.onerror = (err) => console.warn(`Unable to load script ${src}`, err);  // eslint-disable-line

      if (this.type === 'vimeo') {
        s.onload = () => document.dispatchEvent(new CustomEvent('on:vimeo-api:loaded'));
      } else if (this.type === 'youtube') {
        window.onYouTubeIframeAPIReady = () => document.dispatchEvent(new CustomEvent('on:youtube-api:loaded'));
      }

      document.body.appendChild(s);
    }

    /**
     * Initialises a YouTube video.
     */
    initYouTube() {
      const initYTPlayer = () => {
        YT.ready(() => {
          this.player = new YT.Player(this.querySelector('div'), {
            videoId: this.videoId,
            width: '1280',
            height: '720',
            playerVars: {
              controls: this.background ? 0 : 1,
              disablekb: this.background ? 1 : 0,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              rel: 0
            },
            events: {
              onReady: this.handleYTReady.bind(this),
              onStateChange: this.handleYTStateChange.bind(this)
            }
          });
        });
      };

      if (!window.YT) {
        document.addEventListener('on:youtube-api:loaded', initYTPlayer.bind(this));
        this.loadScript('//www.youtube.com/iframe_api');
      } else {
        initYTPlayer();
      }
    }

    /**
     * Initialises a Vimeo video.
     */
    initVimeo() {
      const initVimeoPlayer = async () => {
        this.player = new Vimeo.Player(this, {
          id: this.videoId,
          width: '1280',
          height: '720',
          autoplay: this.autoplay,
          background: this.background,
          keyboard: !this.background,
          muted: this.autoplay
        });

        await this.player.ready();
        this.setupIframe('js-vimeo');

        this.player.on('pause', () => {
          if (this.inViewport) this.pausedByUser = true;
        });

        this.player.on('play', () => {
          this.closest('.video-section').classList.add('video-section--played');
        });

        this.play();
      };

      if (!window.Vimeo) {
        document.addEventListener('on:vimeo-api:loaded', initVimeoPlayer.bind(this));
        this.loadScript('//player.vimeo.com/api/player.js');
      } else {
        initVimeoPlayer();
      }
    }

    /**
     * Initialises a video tag.
     */
    initVideoTag() {
      this.player = this.querySelector('video');

      this.player.addEventListener('pause', () => {
        if (this.inViewport) this.pausedByUser = true;
      });

      // If the video is already playing
      if (this.player.currentTime > 0 && !this.player.paused && !this.player.ended
        && this.player.readyState > 2) {
        this.closest('.video-section').classList.add('video-section--played');
      } else {
        this.player.addEventListener('play', () => {
          this.closest('.video-section').classList.add('video-section--played');
        });

        this.addObserver(this.player);

        // Mute the video if a click didn't trigger its load
        const deferredMedia = this.closest('deferred-media');
        if (!deferredMedia || deferredMedia.loadTrigger !== 'click') {
          this.player.muted = true;
        }

        this.play();
      }
    }

    /**
     * Handles a YouTube ready event.
     */
    handleYTReady() {
      this.setupIframe('js-youtube');

      if (this.autoplay) this.player.mute();
      this.play();
    }

    /**
     * Handles a YouTube state change event.
     * @param {object} e - Event object.
     */
    handleYTStateChange(e) {
      if (e.data === YT.PlayerState.PAUSED) {
        if (this.inViewport) this.pausedByUser = true;
      } else if (e.data === YT.PlayerState.ENDED) {
        // Looping this way rather than 'loop' API parameter to avoid flash of black background
        if (this.background) this.player.playVideo();
      } else if (e.data === YT.PlayerState.PLAYING) {
        this.closest('.video-section').classList.add('video-section--played');
      }
    }

    /**
     * Sets up the injected iframe.
     * @param {string} jsClass - Class name to add to the iframe.
     */
    setupIframe(jsClass) {
      // Enable iframe to cover entire container height.
      if (this.autoplay && !this.naturalWidth) {
        this.style.width = `${this.clientHeight * 1.7778}px`;

        window.addEventListener('resize', window.debounce(() => {
          this.style.width = `${this.clientHeight * 1.7778}px`;
        }, 200));
      }

      this.iframe = this.querySelector('iframe');
      this.iframe.title = this.dataset.description;
      this.iframe.classList.add(jsClass);
      this.addObserver(this.iframe);
    }

    /**
     * Plays the video when scrolled into view (if not paused by the user).
     */
    play() {
      if (!this.player || this.pausedByUser) return;

      if (this.type === 'youtube') {
        this.player.playVideo();
      } else {
        this.player.play();
      }
    }

    /**
     * Pauses the video when scrolled out of view (if playing).
     */
    pause() {
      if (!this.player) return;

      if (this.type === 'youtube') {
        if (this.player.getPlayerState() !== 2) {
          this.player.pauseVideo();
          this.pausedByUser = false;
        }
      } else if (this.type === 'vimeo') {
        this.player.getPaused().then((paused) => {
          if (!paused) {
            this.player.pause();
            this.pausedByUser = false;
          }
        });
      } else if (!this.player.paused) {
        this.player.pause();
        this.pausedByUser = false;
      }
    }

    /**
     * Adds an observer to pause the video when not in the viewport.
     * @param {Element} el - Element to observe.
     */
    addObserver(el) {
      if ('IntersectionObserver' in window === false) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.inViewport = true;
            this.play();
          } else {
            this.inViewport = false;
            this.pause();
          }
        }, { rootMargin: '0px 0px 200px 0px' });
      });

      observer.observe(el);
    }
  }

  customElements.define('video-component', Video);
}
