console.log("Let's Write JAVASCRIPT");

let currentSong = new Audio();
let Songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;

    // Fetch folder contents (HTML page)
    let a = await fetch(`http://127.0.0.1:3000/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    Songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            let fileName = element.href.split(`/${folder}/`).pop();
            Songs.push(fileName);
        }
    }

    // 👉 Fetch artist title from info.json
    let title = "Unknown Artist"; // default
    try {
        let infoResponse = await fetch(`http://127.0.0.1:3000/${folder}/info.json`);
        let infoData = await infoResponse.json();
        title = infoData.title || title;
    } catch (error) {
        console.warn("info.json not found or invalid:", error);
    }

    // Show all songs in the playlist
    let kUL = document.querySelector(".slist").getElementsByTagName("ul")[0]
    kUL.innerHTML = ""; // Clear the existing list
    for (const Song of Songs) {
    kUL.innerHTML += `<li><img class="invert" src="img/music.svg" alt="">
                        <div class="info">
                            <div>${decodeURIComponent(Song)}</div>
                            <div><strong>${title}</strong></div>
                        </div>
                        <div class="playnow">
                            <span>Play Now</span>
                            <img class="invert" src="img/play.svg" alt="" srcset="">
                        </div></li>`;
}


    // Attach click listeners
    Array.from(document.querySelector(".slist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML);
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        });
    });

    return Songs;
}


const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play()
        play.src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"
}

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:3000/Songs/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes("/Songs/")) {
            let folder = e.href.split("/").slice(-2)[0];

            let a = await fetch(`http://127.0.0.1:3000/Songs/${folder}/info.json`);
            let response = await a.json();
            console.log(response);

            cardContainer.innerHTML += `
            <div data-folder="${folder}" class="card">
                <div class="play">
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="16" fill="#00da6b" />
                        <path d="M12 10L22 16L12 22V10Z" fill="black" />
                    </svg>
                </div>
                <img src="/Songs/${folder}/cover.jpg" alt="">
                <h2>${response.title}</h2>
                <p>${response.discription}</p>
            </div>`;
        }
    }

    // Attach click events after cards are created
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log(item, item.currentTarget.dataset);
            Songs = await getSongs(`Songs/${item.currentTarget.dataset.folder}`);
            playMusic(Songs[0]);
        });
    });
}


async function main() {

    // List of all Songs
    await getSongs("Songs/ncs");
    playMusic(Songs[0], true)

    // Display the All the albums on the page
    displayAlbums();

    // Attach an eventlistner to play, next & previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Listen for time update event
    currentSong.addEventListener("timeupdate", () => {
        console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`

        // For SeekBAR
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    // Add an event lister to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    })

    // Add an event lister for Hamburger Menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = 0;
    });

    // Add an event lister for Hamburger Menu Close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event lister for Previous buttons
    previous.addEventListener("click", () => {
        console.log("Previous Clicked");
        let index = Songs.indexOf(currentSong.src.split("/").slice(-1)[0]);

        if ([index - 1] >= 0) {
            playMusic(Songs[index - 1]);
        }
    });

    // Add an event lister for Next buttons
    next.addEventListener("click", () => {
        console.log("Next Clicked");
        let index = Songs.indexOf(currentSong.src.split("/").slice(-1)[0]);

        if ([index + 1] < Songs.length) {
            playMusic(Songs[index + 1]);
        }
    });

    // Add an event lister for Volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e, e.target, e.target.value);
        currentSong.volume = parseInt(e.target.value) / 100;

        if (currentSong.volume >0){
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
    });

    // Add an event listener to mute/unmute track
    document.querySelector(".volume>img").addEventListener("click", e => {
        console.log(e.target);
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 30;
        }
    });

}
main()