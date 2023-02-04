// https://developers.google.com/youtube/v3/getting-started?hl=ja
const YOUTUBE_API_KEY = '{{ YourYouTubeDataAPIKey }}';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_SEARCH_URL = YOUTUBE_API_BASE_URL + '/search';
const YOUTUBE_API_CHANNELS_URL = YOUTUBE_API_BASE_URL + '/channels';
const YOUTUBE_API_PLAYLISTITEMS_URL = YOUTUBE_API_BASE_URL + '/playlistItems';

const HTML_UPPER_PART = `
    <html>
        <head>
            <style>
                .yt { /* 動画をレスポンシブ表示、無駄な余白出さないようにパディング設定 */
                    position: relative;
                    width: 25%;
                    padding-top: 320px;
                    float: left;
                }
                .yt iframe { /* 親要素内100%で動画を表示する */
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 100%;
                    height: 100%;
                }
                .yt_video { /* 親要素内100%でサムネイル画像を表示する */
                    position: absolute;
                    width:100%;
                    height:auto;
                    top:0;
                }
                .yt_video img { /* 親要素内100%でサムネイル画像を表示する */
                    width:100%;
                    height:auto;
                }
                .yt_video::before { /* FontAwesomeで再生ボタンを画像上に。あっても無くても可 */
                    position: absolute;
                    font-family: "Font Awesome 5 Free";
                    content: "\f04b";
                    font-weight:900;
                    color: #fc0d1c;
                    font-size: 70px;
                    top: 50%;
                    left: 50%;
                    transform : translate(-50%,-50%);
                    opacity: .90;
                    transition:.5s;
                }
                .yt_video img:hover{ /* ホバー時にカーソル変える */
                    cursor: pointer;
                    width:100%;
                    height:auto;
                    box-sizing: border-box;
                }
                .yt_video:hover::before { /* ホバー時アイコンの色変える */
                    color:#32cd32;
                    transition:.5s;
                }
            </style>
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
        </head>
        <body>
`;

const HTML_LOWER_PART = `
    <script>
        $('.yt_video').click(function(){
	        video = '<iframe src="'+ $(this).attr('youtube') +'" frameborder="0"></iframe>';
	        $(this).replaceWith(video);
        });
    </script>
    </body>
    </html>
`;

const DOWNLOADING_HTML = `
    <!-- loading -->
    <div id="loading" class="is-hide">
        <div class="cv-spinner">
            <span class="dl-message">Downloading...</span>
            <span class="spinner"></span>
        </div>
    </div>
    <!-- loading -->
`;

const DOWNLOADING_CSS = `
    <style>
        #loading{
            position: fixed;
            top: 0;
            left: 0;
            z-index: 9999;
            width: 100%;
            height:100%;
            background: rgba(0,0,0,0.6);
        }
        #loading .cv-spinner {
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }
        #loading .spinner {
            width: 80px;
            height: 80px;
            border: 4px #ddd solid;
            border-top: 4px #999 solid;
            border-radius: 50%;
            animation: sp-anime 0.8s infinite linear;
        }
        #loading .dl-message {
            font-size: 50px;
            padding-bottom: 30px;
            color: lightgrey;
        }
        @keyframes sp-anime {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(359deg); }
        }
        #loading.is-hide{
            display:none;
        }
    </style>
`;

let playlistItems = [];
let html = "";
let channelId;
let playlistId;


function showLoading() {
    document.getElementById('loading').classList.remove('is-hide')
}

function hideLoading() {
    document.getElementById('loading').classList.add('is-hide')
}

async function getChannelId() {
    console.log("getChannelId() is called.");
    // HTMLからチャンネルID取得(HTML変わって今使えない)
    // let elements = await document.getElementsByTagName("link");
    // for (let i = 0; i < elements.length; i++ ){
    //     if (elements[i].rel == 'canonical') {
    //         return await elements[i].href.replace('https://www.youtube.com/channel/', '');
    //         // await console.log(channelId);
    //     }
    // }

    // 検索APIでチャンネルID取得(100%狙ったチャンネルのIDを取得できるわけではない)
    let q = await location.href.replace('https://www.youtube.com/', '');
    let response = await fetch(YOUTUBE_API_SEARCH_URL + '?part=id&part=snippet' + '&maxResults=1' + '&q=' + q + '&key=' + YOUTUBE_API_KEY);
    let responseJson = await response.json();
    await console.log(responseJson);
    return await responseJson.items[0].snippet.channelId
}

    async function getPlaylistId(channelId) {
        let response = await fetch(YOUTUBE_API_CHANNELS_URL + '?part=id,contentDetails,snippet,status' + '&id=' + channelId + '&key=' + YOUTUBE_API_KEY);
        let responseJson = await response.json();
        return await responseJson.items[0].contentDetails.relatedPlaylists.uploads;   
    }

    async function getPlaylistItemsList(playlistId, nextPageToken = null) {
        let response;
        if (nextPageToken) {
            response = await fetch(YOUTUBE_API_PLAYLISTITEMS_URL + '?part=id,contentDetails,snippet,status' + '&playlistId=' + playlistId + '&maxResults=50' + '&key=' + YOUTUBE_API_KEY + '&pageToken=' + nextPageToken);
        } else {
            response = await fetch(YOUTUBE_API_PLAYLISTITEMS_URL + '?part=id,contentDetails,snippet,status' + '&playlistId=' + playlistId + '&maxResults=50' + '&key=' + YOUTUBE_API_KEY);
        }
        let responseJson = await response.json();
        responseJson.items.forEach(element => {
            playlistItems.push(
                {
                    title: element.snippet.title,
                    videoId: element.contentDetails.videoId
                }
            );
        });
        if (responseJson.nextPageToken) {
            await getPlaylistItemsList(playlistId, responseJson.nextPageToken);
        }
    }

    async function createHTML() {
        html += HTML_UPPER_PART;
        let reversed = playlistItems.reverse();
        reversed.forEach(element => {
            html += `
                <div class="yt">
	                <div class="yt_video" youtube="https://www.youtube.com/embed/${element.videoId}?rel=0&showinfo=0&autoplay=0">
		                <img src="https://i.ytimg.com/vi/${element.videoId}/mqdefault.jpg" alt="サンプル動画" width="100%" height="auto" />
                        <span>${element.title}</span>
	                </div>
                </div>
            `
        });
        html += HTML_LOWER_PART;
    }

async function downloadHTML() {
    showLoading();
    playlistItems = [];
    html = "";

    try {
        //ファイル保存ダイアログを表示して FileSystemFileHandle オブジェクトを取得
        let fh = await window.showSaveFilePicker({ suggestedName: 'sorted.html' });

        let channelId = await getChannelId();
        let playlistId = await getPlaylistId(channelId);
        await getPlaylistItemsList(playlistId);

        await createHTML();

        // FileSystemWritableFileStream オブジェクトを取得
        const stream = await fh.createWritable();
        const blob = new Blob([html], { type: 'text/html' });
        await stream.write(blob);
        await stream.close();
        await hideLoading();
    } catch (error) {
        console.log(error);
        hideLoading();
    }
}

function main() {
    if (document.getElementById('channel-header-container') != null) {
        document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', DOWNLOADING_CSS);
        document.getElementsByTagName('body')[0].insertAdjacentHTML('afterbegin', DOWNLOADING_HTML);
        let sortButton = document.createElement('button');
        sortButton.innerHTML = "古い順HTMLﾀﾞｳﾝﾛｰﾄﾞ";
        sortButton.onclick = function () {
            downloadHTML();
        };
        document.getElementById('channel-header-container').appendChild(sortButton);
    } else {
        alert("ボタン表示に失敗しました。HTMLが変わったかもしれません。");
    }
}

main();