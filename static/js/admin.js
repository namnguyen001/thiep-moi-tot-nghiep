document.addEventListener("DOMContentLoaded", () => {
    // --- State ---
    let adminPasscode = sessionStorage.getItem("admin_passcode") || "";
    let allCards = [];
    let activeCard = null;

    // --- DOM Elements ---
    const passcodeModal = document.getElementById("passcodeModal");
    const passcodeForm = document.getElementById("passcodeForm");
    const inputPasscode = document.getElementById("inputPasscode");
    const btnLogout = document.getElementById("btnLogout");
    const adminToast = document.getElementById("adminToast");

    const cardSelectDropdown = document.getElementById("cardSelectDropdown");
    const btnViewCurrentCard = document.getElementById("btnViewCurrentCard");

    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    // Modal Create Card
    const newCardModal = document.getElementById("newCardModal");
    const newCardForm = document.getElementById("newCardForm");
    const btnCreateNewCardModal = document.getElementById("btnCreateNewCardModal");
    const btnCloseNewCard = document.getElementById("btnCloseNewCard");

    // Forms
    const configForm = document.getElementById("configForm");
    const uploadPhotoForm = document.getElementById("uploadPhotoForm");
    const addGuestForm = document.getElementById("addGuestForm");
    const guestImageForm = document.getElementById("guestImageForm");

    function showToast(msg) {
        adminToast.textContent = msg;
        adminToast.classList.add("show");
        setTimeout(() => adminToast.classList.remove("show"), 3000);
    }

    async function apiFetch(url, options = {}) {
        options.headers = options.headers || {};
        options.headers["X-Admin-Passcode"] = adminPasscode;
        const res = await fetch(url, options);
        if (res.status === 401) {
            sessionStorage.removeItem("admin_passcode");
            passcodeModal.style.display = "flex";
            throw new Error("Unauthorized");
        }
        return res;
    }

    // Passcode Login Check
    if (!adminPasscode) {
        passcodeModal.style.display = "flex";
    } else {
        passcodeModal.style.display = "none";
        loadAllCards();
    }

    passcodeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        adminPasscode = inputPasscode.value.trim();
        try {
            const res = await apiFetch("/api/cards");
            if (res.ok) {
                sessionStorage.setItem("admin_passcode", adminPasscode);
                passcodeModal.style.display = "none";
                showToast("Đăng nhập thành công!");
                loadAllCards();
            }
        } catch (err) {
            alert("Mật khẩu Admin không chính xác.");
        }
    });

    btnLogout.addEventListener("click", () => {
        sessionStorage.removeItem("admin_passcode");
        window.location.reload();
    });

    // Tab Navigation
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
        });
    });

    // --- MULTI-CARD LOGIC ---
    async function loadAllCards(selectedCardId = null) {
        try {
            const res = await apiFetch("/api/cards");
            allCards = await res.json();

            if (allCards.length === 0) {
                cardSelectDropdown.innerHTML = `<option value="">-- Chưa có thiệp nào --</option>`;
                return;
            }

            // Populate Header Dropdown
            cardSelectDropdown.innerHTML = allCards.map(c => `
                <option value="${c.id}">${c.person_name} (${c.slug})</option>
            `).join('');

            // Select Card
            if (selectedCardId) {
                cardSelectDropdown.value = selectedCardId;
            }

            const currentId = parseInt(cardSelectDropdown.value);
            activeCard = allCards.find(c => c.id === currentId) || allCards[0];
            cardSelectDropdown.value = activeCard.id;

            // Update View Link
            btnViewCurrentCard.href = `/t/${activeCard.slug}`;

            // Populate Cards Table list in Tab 0
            renderAllCardsTable();

            // Populate Active Card Details across tabs
            populateActiveCardDetails();

        } catch (err) {
            console.error(err);
        }
    }

    cardSelectDropdown.addEventListener("change", (e) => {
        const id = parseInt(e.target.value);
        activeCard = allCards.find(c => c.id === id);
        if (activeCard) {
            btnViewCurrentCard.href = `/t/${activeCard.slug}`;
            populateActiveCardDetails();
            showToast(`Đã chuyển sang quản lý thiệp: ${activeCard.person_name}`);
        }
    });

    function renderAllCardsTable() {
        const tbody = document.getElementById("allCardsTableBody");
        const origin = window.location.origin;

        tbody.innerHTML = allCards.map(c => `
            <tr>
                <td><strong>${c.person_name}</strong></td>
                <td><code style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px;">/t/${c.slug}</code></td>
                <td>${c.school_name || '-'}</td>
                <td>${new Date(c.event_date).toLocaleDateString('vi-VN')}</td>
                <td><span style="font-weight: 700; color: var(--primary-dark);">${c.view_count || 0}</span> lượt</td>
                <td>
                    <button class="btn btn-primary btn-select-card" data-id="${c.id}" style="font-size: 12px; padding: 4px 8px;">
                        <i class="fa-solid fa-pen-to-square"></i> Quản lý
                    </button>
                    <a href="/t/${c.slug}" target="_blank" class="btn btn-secondary" style="font-size: 12px; padding: 4px 8px;">
                        <i class="fa-solid fa-eye"></i> Xem
                    </a>
                    <button class="btn btn-danger btn-delete-card" data-id="${c.id}" style="font-size: 12px; padding: 4px 8px;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll(".btn-select-card").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = parseInt(btn.getAttribute("data-id"));
                loadAllCards(id);
                // Switch to config tab
                document.querySelector('[data-tab="tab-config"]').click();
            });
        });

        document.querySelectorAll(".btn-delete-card").forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!confirm("Bạn có chắc chắn muốn xóa thiệp này? Dữ liệu ảnh, khách mời và RSVP của thiệp sẽ bị xóa.")) return;
                const id = btn.getAttribute("data-id");
                try {
                    const res = await apiFetch(`/api/cards/${id}`, { method: "DELETE" });
                    if (res.ok) {
                        showToast("Đã xóa thiệp thành công!");
                        loadAllCards();
                    }
                } catch (err) {
                    showToast("Lỗi xóa thiệp.");
                }
            });
        });
    }

    // Modal Create New Card
    btnCreateNewCardModal.addEventListener("click", () => newCardModal.style.display = "flex");
    document.querySelectorAll(".btn-trigger-new-card").forEach(b => b.addEventListener("click", () => newCardModal.style.display = "flex"));
    btnCloseNewCard.addEventListener("click", () => newCardModal.style.display = "none");

    // Auto-generate slug when name changes in modal
    document.getElementById("newPersonName").addEventListener("input", (e) => {
        const val = e.target.value.toLowerCase().trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-");
        document.getElementById("newSlug").value = val ? `${val}-${Math.floor(Math.random()*1000)}` : "";
    });

    // Copy inviter name to person name by default
    document.getElementById("newInviterName").addEventListener("input", (e) => {
        if (!document.getElementById("newPersonName").value) {
            document.getElementById("newPersonName").value = e.target.value;
        }
    });

    // Handle hero image upload in create card modal
    let newHeroImageUrl = "";
    document.getElementById("newHeroFileInput").addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await apiFetch("/api/upload", { method: "POST", body: formData });
            const result = await res.json();
            if (res.ok) {
                newHeroImageUrl = result.url;
                document.getElementById("newHeroPreview").innerHTML = `<img src="${result.url}" style="max-height: 100px; border-radius: 8px;">`;
                showToast("Đã tải ảnh bìa!");
            }
        } catch (err) {
            showToast("Lỗi tải ảnh bìa.");
        }
    });

    newCardForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        if (!newHeroImageUrl) {
            alert("Vui lòng chọn ảnh bìa cho thiệp!");
            return;
        }

        const payload = {
            person_name: document.getElementById("newPersonName").value.trim(),
            inviter_name: document.getElementById("newInviterName").value.trim(),
            slug: document.getElementById("newSlug").value.trim(),
            degree_title: document.getElementById("newDegreeTitle").value.trim() || "Cử nhân Công nghệ Thông tin",
            school_name: document.getElementById("newSchoolName").value.trim(),
            event_date: document.getElementById("newEventDate").value,
            event_location: document.getElementById("newEventLocation").value.trim(),
            event_address: "Địa chỉ trường",
            custom_message: "Mời bạn đến tham dự Lễ Tốt Nghiệp của mình nhé!",
            google_maps_embed: "https://maps.google.com/maps?q=" + encodeURIComponent(document.getElementById("newEventLocation").value) + "&output=embed",
            google_maps_link: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(document.getElementById("newEventLocation").value),
            parking_info: "[]",
            music_url: "https://youtu.be/3Kxf2dHlDpQ",
            hero_image: newHeroImageUrl,
            theme: "mystery-noir"
        };

        try {
            const res = await apiFetch("/api/cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const createdCard = await res.json();
                showToast("✨ Tạo thiệp mới thành công!");
                newCardForm.reset();
                newHeroImageUrl = "";
                document.getElementById("newHeroPreview").innerHTML = "";
                newCardModal.style.display = "none";
                loadAllCards(createdCard.id);
            }
        } catch (err) {
            showToast("Lỗi khi tạo thiệp.");
        }
    });

    // Populate Active Card Details
    function populateActiveCardDetails() {
        if (!activeCard) return;

        document.getElementById("editingCardNameTitle").textContent = `${activeCard.person_name} (${activeCard.slug})`;

        // Config Form Fields
        document.getElementById("cfgPersonName").value = activeCard.person_name || "";
        document.getElementById("cfgInviterName").value = activeCard.inviter_name || "";
        document.getElementById("cfgSlug").value = activeCard.slug || "";
        document.getElementById("cfgDegreeTitle").value = activeCard.degree_title || "";
        document.getElementById("cfgSchoolName").value = activeCard.school_name || "";
        document.getElementById("cfgEventDate").value = activeCard.event_date ? activeCard.event_date.substring(0, 16) : "";
        document.getElementById("cfgEventLocation").value = activeCard.event_location || "";
        document.getElementById("cfgEventAddress").value = activeCard.event_address || "";
        document.getElementById("cfgCustomMessage").value = activeCard.custom_message || "";
        document.getElementById("cfgMapsEmbed").value = activeCard.google_maps_embed || "";
        document.getElementById("cfgMapsLink").value = activeCard.google_maps_link || "";
        document.getElementById("cfgMusicUrl").value = activeCard.music_url || "";
        document.getElementById("cfgHeroImage").value = activeCard.hero_image || "";

        if (activeCard.hero_image) {
            document.getElementById("heroPreview").innerHTML = `<img src="${activeCard.hero_image}" style="max-height: 100px; border-radius: 8px;">`;
        }

        loadPhotos();
        loadGuests();
        loadRSVPsAndWishes();
    }

    // Upload Hero Image File
    document.getElementById("heroFileInput").addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await apiFetch("/api/upload", { method: "POST", body: formData });
            const result = await res.json();
            if (res.ok) {
                document.getElementById("cfgHeroImage").value = result.url;
                document.getElementById("heroPreview").innerHTML = `<img src="${result.url}" style="max-height: 100px; border-radius: 8px;">`;
                showToast("Đã tải ảnh bìa mới!");
            }
        } catch (err) {
            showToast("Lỗi tải ảnh bìa.");
        }
    });

    configForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!activeCard) return;

        const payload = {
            slug: document.getElementById("cfgSlug").value.trim(),
            person_name: document.getElementById("cfgPersonName").value.trim(),
            inviter_name: document.getElementById("cfgInviterName").value.trim(),
            degree_title: document.getElementById("cfgDegreeTitle").value.trim(),
            school_name: document.getElementById("cfgSchoolName").value.trim(),
            event_date: document.getElementById("cfgEventDate").value,
            event_location: document.getElementById("cfgEventLocation").value.trim(),
            event_address: document.getElementById("cfgEventAddress").value.trim(),
            custom_message: document.getElementById("cfgCustomMessage").value.trim(),
            google_maps_embed: document.getElementById("cfgMapsEmbed").value.trim(),
            google_maps_link: document.getElementById("cfgMapsLink").value.trim(),
            music_url: document.getElementById("cfgMusicUrl").value.trim(),
            hero_image: document.getElementById("cfgHeroImage").value || "/uploads/hero_default.jpg"
        };

        try {
            const res = await apiFetch(`/api/cards/${activeCard.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast("✅ Đã cập nhật thiệp thành công!");
                loadAllCards(activeCard.id);
            }
        } catch (err) {
            showToast("Lỗi cập nhật thiệp.");
        }
    });

    // --- TAB 2: PHOTOS ---
    async function loadPhotos() {
        if (!activeCard) return;
        try {
            const res = await apiFetch(`/api/cards/${activeCard.id}/photos`);
            const photos = await res.json();
            const grid = document.getElementById("photosAdminGrid");

            if (photos.length === 0) {
                grid.innerHTML = `<p style="grid-column: 1/-1; color: #64748B;">Chưa có ảnh nào trong album thiệp này.</p>`;
                return;
            }

            grid.innerHTML = photos.map(p => `
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                    <img src="${p.url}" style="width: 100%; height: 140px; object-fit: cover;">
                    <div style="padding: 8px;">
                        <p style="font-size: 12px; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.caption || "Không có chú thích"}</p>
                        <button class="btn btn-danger btn-delete-photo" data-id="${p.id}" style="width: 100%; font-size: 11px; padding: 4px; margin-top: 6px; justify-content: center;">
                            <i class="fa-solid fa-trash"></i> Xóa ảnh
                        </button>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll(".btn-delete-photo").forEach(btn => {
                btn.addEventListener("click", async () => {
                    if (!confirm("Xóa ảnh này?")) return;
                    const photoId = btn.getAttribute("data-id");
                    try {
                        const res = await apiFetch(`/api/photos/${photoId}`, { method: "DELETE" });
                        if (res.ok) {
                            showToast("Đã xóa ảnh!");
                            loadPhotos();
                        }
                    } catch (err) {
                        showToast("Lỗi xóa ảnh.");
                    }
                });
            });
        } catch (err) {
            console.error(err);
        }
    }

    uploadPhotoForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!activeCard) return;

        const fileInput = document.getElementById("photoFileInput");
        const urlInput = document.getElementById("photoUrlInput");
        const captionInput = document.getElementById("photoCaptionInput");

        let photoUrl = urlInput.value.trim();

        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append("file", fileInput.files[0]);
            try {
                const res = await apiFetch("/api/upload", { method: "POST", body: formData });
                const result = await res.json();
                photoUrl = result.url;
            } catch (err) {
                showToast("Lỗi tải ảnh lên.");
                return;
            }
        }

        if (!photoUrl) {
            alert("Vui lòng chọn file hoặc nhập URL ảnh.");
            return;
        }

        try {
            const res = await apiFetch("/api/photos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ card_id: activeCard.id, url: photoUrl, caption: captionInput.value.trim() })
            });

            if (res.ok) {
                showToast("Thêm ảnh thành công!");
                uploadPhotoForm.reset();
                loadPhotos();
            }
        } catch (err) {
            showToast("Lỗi thêm ảnh.");
        }
    });

    // --- TAB 3: GUESTS ---
    async function loadGuests() {
        if (!activeCard) return;
        try {
            const res = await apiFetch(`/api/cards/${activeCard.id}/guests`);
            const guests = await res.json();
            const tbody = document.getElementById("guestTableBody");
            const origin = window.location.origin;

            if (guests.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748B;">Chưa có khách mời nào được tạo link cho thiệp này.</td></tr>`;
                return;
            }

            tbody.innerHTML = guests.map(g => {
                const guestUrl = `${origin}/t/${activeCard.slug}?guest=${encodeURIComponent(g.name)}${g.role ? `&role=${encodeURIComponent(g.role)}` : ''}`;
                const hasCustomImage = g.custom_image && g.custom_image !== "";
                return `
                    <tr>
                        <td><strong>${g.name}</strong></td>
                        <td><span style="background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${g.role || 'Khách'}</span></td>
                        <td>${g.phone || '-'}</td>
                        <td>
                            ${hasCustomImage
                                ? '<span style="color: #166534; font-weight: 600; font-size: 12px;"><i class="fa-solid fa-check"></i> Có ảnh</span>'
                                : '<span style="color: #991B1B; font-size: 12px;">Mặc định</span>'}
                        </td>
                        <td>
                            <input type="text" value="${guestUrl}" readonly style="width: 280px; padding: 4px 8px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 12px; background: #F8FAFC;">
                        </td>
                        <td>
                            <a href="${guestUrl}" target="_blank" class="btn btn-secondary" style="font-size: 11px; padding: 4px 8px; background: #10B981;">
                                <i class="fa-solid fa-eye"></i> Xem Thiệp
                            </a>
                        </td>
                        <td>
                            <button class="btn btn-primary btn-copy-link" data-url="${guestUrl}" style="font-size: 11px; padding: 4px 8px;">
                                <i class="fa-solid fa-copy"></i> Copy Link
                            </button>
                            <button class="btn btn-secondary btn-qr-code" data-url="${guestUrl}" data-name="${g.name}" style="font-size: 11px; padding: 4px 8px; background: #0284C7;">
                                <i class="fa-solid fa-qrcode"></i> Mã QR
                            </button>
                            <button class="btn btn-danger btn-delete-guest" data-id="${g.id}" style="font-size: 11px; padding: 4px 8px;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Copy Link
            document.querySelectorAll(".btn-copy-link").forEach(btn => {
                btn.addEventListener("click", () => {
                    navigator.clipboard.writeText(btn.getAttribute("data-url"));
                    showToast("📋 Đã sao chép link cá nhân hóa vào bộ nhớ tạm!");
                });
            });

            // QR Code
            document.querySelectorAll(".btn-qr-code").forEach(btn => {
                btn.addEventListener("click", () => {
                    const url = btn.getAttribute("data-url");
                    const name = btn.getAttribute("data-name");
                    const qrApi = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=250`;
                    
                    document.getElementById("qrGuestNameTitle").textContent = `Mã QR - ${name}`;
                    document.getElementById("qrImg").src = qrApi;
                    document.getElementById("qrLinkText").textContent = url;
                    document.getElementById("qrModal").style.display = "flex";
                });
            });

            // Delete Guest
            document.querySelectorAll(".btn-delete-guest").forEach(btn => {
                btn.addEventListener("click", async () => {
                    if (!confirm("Xóa khách mời này?")) return;
                    const id = btn.getAttribute("data-id");
                    try {
                        const res = await apiFetch(`/api/guests/${id}`, { method: "DELETE" });
                        if (res.ok) {
                            showToast("Đã xóa!");
                            loadGuests();
                        }
                    } catch (err) {
                        showToast("Lỗi xóa khách.");
                    }
                });
            });

            // Populate guest select dropdown for image upload
            const guestSelectForImage = document.getElementById("guestSelectForImage");
            guestSelectForImage.innerHTML = `<option value="">-- Chọn khách mời --</option>` + 
                guests.map(g => `<option value="${g.id}">${g.name} (${g.role || 'Khách'})</option>`).join('');

            // Set up guest selection change handler for image preview
            guestSelectForImage.addEventListener("change", () => {
                const guestId = guestSelectForImage.value;
                if (guestId) {
                    const guest = guests.find(g => g.id === parseInt(guestId));
                    updateGuestImagePreview(guest);
                } else {
                    clearGuestImagePreview();
                }
            });

        } catch (err) {
            console.error(err);
        }
    }

    function updateGuestImagePreview(guest) {
        const currentGuestImage = document.getElementById("currentGuestImage");
        const noGuestImageText = document.getElementById("noGuestImageText");
        const btnRemoveGuestImage = document.getElementById("btnRemoveGuestImage");

        if (guest && guest.custom_image && guest.custom_image !== "") {
            currentGuestImage.src = guest.custom_image;
            currentGuestImage.style.display = "block";
            noGuestImageText.style.display = "none";
            btnRemoveGuestImage.style.display = "inline-flex";
            btnRemoveGuestImage.onclick = () => removeGuestImage(guest.id);
        } else {
            clearGuestImagePreview();
        }
    }

    function clearGuestImagePreview() {
        const currentGuestImage = document.getElementById("currentGuestImage");
        const noGuestImageText = document.getElementById("noGuestImageText");
        const btnRemoveGuestImage = document.getElementById("btnRemoveGuestImage");

        currentGuestImage.style.display = "none";
        noGuestImageText.style.display = "inline";
        btnRemoveGuestImage.style.display = "none";
    }

    async function removeGuestImage(guestId) {
        if (!confirm("Bạn có chắc chắn muốn xóa ảnh riêng của khách mời này?")) return;

        try {
            const res = await apiFetch(`/api/guests/${guestId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ custom_image: "" })
            });

            if (res.ok) {
                showToast("Đã xóa ảnh riêng!");
                clearGuestImagePreview();
                loadGuests();
            }
        } catch (err) {
            showToast("Lỗi xóa ảnh.");
        }
    }

    addGuestForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!activeCard) return;

        const payload = {
            card_id: activeCard.id,
            name: document.getElementById("guestNameInput").value.trim(),
            role: document.getElementById("guestRoleInput").value.trim() || "Bạn thân",
            phone: document.getElementById("guestPhoneInput").value.trim()
        };

        try {
            const res = await apiFetch("/api/guests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast("✨ Tạo link mời thành công!");
                addGuestForm.reset();
                loadGuests();
            }
        } catch (err) {
            showToast("Lỗi tạo link.");
        }
    });

    document.getElementById("btnCloseQr").addEventListener("click", () => {
        document.getElementById("qrModal").style.display = "none";
    });

    // Handle guest image upload
    guestImageForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!activeCard) return;

        const guestId = document.getElementById("guestSelectForImage").value;
        const fileInput = document.getElementById("guestImageInput");

        if (!guestId) {
            alert("Vui lòng chọn khách mời!");
            return;
        }

        let imageUrl = "";
        
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append("file", fileInput.files[0]);
            
            try {
                const res = await apiFetch("/api/upload", { method: "POST", body: formData });
                const result = await res.json();
                if (res.ok) {
                    imageUrl = result.url;
                } else {
                    showToast("Lỗi tải ảnh lên.");
                    return;
                }
            } catch (err) {
                showToast("Lỗi tải ảnh lên.");
                return;
            }
        } else {
            alert("Vui lòng chọn file ảnh!");
            return;
        }

        try {
            const res = await apiFetch(`/api/guests/${guestId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ custom_image: imageUrl })
            });

            if (res.ok) {
                const updatedGuest = await res.json();
                console.log("Updated guest response:", updatedGuest);
                showToast("✅ Đã cập nhật ảnh cho khách mời!");
                guestImageForm.reset();
                // Reload guests to update the table
                await loadGuests();
                // Update preview with the newly uploaded image immediately
                const guestSelectForImage = document.getElementById("guestSelectForImage");
                if (guestSelectForImage.value) {
                    // Use the updated guest response directly
                    updateGuestImagePreview(updatedGuest);
                }
            }
        } catch (err) {
            console.error("Error updating guest image:", err);
            showToast("Lỗi cập nhật ảnh khách.");
        }
    });

    // --- TAB 4: RSVPS & WISHES ---
    async function loadRSVPsAndWishes() {
        if (!activeCard) return;
        try {
            // Load RSVPs
            const resRsvp = await apiFetch(`/api/cards/${activeCard.id}/rsvps`);
            const rsvps = await resRsvp.json();
            const tbodyRsvp = document.getElementById("rsvpTableBody");

            if (rsvps.length === 0) {
                tbodyRsvp.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748B;">Chưa có phản hồi RSVP nào.</td></tr>`;
            } else {
                tbodyRsvp.innerHTML = rsvps.map(r => `
                    <tr>
                        <td><strong>${r.guest_name}</strong></td>
                        <td>${r.phone || '-'}</td>
                        <td>
                            ${r.attending 
                                ? `<span style="background: #DCFCE7; color: #166534; padding: 2px 8px; border-radius: 12px; font-weight: 700; font-size: 12px;"><i class="fa-solid fa-check"></i> Sẽ đến</span>` 
                                : `<span style="background: #FEE2E2; color: #991B1B; padding: 2px 8px; border-radius: 12px; font-weight: 700; font-size: 12px;"><i class="fa-solid fa-xmark"></i> Không đến</span>`}
                        </td>
                        <td><strong>${r.guest_count}</strong> người</td>
                        <td>${r.note || '-'}</td>
                        <td>${new Date(r.created_at).toLocaleString('vi-VN')}</td>
                        <td>
                            <button class="btn btn-danger btn-delete-rsvp" data-id="${r.id}" style="font-size: 11px; padding: 4px 8px;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');

                document.querySelectorAll(".btn-delete-rsvp").forEach(btn => {
                    btn.addEventListener("click", async () => {
                        if (!confirm("Xóa phản hồi này?")) return;
                        const id = btn.getAttribute("data-id");
                        try {
                            const res = await apiFetch(`/api/rsvps/${id}`, { method: "DELETE" });
                            if (res.ok) {
                                showToast("Đã xóa!");
                                loadRSVPsAndWishes();
                            }
                        } catch (err) {
                            showToast("Lỗi xóa phản hồi.");
                        }
                    });
                });
            }

            // Load Wishes
            const resWishes = await apiFetch(`/api/cards/${activeCard.id}/wishes`);
            const wishes = await resWishes.json();
            const tbodyWishes = document.getElementById("wishesTableBody");

            if (wishes.length === 0) {
                tbodyWishes.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748B;">Chưa có lời chúc nào.</td></tr>`;
            } else {
                tbodyWishes.innerHTML = wishes.map(w => `
                    <tr>
                        <td><strong>${w.sender_name}</strong></td>
                        <td>${w.message}</td>
                        <td>${new Date(w.created_at).toLocaleString('vi-VN')}</td>
                        <td>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" class="wish-display-toggle" data-id="${w.id}" ${w.is_displayed ? 'checked' : ''} style="width: 16px; height: 16px;">
                                <span style="font-size: 12px; font-weight: 600; color: ${w.is_displayed ? '#166534' : '#991B1B'};">${w.is_displayed ? 'Có' : 'Không'}</span>
                            </label>
                        </td>
                        <td>
                            <button class="btn btn-danger btn-delete-wish" data-id="${w.id}" style="font-size: 11px; padding: 4px 8px;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');

                // Toggle display status
                document.querySelectorAll(".wish-display-toggle").forEach(checkbox => {
                    checkbox.addEventListener("change", async () => {
                        const id = checkbox.getAttribute("data-id");
                        const isDisplayed = checkbox.checked;
                        try {
                            const res = await apiFetch(`/api/wishes/${id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ is_displayed: isDisplayed })
                            });
                            if (res.ok) {
                                showToast(isDisplayed ? "Đã hiển thị lời chúc!" : "Đã ẩn lời chúc!");
                                loadRSVPsAndWishes();
                            }
                        } catch (err) {
                            showToast("Lỗi cập nhật trạng thái hiển thị.");
                        }
                    });
                });

                document.querySelectorAll(".btn-delete-wish").forEach(btn => {
                    btn.addEventListener("click", async () => {
                        if (!confirm("Xóa lời chúc này?")) return;
                        const id = btn.getAttribute("data-id");
                        try {
                            const res = await apiFetch(`/api/wishes/${id}`, { method: "DELETE" });
                            if (res.ok) {
                                showToast("Đã xóa!");
                                loadRSVPsAndWishes();
                            }
                        } catch (err) {
                            showToast("Lỗi xóa lời chúc.");
                        }
                    });
                });
            }

        } catch (err) {
            console.error(err);
        }
    }

});
