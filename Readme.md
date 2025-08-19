# Tempo Pomodoro Timer

A modern web-based Pomodoro timer application with integrated Spotify player for enhanced productivity.

## Features

### Timer Functionality
- Customizable work and break durations
- Visual progress tracking with circular progress bar
- Audio alerts on session completion
- Pause switches to break mode automatically
- Session persistence across browser refreshes
- Incomplete task saving and resumption

### User Interface
- Clean, modern design with light/dark themes
- Three main tabs: Home, Timer, Settings
- Responsive design for all screen sizes
- Smooth animations and transitions
- Intuitive controls and feedback

### Task Management
- Template-based task creation
- Recent tasks history
- Task categorization
- Progress tracking and statistics
- Data export and import functionality

### Spotify Integration
- Built-in Spotify player with authentication
- Browse playlists, search tracks, and control playback
- Music continues playing while using the timer
- Fallback to default playlist for non-premium users

## Quick Start

1. Clone the repository
2. Open `index.html` in a web browser
3. Start using the timer immediately
4. Optionally connect Spotify for music integration

## File Structure

```
focus-timer/
├── index.html              # Main HTML file
├── css/
│   ├── base.css            # Core styles and variables
│   ├── home.css            # Home tab styles
│   ├── timer.css           # Timer interface styles
│   ├── settings.css        # Settings page styles
│   ├── modals.css          # Modal and form styles
│   ├── spotify.css         # Spotify player styles
│   └── responsive.css      # Mobile responsiveness
├── js/
│   ├── storage.js          # Data persistence layer
│   ├── timer-controller.js # Timer logic and state
│   ├── ui-components.js    # Reusable UI components
│   ├── navigation.js       # Tab switching and routing
│   ├── modal.js            # Modal management
│   ├── settings.js         # App settings and themes
│   ├── home.js             # Home page functionality
│   ├── spotify-player.js   # Spotify integration
│   ├── app.js              # Main app controller
│   └── main.js             # Entry point and initialization
```

## Timer Logic

- **Focus Mode**: Work countdown with green progress indicator
- **Break Mode**: Activated when pausing, auto-starts break countdown
- **Session Completion**: Audio alert and congratulations modal
- **Data Persistence**: Saves incomplete sessions for later resumption

## Spotify Setup

For full Spotify functionality:

1. Create a Spotify Developer App at https://developer.spotify.com
2. Add your domain to the redirect URIs
3. Replace `your_spotify_client_id` in `spotify-player.js` with your actual client ID
4. Requires Spotify Premium for full playback control

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Technologies

- Vanilla JavaScript (ES6+)
- CSS3 with custom properties
- Spotify Web API and Web Playback SDK
- Local Storage for data persistence
- Font Awesome icons
