//Constants//
const sliderLeft = document.getElementById('sliderLeft');
const sliderRight = document.getElementById('sliderRight');
const currentClientID = document.getElementById('clientID');
const currentClientSecret = document.getElementById('clientSecret');
const login = document.getElementById('login');
const userName = document.getElementById('userName');
const ticketPlayer = document.getElementById('ticketPlayer');
const mainPage = document.getElementById('mainPage');
const backFinger = document.getElementById('backFinger');
const img = document.getElementById('image');
const img2 = document.getElementById('image2');

//Beginning Tween//
const tl = new TimelineMax();

//tl.to(login, 1.5, {y: "325%"});
tl.to(login, .3, {opacity: "1"});

var clientID = '';
var clientSecret = '';
var currentName = '';
var currentDevice = '';

var currentTrackTitle = '';
var currentAlbumTitle = '';
var currentImage = '';
var currentTrackArtists = '';

const AUT = "https://accounts.spotify.com/authorize";
const redirect_uri = "http://127.0.0.1:5500/index.html";
const TOKEN = "https://accounts.spotify.com/api/token";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PROFILE = "https://api.spotify.com/v1/me";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const TRACKS = "https://api.spotify.com/v1/playlists/";
const PLAY = "https://api.spotify.com/v1/me/player/play";
const QUEUE = "https://api.spotify.com/v1/me/player/queue"

const SGclient_id = "MzAxNjQ2NTF8MTY2Nzc0MTgyOC44NjU3MDU";
const SGclient_secret = "8b546421cc88f2ae6717f52f9f6d1b2466a6a2ab545af6e983c1262dba95a9fe";

//Checks if a redirect or first time
window.onloadstart = onPageLoad();
//// 
function onPageLoad(){
    clientID = localStorage.getItem('client_id');
    clientSecret = localStorage.getItem('client_secret');
    if(window.location.search.length > 0){
        handleRedirect(); 
        tl.to(login, .3, {y: "-100"});
        tl.to(login, 1.5, {y: "1000"});
        tl.to(sliderLeft, 1, {x: "-100%"},"-=.5");
        tl.to(sliderRight, 1, {x: "100%"}, "-=1");
    }
    callApi("GET", PROFILE, null, handleProfileResponse);
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("","",redirect_uri);
}

function fetchAccessToken(code){
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + clientID;
    body += "&client_secret=" + clientSecret;
    callAuthorizationAPI(body);
}

///////////////////// FUNCTION CALLS /////////////////////////
function callAuthorizationAPI(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization','Basic ' + btoa(clientID + ":" + clientSecret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}
function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}
///////////////////////////////////////////////////////////////

function refreshAccessToken(){
    refresh_token = localStorage.getItem('refresh_token');
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + clientID;
    callAuthorizationAPI(body);
}

function handleAuthorizationResponse(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if(data["access_token"] != undefined){
            access_token = data["access_token"];
            localStorage.setItem("access_token", access_token);
        }
        if(data["refresh_token"] != undefined){
            refresh_token = data["refresh_token"];
            localStorage.setItem("refresh_token", refresh_token)
        }
        onPageLoad();
    }else{
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if(queryString.length > 0){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code');
    }
    return code;
}


//////////// REQUEST USER AUTHORIZATION //////////////
function authorize(){
    if(currentClientID.value == '' || currentClientSecret.value == ''){
        alert('Enter Credential Values!!')
    }else{
        clientID = currentClientID.value;
        clientSecret = currentClientSecret.value;
        localStorage.setItem("client_id",clientID);
        localStorage.setItem("client_secret",clientSecret);
    
        let url = AUT;
        url += "?client_id=" + clientID;
        url += "&response_type=code";
        url += "&redirect_uri=" + encodeURI(redirect_uri);
        url += "&show_dialog=true";
        url += "&scope=ugc-image-upload user-read-playback-state app-remote-control user-modify-playback-state playlist-read-private user-follow-modify playlist-read-collaborative user-follow-read user-read-currently-playing user-read-playback-position user-library-modify playlist-modify-private playlist-modify-public user-read-email user-top-read streaming user-read-recently-played user-read-private user-library-read"
        window.location.href = url;
    }
}

//// API CALLS ////////////
function refreshDevices(){
    callApi("GET", DEVICES, null, handleDevicesResponse);
}
function refreshPlaylists(){
    callApi("GET", PLAYLISTS, null, handlePlaylistsResponse);
}
function refreshTracks(){
    var ddl = document.getElementById('playlists');
    var selectedValue = ddl.options[ddl.selectedIndex].value;
    callApi("GET", TRACKS+selectedValue+"/tracks", null, handleTracksResponse);
}

function play(){
    tl.to(mainPage, 1, {y:"-100%"});
    tl.to(ticketPlayer, 1, {y:"-100%"},"-=1");
    tl.to(backFinger,.3, {x:"450%"})
    var ddl1 = document.getElementById('tracks');
    var selectedValue2 = ddl1.options[ddl1.selectedIndex].value;
    currentTrackTitle = ddl1.options[ddl1.selectedIndex].innerHTML;
    callApi("POST", QUEUE+"?uri="+selectedValue2,null,null)
    skip();
    var newID = selectedValue2.toString().substring(14);
    callApi("GET", "https://api.spotify.com/v1/tracks/"+newID,null,handleOneTrack);
}

function handleOneTrack(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        currentImage = data.album.images[data.album.images.length-1]['url'];
        document.getElementById('image').style.backgroundImage="url("+currentImage+")";
        document.getElementById('image').style.backgroundPosition="center";
        document.getElementById('image').style.backgroundSize="cover";
        document.getElementById('image').style.backgroundRepeat="no-repeat";
        currentAlbumTitle = data.album.name;
        currentTrackArtists = data.album.artists[0].name;
        currentArtistID = data.album.artists[0].id;
        document.getElementById('currentTitle').innerHTML = currentTrackTitle;
        document.getElementById('currentAlbumTitle').innerHTML = currentAlbumTitle;
        document.getElementById('currentArtists').innerHTML = currentTrackArtists;
        same();
        callApi("GET", "https://api.spotify.com/v1/artists/"+currentArtistID,null,artistInfo);
    }else if(this.status == 401){
        refreshAccessToken();
    }else{
        console.log(this.responseText);
        alert(this.responseText);
    }
}
var currentImage2 = '';
function artistInfo(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        currentImage2 = data.images[0]['url'];
        document.getElementById('image2').style.backgroundImage="url("+currentImage2+")";
        document.getElementById('image2').style.backgroundPosition="center";
        document.getElementById('image2').style.backgroundSize="cover";
        document.getElementById('image2').style.backgroundRepeat="no-repeat";

        document.getElementById('artistFollowers').innerHTML = "Follower Count = " + data.followers.total;
        document.getElementById('artistGenre').innerHTML = "Genres = " +data.genres.join(", ");
        document.getElementById('artistName').innerHTML = data.name;
        document.getElementById('artistPop').innerHTML = "Popularity Rating = "+data.popularity;
    }else if(this.status == 401){
        refreshAccessToken();
    }else{
        console.log(this.responseText);
        alert(this.responseText);
    }
}
function lyricsShow(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        alert(data['lyrics']);
    }
}
function same(){
    callApi("GET","https://api.spotify.com/v1/me/player/currently-playing",null,checkSame());
}

function checkSame(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if(currentTrackTitle != data.item.linked_from.name){
            skip();
        }
    }else if(this.status == 401){
        refreshAccessToken();
    }
}

function skip(){
    callApi("POST", "https://api.spotify.com/v1/me/player/next",null,null);
    
}
function reverse(){
    callApi("POST", "https://api.spotify.com/v1/me/player/previous", null,null);
}

function handleDevicesResponse(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems("devices");
        data.devices.forEach(item => addDevice(item));
    }else if(this.status == 401){
        refreshAccessToken();
    }else{
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleProfileResponse(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        userName.innerHTML = "Hiya " + data["display_name"] + "! 😊";
        tl.to(userName, 1, {y:"470"},"-=.6");
    }else{
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handlePlaylistsResponse(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems("playlists");
        data.items.forEach(item => addPlaylists(item));
    }else if(this.status == 401){
        refreshAccessToken();
    }else{
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleTracksResponse(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems("tracks");
        data.items.forEach(item => addTracks(item));
    }else if(this.status == 401){
        refreshAccessToken();
    }else{
        console.log(this.responseText);
        alert(this.responseText);
    }
}

///// ADD DEVICES TO LIST /////
function addDevice(item){
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById("devices").appendChild(node);
}

function removeAllItems(elementId){
    let node = document.getElementById(elementId);
    while(node.firstChild){
        node.removeChild(node.firstChild);
    }
}

///// ADD PLAYLISTS TO LIST //////
function addPlaylists(item){
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById("playlists").appendChild(node);
}

///// ADD TRACKS TO LIST ///////
function addTracks(item){
    let node = document.createElement("option");
    let track = item.track;
    node.value = track.uri;
    node.innerHTML = track.name;
    document.getElementById("tracks").appendChild(node);
}

function backButton(){
    tl.to(backFinger,.4, {x:"200%"})
    tl.to(ticketPlayer, 1, {y:"0%"});
    tl.to(mainPage, 1, {y:"0%"},"-=1");
}