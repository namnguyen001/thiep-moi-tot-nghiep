document.addEventListener("DOMContentLoaded", () => {
    // --- Global State ---
    let cardData = null;
    let targetDate = new Date("2026-09-07T16:00:00");
    let youtubePlayer = null;
    let isYouTubeMode = false;
    let isMusicPlaying = false;
    let pendingPlay = false;

    // Extract Slug from path /t/{slug} or search query ?c=slug or default
    const pathname = window.location.pathname;
    let cardSlug = "";

    if (pathname.startsWith("/t/")) {
        cardSlug = pathname.split("/t/")[1];
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        cardSlug = urlParams.get("c") || urlParams.get("card") || "nguyen-hoai-nam-f6034e";
    }

    // DOM Elements
    const envelopeOverlay = document.getElementById("envelopeOverlay");
    const btnOpenEnvelope = document.getElementById("btnOpenEnvelope");
    const bgAudio = document.getElementById("bgAudio");
    const musicCircle = document.getElementById("musicCircle");
    const musicIcon = document.getElementById("musicIcon");
    const musicTooltip = document.getElementById("musicTooltip");

    const guestBanner = document.getElementById("guestBanner");
    const guestBannerName = document.getElementById("guestBannerName");
    const guestBannerRole = document.getElementById("guestBannerRole");
    const envGuestBadge = document.getElementById("envGuestBadge");
    const envGuestName = document.getElementById("envGuestName");

    const envPersonName = document.getElementById("envPersonName");
    const heroPersonName = document.getElementById("heroPersonName");
    const heroSchoolName = document.getElementById("heroSchoolName");
    const heroImage = document.getElementById("heroImage");

    const eventDayOfWeek = document.getElementById("eventDayOfWeek");
    const eventDateFull = document.getElementById("eventDateFull");
    const eventTimeFull = document.getElementById("eventTimeFull");

    const venueName = document.getElementById("venueName");
    const venueAddress = document.getElementById("venueAddress");
    const mapFrame = document.getElementById("mapFrame");
    const btnGoogleMaps = document.getElementById("btnGoogleMaps");

    const customMessage = document.getElementById("customMessage");
    const rsvpForm = document.getElementById("rsvpForm");
    
    const wishSender = document.getElementById("wishSender");
    const wishMessage = document.getElementById("wishMessage");
    const btnSubmitWish = document.getElementById("btnSubmitWish");
    const wishesList = document.getElementById("wishesList");
    const toast = document.getElementById("toast");

    // Suggestion wish modal
    const btnSuggestWish = document.getElementById("btnSuggestWish");
    const suggestionModal = document.getElementById("suggestionModal");
    const btnCloseSuggest = document.getElementById("btnCloseSuggest");

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3500);
    }

    function toVietnameseUpperCase(text) {
        return text ? text.toLocaleUpperCase("vi-VN") : "";
    }

    function setPersonName(name) {
        const displayName = toVietnameseUpperCase(name);
        envPersonName.textContent = displayName;
        heroPersonName.textContent = displayName;
    }

    // Extract YouTube Video ID from any YouTube URL format
    function getYouTubeId(url) {
        if (!url) return null;
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    // Attach global YouTube API ready callback
    window.onYouTubeIframeAPIReady = function() {
        console.log("YouTube API Ready");
        if (cardData && cardData.music_url) {
            initYouTubePlayer();
        }
    };

    function initYouTubePlayer() {
        if (!cardData || !cardData.music_url) return;

        const ytId = getYouTubeId(cardData.music_url);
        console.log("YouTube ID:", ytId, "Music URL:", cardData.music_url);
        
        if (!ytId) {
            isYouTubeMode = false;
            bgAudio.src = cardData.music_url;
            console.log("Using MP3 audio:", cardData.music_url);
            return;
        }

        isYouTubeMode = true;

        if (!window.YT || !window.YT.Player) {
            console.log("YouTube API not loaded yet, will retry");
            return;
        }

        if (youtubePlayer && typeof youtubePlayer.destroy === "function") {
            try { youtubePlayer.destroy(); } catch (e) {}
        }

        console.log("Initializing YouTube player with ID:", ytId);
        youtubePlayer = new YT.Player("ytPlayer", {
            height: "200",
            width: "200",
            videoId: ytId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                loop: 1,
                playlist: ytId,
                playsinline: 1,
                rel: 0
            },
            events: {
                onReady: (event) => {
                    console.log("YouTube player ready");
                    event.target.setVolume(100);
                    if (pendingPlay) {
                        pendingPlay = false;
                        try {
                            event.target.unMute();
                            event.target.playVideo();
                            setMusicUIPlaying(true);
                        } catch (err) {
                            console.error("YouTube play error onReady", err);
                        }
                    }
                },
                onStateChange: (event) => {
                    if (event.data === YT.PlayerState.PLAYING) {
                        setMusicUIPlaying(true);
                    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                        setMusicUIPlaying(false);
                    }
                },
                onError: (event) => {
                    console.error("YouTube player error:", event.data);
                }
            }
        });
    }

    function playMusic() {
        console.log("playMusic called, isYouTubeMode:", isYouTubeMode, "isMusicPlaying:", isMusicPlaying);
        if (isYouTubeMode) {
            if (youtubePlayer && typeof youtubePlayer.playVideo === "function") {
                try {
                    youtubePlayer.unMute();
                    youtubePlayer.setVolume(100);
                    youtubePlayer.playVideo();
                    setMusicUIPlaying(true);
                    console.log("YouTube playVideo called");
                } catch (e) {
                    console.error("YouTube play error:", e);
                    pendingPlay = true;
                }
            } else {
                console.log("YouTube player not ready, setting pendingPlay");
                pendingPlay = true;
                initYouTubePlayer();
            }
        } else if (bgAudio.src) {
            console.log("Playing MP3 audio");
            bgAudio.play().then(() => {
                setMusicUIPlaying(true);
                console.log("MP3 audio playing");
            }).catch(e => {
                console.log("Audio autoplay blocked", e);
            });
        } else {
            console.log("No audio source available");
        }
    }

    function pauseMusic() {
        if (isYouTubeMode && youtubePlayer && typeof youtubePlayer.pauseVideo === "function") {
            try {
                youtubePlayer.pauseVideo();
                setMusicUIPlaying(false);
            } catch (e) {}
        } else if (bgAudio.src) {
            bgAudio.pause();
            setMusicUIPlaying(false);
        }
    }

    function toggleMusic() {
        if (isMusicPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    }

    function setMusicUIPlaying(playing) {
        isMusicPlaying = playing;
        if (playing) {
            musicCircle.classList.add("playing");
            musicIcon.className = "fa-solid fa-volume-high";
            musicTooltip.textContent = "Đang phát nhạc";
        } else {
            musicCircle.classList.remove("playing");
            musicIcon.className = "fa-solid fa-volume-xmark";
            musicTooltip.textContent = "Đã tắt nhạc";
        }
    }

    // Guest personalization
    const urlParams = new URLSearchParams(window.location.search);
    const guestNameParam = urlParams.get("guest");

    if (guestNameParam) {
        // Decode URL parameter to handle Vietnamese characters properly
        const decodedGuestName = decodeURIComponent(guestNameParam);

        guestBanner.style.display = "flex";
        guestBannerName.textContent = decodedGuestName;

        envGuestBadge.style.display = "inline-block";
        envGuestName.textContent = decodedGuestName;

        const rsvpNameInput = document.getElementById("rsvpName");
        if (rsvpNameInput) rsvpNameInput.value = decodedGuestName;
    }

    // Fetch Card Details
    async function loadCardData() {
        try {
            const res = await fetch(`/api/cards/${cardSlug}`);
            if (!res.ok) return;
            cardData = await res.json();

            // Populate Text
            setPersonName(cardData.person_name);
            heroSchoolName.textContent = cardData.school_name;
            customMessage.textContent = cardData.custom_message;

            venueName.textContent = cardData.event_location;
            venueAddress.textContent = cardData.event_address;
            if (cardData.google_maps_embed) {
                mapFrame.src = cardData.google_maps_embed;
            }

            // Reliable Google Maps Directions Link Fallback
            let mapLink = cardData.google_maps_link ? cardData.google_maps_link.trim() : "";
            if (!mapLink || mapLink === "https://maps.app.goo.gl/" || mapLink.includes("firebase") || mapLink === "https://maps.google.com/") {
                const query = encodeURIComponent(`${cardData.event_location}, ${cardData.event_address}`);
                mapLink = `https://www.google.com/maps/search/?api=1&query=${query}`;
            }
            btnGoogleMaps.href = mapLink;

            if (cardData.hero_image) {
                heroImage.src = cardData.hero_image;
            }

            if (cardData.music_url) {
                const ytId = getYouTubeId(cardData.music_url);
                if (ytId) {
                    isYouTubeMode = true;
                    if (window.YT && window.YT.Player) {
                        initYouTubePlayer();
                    }
                } else {
                    isYouTubeMode = false;
                    bgAudio.src = cardData.music_url;
                }
            }

            // Event Date Parsing
            if (cardData.event_date) {
                targetDate = new Date(cardData.event_date);
                const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
                eventDayOfWeek.textContent = dayNames[targetDate.getDay()];
                
                const dd = String(targetDate.getDate()).padStart(2, "0");
                const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
                const yyyy = targetDate.getFullYear();
                eventDateFull.textContent = `${dd}.${mm}.${yyyy}`;
                
                const hh = String(targetDate.getHours()).padStart(2, "0");
                const min = String(targetDate.getMinutes()).padStart(2, "0");
                eventTimeFull.textContent = `${hh}:${min}`;

                // Generate Calendar Grid for event month
                generateCalendar(targetDate);
            }

            loadWishes(cardData.id);

        } catch (err) {
            console.error("Error loading card data", err);
        }
    }

    // Generate Calendar Grid
    function generateCalendar(dateObj) {
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const eventDay = dateObj.getDate();

        document.getElementById("calendarMonthTitle").textContent = `Tháng ${month + 1} / ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
        const totalDays = new Date(year, month + 1, 0).getDate();

        // Convert Sunday (0) -> 6, Mon (1) -> 0 for Mon-Start grid
        let startCol = firstDayOfMonth - 1;
        if (startCol < 0) startCol = 6;

        const daysGrid = document.getElementById("calendarDaysGrid");
        daysGrid.innerHTML = "";

        // Empty cells before start day
        for (let i = 0; i < startCol; i++) {
            daysGrid.innerHTML += `<div class="calendar-cell"></div>`;
        }

        // Fill days
        for (let d = 1; d <= totalDays; d++) {
            if (d === eventDay) {
                daysGrid.innerHTML += `
                    <div class="calendar-cell event-highlight">
                        <svg viewBox="0 0 32 30" class="heart-svg" aria-hidden="true"><path d="M16 28S1 19.5 1 10.5C1 5.8 4.8 2 9.5 2c2.7 0 5.1 1.3 6.5 3.3C17.4 3.3 19.8 2 22.5 2 27.2 2 31 5.8 31 10.5 31 19.5 16 28 16 28z"></path></svg>
                        <span class="cell-text" style="font-weight: 700; color: #FFFFFF;">${d}</span>
                    </div>
                `;
            } else {
                daysGrid.innerHTML += `<div class="calendar-cell"><span class="cell-text">${d}</span></div>`;
            }
        }
    }

    // Countdown Timer
    function updateCountdown() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            document.getElementById("cdDays").textContent = "00";
            document.getElementById("cdHours").textContent = "00";
            document.getElementById("cdMinutes").textContent = "00";
            document.getElementById("cdSeconds").textContent = "00";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById("cdDays").textContent = String(days).padStart(2, "0");
        document.getElementById("cdHours").textContent = String(hours).padStart(2, "0");
        document.getElementById("cdMinutes").textContent = String(minutes).padStart(2, "0");
        document.getElementById("cdSeconds").textContent = String(seconds).padStart(2, "0");
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();

    // Envelope Open & Confetti & Play Music
    btnOpenEnvelope.addEventListener("click", () => {
        envelopeOverlay.classList.add("opened");

        if (typeof confetti === "function") {
            confetti({
                particleCount: 120,
                spread: 90,
                origin: { y: 0.6 },
                colors: ["#F6E8AE", "#D9B75B", "#B8873A", "#FFFFFF"]
            });
        }

        playMusic();
    });

    // Music Player Toggle Button
    musicCircle.addEventListener("click", toggleMusic);

    // RSVP Submit
    rsvpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!cardData) return;

        const attending = rsvpForm.querySelector('input[name="attending"]:checked').value === "true";
        const payload = {
            card_id: cardData.id,
            guest_name: document.getElementById("rsvpName").value.trim(),
            phone: document.getElementById("rsvpPhone").value.trim(),
            attending: attending,
            guest_count: 1,
            note: document.getElementById("rsvpNote").value.trim()
        };

        try {
            const res = await fetch("/api/rsvps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast("🎉 Cảm ơn bạn đã phản hồi tham dự!");
                rsvpForm.reset();
            } else {
                showToast("Có lỗi xảy ra, vui lòng thử lại.");
            }
        } catch (err) {
            showToast("Lỗi kết nối server.");
        }
    });

    // Wishes Load & Submit
    async function loadWishes(cardId) {
        try {
            const res = await fetch(`/api/cards/${cardId}/wishes`);
            if (!res.ok) return;
            const wishes = await res.json();

            if (wishes.length === 0) {
                wishesList.innerHTML = `<p style="text-align: center; color: var(--gold-5); font-style: italic; font-size: 14px;">Hãy là người đầu tiên gửi lời chúc!</p>`;
                return;
            }

            wishesList.innerHTML = wishes.map(w => `
                <div class="wish-card">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                        <strong style="color: var(--gold-5); font-size: 14px;">${w.sender_name}</strong>
                        <span style="font-size: 11px; color: #888;">${new Date(w.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p style="font-size: 13.5px; color: var(--text-gold-muted); line-height: 1.5;">${w.message}</p>
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
        }
    }

    async function submitWish() {
        if (!cardData) return;

        const sender = wishSender.value.trim();
        const msg = wishMessage.value.trim();

        if (!sender || !msg) {
            showToast("Vui lòng nhập tên và lời chúc của bạn.");
            return;
        }

        const payload = {
            card_id: cardData.id,
            sender_name: sender,
            message: msg,
            avatar_index: 1
        };

        try {
            const res = await fetch("/api/wishes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast("❤️ Cảm ơn lời chúc của bạn!");
                wishSender.value = "";
                wishMessage.value = "";
                loadWishes(cardData.id);
            }
        } catch (err) {
            showToast("Lỗi gửi lời chúc.");
        }
    }

    if (btnSubmitWish) {
        btnSubmitWish.addEventListener("click", submitWish);
    }

    // Suggestion Wish Modal 💡
    btnSuggestWish.addEventListener("click", () => {
        suggestionModal.style.display = "flex";
    });
    btnCloseSuggest.addEventListener("click", () => {
        suggestionModal.style.display = "none";
    });
    document.querySelectorAll(".suggestion-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            wishMessage.value = chip.textContent.replace(/^[\s🎓🌟✨❤️]+/, '');
            suggestionModal.style.display = "none";
        });
    });

    // Floating RSVP Smooth Scroll
    document.getElementById("btnFloatRsvp").addEventListener("click", () => {
        document.getElementById("rsvpSection").scrollIntoView({ behavior: "smooth" });
    });

    // Init
    loadCardData();
});
