import StartGame from './game/main';

const APP_VERSION = import.meta.env.VITE_APP_VERSION as string;
console.log(`NET CRISIS - v.${APP_VERSION}`)

document.addEventListener('DOMContentLoaded', () => {

    StartGame('game-container');

});