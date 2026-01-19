// ==================== Like Detail Modal ====================

let currentLikeData = null;

async function showLikeDetailModal(likeId, likeType) {
    try {
        const endpoint = likeType === 'breeding' 
            ? `${API_BASE_URL}/breeding/like-detail/${likeId}`
            : `${API_BASE_URL}/likes/detail/${likeId}`;
        
        const response = await fetch(endpoint);
        const result = await response.json();
        
        if (result.success && result.like) {
            currentLikeData = { ...result.like, likeType };
            
            const like = result.like;
            const age = like.liker_dob ? calculateAge(like.liker_dob) : 'ไม่ระบุ';
            const gender = like.liker_gender === 'male' ? 'ชาย' : like.liker_gender === 'female' ? 'หญิง' : 'ไม่ระบุ';
            
            document.getElementById('likeDetailContent').innerHTML = `
                <div class="like-detail-card">
                    <img src="${like.liker_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}" 
                         alt="${like.liker_name}" 
                         class="like-detail-image">
                    <div class="like-detail-info">
                        <div class="like-detail-name">${like.liker_name}</div>
                        <div class="like-detail-meta">
                            <div class="like-detail-meta-item">
                                <i class="fas fa-venus-mars"></i>
                                <span>${gender}</span>
                            </div>
                            <div class="like-detail-meta-item">
                                <i class="fas fa-birthday-cake"></i>
                                <span>${age} ปี</span>
                            </div>
                            ${like.liker_location ? `
                                <div class="like-detail-meta-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${like.liker_location}</span>
                                </div>
                            ` : ''}
                            ${like.liker_phone ? `
                                <div class="like-detail-meta-item">
                                    <i class="fas fa-phone"></i>
                                    <span>${like.liker_phone}</span>
                                </div>
                            ` : ''}
                            ${like.liker_email ? `
                                <div class="like-detail-meta-item">
                                    <i class="fas fa-envelope"></i>
                                    <span>${like.liker_email}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${like.liker_bio ? `
                    <div class="like-detail-bio">
                        <strong><i class="fas fa-quote-left"></i> เกี่ยวกับฉัน</strong><br>
                        ${like.liker_bio}
                    </div>
                ` : ''}
                
                <div class="like-detail-pet-info">
                    <h4><i class="fas fa-paw"></i> สนใจสัตว์เลี้ยง</h4>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${like.pet_image}" style="width: 60px; height: 60px; border-radius: 10px; object-fit: cover; border: 2px solid white;">
                        <div>
                            <strong style="font-size: 18px;">${like.pet_name}</strong><br>
                            <span>${like.pet_breed}</span>
                        </div>
                    </div>
                </div>
            `;
            
            closeNotificationsModal();
            document.getElementById('likeDetailModal').style.display = 'flex';
        } else {
            alert('ไม่สามารถโหลดข้อมูลได้');
        }
    } catch (error) {
        console.error('Error loading like detail:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
}

function calculateAge(dateString) {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function closeLikeDetailModal() {
    document.getElementById('likeDetailModal').style.display = 'none';
    currentLikeData = null;
}

async function handleAcceptLike() {
    if (!currentLikeData) return;
    
    const confirmMsg = `ต้องการยอมรับและเริ่มแชทกับ ${currentLikeData.liker_name} ใช่หรือไม่?`;
    if (!confirm(confirmMsg)) return;
    
    try {
        const endpoint = currentLikeData.likeType === 'breeding'
            ? `${API_BASE_URL}/breeding/accept`
            : `${API_BASE_URL}/likes/accept`;
        
        const payload = currentLikeData.likeType === 'breeding' ? {
            like_id: currentLikeData.id,
            owner_user_id: currentUserId,
            liker_user_id: currentLikeData.user_id,
            breeding_pet_id: currentLikeData.breeding_pet_id
        } : {
            like_id: currentLikeData.id,
            owner_user_id: currentUserId,
            liker_user_id: currentLikeData.user_id,
            pet_id: currentLikeData.pet_id
        };
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Match สำเร็จ! ตอนนี้คุณสามารถแชทกันได้แล้ว');
            closeLikeDetailModal();
            await loadNotificationCount();
            showPage('matches');
        } else {
            alert(result.message || 'เกิดข้อผิดพลาด');
        }
    } catch (error) {
        console.error('Error accepting like:', error);
        alert('เกิดข้อผิดพลาด');
    }
}

async function handleRejectLike() {
    if (!currentLikeData) return;
    
    if (!confirm('ต้องการปฏิเสธใช่หรือไม่?')) return;
    
    try {
        const endpoint = currentLikeData.likeType === 'breeding'
            ? `${API_BASE_URL}/breeding/reject`
            : `${API_BASE_URL}/likes/reject`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ like_id: currentLikeData.id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('ปฏิเสธเรียบร้อย');
            closeLikeDetailModal();
            await loadNotificationCount();
        } else {
            alert(result.message || 'เกิดข้อผิดพลาด');
        }
    } catch (error) {
        console.error('Error rejecting like:', error);
        alert('เกิดข้อผิดพลาด');
    }
}
