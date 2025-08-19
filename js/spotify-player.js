// Spotify Player Controller - Uses Authorization Code with PKCE flow

class SpotifyPlayer {
    constructor() {
        this.isAuthenticated = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.player = null;
        this.deviceId = null;
        this.currentTrack = null;
        this.isPlaying = false;
        this.currentPosition = 0;
        this.trackDuration = 0;
        this.progressInterval = null;

        // Spotify API configuration - Authorization Code with PKCE
        this.clientId = 'a3a725b8aea149189da448808c924c5d';
        this.redirectUri = 'https://tempo-gilt.vercel.app/?tab=timer';
        this.scopes = [
            'streaming',
            'user-read-email',
            'user-read-private',
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-currently-playing',
            'playlist-read-private',
            'playlist-read-collaborative'
        ].join(' ');

        this.init();
    }

    // Initialize Spotify player
    
    init() {
        this.loadStoredAuth();
        this.handleAuthCallback();
        console.log('SpotifyPlayer: Initialized with PKCE flow');
    }

    // Load stored authentication from localStorage
    
    loadStoredAuth() {
        const storedAuth = localStorage.getItem('spotify_auth');
        if (storedAuth) {
            try {
                const auth = JSON.parse(storedAuth);
                if (auth.accessToken && auth.expiresAt > Date.now()) {
                    this.accessToken = auth.accessToken;
                    this.refreshToken = auth.refreshToken;
                    this.isAuthenticated = true;
                    console.log('SpotifyPlayer: Loaded stored authentication');
                } else if (auth.refreshToken) {
                    // Token expired but we have refresh token
                    this.refreshAccessToken(auth.refreshToken);
                } else {
                    localStorage.removeItem('spotify_auth');
                }
            } catch (error) {
                console.error('SpotifyPlayer: Error loading stored auth:', error);
                localStorage.removeItem('spotify_auth');
            }
        }
    }

    // Save authentication to localStorage
    
    saveAuth(accessToken, refreshToken, expiresIn) {
        const auth = {
            accessToken: accessToken,
            refreshToken: refreshToken,
            // expiresAt: Date.now() + (expiresIn1000)
        };
        localStorage.setItem('spotify_auth', JSON.stringify(auth));
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.isAuthenticated = true;
    }

    // Generate PKCE code verifier and challenge
    
    generatePKCE() {
        // Generate code verifier
        const array = new Uint32Array(56);
        crypto.getRandomValues(array);
        const codeVerifier = Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');

        // Generate code challenge
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);

        return crypto.subtle.digest('SHA-256', data).then(digest => {
            const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');

            return { codeVerifier, codeChallenge };
        });
    }

    // Start Spotify authentication using Authorization Code with PKCE
    
    async authenticate() {
        try {
            this.displaySpinner()
            const { codeVerifier, codeChallenge } = await this.generatePKCE();

            // Store code verifier for later use
            localStorage.setItem('spotify_code_verifier', codeVerifier);

            // Build authorization URL
            const authUrl = new URL('https://accounts.spotify.com/authorize');
            const params = {
                client_id: this.clientId,
                response_type: 'code',
                redirect_uri: this.redirectUri,
                scope: this.scopes,
                code_challenge_method: 'S256',
                code_challenge: codeChallenge,
                state: this.generateRandomString(16)
            };

            // Store state for verification
            localStorage.setItem('spotify_auth_state', params.state);

            Object.keys(params).forEach(key => {
                authUrl.searchParams.append(key, params[key]);
            });

            // Redirect to authorization page in same tab
            window.location.href = authUrl.toString();

        } catch (error) {
            console.error('SpotifyPlayer: Error starting authentication:', error);
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Authentication failed. Please try again.');
            }
        } finally {
            this.hideSpinner()
        }
    }

    // Generate random string for state parameter
    
    generateRandomString(length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], '');
    }

    // Handle authentication callback
    
    async handleAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            console.error('SpotifyPlayer: Authentication error:', error);
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Spotify authentication failed');
            }
            // Clean up URL
            this.cleanupURL();
            return;
        }

        if (code) {
            // Verify state parameter
            const storedState = localStorage.getItem('spotify_auth_state');
            if (state !== storedState) {
                console.error('SpotifyPlayer: State mismatch');
                this.cleanupURL();
                return;
            }

            // Exchange code for tokens
            await this.exchangeCodeForTokens(code);

            // Clean up URL and localStorage
            this.cleanupURL();
            localStorage.removeItem('spotify_auth_state');
            localStorage.removeItem('spotify_code_verifier');
        }
    }

    // Exchange authorization code for access and refresh tokens
    
    async exchangeCodeForTokens(code) {
        const codeVerifier = localStorage.getItem('spotify_code_verifier');
        if (!codeVerifier) {
            console.error('SpotifyPlayer: No code verifier found');
            return;
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri,
                    client_id: this.clientId,
                    code_verifier: codeVerifier
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Save tokens
            this.saveAuth(data.access_token, data.refresh_token, data.expires_in);

            console.log('SpotifyPlayer: Authentication successful');

            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Connected to Spotify successfully!');
            }

            // Update UI and load user data
            this.updateUI();
            this.loadUserPlaylists();

        } catch (error) {
            console.error('SpotifyPlayer: Error exchanging code for tokens:', error);
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Failed to complete authentication');
            }
        }
    }

    // Refresh access token using refresh token
    
    async refreshAccessToken(refreshToken) {
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: this.clientId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Save new access token (refresh token might be rotated)
            this.saveAuth(
                data.access_token,
                data.refresh_token || refreshToken,
                data.expires_in
            );

            console.log('SpotifyPlayer: Token refreshed successfully');

        } catch (error) {
            console.error('SpotifyPlayer: Error refreshing token:', error);
            // Clear stored auth on refresh failure
            localStorage.removeItem('spotify_auth');
            this.isAuthenticated = false;
            this.accessToken = null;
            this.refreshToken = null;
        }
    }

    // Clean up URL by removing query parameters
    
    cleanupURL() {
        const url = new URL(window.location);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
    }

    // Show Spotify drawer
    
    showDrawer() {
        const modal = document.getElementById('spotifyModal');
        const drawer = document.getElementById('spotifyDrawer');

        if (!modal || !drawer) return;

        modal.style.display = 'flex';

        setTimeout(() => {
            drawer.classList.add('show');
        }, 10);

        // Update UI based on authentication status
        this.updateUI();

        if (this.isAuthenticated) {
            this.loadUserPlaylists();
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    // Hide Spotify drawer
    
    hideDrawer() {
        const modal = document.getElementById('spotifyModal');
        const drawer = document.getElementById('spotifyDrawer');

        if (!modal || !drawer) return;

        drawer.classList.remove('show');

        setTimeout(() => {
            modal.style.display = 'none';
            // Restore body scroll
            document.body.style.overflow = '';
        }, 300);
    }

    // Update UI based on authentication status
    
    updateUI() {
        const defaultView = document.getElementById('spotifyDefault');
        const authenticatedView = document.getElementById('spotifyAuthenticated');
        const connectSection = document.getElementById('connectSpotify');
        const spotifyTabs = document.getElementById('spotifyTabs');
        const currentPlayer = document.getElementById('currentTrackPlayer');
        const drawer = document.getElementById('spotifyDrawer');

        if (this.isAuthenticated) {
            if (defaultView) defaultView.classList.add('hidden');
            if (authenticatedView) authenticatedView.classList.remove('hidden');
            if (connectSection) connectSection.classList.add('hidden');
            if (currentPlayer) currentPlayer.classList.remove('hidden');
            if (spotifyTabs) spotifyTabs.classList.remove('hidden');
            // if (drawer) drawer.style.background='var(--bg-card)'

            // Initialize Spotify Web Playback SDK
            this.initializeWebPlayback();
        } else {
            if (defaultView) defaultView.classList.remove('hidden');
            if (authenticatedView) authenticatedView.classList.add('hidden');
            if (connectSection) connectSection.classList.remove('hidden');
            if (currentPlayer) currentPlayer.classList.add('hidden');
            if (spotifyTabs) spotifyTabs.classList.add('hidden');
        }
    }

    displaySpinner() {
        const spotifySpinner = document.getElementById('spotify-spinner');
        spotifySpinner.classList.remove('hidden')
    }

    hideSpinner() {
        const spotifySpinner = document.getElementById('spotify-spinner');
        spotifySpinner.classList.add('hidden')
    }

    // Initialize Spotify Web Playback SDK
    
    async initializeWebPlayback() {
        if (this.player) return;

        try {
            this.displaySpinner()
            // Load Spotify Web Playback SDK
            if (!window.Spotify) {
                await this.loadSpotifySDK();
            }

            this.player = new window.Spotify.Player({
                name: 'Tempo',
                getOAuthToken: cb => cb(this.accessToken),
                // volume: 0.5
            });

            // Error handling
            this.player.addListener('initialization_error', ({ message }) => {
                console.error('SpotifyPlayer: Initialization error:', message);
            });

            this.player.addListener('authentication_error', ({ message }) => {
                console.error('SpotifyPlayer: Authentication error:', message);
                this.logout();
            });

            this.player.addListener('account_error', ({ message }) => {
                console.error('SpotifyPlayer: Account error:', message);
            });

            this.player.addListener('playback_error', ({ message }) => {
                console.error('SpotifyPlayer: Playback error:', message);
            });

            // Playback status updates
            this.player.addListener('player_state_changed', (state) => {
                if (!state) return;

                this.currentTrack = state.track_window.current_track;
                this.isPlaying = !state.paused;
                this.currentPosition = state.position;
                this.trackDuration = state.duration;

                this.updateCurrentTrackDisplay();
                this.updateProgressBar();

                if (this.isPlaying) {
                    this.startProgressTracking();
                } else {
                    this.stopProgressTracking();
                }
            });

            // Ready
            this.player.addListener('ready', ({ device_id }) => {
                console.log('SpotifyPlayer: Ready with Device ID', device_id);
                this.deviceId = device_id;
                this.hideSpinner()
            });

            // Connect to the player
            await this.player.connect();
        } catch (error) {
            console.error('SpotifyPlayer: Error initializing web playback:', error);
        }
    }

    // Load Spotify Web Playback SDK
    
    loadSpotifySDK() {
        return new Promise((resolve, reject) => {
            if (window.Spotify) {
                resolve();
                return;
            }

            this.displaySpinner()

            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;

            script.onload = () => {
                window.onSpotifyWebPlaybackSDKReady = () => {
                    resolve();
                };
            };

            script.onerror = () => {
                reject(new Error('Failed to load Spotify SDK'));
            };

            document.body.appendChild(script);

            this.hideSpinner()
        });
    }

    // Make authenticated API request with automatic token refresh
    
    async makeAPIRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);

            if (response.status === 401 && this.refreshToken) {
                // Token expired, try to refresh
                await this.refreshAccessToken(this.refreshToken);

                // Retry request with new token
                defaultOptions.headers.Authorization = `Bearer ${this.accessToken}`;
                return await fetch(url, defaultOptions);
            }

            return response;
        } catch (error) {
            console.error('SpotifyPlayer: API request failed:', error);
            throw error;
        }
    }

    // Load user playlists
    
    async loadUserPlaylists() {
        if (!this.accessToken) return;

        try {
            this.displaySpinner()
            const response = await this.makeAPIRequest('https://api.spotify.com/v1/me/playlists?limit=20');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayPlaylists(data.items);
        } catch (error) {
            console.error('SpotifyPlayer: Error loading playlists:', error);
            uiComponents.showNotification('Error loading playlists');
        } finally {
            this.hideSpinner()
        }
    }

    // Display playlists in the UI
    
    displayPlaylists(playlists) {
        const playlistGrid = document.getElementById('playlistGrid');
        if (!playlistGrid) return;

        playlistGrid.innerHTML = playlists.map(playlist => `
            <div class="playlist-item" onclick="spotifyPlayer.playPlaylist('${playlist.id}')">
                <img src="${playlist.images[0]?.url || 'https://via.placeholder.com/48x48/282828/ffffff?text=♪'}" 
                     alt="${playlist.name}" class="playlist-image">
                <div class="playlist-info">
                    <div class="playlist-title">${playlist.name}</div>
                    <div class="playlist-description">${playlist.description || playlist.tracks.total + ' tracks'}</div>
                </div>
            </div>
        `).join('');
    }

    // Play a playlist
    
    async playPlaylist(playlistId) {
        this.displaySpinner()
        if (!this.player || !this.deviceId) {
            console.error('SpotifyPlayer: Player not ready');
            return;
        }

        try {
            const response = await this.makeAPIRequest(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    context_uri: `spotify:playlist:${playlistId}`
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Playlist started!');
            }

            this.hideSpinner()
        } catch (error) {
            console.error('SpotifyPlayer: Error playing playlist:', error);
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Failed to play playlist');
            }
        }
    }

    // Update current track display
    
    updateCurrentTrackDisplay() {
        if (!this.currentTrack) return;

        const trackImage = document.getElementById('currentTrackImage');
        const trackTitle = document.getElementById('currentTrackTitle');
        const trackArtist = document.getElementById('currentTrackArtist');
        const playPauseBtn = document.getElementById('playPauseBtn');

        if (trackImage && this.currentTrack.album && this.currentTrack.album.images[0]) {
            trackImage.src = this.currentTrack.album.images[0].url;
            trackImage.alt = this.currentTrack.name;
        }

        if (trackTitle) {
            trackTitle.textContent = this.currentTrack.name;
        }

        if (trackArtist) {
            trackArtist.textContent = this.currentTrack.artists.map(artist => artist.name).join(', ');
        }

        if (playPauseBtn) {
            const icon = playPauseBtn.querySelector('i');
            if (icon) {
                icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
        }
    }

    // Update progress bar
    
    updateProgressBar() {
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        const progressFill = document.getElementById('progressFill');
        const progressHandle = document.getElementById('progressHandle');

        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.currentPosition);
        }

        if (totalTimeEl) {
            totalTimeEl.textContent = this.formatTime(this.trackDuration);
        }

        if (progressFill && progressHandle && this.trackDuration > 0) {
            // const progress = (this.currentPosition / this.trackDuration)100;
            progressFill.style.width = `${progress}%`;
            progressHandle.style.left = `${progress}%`;
        }
    }

    // Start progress tracking
    
    startProgressTracking() {
        this.stopProgressTracking();
        this.progressInterval = setInterval(() => {
            if (this.isPlaying) {
                this.currentPosition += 1000;
                this.updateProgressBar();

                if (this.currentPosition >= this.trackDuration) {
                    this.stopProgressTracking();
                }
            }
        }, 1000);
    }

    // Stop progress tracking
    
    stopProgressTracking() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    // Format time in mm:ss
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Toggle play/pause
    
    async togglePlayback() {
        try {
            this.displaySpinner()
            await this.player.togglePlay();
            this.hideSpinner()
        } catch (error) {
            console.error('SpotifyPlayer: Error toggling playback:', error);
            uiComponents.showNotification('Kindly select a playlist first!');
        }
    }

    // Previous track
    
    async previousTrack() {
        if (!this.player) {
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Previous track');
            }
            return;
        }

        try {
            await this.player.previousTrack();
        } catch (error) {
            console.error('SpotifyPlayer: Error going to previous track:', error);
        }
    }

    // Next track
    
    async nextTrack() {
        if (!this.player) {
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Next track');
            }
            return;
        }

        try {
            await this.player.nextTrack();
        } catch (error) {
            console.error('SpotifyPlayer: Error going to next track:', error);
        }
    }

    // Search for tracks
    
    async searchTracks(query) {
        if (!this.accessToken || !query.trim()) return;
        this.displaySpinner()

        try {
            const response = await this.makeAPIRequest(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displaySearchResults(data.tracks.items);
        } catch (error) {
            console.error('SpotifyPlayer: Error searching tracks:', error);
            uiComponents.showNotification('Error searching tracks');
        } finally {
            this.hideSpinner()
        }
    }

    // Display search results
    
    displaySearchResults(tracks) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        searchResults.innerHTML = tracks.map(track => `
            <div class="search-item" onclick="spotifyPlayer.playTrack('${track.uri}')">
                <img src="${track.album.images[0]?.url || 'https://via.placeholder.com/40x40/282828/ffffff?text=♪'}" 
                     alt="${track.name}" class="search-item-image">
                <div class="search-item-info">
                    <div class="search-item-title">${track.name}</div>
                    <div class="search-item-artist">${track.artists.map(artist => artist.name).join(', ')}</div>
                </div>
            </div>
        `).join('');
    }

    // Play specific track
    
    async playTrack(trackUri) {
        if (!this.player || !this.deviceId) {
            console.error('SpotifyPlayer: Player not ready');
            return;
        }

        try {
            const response = await this.makeAPIRequest(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    uris: [trackUri]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('SpotifyPlayer: Error playing track:', error);
        }
    }

    // Switch tabs
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.spotify-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Update tab content
        document.querySelectorAll('.spotify-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        const activeContent = document.getElementById(`${tabName}Content`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }

        // Load content based on tab
        if (tabName === 'library' && this.isAuthenticated) {
            this.loadLibrary();
        }
    }

    // Load user library
    
    async loadLibrary() {
        // Mock library for demo
        const libraryItems = [
            { name: 'Liked Songs', type: 'Playlist', image: 'https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png' },
            { name: 'Recently Played', type: 'Playlist', image: 'https://t.scdn.co/images/7262179db37c498480ef06bfc0a1f504.png' },
            { name: 'Your Episodes', type: 'Podcast', image: 'https://t.scdn.co/images/8e5c8fcc205e42f3b06ad01b2cddc46e.png' }
        ];

        const libraryItemsEl = document.getElementById('libraryItems');
        if (!libraryItemsEl) return;

        libraryItemsEl.innerHTML = libraryItems.map(item => `
            <div class="library-item">
                <img src="${item.image}" alt="${item.name}" class="library-item-image">
                <div class="library-item-info">
                    <div class="library-item-title">${item.name}</div>
                    <div class="library-item-type">${item.type}</div>
                </div>
            </div>
        `).join('');
    }

    // Logout from Spotify
    
    logout() {
        this.isAuthenticated = false;
        this.accessToken = null;
        localStorage.removeItem('spotify_auth');

        if (this.player) {
            this.player.disconnect();
            this.player = null;
        }

        this.stopProgressTracking();
        this.updateUI();

        if (typeof uiComponents !== 'undefined') {
            uiComponents.showNotification('Disconnected from Spotify');
        }
    }

    // Get current state for persistence
    
    getState() {
        return {
            isAuthenticated: this.isAuthenticated,
            currentTrack: this.currentTrack,
            isPlaying: this.isPlaying,
            currentPosition: this.currentPosition,
            trackDuration: this.trackDuration
        };
    }

    // Restore state
    
    restoreState(state) {
        if (state) {
            this.currentTrack = state.currentTrack;
            this.isPlaying = state.isPlaying;
            this.currentPosition = state.currentPosition;
            this.trackDuration = state.trackDuration;

            if (this.currentTrack) {
                this.updateCurrentTrackDisplay();
                this.updateProgressBar();

                if (this.isPlaying) {
                    this.startProgressTracking();
                }
            }
        }
    }
}

window.SpotifyPlayer = SpotifyPlayer;